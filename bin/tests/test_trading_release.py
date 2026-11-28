"""Offline regression checks for the reviewed journal release boundary.

All Git operations are against disposable local repositories. Network, formatter,
Ruby inspection, and browser execution are replaced with explicit test doubles.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
BIN = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BIN))
import trading_release as release


REAL_VERIFY_HTTP = release.verify_http
WORKFLOWS = ["Deploy site", "Prettier code formatter", "Check for broken links",
             "Check for broken links on site", "pages build and deployment"]


def successful_deployment(source_sha, status="succeeded"):
    return {"status": status, "source_sha": source_sha, "generated_sha": "d" * 40,
            "generated_source_verified": True,
            "workflows": [{"name": name, "status": "completed", "conclusion": "success"}
                          for name in WORKFLOWS]}


class OfflineRemote:
    def __init__(self, case):
        self.case = case
        self.remote_sha = case.base
        self.generated_sha = "d" * 40
        self.pushes = []
        self.waits = []
        self.failure = None
        self.deployment_status = "succeeded"

    def head(self, branch):
        if branch == "gh-pages":
            return self.generated_sha
        if branch != "master":
            raise AssertionError("Unexpected branch read")
        return self.remote_sha

    def push(self, expected_head):
        self.pushes.append(expected_head)
        if self.remote_sha != expected_head:
            raise RuntimeError("Remote source changed")
        self.remote_sha = self.case.local_git("rev-parse", "HEAD").strip()

    def wait_for_deployment(self, source_sha, **kwargs):
        self.waits.append(source_sha)
        if self.failure:
            raise self.failure
        return successful_deployment(source_sha, self.deployment_status)


class ReleaseBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.git_executable = shutil.which("git")
        if not cls.git_executable:
            raise unittest.SkipTest("The project's existing Git executable is unavailable")
        cls.scratch = BIN.parents[1] / ".work" / "trading-pipeline-tests"
        cls.scratch.mkdir(parents=True, exist_ok=True)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="release-", dir=self.scratch)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        # Exercise Unicode and quotes without involving a shell.
        self.repo = self.root / "中文 'source'"
        self.repo.mkdir()
        self.private = self.root / ".work" / "trading-reflections"
        self.private.mkdir(parents=True)
        self.state_path = self.private / "release.state.json"
        self.local_git("init", "-b", "master")
        self.local_git("config", "user.name", "Offline Journal Test")
        self.local_git("config", "user.email", "offline-test@example.invalid")
        self.local_git("remote", "add", "origin", "https://github.com/Rexmiao/rexmiao.github.io.git")
        self.support = self.repo / "WEBSITE_SPEC.md"
        self.support.write_text("# Reviewed support\n", encoding="utf-8", newline="\n")
        self.local_git("add", "--", "WEBSITE_SPEC.md")
        self.local_git("commit", "-m", "Offline fixture baseline")
        self.base = self.local_git("rev-parse", "HEAD").strip()
        self.manifest_path = self.private / "manifest.json"
        self.asset_routes = [f"/assets/img/trading-reflections/2026-11-27/chart-{number}.png" for number in range(17)]
        self.assets = []
        for number, route in enumerate(self.asset_routes):
            path = self.private / f"chart-{number}.png"
            path.write_bytes(bytes([0, 255, 137, number]) + b"\r\nBINARY\x00")
            self.assets.append({"local_path": str(path), "public_path_after_approval": route})
        self.drafts = []
        for slug in ["method", "execution"]:
            path = self.private / f"2026-11-27-{slug}.md"
            meta = {"title": 'Reviewed "QQQ" note', "title_zh": "已审阅的交易复盘",
                    "description": "Trading decisions with explicit evidence.",
                    "description_zh": "区分事前判断和事后反思。", "date": "2026-11-27", "published": False}
            images = "\n".join(f"![Evidence]({route})" for route in self.asset_routes)
            body = ('<div class="reflection-body" data-lang="en" lang="en" markdown="1">\n'
                    '## Context\n\nThe plan was prepared before execution.\n\n$$\nx = 1\n$$\n'
                    f'{images}\n</div>\n\n'
                    '<div class="reflection-body" data-lang="zh" lang="zh-CN" markdown="1" hidden>\n'
                    '## 交易背景\n\n先形成候选计划，再核对执行条件。\n\n$$\nx = 1\n$$\n</div>\n')
            path.write_text("---\n" + json.dumps(meta, ensure_ascii=False) + "\n---\n" + body,
                            encoding="utf-8", newline="\n")
            self.drafts.append({"path": str(path)})
        self.manifest = {"drafts": self.drafts, "assets": self.assets}
        self.write_manifest()
        self.original_run = release.run
        self.addCleanup(mock.patch.stopall)
        mock.patch.object(release, "inspect_draft", side_effect=self.inspect_stub).start()
        mock.patch.object(release, "formatter", return_value=["offline-prettier"]).start()
        mock.patch.object(release, "run", side_effect=self.tool_stub).start()
        self.events = mock.patch.object(release, "emit").start()
        self.http = mock.patch.object(release, "verify_http", return_value={"success": True}).start()
        self.browser = mock.patch.object(release, "verify_browser", return_value={"success": True}).start()

    def local_git(self, *args):
        result = subprocess.run([self.git_executable, "-c", "core.autocrlf=false", *args], cwd=self.repo,
                                check=True, capture_output=True, encoding="utf-8")
        return result.stdout

    def write_manifest(self):
        self.manifest_path.write_text(json.dumps(self.manifest, ensure_ascii=False), encoding="utf-8")

    def inspect_stub(self, path, repo=None):
        path = Path(path)
        text = path.read_text(encoding="utf-8")
        _, front, body = text.split("---\n", 2)
        meta = json.loads(front)
        checked = {"sha256": release.sha(path), "published": meta["published"], "bilingual": True}
        if meta["published"]:
            raise ValueError("The reviewed input is no longer a private draft")
        prepared_meta = dict(meta, published=True)
        return checked, {"metadata": meta, "body": body,
                         "prepared": "---\n" + json.dumps(prepared_meta, ensure_ascii=False) + "\n---\n" + body}

    def tool_stub(self, args, repo=None, input_text=None):
        if str(args[0]) == "offline-prettier":
            return input_text or ""
        return self.original_run(args, repo=self.repo if repo is None else repo, input_text=input_text)

    def plan(self):
        self.write_manifest()
        return release.create_plan(self.manifest_path, ["WEBSITE_SPEC.md"], repo=self.repo)

    def state(self, plan, phase="approved"):
        state = {"schema_version": 1, "phase": phase, "plan": plan,
                 "approved_sha256": plan["sha256"], "expected_head": self.base}
        if phase in {"deployed", "verified"}:
            state["deployment"] = successful_deployment(self.base)
        return state

    def prepared(self):
        plan = self.plan()
        state = self.state(plan, "prepared")
        state["prepared_hashes"] = release.prepare(plan, repo=self.repo)
        return plan, state

    def continue_state(self, state, remote=None):
        return release.continue_release(state, self.state_path, repo=self.repo,
                                        remote=remote or OfflineRemote(self), timeout=1, poll=1)

    def test_plan_binds_both_drafts_every_selected_asset_and_support(self):
        baseline = self.plan()["sha256"]
        paths = [Path(item["path"]) for item in self.drafts]
        paths += [Path(item["local_path"]) for item in self.assets] + [self.support]
        for path in paths:
            with self.subTest(source=path.name):
                previous = path.read_bytes()
                path.write_bytes(previous + b"\n")
                self.assertNotEqual(baseline, self.plan()["sha256"])
                path.write_bytes(previous)

    def test_manifest_hash_mismatch_and_unlisted_article_image_are_rejected(self):
        self.manifest["assets"][0]["sha256"] = "0" * 64
        with self.assertRaises(ValueError):
            self.plan()
        del self.manifest["assets"][0]["sha256"]
        self.manifest["assets"].pop()
        with self.assertRaises(ValueError):
            self.plan()

    def test_changed_approved_sources_stop_before_any_public_file_write(self):
        plan = self.plan()
        for path in [Path(self.drafts[0]["path"]), Path(self.assets[-1]["local_path"]), self.support]:
            with self.subTest(source=path.name):
                previous = path.read_bytes()
                path.write_bytes(previous + b"changed")
                with self.assertRaises(ValueError):
                    release.prepare(plan, repo=self.repo)
                self.assertFalse((self.repo / "_trading_reflections").exists())
                self.assertFalse((self.repo / "assets").exists())
                path.write_bytes(previous)

    def test_private_boundaries_reject_checkout_and_parent_escape(self):
        escaped = self.root / "outside.md"
        escaped.write_text("not private", encoding="utf-8")
        for path in [self.support, escaped, self.private / ".." / ".." / "outside.md"]:
            with self.subTest(path=str(path)), self.assertRaises(ValueError):
                release.private_path(path, repo=self.repo)
        for target in ["../outside.md", ".git/config", str(escaped)]:
            with self.subTest(target=target), self.assertRaises(ValueError):
                release.target_path(target, repo=self.repo)

    def test_duplicate_and_wrong_asset_routes_are_rejected(self):
        for route in ["/assets/elsewhere/chart.png", "/assets/img/trading-reflections/2026-11-27/../chart.png",
                      self.asset_routes[0]]:
            with self.subTest(route=route):
                self.assets[-1]["public_path_after_approval"] = route
                with self.assertRaises(ValueError):
                    self.plan()

    @unittest.skipUnless(os.path.normcase("A.png") == os.path.normcase("a.png"), "Case-insensitive Windows path check")
    def test_case_aliases_cannot_publish_two_images_to_one_windows_target(self):
        self.assets[-1]["public_path_after_approval"] = self.asset_routes[0].replace("chart", "CHART")
        with self.assertRaises(ValueError):
            self.plan()

    def test_duplicate_article_and_non_image_private_evidence_are_rejected(self):
        self.drafts.append(dict(self.drafts[0]))
        with self.assertRaises(ValueError):
            self.plan()
        self.drafts.pop()
        evidence = self.private / "chat-private-evidence.png"
        evidence.write_bytes(b"private")
        self.assets[-1]["local_path"] = str(evidence)
        with self.assertRaises(ValueError):
            self.plan()

    def test_plan_tampering_or_wrong_repository_cannot_load(self):
        plan = self.plan()
        path = self.private / "release-plan.json"
        for field, value in [("repository", "other/repository"), ("branch", "gh-pages"), ("site_url", "https://example.invalid")]:
            changed = dict(plan, **{field: value})
            changed["sha256"] = release.payload_hash(changed)
            release.save_json(path, changed)
            with self.subTest(field=field), self.assertRaises(ValueError):
                release.load_plan(path, repo=self.repo)
        plan["articles"][0]["title"] = "Changed after review"
        release.save_json(path, plan)
        with self.assertRaises(ValueError):
            release.load_plan(path, repo=self.repo)

    def test_new_or_existing_public_target_changed_after_plan_is_not_overwritten(self):
        for existing in [False, True]:
            with self.subTest(existing=existing):
                target = self.repo / "_trading_reflections" / Path(self.drafts[0]["path"]).name
                target.parent.mkdir(exist_ok=True)
                if existing:
                    target.write_bytes(b"previous article version")
                elif target.exists():
                    target.unlink()
                plan = self.plan()
                target.write_bytes(b"someone else's edit")
                with self.assertRaises(ValueError):
                    release.prepare(plan, repo=self.repo)
                self.assertEqual(target.read_bytes(), b"someone else's edit")

    def test_prepare_preserves_binary_bytes_and_is_idempotent(self):
        plan = self.plan()
        first = release.prepare(plan, repo=self.repo)
        modified_times = {name: (self.repo / name).stat().st_mtime_ns for name in first}
        second = release.prepare(plan, repo=self.repo)
        self.assertEqual(first, second)
        self.assertEqual(modified_times, {name: (self.repo / name).stat().st_mtime_ns for name in second})
        for item in plan["assets"]:
            self.assertEqual(Path(item["local_path"]).read_bytes(), (self.repo / item["target"]).read_bytes())
        for item in plan["articles"]:
            self.assertIn(b'"published": true', (self.repo / item["target"]).read_bytes())
            self.assertIn(b'"published": false', Path(item["draft_path"]).read_bytes())
        self.assertEqual(self.local_git("diff", "--cached", "--name-only"), "")

    def test_draft_edit_between_hash_check_and_inspection_cannot_be_prepared(self):
        plan = self.plan()
        draft = Path(plan["articles"][0]["draft_path"])

        def edited_inspection(path, repo=None):
            if Path(path) == draft:
                draft.write_bytes(draft.read_bytes() + b"\nUnapproved edit during preparation\n")
            return self.inspect_stub(path, repo)

        with mock.patch.object(release, "inspect_draft", side_effect=edited_inspection), \
                self.assertRaises((ValueError, RuntimeError)):
            release.prepare(plan, repo=self.repo)
        self.assertFalse((self.repo / "_trading_reflections").exists())
        self.assertFalse((self.repo / "assets").exists())

    def test_source_image_changed_after_read_never_copies_unapproved_bytes(self):
        plan = self.plan()
        image = Path(plan["assets"][0]["local_path"])
        original_read = Path.read_bytes
        edited = False

        def concurrent_image_edit(path):
            nonlocal edited
            data = original_read(path)
            if path == image and not edited:
                edited = True
                path.write_bytes(data + b"unapproved image edit")
            return data

        with mock.patch.object(Path, "read_bytes", concurrent_image_edit):
            try:
                release.prepare(plan, repo=self.repo)
            except (ValueError, RuntimeError):
                self.assertFalse((self.repo / "_trading_reflections").exists())
            else:
                target = self.repo / plan["assets"][0]["target"]
                self.assertEqual(release.sha(target), plan["assets"][0]["sha256"])
        self.assertTrue(edited)

    def test_unapproved_state_and_wrong_source_branch_or_origin_stop(self):
        plan = self.plan()
        state = self.state(plan)
        state["approved_sha256"] = "0" * 64
        with self.assertRaises(ValueError):
            self.continue_state(state)
        self.local_git("checkout", "-b", "other")
        with self.assertRaises(RuntimeError):
            self.continue_state(self.state(plan))
        self.local_git("checkout", "master")
        self.local_git("remote", "set-url", "origin", "https://github.com/other/repository.git")
        with self.assertRaises(RuntimeError):
            self.continue_state(self.state(plan))

    def test_existing_staged_work_is_preserved_and_never_committed(self):
        path = self.repo / "unrelated.md"
        path.write_text("user's staged work\n", encoding="utf-8")
        self.local_git("add", "--", path.name)
        remote = OfflineRemote(self)
        with self.assertRaises(RuntimeError):
            self.continue_state(self.state(self.plan()), remote)
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), self.base)
        self.assertEqual(self.local_git("diff", "--cached", "--name-only").strip(), path.name)
        self.assertEqual(remote.pushes, [])

    def test_resumed_prepared_release_rejects_unrelated_staged_work(self):
        _, state = self.prepared()
        path = self.repo / "unrelated.md"
        path.write_text("user staged this after preparation\n", encoding="utf-8")
        self.local_git("add", "--", path.name)
        with self.assertRaises(RuntimeError):
            self.continue_state(state)
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), self.base)
        self.assertIn(path.name, self.local_git("diff", "--cached", "--name-only"))

    def test_change_during_git_add_cannot_enter_commit(self):
        plan, state = self.prepared()
        original_git = release.git
        changed = False
        target = self.repo / plan["articles"][0]["target"]

        def concurrent_edit(args, repo=None):
            nonlocal changed
            if args[0] == "add" and not changed:
                changed = True
                target.write_bytes(target.read_bytes() + b"\nUnapproved concurrent edit\n")
            return original_git(args, repo=self.repo if repo is None else repo)

        with mock.patch.object(release, "git", side_effect=concurrent_edit), self.assertRaises(RuntimeError):
            self.continue_state(state)
        self.assertTrue(changed)
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), self.base)

    def test_success_commits_only_selected_paths_and_preserves_unrelated_unstaged_work(self):
        plan = self.plan()
        unrelated = self.repo / "unrelated.md"
        unrelated.write_text("keep this user's work\n", encoding="utf-8")
        remote = OfflineRemote(self)
        state = self.state(plan)
        result = self.continue_state(state, remote)
        selected = {item["target"] for category in ["articles", "assets", "support_files"] for item in plan[category]}
        committed = set(self.local_git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").splitlines())
        self.assertTrue(committed.issubset(selected))
        self.assertNotIn(unrelated.name, committed)
        self.assertEqual(unrelated.read_text(encoding="utf-8"), "keep this user's work\n")
        self.assertEqual(result["status"], "published_and_verified")
        self.assertEqual(state["phase"], "verified")
        self.assertEqual(remote.pushes, [self.base])

    def test_resume_after_push_timeout_never_recommits_or_repushes(self):
        plan = self.plan()
        state = self.state(plan)
        remote = OfflineRemote(self)
        remote.failure = RuntimeError("offline workflow timeout")
        with self.assertRaises(RuntimeError):
            self.continue_state(state, remote)
        head = self.local_git("rev-parse", "HEAD").strip()
        self.assertEqual(state["phase"], "pushed")
        self.http.assert_not_called()
        self.browser.assert_not_called()
        remote.failure = None
        self.continue_state(state, remote)
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), head)
        self.assertEqual(remote.pushes, [self.base])
        previous_waits = len(remote.waits)
        self.assertEqual(self.continue_state(state, remote)["status"], "previously_verified")
        self.assertEqual(len(remote.waits), previous_waits)

    def test_resume_recovers_commit_receipt_crash_without_duplicate_commit(self):
        _, state = self.prepared()
        self.local_git("add", "--", *state["prepared_hashes"])
        self.local_git("commit", "-m", "Commit completed before receipt crash")
        head = self.local_git("rev-parse", "HEAD").strip()
        remote = OfflineRemote(self)
        self.continue_state(state, remote)
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), head)
        self.assertEqual(remote.pushes, [self.base])

    def test_failed_workflow_http_or_browser_never_claims_verified(self):
        for stage in ["workflow", "http", "browser"]:
            with self.subTest(stage=stage):
                state = self.state(self.plan(), "pushed" if stage == "workflow" else "deployed")
                state["source_sha"] = self.base
                remote = OfflineRemote(self)
                self.http.reset_mock(side_effect=True)
                self.browser.reset_mock(side_effect=True)
                if stage == "workflow":
                    remote.failure = RuntimeError("a required workflow failed")
                elif stage == "http":
                    self.http.side_effect = RuntimeError("published image bytes differ")
                else:
                    self.browser.side_effect = RuntimeError("live bilingual switch failed")
                with self.assertRaises(RuntimeError):
                    self.continue_state(state, remote)
                self.assertNotEqual(state["phase"], "verified")
        self.http.side_effect = self.browser.side_effect = None

    def test_unsuccessful_reports_fail_closed_even_without_helper_exception(self):
        for stage in ["workflow", "http", "browser"]:
            with self.subTest(stage=stage):
                state = self.state(self.plan(), "pushed" if stage == "workflow" else "deployed")
                state["source_sha"] = self.base
                remote = OfflineRemote(self)
                self.http.return_value = self.browser.return_value = {"success": True}
                if stage == "workflow":
                    remote.deployment_status = "failed"
                elif stage == "http":
                    self.http.return_value = {"success": False}
                else:
                    self.browser.return_value = {"success": False}
                with self.assertRaises(RuntimeError):
                    self.continue_state(state, remote)
                self.assertNotEqual(state["phase"], "verified")

    def test_browser_failure_resume_reuses_recorded_http_but_rechecks_browser(self):
        state = self.state(self.plan(), "deployed")
        state["source_sha"] = self.base
        self.browser.side_effect = RuntimeError("browser not ready")
        with self.assertRaises(RuntimeError):
            self.continue_state(state)
        self.assertEqual(state["phase"], "deployed")
        self.assertTrue(state["http"]["success"])
        self.browser.side_effect = None
        self.continue_state(state)
        self.assertEqual(self.http.call_count, 1)
        self.assertEqual(self.browser.call_count, 2)

    def test_generated_branch_replaced_during_live_checks_cannot_be_verified(self):
        state = self.state(self.plan(), "deployed")
        state["source_sha"] = self.base
        remote = OfflineRemote(self)

        def replaced_output(*args, **kwargs):
            remote.generated_sha = "e" * 40
            return {"success": True}

        self.browser.side_effect = replaced_output
        with self.assertRaises(RuntimeError):
            self.continue_state(state, remote)
        self.assertNotEqual(state["phase"], "verified")
        self.assertEqual(remote.remote_sha, self.base)
        self.assertEqual(remote.pushes, [])

    def test_main_plan_and_verify_do_not_mutate_git_or_push(self):
        plan = self.plan()
        plan_path = self.private / "release-plan.json"
        release.save_json(plan_path, plan)
        remote = OfflineRemote(self)
        original_private = release.private_path
        original_git = release.git
        observed = []

        def record_git(args, repo=None):
            observed.append(args[0])
            return original_git(args, repo=self.repo if repo is None else repo)

        with mock.patch.object(release, "REPO", self.repo), \
                mock.patch.object(release, "create_plan", return_value=plan), \
                mock.patch.object(release, "load_plan", return_value=plan), \
                mock.patch.object(release, "private_path", side_effect=lambda path, repo=None, exists=True: original_private(path, self.repo, exists)), \
                mock.patch.object(release, "GitHubRemote", return_value=remote), \
                mock.patch.object(release, "git", side_effect=record_git):
            self.assertEqual(release.main(["plan", "--manifest", str(self.manifest_path), "--out", str(plan_path)]), 0,
                             self.events.call_args_list)
            self.assertEqual(release.main(["verify", "--plan", str(plan_path), "--source-sha", self.base]), 0,
                             self.events.call_args_list)
        self.assertEqual(remote.pushes, [])
        self.assertFalse(set(observed) & {"add", "commit", "push", "reset", "checkout", "update-index"})
        self.assertEqual(self.local_git("rev-parse", "HEAD").strip(), self.base)

    def test_main_publish_with_wrong_approval_hash_stops_before_preparation(self):
        plan = self.plan()
        with mock.patch.object(release, "load_plan", return_value=plan), \
                mock.patch.object(release, "prepare") as prepare, \
                mock.patch.object(release, "GitHubRemote") as remote:
            result = release.main(["publish", "--plan", str(self.private / "plan.json"),
                                   "--approved-sha256", "0" * 64, "--expected-head", self.base])
        self.assertEqual(result, 1)
        prepare.assert_not_called()
        remote.assert_not_called()

    def test_incomplete_or_wrong_commit_deployment_receipt_is_rejected(self):
        valid = successful_deployment(self.base)
        release.require_deployment_success(valid, self.base)
        invalid = []
        failed = copy.deepcopy(valid)
        failed["workflows"][0]["conclusion"] = "failure"
        invalid.append(failed)
        missing = copy.deepcopy(valid)
        missing["workflows"].pop()
        invalid.append(missing)
        invalid.append(dict(valid, source_sha="e" * 40))
        invalid.append(dict(valid, generated_source_verified=False))
        invalid.append(dict(valid, generated_sha="not a commit"))
        for report in invalid:
            with self.subTest(report=report), self.assertRaises(RuntimeError):
                release.require_deployment_success(report, self.base)

    def test_http_checks_every_approved_image_bytes_and_portrait_resources(self):
        plan = self.plan()
        response_bytes = {item["public_path"]: Path(item["local_path"]).read_bytes() for item in plan["assets"]}

        def response(request, timeout=None):
            path = request.full_url.removeprefix(release.SITE)
            item = mock.MagicMock()
            item.__enter__.return_value = item
            item.status = 200
            item.read.return_value = response_bytes.get(path, b"nonempty HTML or portrait")
            return item

        output = self.private / "http-verification"
        with mock.patch.object(release.urllib.request, "urlopen", side_effect=response), \
                mock.patch.object(release, "cpu_load", return_value=75):
            result = REAL_VERIFY_HTTP(plan, output)
        self.assertTrue(result["success"])
        checked = {item["path"] for item in result["resources"]}
        self.assertTrue(set(response_bytes).issubset(checked))
        self.assertTrue({"/assets/img/runtian-miao.jpg", "/assets/img/runtian-miao-480.webp",
                         "/assets/img/runtian-miao-800.webp", "/assets/img/runtian-miao-1400.webp"}.issubset(checked))
        response_bytes[plan["assets"][0]["public_path"]] = b"wrong published bytes"
        rejected_output = self.private / "http-rejected"
        with mock.patch.object(release.urllib.request, "urlopen", side_effect=response), \
                mock.patch.object(release, "cpu_load", return_value=75), self.assertRaises(RuntimeError):
            REAL_VERIFY_HTTP(plan, rejected_output)
        self.assertFalse((rejected_output / "http-checks.json").exists())


if __name__ == "__main__":
    unittest.main()
