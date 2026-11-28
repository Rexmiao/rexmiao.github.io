"""Offline X approval, publication-order and duplicate-prevention regressions."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import trading_x as x
import trading_release as release
from trading_x_client import XClientError


class DefaultPreferencesTests(unittest.TestCase):
    def test_only_explicit_valid_nonsecret_defaults_are_accepted(self):
        scratch = Path(__file__).resolve().parents[3] / ".work/trading-pipeline-tests"
        scratch.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as folder:
            repo = Path(folder) / "source"
            repo.mkdir()
            path = repo.parent / ".work/trading-reflections/x-preferences.json"
            self.assertEqual(release.x_preferences(repo), {})
            path.parent.mkdir(parents=True)
            chosen = {"schema_version": 1, "enabled": True, "account": "Rexy69492164", "language": "en"}
            path.write_text(json.dumps(chosen), encoding="utf-8")
            self.assertEqual(release.x_preferences(repo), chosen)
            path.write_text(json.dumps(dict(chosen, enabled=False)), encoding="utf-8")
            self.assertEqual(release.x_preferences(repo), {})
            for invalid in [dict(chosen, language="invalid"), dict(chosen, token="do-not-store-secrets"), dict(chosen, enabled="yes")]:
                path.write_text(json.dumps(invalid), encoding="utf-8")
                with self.assertRaises(ValueError):
                    release.x_preferences(repo)

    def test_cli_uses_defaults_but_explicit_override_or_no_x_takes_precedence(self):
        with tempfile.TemporaryDirectory() as folder:
            for extra, expected in [([], "en"), (["--x-language", "zh"], "zh"), (["--no-x"], None)]:
                with self.subTest(extra=extra), \
                        mock.patch.object(release, "x_preferences", return_value={"account": "Rexy69492164", "language": "en"}) as preferences, \
                        mock.patch.object(release, "private_path", side_effect=lambda path, **kwargs: Path(path)), \
                        mock.patch.object(release, "create_plan", return_value={"sha256": "x", "articles": [], "assets": []}) as create, \
                        mock.patch.object(release, "save_json"), mock.patch.object(release, "emit"):
                    self.assertEqual(release.main(["plan", "--manifest", "input.json", "--out", str(Path(folder) / "plan.json"), *extra]), 0)
                    self.assertEqual(create.call_args.kwargs["x_language"], expected)
                    self.assertEqual(create.call_args.kwargs["x_account"], "Rexy69492164")
                    if extra == ["--no-x"]:
                        preferences.assert_not_called()


class DebriefTests(unittest.TestCase):
    def setUp(self):
        self.articles = [{"route": "/projects/trading-reflections/2026-11-27-note/",
                          "description": "Entry timing matters when trading 0DTE options.",
                          "description_zh": "交易零日期权时，需要重视入场时机。"}]
        self.spec = x.draft(self.articles)
        self.state = {"phase": "verified", "plan": {"articles": self.articles, "x_debrief": self.spec},
                      "http": {"success": True}, "browser": {"success": True}}
        self.client = mock.Mock()
        self.client.whoami.return_value = {"id": "7", "username": x.DEFAULT_ACCOUNT}
        self.client.create_post.return_value = {"id": "123", "text": self.spec["posts"][0]["text"]}
        self.saved = []
        self.save = lambda path, value: self.saved.append(copy.deepcopy(value))

    def publish(self):
        return x.publish(self.state, Path("private-state.json"), self.save, self.client)

    def test_generated_copy_reuses_bilingual_descriptions_and_canonical_urls(self):
        self.assertEqual(x.SITE, "https://rexy.levyquant.ai")
        self.assertEqual(release.SITE, x.SITE)
        value = x.draft(self.articles, "both")
        self.assertEqual([p["language"] for p in value["posts"]], ["en", "zh"])
        for post in value["posts"]:
            self.assertLessEqual(x.weight(post["text"]), 280)
            self.assertTrue(post["text"].endswith(x.SITE + self.articles[0]["route"]))
        self.assertEqual(x.weight("中文"), 4)
        self.assertEqual(x.weight("abc"), 3)

    def test_canonical_url_weight_is_23_and_budget_boundary_is_enforced(self):
        route = self.articles[0]["route"]
        url = "https://rexy.levyquant.ai" + route
        self.assertEqual(x.weight(url), 23)
        self.assertEqual(x.weight("note\n" + url), 28)
        for prefix in ["a" * 256, "中" * 128]:
            spec = copy.deepcopy(self.spec)
            spec["posts"][0]["text"] = prefix + "\n" + url
            self.assertEqual(x.weight(spec["posts"][0]["text"]), 280)
            x.validate(spec, self.articles)
            spec["posts"][0]["text"] = "a" + spec["posts"][0]["text"]
            with self.assertRaisesRegex(ValueError, "280-character"):
                x.validate(spec, self.articles)
        for suffix in ["extra/", "?query=x", "#fragment"]:
            self.assertGreater(x.weight(url + suffix), 23)

    def test_old_github_host_copy_is_rejected_unchanged_before_any_x_action(self):
        legacy_url = "https://rexmiao.github.io" + self.articles[0]["route"]
        spec = copy.deepcopy(self.spec)
        spec["posts"][0]["text"] = "Historical debrief\n" + legacy_url
        self.assertEqual(x.weight(legacy_url), len(legacy_url))
        original = copy.deepcopy(spec)
        with self.assertRaisesRegex(ValueError, "canonical article URL on https://rexy.levyquant.ai"):
            x.validate(spec, self.articles)
        self.state["plan"]["x_debrief"] = spec
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(spec, original)
        self.client.whoami.assert_not_called()
        self.client.create_post.assert_not_called()
        self.assertEqual(self.saved, [])

    def test_long_copy_is_shortened_without_another_url_or_claim(self):
        for language in ["en", "zh"]:
            article = dict(self.articles[0], description="words " * 300, description_zh="入场时机" * 200)
            text = x.draft([article], language)["posts"][0]["text"]
            self.assertLessEqual(x.weight(text), 280)
            self.assertIn("…\nhttps://", text)

    def test_other_links_wrong_routes_duplicate_copy_and_overbudget_rejected(self):
        for edit in [lambda s: s["posts"].append(copy.deepcopy(s["posts"][0])),
                     lambda s: s["posts"][0].update(route="/other/"),
                     lambda s: s["posts"][0].update(text="https://evil.example/\n" + s["posts"][0]["text"]),
                     lambda s: s["posts"][0].update(text="a" * 281 + "\n" + x.SITE + self.articles[0]["route"]),
                     lambda s: s.update(account="bad account")]:
            spec = copy.deepcopy(self.spec)
            edit(spec)
            with self.assertRaises(ValueError):
                x.validate(spec, self.articles)

    def test_account_text_and_language_are_bound_to_approval_hash(self):
        baseline = release.payload_hash(self.state["plan"])
        for field, value in [("account", "another")]:
            spec = copy.deepcopy(self.spec)
            spec[field] = value
            self.assertNotEqual(baseline, release.payload_hash(dict(self.state["plan"], x_debrief=spec)))
        changed = copy.deepcopy(self.state["plan"])
        changed["x_debrief"]["posts"][0]["text"] = "Reviewed: " + self.spec["posts"][0]["text"]
        self.assertNotEqual(baseline, release.payload_hash(changed))

    def test_without_x_intent_never_constructs_or_calls_client(self):
        del self.state["plan"]["x_debrief"]
        with mock.patch("trading_x_client.XClient") as factory:
            self.assertEqual(self.publish(), {"status": "disabled"})
            factory.assert_not_called()
        self.client.whoami.assert_not_called()

    def test_no_post_before_all_live_checks_succeed(self):
        for field, value in [("phase", "deployed"), ("http", {"success": False}), ("browser", {"success": False})]:
            previous = self.state[field]
            self.state[field] = value
            with self.assertRaises(ValueError):
                self.publish()
            self.state[field] = previous
        self.client.create_post.assert_not_called()

    def test_verified_receipt_is_saved_before_one_post_and_resume_skips(self):
        def post(text):
            self.assertEqual(self.saved[-1]["phase"], "verified")
            self.assertEqual(self.saved[-1]["x_debrief"]["posts"][0]["status"], "sending")
            return {"id": "123"}
        self.client.create_post.side_effect = post
        self.assertEqual(self.publish()["status"], "posted")
        self.assertEqual(self.publish()["status"], "posted")
        self.client.create_post.assert_called_once()
        self.client.whoami.assert_called_once()

    def test_wrong_account_and_connection_failure_stop_before_post(self):
        self.client.whoami.return_value = {"id": "8", "username": "someone_else"}
        self.assertEqual(self.publish()["status"], "needs_connection")
        self.client.create_post.assert_not_called()
        self.assertEqual(self.state["phase"], "verified")

    def test_timeout_is_uncertain_and_never_retried_on_resume(self):
        self.client.create_post.side_effect = XClientError("private server secret", ambiguous=True)
        self.assertEqual(self.publish()["status"], "needs_reconciliation")
        self.assertEqual(self.publish()["status"], "needs_reconciliation")
        self.client.create_post.assert_called_once()
        self.assertNotIn("private server secret", json.dumps(self.saved))
        self.assertEqual(self.state["phase"], "verified")

    def test_rejection_keeps_website_verified_and_sanitizes_errors(self):
        self.client.create_post.side_effect = XClientError("SECRET", status=403)
        self.assertEqual(self.publish()["status"], "rejected")
        self.assertEqual(self.state["phase"], "verified")
        self.assertNotIn("SECRET", json.dumps(self.saved))

    def test_crash_after_post_before_receipt_cannot_create_duplicate(self):
        def crash(path, value):
            if value["x_debrief"]["posts"][0]["status"] == "posted":
                raise OSError("simulated disk error")
            self.save(path, value)
        with self.assertRaises(OSError):
            x.publish(self.state, "private-state.json", crash, self.client)
        self.state = self.saved[-1]
        self.assertEqual(self.publish()["status"], "needs_reconciliation")
        self.client.create_post.assert_called_once()

    def test_crash_before_post_does_not_send(self):
        with self.assertRaises(OSError):
            x.publish(self.state, "private-state.json", mock.Mock(side_effect=OSError()), self.client)
        self.client.create_post.assert_not_called()

    def test_reconcile_requires_matching_author_and_expanded_exact_copy(self):
        self.client.create_post.side_effect = TimeoutError()
        self.publish()
        text = self.spec["posts"][0]["text"]
        url = x.SITE + self.articles[0]["route"]
        self.client.get_post.return_value = {"id": "123", "author_id": "7", "text": text.replace(url, "https://t.co/abc"),
                                            "entities": {"urls": [{"url": "https://t.co/abc", "expanded_url": url}]}}
        x.reconcile(self.state, 0, "123", self.client, self.save, "private-state.json")
        self.assertEqual(self.publish()["status"], "posted")
        self.client.create_post.assert_called_once()

    def test_reconcile_rejects_different_content_or_author(self):
        self.client.create_post.side_effect = TimeoutError()
        self.publish()
        for actual in [{"author_id": "8", "text": self.spec["posts"][0]["text"]}, {"author_id": "7", "text": "different"}]:
            self.client.get_post.return_value = actual
            with self.assertRaises(ValueError):
                x.reconcile(self.state, 0, "123", self.client, self.save, "private-state.json")


if __name__ == "__main__":
    unittest.main()
