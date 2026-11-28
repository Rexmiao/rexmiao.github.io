"""Offline checks: all Git/GitHub calls use injected runners."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
MODULE = Path(__file__).resolve().parents[1] / "trading_release_remote.py"
spec = importlib.util.spec_from_file_location("trading_release_remote", MODULE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
S, OLD, G, OTHER = "a" * 40, "b" * 40, "c" * 40, "d" * 40


def run(name, index, sha=S, branch="master", status="completed", conclusion="success", event="push"):
    return {"id": index, "run_number": index, "run_attempt": 1, "name": name,
            "head_sha": sha, "head_branch": branch, "event": event,
            "status": status, "conclusion": conclusion}


class FakeRunner:
    def __init__(self, directory):
        self.directory = str(directory)
        self.calls = []
        self.source = S
        self.generated = G
        self.origin = self.push_url = m.ORIGIN_URL
        self.branch = "master"
        self.local = S
        self.message = f"Deploying to gh-pages from @ {m.REPOSITORY}@{S} 🚀"
        self.runs = [run(name, i + 1, event="workflow_run" if name.endswith("on site") else "push")
                     for i, name in enumerate(m.SOURCE_WORKFLOWS)]
        self.pages = [run(m.PAGES_WORKFLOW, 5, sha=G, branch="gh-pages", event="dynamic")]
        self.source_sequence = []
        self.generated_sequence = []
        self.fail = False

    def __call__(self, argv, **kwargs):
        assert kwargs["shell"] is False
        assert kwargs["cwd"] == self.directory
        assert kwargs["timeout"] == 60
        self.calls.append(argv)
        if self.fail:
            return subprocess.CompletedProcess(argv, 1, "secret-token-output", "HTTP 403 secret-token-error")
        if argv[1] == "api":
            endpoint = argv[-1]
            assert argv[2:6] == ["--hostname", "github.com", "--method", "GET"]
            suffix = endpoint.removeprefix(m.REPOSITORY_API + "/")
            if suffix == "git/ref/heads/master":
                data = {"object": {"sha": self.source_sequence.pop(0) if self.source_sequence else self.source}}
            elif suffix == "git/ref/heads/gh-pages":
                data = {"object": {"sha": self.generated_sequence.pop(0) if self.generated_sequence else self.generated}}
            elif suffix.startswith("git/commits/"):
                data = {"sha": self.generated, "message": self.message}
            elif suffix.startswith("actions/runs?"):
                rows = self.runs if f"head_sha={S}" in suffix else self.pages
                data = {"total_count": len(rows), "workflow_runs": rows}
            elif "/jobs?" in suffix:
                data = {"total_count": 1, "jobs": [{"id": 70, "name": "link-checker", "status": "completed",
                    "conclusion": "failure", "steps": [{"number": 5, "name": "Link Checker", "conclusion": "failure"}]}]}
            elif endpoint == m.REPOSITORY_API:
                data = {"full_name": m.REPOSITORY}
            else:
                raise AssertionError(endpoint)
            return subprocess.CompletedProcess(argv, 0, json.dumps(data), "")
        assert argv[1:5] == ["-c", f"safe.directory={Path(self.directory).as_posix()}", "-c", "core.autocrlf=false"]
        args = argv[7:]
        if args == ["rev-parse", "--show-toplevel"]:
            output = self.directory
        elif args == ["symbolic-ref", "--quiet", "--short", "HEAD"]:
            output = self.branch
        elif args == ["remote", "get-url", "--all", "origin"]:
            output = self.origin
        elif args == ["remote", "get-url", "--push", "--all", "origin"]:
            output = self.push_url
        elif args == ["rev-parse", "--verify", "HEAD"]:
            output = self.local
        elif "push" in args:
            assert args[-2:] == ["origin", f"{S}:refs/heads/master"]
            assert not any("--force" in arg for arg in args)
            assert args[0:3] == ["-c", "credential.helper=", "-c"]
            assert "auth git-credential" in args[3]
            self.source = S
            output = "done"
        else:
            raise AssertionError(args)
        return subprocess.CompletedProcess(argv, 0, output + "\n", "")


class RemoteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="remote-测试-")
        self.directory = Path(self.temp.name).resolve()
        self.runner = FakeRunner(self.directory)
        self.remote = m.GitHubRemote(self.directory, gh_path="C:/Program Files/GitHub CLI/gh.exe",
                                    git_path="fake-git", runner=self.runner)

    def tearDown(self):
        self.temp.cleanup()

    def timeout(self, **kwargs):
        with patch.object(m.time, "monotonic", side_effect=[0, 2]), patch.object(m.time, "sleep"):
            with self.assertRaises(m.DeploymentTimeout) as caught:
                self.remote.wait_for_deployment(S, timeout_seconds=1, **kwargs)
        return caught.exception.report

    def test_endpoint_scope_and_get(self):
        self.assertEqual(self.remote.api(m.REPOSITORY_API)["full_name"], m.REPOSITORY)
        for endpoint in ["user", "orgs/other", "repos/other/repo/actions/runs", "https://api.github.com/repos/a/b",
                         "//evil.test/x", "actions/runs?token=secret", "actions/runs?per_page=1000",
                         "actions/runs?head_sha=x", "actions/runs?status=success", "actions/runs/../../secrets",
                         "actions/runs\n--method POST", "actions/runs?per_page=1&per_page=2",
                         "git/ref/heads/not-master", "actions/runs%2f1", "secrets", "installation/repositories"]:
            with self.subTest(endpoint=endpoint), self.assertRaises(m.RemoteError):
                self.remote.api(endpoint)
        self.assertEqual(len(self.runner.calls), 1)

    def test_failure_redacts_process_output(self):
        self.runner.fail = True
        with self.assertRaises(m.RemoteError) as caught:
            self.remote.head("master")
        self.assertNotIn("secret-token", str(caught.exception))
        self.assertNotIn("secret-token", json.dumps(caught.exception.report))
        self.assertEqual(caught.exception.report["http_status"], 403)

    def test_push_exact_and_noforce(self):
        self.runner.source = OLD
        result = self.remote.push(OLD)
        self.assertEqual(result["source_sha"], S)
        self.assertEqual(result["previous_head"], OLD)
        push_calls = [call for call in self.runner.calls if "push" in call]
        self.assertEqual(len(push_calls), 1)
        self.assertIn("credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential", push_calls[0])

    def test_push_rejects_changed_head(self):
        with self.assertRaises(m.RemoteChanged):
            self.remote.push(OLD)
        self.assertFalse(any("push" in call for call in self.runner.calls))

    def test_push_rejects_branch_origin_and_pushurl(self):
        for field, value in [("branch", "other"), ("origin", "https://token@github.com/Rexmiao/rexmiao.github.io.git"),
                             ("push_url", "https://github.com/other/repo.git"), ("origin", m.ORIGIN_URL + "\n" + m.ORIGIN_URL)]:
            with self.subTest(field=field):
                original = getattr(self.runner, field)
                setattr(self.runner, field, value)
                with self.assertRaises(m.RemoteError):
                    self.remote.push(OLD)
                setattr(self.runner, field, original)
        self.assertFalse(any("push" in call for call in self.runner.calls))

    def test_success_exact_source_generated_and_pages(self):
        seen = []
        result = self.remote.wait_for_deployment(S, on_progress=seen.append)
        self.assertEqual(result["status"], "succeeded")
        self.assertEqual(result["generated_sha"], G)
        self.assertTrue(result["generated_source_verified"])
        self.assertEqual(len(result["workflows"]), 5)
        self.assertEqual(len(seen), 1)

    def test_exact_source_never_accepts_other_sha_success(self):
        self.runner.runs = [dict(row, head_sha=OTHER) for row in self.runner.runs]
        report = self.timeout()
        self.assertTrue(all(row["status"] == "missing" for row in report["workflows"]))

    def test_missing_child_workflow_is_not_success(self):
        self.runner.runs.pop()
        self.assertEqual(self.timeout()["status"], "timeout")

    def test_latest_failed_run_wins_and_reports_failed_steps(self):
        self.runner.runs.append(run("Check for broken links", 100, conclusion="failure"))
        seen = []
        with self.assertRaises(m.DeploymentFailed) as caught:
            self.remote.wait_for_deployment(S, on_progress=seen.append)
        failure = caught.exception.report["failures"][0]
        self.assertEqual(failure["id"], 100)
        self.assertEqual(failure["jobs"][0]["failed_steps"][0]["name"], "Link Checker")
        self.assertEqual(seen[-1]["status"], "failed")

    def test_unmapped_generated_sha_is_not_accepted(self):
        self.runner.message = f"Deploy from other/repository@{S}"
        report = self.timeout()
        self.assertIsNone(report["generated_sha"])
        self.assertEqual(report["phase"], "waiting_for_verifiable_generated_source_mapping")

    def test_pages_must_match_generated_sha(self):
        self.runner.pages[0]["head_sha"] = OTHER
        self.assertEqual(self.timeout()["workflows"][-1]["status"], "missing")

    def test_pages_failure_is_failure(self):
        self.runner.pages[0]["conclusion"] = "failure"
        with self.assertRaises(m.DeploymentFailed) as caught:
            self.remote.wait_for_deployment(S)
        self.assertEqual(caught.exception.report["failures"][0]["name"], m.PAGES_WORKFLOW)

    def test_master_advance_stops_wait(self):
        self.runner.source = OTHER
        with self.assertRaises(m.RemoteChanged):
            self.remote.wait_for_deployment(S)

    def test_generated_advance_prevents_final_success(self):
        self.runner.generated_sequence = [G, OTHER]
        with self.assertRaises(m.RemoteChanged):
            self.remote.wait_for_deployment(S)

    def test_progress_only_when_state_changes(self):
        self.runner.runs[0].update(status="in_progress", conclusion=None)
        seen = []
        with patch.object(m.time, "monotonic", side_effect=[0, 0, 0, 2]), patch.object(m.time, "sleep") as sleep:
            with self.assertRaises(m.DeploymentTimeout):
                self.remote.wait_for_deployment(S, timeout_seconds=1, on_progress=seen.append)
        self.assertEqual([row["status"] for row in seen], ["waiting", "timeout"])
        self.assertEqual(sleep.call_count, 2)

    def test_unbounded_time_options_rejected(self):
        for kwargs in [{"timeout_seconds": float("nan")}, {"timeout_seconds": float("inf")},
                       {"timeout_seconds": 0}, {"poll_seconds": 61}, {"poll_seconds": float("nan")}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(m.RemoteError):
                self.remote.wait_for_deployment(S, **kwargs)


if __name__ == "__main__":
    unittest.main(verbosity=2)
