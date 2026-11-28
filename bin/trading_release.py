#!/usr/bin/env python3
"""Reviewed Trading Reflections releases; standard library plus existing project tools.

No command grants human approval. An operator supplies the frozen plan hash only
after the user approves its articles, assets and explicitly listed support files.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import contextlib
import ctypes
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

from trading_release_remote import GitHubRemote

REPO = Path(__file__).resolve().parent.parent
REPOSITORY = "Rexmiao/rexmiao.github.io"
SITE = "https://rexy.levyquant.ai"
ARTICLE_NAME = re.compile(r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md\Z")
ASSET_ROUTE = re.compile(r"/assets/img/trading-reflections/\d{4}-\d{2}-\d{2}/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?i:png|jpe?g|webp|gif|svg)\Z")
RUBY_ARTICLE = r'''
require "json"; require "yaml"; require "date"
STDOUT.set_encoding("UTF-8")
text = STDIN.read.force_encoding("UTF-8").gsub("\r\n", "\n")
match = text.match(/\A---\n(.*?)\n---\n(.*)\z/m)
abort "Missing front matter" unless match
meta = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: false)
meta["published"] = true
print JSON.generate(metadata: meta, body: match[2], prepared: YAML.dump(meta, line_width: -1) + "---\n" + match[2])
'''


def emit(event, **fields):
    print(json.dumps({"event": event, **fields}, ensure_ascii=True), flush=True)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def payload_hash(payload):
    data = {key: value for key, value in payload.items() if key != "sha256"}
    return hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def run(args, repo=REPO, input_text=None):
    result = subprocess.run([str(arg) for arg in args], cwd=repo, input=input_text,
                            capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        # These tools never receive credentials through arguments, stdin or files.
        detail = (result.stderr or result.stdout).strip()[-2400:]
        raise RuntimeError(f"{Path(str(args[0])).name} failed ({result.returncode}): {detail}")
    return result.stdout


def git(args, repo=REPO):
    return run([shutil.which("git") or "git", "-c", f"safe.directory={repo.resolve().as_posix()}",
                "-c", "core.autocrlf=false", *args], repo)


def private_path(path, repo=REPO, exists=True):
    path = Path(path).resolve(strict=exists)
    private = (repo.parent / ".work" / "trading-reflections").resolve()
    if not path.is_relative_to(private) or path.is_relative_to(repo.resolve()):
        raise ValueError("Release plans, state, drafts and raw material must stay in the private journal directory")
    return path


def target_path(relative, repo=REPO):
    path = (repo / relative).resolve()
    if not path.is_relative_to(repo.resolve()) or ".git" in path.relative_to(repo.resolve()).parts:
        raise ValueError("Release target escapes the source checkout")
    return path


def destination_key(relative, repo=REPO):
    return os.path.normcase(str(target_path(relative, repo)))


def save_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + f".{os.getpid()}.tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    temp.replace(path)


def formatter(repo=REPO):
    lock = json.loads((repo / "package-lock.json").read_text(encoding="utf-8"))
    for package in ["prettier", "@shopify/prettier-plugin-liquid"]:
        installed = repo / "node_modules" / package / "package.json"
        expected = lock["packages"]["node_modules/" + package]["version"]
        if not installed.is_file() or json.loads(installed.read_text(encoding="utf-8"))["version"] != expected:
            raise RuntimeError("Restore the existing locked formatter with npm ci --ignore-scripts; do not upgrade it")
    return [shutil.which("node") or "node", repo / "node_modules/prettier/bin/prettier.cjs"]


def inspect_draft(path, repo=REPO):
    snapshot = Path(path).read_bytes()
    checked = json.loads(run(["ruby", repo / "bin/trading_reflections.rb", "check", path], repo))
    if hashlib.sha256(snapshot).hexdigest() != checked["sha256"]:
        raise ValueError("Draft changed during validation")
    if checked["published"] or not checked["bilingual"]:
        raise ValueError("Release input must be a reviewed, unpublished bilingual draft")
    content = json.loads(run(["ruby", "-e", RUBY_ARTICLE], repo, snapshot.decode("utf-8")))
    return checked, content


def language_metrics(body):
    counts = {}
    for language in ["en", "zh"]:
        matches = re.findall(r'<div\b[^>]*class="reflection-body"[^>]*data-lang="' + language + r'"[^>]*>(.*?)</div>', body, re.S)
        if len(matches) != 1:
            raise ValueError("Use the established bilingual body containers")
        section = matches[0]
        delimiters = re.findall(r"^\s*\$\$\s*$", section, re.M)
        if len(delimiters) % 2:
            raise ValueError("Unpaired display-math delimiters")
        counts[language] = {"math": len(delimiters) // 2,
                            "intuition": len(re.findall(r'class="reflection-intuition"', section))}
    return counts


def manifest_from_drafts(paths, repo=REPO):
    manifest = {"drafts": [], "assets": []}
    selected = set()
    for value in paths:
        path = private_path(value, repo)
        manifest["drafts"].append({"path": str(path), "sha256": sha(path)})
        text = path.read_text(encoding="utf-8")
        for route in re.findall(r"/assets/img/trading-reflections/[^\s)\"<>]+", text):
            if route in selected:
                continue
            if not ASSET_ROUTE.fullmatch(route):
                raise ValueError("Invalid public image reference")
            selected.add(route)
            date, name = route.split("/")[-2:]
            asset = private_path(repo.parent / ".work/trading-reflections" / f"{date}-materials" / "assets" / name, repo)
            manifest["assets"].append({"local_path": str(asset), "sha256": sha(asset), "public_path_after_approval": route})
    return manifest


def create_plan(manifest_path, support_files=(), repo=REPO, x_debrief=None, x_language=None, x_account="Rexy69492164"):
    if isinstance(manifest_path, dict):
        manifest = manifest_path
    else:
        manifest_path = private_path(manifest_path, repo)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    plan = {"schema_version": 1, "repository": REPOSITORY, "site_url": SITE,
            "branch": "master", "base_commit": git(["rev-parse", "HEAD"], repo).strip(),
            "articles": [], "assets": [], "support_files": []}
    destinations = set()
    for item in manifest.get("drafts", []):
        path = private_path(item["path"], repo)
        if not ARTICLE_NAME.fullmatch(path.name):
            raise ValueError("Invalid dated article filename")
        checked, data = inspect_draft(path, repo)
        if item.get("sha256", checked["sha256"]) != checked["sha256"]:
            raise ValueError("Draft differs from the reviewed manifest")
        route = "/projects/trading-reflections/" + path.stem + "/"
        if item.get("public_route_after_approval", route) != route:
            raise ValueError("Article route differs from its filename")
        relative = "_trading_reflections/" + path.name
        key = destination_key(relative, repo)
        if key in destinations:
            raise ValueError("Duplicate article destination")
        destinations.add(key)
        target = target_path(relative, repo)
        meta = data["metadata"]
        metrics = language_metrics(data["body"])
        plan["articles"].append({"draft_path": str(path), "sha256": checked["sha256"], "target": relative,
                                 "target_before_sha256": sha(target) if target.exists() else None,
                                 "route": route, **{key: meta[key] for key in ["title", "title_zh", "description", "description_zh"]},
                                 "display_equations": {key: value["math"] for key, value in metrics.items()},
                                 "intuition_blocks": {key: value["intuition"] for key, value in metrics.items()}})
    if not plan["articles"]:
        raise ValueError("Manifest has no drafts")
    for item in manifest.get("assets", []):
        path = private_path(item["local_path"], repo)
        route = item["public_path_after_approval"]
        if not ASSET_ROUTE.fullmatch(route) or any(word in path.name.lower() for word in ["rejected", "chat-", "private-evidence"]):
            raise ValueError("Only selected public image assets may be released")
        digest = sha(path)
        if item.get("sha256", digest) != digest:
            raise ValueError("Asset differs from the reviewed manifest")
        relative = route.lstrip("/")
        key = destination_key(relative, repo)
        if key in destinations:
            raise ValueError("Duplicate asset destination")
        destinations.add(key)
        target = target_path(relative, repo)
        plan["assets"].append({"local_path": str(path), "sha256": digest, "public_path": route,
                               "target": relative, "target_before_sha256": sha(target) if target.exists() else None})
    for name in support_files:
        path = target_path(name, repo)
        relative = path.relative_to(repo.resolve()).as_posix()
        key = destination_key(relative, repo)
        if key in destinations or path.suffix.lower() not in {".md", ".scss", ".css", ".liquid", ".js", ".mjs", ".py", ".rb", ".yml", ".yaml", ".json"}:
            raise ValueError("Invalid or duplicate support file")
        if relative.startswith(("_trading_reflections/", "assets/img/trading-reflections/")):
            raise ValueError("Journal content must use the reviewed draft/image manifest, not support-file overrides")
        if any(part.startswith(".") and part != ".github" for part in Path(relative).parts):
            raise ValueError("Private files cannot be support files")
        destinations.add(key)
        plan["support_files"].append({"target": relative, "sha256": sha(path)})
    allowed_images = {item["public_path"] for item in plan["assets"]}
    for item in plan["articles"]:
        text = Path(item["draft_path"]).read_text(encoding="utf-8")
        refs = re.findall(r"/assets/img/trading-reflections/[^\s)\"<>]+", text)
        if any(ref not in allowed_images for ref in refs):
            raise ValueError("Every article image must be in the selected asset manifest")
    for key in ["articles", "assets", "support_files"]:
        plan[key].sort(key=lambda item: item["target"])
    if x_debrief is not None or x_language is not None:
        from trading_x import draft, validate
        if x_debrief is not None and x_language is not None:
            raise ValueError("Choose reviewed X copy or generated X copy")
        plan["x_debrief"] = validate(x_debrief, plan["articles"]) if x_debrief is not None else draft(plan["articles"], x_language, x_account)
    plan["sha256"] = payload_hash(plan)
    return plan


def load_plan(path, repo=REPO):
    value = json.loads(private_path(path, repo).read_text(encoding="utf-8"))
    if value.get("schema_version") != 1 or value.get("repository") != REPOSITORY or value.get("branch") != "master":
        raise ValueError("Unexpected release destination or plan version")
    require_current_site(value)
    if value.get("sha256") != payload_hash(value):
        raise ValueError("Release plan changed; prepare and review a fresh plan")
    return value


def require_current_site(plan):
    if plan.get("site_url") != SITE:
        raise ValueError("The frozen release plan uses another website origin. Create and review a fresh plan for "
                         + SITE + "; the existing plan has not been migrated")


def x_preferences(repo=None):
    """Nonsecret, explicitly chosen local defaults; never implies account access."""
    repo = repo or REPO
    path = private_path(repo.parent / ".work/trading-reflections/x-preferences.json", repo=repo, exists=False)
    if not path.exists():
        return {}
    value = json.loads(path.read_text(encoding="utf-8"))
    if (not isinstance(value, dict) or set(value) != {"schema_version", "enabled", "account", "language"}
            or value["schema_version"] != 1 or not isinstance(value["enabled"], bool)
            or not isinstance(value["account"], str) or not re.fullmatch(r"[A-Za-z0-9_]{1,15}", value["account"])
            or value["language"] not in {"en", "zh", "both"}):
        raise ValueError("Invalid local X preferences; review the nonsecret settings")
    return value if value["enabled"] else {}


def prepare(plan, repo=REPO):
    require_current_site(plan)
    # Complete all validation and formatting before writing any public files.
    writes = []
    fmt = formatter(repo)
    for item in plan["articles"]:
        path = private_path(item["draft_path"], repo)
        if sha(path) != item["sha256"]:
            raise ValueError("Approved draft changed")
        checked, data = inspect_draft(path, repo)
        if checked["sha256"] != item["sha256"]:
            raise ValueError("Approved draft changed during validation")
        text = run([*fmt, "--stdin-filepath", item["target"]], repo, data["prepared"])
        if sha(path) != item["sha256"]:
            raise ValueError("Approved draft changed during formatting")
        writes.append((item, text.encode("utf-8")))
    for item in plan["assets"]:
        path = private_path(item["local_path"], repo)
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ValueError("Approved image changed")
        writes.append((item, data))
    expected = {item["target"]: hashlib.sha256(data).hexdigest() for item, data in writes}
    for item in plan["support_files"]:
        path = target_path(item["target"], repo)
        data = path.read_bytes()
        data.decode("utf-8")
        if hashlib.sha256(data).hexdigest() != item["sha256"] or b"\r" in data:
            raise ValueError("Support file changed or does not use LF")
        expected[item["target"]] = item["sha256"]
    for item, data in writes:
        target = target_path(item["target"], repo)
        desired = hashlib.sha256(data).hexdigest()
        current = sha(target) if target.exists() else None
        if current not in {item["target_before_sha256"], desired}:
            raise ValueError("Publication target changed since review")
    for item, data in writes:
        target = target_path(item["target"], repo)
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != data:
            temp = target.with_name(target.name + f".{os.getpid()}.tmp")
            temp.write_bytes(data)
            temp.replace(target)
    files = [item["target"] for item in plan["articles"] + plan["assets"] + plan["support_files"]]
    text_files = [name for name in files if name not in {item["target"] for item in plan["assets"]}]
    # Ruby/Python files have no Prettier parser; validate only supported files.
    pretty = [name for name in text_files if Path(name).suffix in {".md", ".scss", ".css", ".liquid", ".js", ".mjs", ".json", ".yaml", ".yml"}]
    if pretty:
        run([*fmt, "--check", "--", *pretty], repo)
    git(["diff", "--check", "--", *files], repo)
    if any(sha(target_path(name, repo)) != digest for name, digest in expected.items()):
        raise RuntimeError("Prepared file changed before its receipt was saved")
    return expected


def cpu_load():
    if os.name != "nt":
        return None
    try:
        def sample():
            idle, kernel, user = [ctypes.c_ulonglong() for _ in range(3)]
            if not ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
                return None
            return idle.value, kernel.value + user.value
        first = sample()
        time.sleep(0.15)
        second = sample()
        return max(0.0, min(100.0, 100 * (1 - (second[0] - first[0]) / (second[1] - first[1]))))
    except (AttributeError, TypeError, ZeroDivisionError, OSError):
        return None


def verify_prepared_index(hashes, repo=REPO):
    staged = set(git(["diff", "--cached", "--name-only"], repo).splitlines())
    if staged.difference(hashes):
        raise RuntimeError("Unrelated changes entered the index during staging")
    for name, digest in hashes.items():
        data = target_path(name, repo).read_bytes()
        if hashlib.sha256(data).hexdigest() != digest:
            raise RuntimeError("Approved file changed during staging")
        blob = hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()
        if git(["rev-parse", f":{name}"], repo).strip() != blob:
            raise RuntimeError("Staged blob differs from the approved file")


def require_deployment_success(report, source_sha):
    required = {"Deploy site", "Prettier code formatter", "Check for broken links",
                "Check for broken links on site", "pages build and deployment"}
    runs = report.get("workflows", [])
    if (report.get("status") != "succeeded" or report.get("source_sha") != source_sha
            or report.get("generated_source_verified") is not True
            or not re.fullmatch(r"[a-f0-9]{40}", report.get("generated_sha", ""))
            or len(runs) != 5 or {item.get("name") for item in runs} != required
            or any(item.get("status") != "completed" or item.get("conclusion") != "success" for item in runs)):
        raise RuntimeError("A complete, exact-commit successful deployment report is required")


def verify_http(plan, output_dir):
    require_current_site(plan)
    targets = [{"path": item["public_path"], "sha256": item["sha256"]} for item in plan["assets"]]
    targets += [{"path": item["route"]} for item in plan["articles"]]
    targets += [{"path": path} for path in ["/", "/projects/", "/projects/trading-reflections/", "/assets/img/runtian-miao.jpg",
                *[f"/assets/img/runtian-miao-{size}.webp" for size in [480, 800, 1400]]]]
    def fetch(item):
        for attempt in range(3):
            try:
                request = urllib.request.Request(plan["site_url"] + item["path"], headers={"User-Agent": "Codex-journal-release-verification"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    data = response.read()
                    if response.status != 200 or not data:
                        raise RuntimeError("Empty or unsuccessful public resource: " + item["path"])
                    if "sha256" in item and hashlib.sha256(data).hexdigest() != item["sha256"]:
                        raise RuntimeError("Published image does not match its approved bytes: " + item["path"])
                    return {"path": item["path"], "status": response.status, "bytes": len(data), "hash_matches": "sha256" in item}
            except (OSError, urllib.error.URLError):
                if attempt == 2:
                    raise
                time.sleep(2)
    load = cpu_load()
    workers = 1 if load is not None and load >= 70 else 2 if load is not None and load >= 40 else 3
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(fetch, targets))
    report = {"success": True, "urls_checked": len(results), "approved_image_hashes_matched": len(plan["assets"]), "resources": results}
    save_json(Path(output_dir) / "http-checks.json", report)
    return report


def verify_browser(plan, output_dir, repo=REPO, screenshots=False):
    require_current_site(plan)
    for attempt in range(6):
        load = cpu_load()
        if load is None or load < 85:
            break
        emit("waiting_for_cpu", cpu_percent=round(load, 1))
        if attempt == 5:
            raise RuntimeError("CPU remains above the user's preference; resume browser verification when load falls")
        time.sleep(20)
    spec = {"schema_version": 1, "site_url": plan["site_url"], "articles": plan["articles"], "assets": plan["assets"],
            "archive_route": "/projects/trading-reflections/", "projects_route": "/projects/", "screenshots": screenshots}
    spec_path = Path(output_dir) / "browser-spec.json"
    save_json(spec_path, spec)
    emit("browser_verification_started", articles=len(plan["articles"]))
    stdout = run([shutil.which("node") or "node", "--preserve-symlinks", "--preserve-symlinks-main",
                  repo / "bin/trading_release_browser.mjs", "--spec", spec_path, "--output-dir", output_dir], repo)
    summary = json.loads(stdout.strip().splitlines()[-1])
    report = json.loads((Path(output_dir) / "browser-checks.json").read_text(encoding="utf-8"))
    if summary.get("success") is not True or report.get("success") is not True:
        raise RuntimeError("Live browser verification failed; inspect browser-checks.json")
    return summary


@contextlib.contextmanager
def release_lock(state_path, repo=REPO):
    lock = private_path(repo.parent / ".work/trading-reflections/.publish.lock", repo, exists=False)
    lock.parent.mkdir(parents=True, exist_ok=True)
    marker = json.dumps({"pid": os.getpid(), "state": str(state_path)})
    try:
        with lock.open("x", encoding="utf-8") as handle:
            handle.write(marker)
    except FileExistsError:
        raise RuntimeError("A release lock exists; inspect its PID/state. Remove a stale lock only after confirming that its process has stopped")
    try:
        yield
    finally:
        if lock.exists() and lock.read_text(encoding="utf-8") == marker:
            lock.unlink()


def continue_release(state, state_path, repo=REPO, remote=None, timeout=1200, poll=20, screenshots=False, x_client=None):
    plan = state["plan"]
    require_current_site(plan)
    if (plan.get("schema_version") != 1 or plan.get("repository") != REPOSITORY
            or plan.get("branch") != "master" or payload_hash(plan) != state["approved_sha256"]):
        raise ValueError("State does not identify the approved plan")
    previous_receipt = state["phase"] == "verified"
    remote = remote or GitHubRemote(repo)
    if state["phase"] == "approved":
        if git(["branch", "--show-current"], repo).strip() != "master":
            raise RuntimeError("Release source must be the master branch")
        origin = git(["remote", "get-url", "origin"], repo).strip()
        if origin != "https://github.com/Rexmiao/rexmiao.github.io.git":
            raise RuntimeError("The source origin is not the selected personal website repository")
        if git(["rev-parse", "HEAD"], repo).strip() != plan["base_commit"] or remote.head("master") != state["expected_head"]:
            raise RuntimeError("Local or remote source head changed before preparation")
        if plan["base_commit"] != state["expected_head"]:
            raise RuntimeError("Local source is not synchronized with the reviewed remote head")
        if git(["diff", "--cached", "--name-only"], repo).strip():
            raise RuntimeError("The index already contains staged changes; preserve that work before releasing")
        state["prepared_hashes"] = prepare(plan, repo)
        state["phase"] = "prepared"
        save_json(state_path, state)
        emit("prepared", articles=len(plan["articles"]), images=len(plan["assets"]))
    if state["phase"] == "prepared":
        for name, digest in state["prepared_hashes"].items():
            if sha(target_path(name, repo)) != digest:
                raise RuntimeError("Prepared content changed before commit")
        files = list(state["prepared_hashes"])
        head = git(["rev-parse", "HEAD"], repo).strip()
        if head != plan["base_commit"]:
            # Recover the narrow crash window after commit but before its receipt.
            parent = git(["rev-parse", "HEAD^"], repo).strip()
            changed = set(git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], repo).splitlines())
            same_files = changed and changed.issubset(files) and all(
                git(["rev-parse", f"HEAD:{name}"], repo).strip() == git(["hash-object", "--", name], repo).strip()
                for name in files)
            if parent != plan["base_commit"] or not same_files:
                raise RuntimeError("Local source head advanced before commit")
            state.update(phase="committed", source_sha=head)
            save_json(state_path, state)
        staged = set(git(["diff", "--cached", "--name-only"], repo).splitlines())
        if staged.difference(files):
            raise RuntimeError("Unrelated staged changes must not enter this release")
        if state["phase"] == "prepared":
            git(["add", "--", *files], repo)
            verify_prepared_index(state["prepared_hashes"], repo)
            git(["diff", "--cached", "--check"], repo)
            if not git(["diff", "--cached", "--name-only"], repo).strip():
                raise RuntimeError("No release changes; verify the existing publication instead of making an empty commit")
            git(["commit", "-m", f"Publish {len(plan['articles'])} reviewed Trading Reflections"], repo)
            state.update(phase="committed", source_sha=git(["rev-parse", "HEAD"], repo).strip())
            save_json(state_path, state)
            emit("committed", source_sha=state["source_sha"])
    if state["phase"] == "committed":
        if git(["rev-parse", "HEAD"], repo).strip() != state["source_sha"]:
            raise RuntimeError("Local source head changed; do not push unreviewed commits")
        head = remote.head("master")
        if head != state["source_sha"]:
            remote.push(state["expected_head"])
        state["phase"] = "pushed"
        save_json(state_path, state)
        emit("pushed", source_sha=state["source_sha"])
    if state["phase"] == "pushed":
        state["deployment"] = remote.wait_for_deployment(state["source_sha"], timeout_seconds=timeout,
                                                          poll_seconds=poll, on_progress=lambda value: emit("workflows", snapshot=value))
        require_deployment_success(state["deployment"], state["source_sha"])
        state["phase"] = "deployed"
        save_json(state_path, state)
    if state["phase"] == "deployed":
        if not state.get("http", {}).get("success"):
            state["http"] = verify_http(plan, state_path.parent)
            save_json(state_path, state)
        if state["http"].get("success") is not True:
            raise RuntimeError("HTTP verification did not succeed")
        state["browser"] = verify_browser(plan, state_path.parent, repo, screenshots)
        if state["browser"].get("success") is not True:
            raise RuntimeError("Browser verification did not succeed")
        if (remote.head("master") != state["source_sha"]
                or remote.head("gh-pages") != state["deployment"]["generated_sha"]):
            raise RuntimeError("The remote advanced during verification; inspect before reporting the current publication")
        state["phase"] = "verified"
        state["completed_utc"] = datetime.now(timezone.utc).isoformat()
        state.pop("last_error", None)
        save_json(state_path, state)
    if state["phase"] != "verified":
        raise ValueError("Unknown release state")
    social = {"status": "disabled"}
    if plan.get("x_debrief") is not None:
        try:
            from trading_x import publish as publish_x
            require_deployment_success(state["deployment"], state["source_sha"])
            if (remote.head("master") != state["source_sha"]
                    or remote.head("gh-pages") != state["deployment"]["generated_sha"]):
                social = {"status": "needs_review", "reason": "Website changed before X publication"}
            else:
                social = publish_x(state, state_path, save_json, client=x_client)
        except Exception:
            # Preserve the website receipt and never blindly repeat a POST after
            # an unexpected network/storage failure in the independent X step.
            social = {"status": "needs_attention", "reason": "X synchronization stopped; inspect its saved receipt before retrying"}
    return {"status": "previously_verified" if previous_receipt else "published_and_verified", "source_sha": state["source_sha"],
            "urls": [SITE + article["route"] for article in plan["articles"]],
            "images": len(plan["assets"]), "state": str(state_path), "x_debrief": social}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    plan_cmd = commands.add_parser("plan", help="Freeze reviewed draft/image hashes; no Git mutation or network")
    inputs = plan_cmd.add_mutually_exclusive_group(required=True)
    inputs.add_argument("--manifest", help="Existing reviewed asset manifest")
    inputs.add_argument("--draft", action="append", help="Repeat for each draft; images are discovered from its canonical links")
    plan_cmd.add_argument("--out")
    plan_cmd.add_argument("--support-file", action="append", default=[])
    x_options = plan_cmd.add_mutually_exclusive_group()
    x_options.add_argument("--x-debrief", help="Private JSON with the reviewed X account and exact posts")
    x_options.add_argument("--x-language", choices=["en", "zh", "both"], help="Generate X copy from article descriptions for review")
    x_options.add_argument("--no-x", action="store_true", help="Explicitly omit X from this plan despite local defaults")
    plan_cmd.add_argument("--x-account", help="Override the locally confirmed X account")
    publish = commands.add_parser("publish", help="Only after user approval: prepare, commit, push, wait, and verify")
    publish.add_argument("--plan", required=True)
    publish.add_argument("--approved-sha256", required=True)
    publish.add_argument("--expected-head", required=True)
    resume = commands.add_parser("resume", help="Continue a previously authorized release without another commit/push")
    resume.add_argument("--state", required=True)
    verify = commands.add_parser("verify", help="Read-only checks for an existing deployment")
    verify.add_argument("--plan", required=True)
    verify.add_argument("--source-sha", required=True)
    for command in [publish, resume, verify]:
        command.add_argument("--timeout", type=int, default=1200)
        command.add_argument("--poll", type=int, default=20)
        command.add_argument("--screenshots", action="store_true")
    args = parser.parse_args(argv)
    state, state_path = None, None
    try:
        if args.command == "plan":
            source = args.manifest if args.manifest else manifest_from_drafts(args.draft)
            social = json.loads(private_path(args.x_debrief).read_text(encoding="utf-8")) if args.x_debrief else None
            preferences = {} if args.no_x else x_preferences()
            language = None if args.x_debrief else args.x_language or preferences.get("language")
            plan = create_plan(source, args.support_file, x_debrief=social, x_language=language,
                               x_account=args.x_account or preferences.get("account", "Rexy69492164"))
            folder = (Path(args.manifest).parent if args.manifest else
                      REPO.parent / ".work/trading-reflections" / (Path(args.draft[0]).name[:10] + "-materials"))
            output = private_path(args.out or folder / "release-plan.json", exists=False)
            if output.exists() and json.loads(output.read_text(encoding="utf-8")).get("sha256") != plan["sha256"]:
                raise ValueError("Plan already exists for a different version; choose a new output name")
            save_json(output, plan)
            emit("plan_ready", plan=str(output), sha256=plan["sha256"], articles=len(plan["articles"]), images=len(plan["assets"]),
                 x_debrief=plan.get("x_debrief"))
            return 0
        if args.command == "verify":
            plan = load_plan(args.plan)
            output = private_path(Path(args.plan).parent / "verification", exists=False)
            output.mkdir(parents=True, exist_ok=True)
            remote = GitHubRemote(REPO)
            deployment = remote.wait_for_deployment(args.source_sha, timeout_seconds=args.timeout, poll_seconds=args.poll,
                          on_progress=lambda value: emit("workflows", snapshot=value))
            require_deployment_success(deployment, args.source_sha)
            result = {"deployment": deployment, "http": verify_http(plan, output),
                      "browser": verify_browser(plan, output, screenshots=args.screenshots)}
            if result["http"].get("success") is not True or result["browser"].get("success") is not True:
                raise RuntimeError("Live verification did not succeed")
            if remote.head("master") != args.source_sha or remote.head("gh-pages") != deployment["generated_sha"]:
                raise RuntimeError("The source head changed during verification")
            save_json(output / "verification.json", result)
            emit("verified", source_sha=args.source_sha, report=str(output / "verification.json"))
            return 0
        if args.command == "publish":
            plan = load_plan(args.plan)
            if args.approved_sha256 != plan["sha256"] or not re.fullmatch(r"[a-f0-9]{40}", args.expected_head):
                raise ValueError("Specify the user-approved plan hash and the verified full remote commit SHA")
            state_path = private_path(Path(args.plan).with_suffix(".state.json"), exists=False)
            if state_path.exists():
                raise ValueError("A release state already exists; use resume")
            state = {"schema_version": 1, "phase": "approved", "plan": plan, "approved_sha256": args.approved_sha256,
                     "expected_head": args.expected_head}
        else:
            state_path = private_path(args.state)
            state = json.loads(state_path.read_text(encoding="utf-8"))
        with release_lock(state_path):
            if args.command == "publish":
                save_json(state_path, state)
            result = continue_release(state, state_path, timeout=args.timeout, poll=args.poll, screenshots=args.screenshots)
        emit("complete", **result)
        return 0 if result["x_debrief"]["status"] in {"disabled", "posted"} else 2
    except Exception as error:
        report = {"type": type(error).__name__, "message": str(error)}
        if hasattr(error, "report"):
            report["details"] = error.report
        if state is not None and state_path is not None:
            state["last_error"] = report
            save_json(state_path, state)
        emit("stopped", error=report, resume_state=str(state_path) if state_path else None)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
