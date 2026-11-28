"""Narrow GitHub transport and exact-commit deployment verification.

Only the existing personal website repository is supported. This module does
not authorize publication: callers must first obtain approval of the specific
release and verify the selected native GitHub App installation. No code runs
at import time, and no credentials or global Git configuration are written.

``runner`` may be a subprocess.run-compatible callable for offline tests. It
receives an argv list, shell=False, cwd, capture_output, text, encoding, errors,
check, and timeout. Raw process output is never included in raised errors.
"""

from __future__ import annotations

import copy
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import time
from urllib.parse import parse_qsl, urlencode, urlsplit


REPOSITORY = "Rexmiao/rexmiao.github.io"
SOURCE_BRANCH = "master"
GENERATED_BRANCH = "gh-pages"
ORIGIN_URL = f"https://github.com/{REPOSITORY}.git"
REPOSITORY_API = f"repos/{REPOSITORY}"
SOURCE_WORKFLOWS = (
    "Deploy site",
    "Prettier code formatter",
    "Check for broken links",
    "Check for broken links on site",
)
PAGES_WORKFLOW = "pages build and deployment"
_SHA = re.compile(r"^[0-9a-fA-F]{40}$")
_READ_PATHS = re.compile(
    r"^(?:"
    r"|git/ref/heads/(?:master|gh-pages)"
    r"|git/commits/[0-9a-fA-F]{40}"
    r"|commits/[0-9a-fA-F]{40}"
    r"|actions/runs(?:/[0-9]+(?:/jobs)?)?"
    r"|actions/jobs/[0-9]+"
    r")$"
)


class RemoteError(RuntimeError):
    """Safe error details; ``report`` may be persisted for a later resume."""

    def __init__(self, message, *, report=None, recoverable=True):
        super().__init__(message)
        self.report = report or {}
        self.recoverable = recoverable


class RemoteChanged(RemoteError):
    """A branch no longer identifies the release being checked."""


class DeploymentFailed(RemoteError):
    """A required workflow completed without success; no rerun is attempted."""


class DeploymentTimeout(RemoteError):
    """The bounded wait ended; repeat it with the same source SHA to resume."""


def _sha(value):
    if not isinstance(value, str) or not _SHA.fullmatch(value):
        raise RemoteError("A full 40-character commit SHA is required.", recoverable=False)
    return value.lower()


def _executable(name, explicit, injected_runner):
    if explicit is not None:
        explicit = os.fspath(explicit)
        found = shutil.which(explicit)
        if found:
            return str(Path(found).resolve())
        candidate = Path(explicit).expanduser()
        if candidate.is_file():
            return str(candidate.resolve())
        if injected_runner:
            return explicit  # Offline stubs do not need installed executables.
        raise RemoteError(f"The selected {name} executable was not found.", recoverable=False)
    found = shutil.which(name)
    if found:
        return str(Path(found).resolve())
    program_files = Path(os.environ.get("ProgramFiles", "C:/Program Files"))
    candidates = (
        [program_files / "GitHub CLI" / "gh.exe"]
        if name == "gh"
        else [
            program_files / "Git" / "cmd" / "git.exe",
            Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe",
        ]
    )
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate.resolve())
    raise RemoteError(f"{name} is unavailable; use the existing installation, not a new login or dependency install.", recoverable=False)


class GitHubRemote:
    def __init__(self, repo_dir, gh_path=None, git_path=None, runner=None):
        try:
            self.repo_dir = Path(repo_dir).expanduser().resolve(strict=True)
        except OSError:
            raise RemoteError("The source checkout directory does not exist.", recoverable=False) from None
        if not self.repo_dir.is_dir():
            raise RemoteError("The source checkout must be a directory.", recoverable=False)
        self._runner = runner or subprocess.run
        self.gh_path = _executable("gh", gh_path, runner is not None)
        self.git_path = _executable("git", git_path, runner is not None)

    def _run(self, argv, *, operation):
        try:
            result = self._runner(
                list(argv), cwd=str(self.repo_dir), shell=False,
                capture_output=True, text=True, encoding="utf-8", errors="replace",
                check=False, timeout=60,
            )
        except (OSError, subprocess.SubprocessError):
            raise RemoteError(f"{operation} could not complete; check the existing tool and network access.") from None
        if result.returncode:
            # Never relay raw stderr/stdout, an argv dump, or environment values.
            stderr = result.stderr or ""
            if isinstance(stderr, bytes):
                stderr = stderr.decode("utf-8", errors="replace")
            match = re.search(r"\bHTTP\s+(\d{3})\b", stderr, re.I)
            details = {"exit_code": result.returncode}
            if match:
                details["http_status"] = int(match.group(1))
            raise RemoteError(f"{operation} failed; no login, retry, or permission change was attempted.", report=details)
        output = result.stdout or ""
        return output.decode("utf-8") if isinstance(output, bytes) else output

    def _git(self, *args):
        return self._run(
            [self.git_path, "-c", f"safe.directory={self.repo_dir.as_posix()}",
             "-c", "core.autocrlf=false", "-C", str(self.repo_dir), *args],
            operation="Repository Git command",
        ).strip()

    @staticmethod
    def _endpoint(endpoint):
        if not isinstance(endpoint, str) or any(ord(char) < 32 for char in endpoint):
            raise RemoteError("Invalid GitHub API endpoint.", recoverable=False)
        parsed = urlsplit(endpoint)
        if parsed.scheme or parsed.netloc or parsed.fragment or "\\" in endpoint:
            raise RemoteError("Use a relative, repository-scoped GitHub API endpoint.", recoverable=False)
        path = parsed.path.removeprefix("/")
        if path == REPOSITORY_API:
            suffix = ""
        elif path.startswith(REPOSITORY_API + "/"):
            suffix = path[len(REPOSITORY_API) + 1:]
        elif path.startswith("repos/"):
            raise RemoteError("Only the selected personal website repository is permitted.", recoverable=False)
        else:
            suffix = path
        if not _READ_PATHS.fullmatch(suffix):
            raise RemoteError("This API path is outside the release verifier's read-only scope.", recoverable=False)
        try:
            pairs = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
        except ValueError:
            raise RemoteError("Invalid GitHub API query.", recoverable=False) from None
        query = {}
        for key, value in pairs:
            if key in query:
                raise RemoteError("Duplicate GitHub API query keys are not allowed.", recoverable=False)
            if key == "head_sha":
                value = _sha(value)
            elif key in {"per_page", "page"}:
                limit = 100 if key == "per_page" else 10
                if not value.isdigit() or not 1 <= int(value) <= limit:
                    raise RemoteError("GitHub pagination is outside its bounded range.", recoverable=False)
            elif key == "branch":
                if value not in {SOURCE_BRANCH, GENERATED_BRANCH}:
                    raise RemoteError("Only the website's two established branches are permitted.", recoverable=False)
            elif key == "event":
                if value not in {"push", "workflow_run", "workflow_dispatch", "dynamic"}:
                    raise RemoteError("Unsupported workflow event filter.", recoverable=False)
            elif key == "status":
                if value not in {"queued", "in_progress", "completed"}:
                    raise RemoteError("Unsupported workflow status filter.", recoverable=False)
            else:
                raise RemoteError("Unsupported GitHub API query key.", recoverable=False)
            query[key] = value
        scoped = REPOSITORY_API + ("/" + suffix if suffix else "")
        return scoped + ("?" + urlencode(query) if query else "")

    def api(self, endpoint):
        """GET JSON from narrowly allowed endpoints of this repository only."""
        endpoint = self._endpoint(endpoint)
        output = self._run(
            [self.gh_path, "api", "--hostname", "github.com", "--method", "GET",
             "--header", "Accept: application/vnd.github+json", endpoint],
            operation="Repository GitHub read",
        )
        try:
            return json.loads(output)
        except (ValueError, TypeError):
            raise RemoteError("GitHub returned invalid JSON; raw output was not retained.") from None

    def head(self, branch):
        if branch not in {SOURCE_BRANCH, GENERATED_BRANCH}:
            raise RemoteError("Only master and gh-pages heads may be read.", recoverable=False)
        data = self.api(f"git/ref/heads/{branch}")
        try:
            return _sha(data["object"]["sha"])
        except (KeyError, TypeError):
            raise RemoteError("GitHub returned an incomplete branch reference.") from None

    def push(self, expected_head):
        """Push the exact local master commit after a fresh remote-head check.

        Approval and native installation preflight belong to the caller. This
        deliberately uses normal fast-forward push, with no force or reruns.
        """
        expected_head = _sha(expected_head)
        top = Path(self._git("rev-parse", "--show-toplevel")).resolve()
        if top != self.repo_dir:
            raise RemoteError("The selected directory is not the exact checkout root.", recoverable=False)
        if self._git("symbolic-ref", "--quiet", "--short", "HEAD") != SOURCE_BRANCH:
            raise RemoteError("Publication requires the existing master branch.", recoverable=False)
        for args in (("remote", "get-url", "--all", "origin"),
                     ("remote", "get-url", "--push", "--all", "origin")):
            if self._git(*args) != ORIGIN_URL:
                raise RemoteError("Origin and its push URL must exactly match the personal website HTTPS remote, without credentials.", recoverable=False)
        source_sha = _sha(self._git("rev-parse", "--verify", "HEAD"))
        before = self.head(SOURCE_BRANCH)
        if before != expected_head:
            raise RemoteChanged("Remote master changed after preflight; review the new head before pushing.", report={
                "status": "remote_changed", "source_sha": source_sha,
                "expected_head": expected_head, "remote_head": before,
            })
        helper = "!" + shlex.quote(self.gh_path.replace("\\", "/")) + " auth git-credential"
        self._git("-c", "credential.helper=", "-c", f"credential.helper={helper}",
                  "push", "--porcelain", "origin", f"{source_sha}:refs/heads/{SOURCE_BRANCH}")
        after = self.head(SOURCE_BRANCH)
        report = {"status": "pushed", "source_sha": source_sha,
                  "previous_head": before, "remote_head": after}
        if after != source_sha:
            report["status"] = "remote_changed"
            raise RemoteChanged("Remote master changed after the push; verify the release before continuing.", report=report)
        return report

    def _runs(self, sha):
        runs = []
        for page in range(1, 11):
            data = self.api(f"actions/runs?head_sha={sha}&per_page=100&page={page}")
            if not isinstance(data, dict) or not isinstance(data.get("workflow_runs"), list):
                raise RemoteError("GitHub returned an incomplete workflow list.")
            batch = data["workflow_runs"]
            runs.extend(run for run in batch if run.get("head_sha", "").lower() == sha)
            if len(batch) < 100 or page * 100 >= data.get("total_count", 0):
                return runs
        raise RemoteError("Too many workflow runs for one source SHA; inspect this release manually.")

    @staticmethod
    def _select(runs, name, branch):
        eligible = [run for run in runs if run.get("name") == name and run.get("head_branch") == branch]
        if name != PAGES_WORKFLOW:
            eligible = [run for run in eligible if run.get("event") in {"push", "workflow_run", "workflow_dispatch"}]
        else:
            eligible = [run for run in eligible if run.get("event") == "dynamic"]
        if not eligible:
            return {"id": None, "name": name, "status": "missing", "conclusion": None, "url": None}
        run = max(eligible, key=lambda item: (item.get("run_number", 0), item.get("id", 0), item.get("run_attempt", 1)))
        run_id = run.get("id")
        if not isinstance(run_id, int) or isinstance(run_id, bool) or run_id <= 0:
            raise RemoteError("GitHub returned an invalid workflow run ID.")
        return {"id": run_id, "name": name, "status": run.get("status"),
                "conclusion": run.get("conclusion"),
                "url": f"https://github.com/{REPOSITORY}/actions/runs/{run_id}"}

    def _failed_jobs(self, run_id):
        try:
            data = self.api(f"actions/runs/{run_id}/jobs?per_page=100&page=1")
        except RemoteError:
            return {"jobs_available": False}
        jobs = []
        for job in data.get("jobs", []):
            if job.get("conclusion") not in {None, "success"}:
                jobs.append({
                    "id": job.get("id"), "name": job.get("name"),
                    "status": job.get("status"), "conclusion": job.get("conclusion"),
                    "failed_steps": [
                        {"number": step.get("number"), "name": step.get("name"), "conclusion": step.get("conclusion")}
                        for step in job.get("steps", [])
                        if step.get("conclusion") not in {None, "success", "skipped"}
                    ],
                })
        return {"jobs_available": True, "jobs": jobs,
                "jobs_truncated": data.get("total_count", len(jobs)) > 100}

    def wait_for_deployment(self, source_sha, timeout_seconds=1200, poll_seconds=20, on_progress=None):
        """Wait for four exact-source checks, then exact-generated Pages success.

        Only changed states call ``on_progress(report)``. A timeout or failed
        check raises a RemoteError subclass with a resumable report; call this
        method again with the same source SHA after the external issue is fixed.
        It never reruns a workflow or changes check requirements.
        """
        source_sha = _sha(source_sha)
        if not isinstance(timeout_seconds, (int, float)) or isinstance(timeout_seconds, bool) or not math.isfinite(timeout_seconds) or timeout_seconds <= 0:
            raise RemoteError("timeout_seconds must be positive.", recoverable=False)
        if not isinstance(poll_seconds, (int, float)) or isinstance(poll_seconds, bool) or not math.isfinite(poll_seconds) or not 0 < poll_seconds <= 60:
            raise RemoteError("poll_seconds must be positive and no greater than 60.", recoverable=False)
        deadline = time.monotonic() + timeout_seconds
        generated_sha, last_signature = None, None
        report = {"status": "waiting", "source_sha": source_sha, "generated_sha": None,
                  "generated_source_verified": False, "workflows": []}

        def notify():
            nonlocal last_signature
            signature = json.dumps(report, sort_keys=True, ensure_ascii=False)
            if signature != last_signature:
                last_signature = signature
                if on_progress is not None:
                    on_progress(copy.deepcopy(report))

        while True:
            remote_source = self.head(SOURCE_BRANCH)
            if remote_source != source_sha:
                report.update(status="remote_changed", remote_head=remote_source)
                notify()
                raise RemoteChanged("Remote master no longer identifies this release; no success was claimed.", report=report)
            runs = self._runs(source_sha)
            checks = [self._select(runs, name, SOURCE_BRANCH) for name in SOURCE_WORKFLOWS]
            report["workflows"] = checks
            source_ready = all(run["status"] == "completed" and run["conclusion"] == "success" for run in checks)
            if source_ready:
                candidate = self.head(GENERATED_BRANCH)
                if generated_sha is not None and candidate != generated_sha:
                    report.update(status="remote_changed", current_generated_sha=candidate)
                    notify()
                    raise RemoteChanged("gh-pages changed during verification; resume against the current exact release.", report=report)
                if generated_sha is None:
                    commit = self.api(f"git/commits/{candidate}")
                    message = commit.get("message", "")
                    marker = re.compile(r"(?<![\w/])" + re.escape(f"{REPOSITORY}@{source_sha}") + r"(?![0-9a-fA-F])")
                    if marker.search(message):
                        generated_sha = candidate
                        report.update(generated_sha=generated_sha, generated_source_verified=True)
                    else:
                        report["phase"] = "waiting_for_verifiable_generated_source_mapping"
                if generated_sha is not None:
                    report["phase"] = "waiting_for_pages"
                    pages = self._select(self._runs(generated_sha), PAGES_WORKFLOW, GENERATED_BRANCH)
                    checks.append(pages)
            else:
                report["phase"] = "waiting_for_source_workflows"

            failed = [run for run in checks if run["status"] == "completed" and run["conclusion"] != "success"]
            if failed:
                report["status"] = "failed"
                report["failures"] = [dict(run, **self._failed_jobs(run["id"])) for run in failed]
                notify()
                raise DeploymentFailed("A required workflow did not succeed; inspect its jobs before a bounded, authorized recovery.", report=report)
            pages_ready = len(checks) == len(SOURCE_WORKFLOWS) + 1 and checks[-1]["status"] == "completed" and checks[-1]["conclusion"] == "success"
            if source_ready and generated_sha is not None and pages_ready:
                if self.head(SOURCE_BRANCH) != source_sha or self.head(GENERATED_BRANCH) != generated_sha:
                    report["status"] = "remote_changed"
                    notify()
                    raise RemoteChanged("A branch changed before final verification; no success was claimed.", report=report)
                report.update(status="succeeded", phase="complete", verified_at=datetime.now(timezone.utc).isoformat())
                notify()
                return report
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                report.update(status="timeout", resume_source_sha=source_sha)
                notify()
                raise DeploymentTimeout("Deployment wait timed out; resume with the same source SHA. No rerun was attempted.", report=report)
            notify()
            time.sleep(min(poll_seconds, remaining))
