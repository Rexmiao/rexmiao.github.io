"""Offline X client checks: no real credentials, browser, callbacks, or network."""
from __future__ import annotations

import base64
import copy
import hashlib
import http.client
import io
import json
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest import mock
import urllib.error
import urllib.parse

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import trading_x_client as x


class Vault:
    def __init__(self, value=None):
        self.value = copy.deepcopy(value)
        self.writes = []

    def read(self):
        return copy.deepcopy(self.value)

    def write(self, value):
        self.value = copy.deepcopy(value)
        self.writes.append(copy.deepcopy(value))

    def delete(self):
        self.value = None


class Response:
    def __init__(self, value):
        self.value = value

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def read(self, limit):
        return self.value if isinstance(self.value, bytes) else json.dumps(self.value).encode("utf-8")


class Transport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, request, timeout):
        self.calls.append(request)
        if timeout != 30:
            raise AssertionError("Unexpected timeout")
        result = self.responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return Response(result)


IDENTITY = {"data": {"id": "12345", "username": x.ACCOUNT}}
STORED = {"account": x.ACCOUNT, "client_id": "public_client_123", "user_id": "12345",
          "access_token": "secret-access-sentinel", "refresh_token": "secret-refresh-sentinel", "expires_utc": 10000}


class XClientTests(unittest.TestCase):
    def client(self, responses=(), stored=STORED):
        vault, transport = Vault(stored), Transport(responses)
        return x.XClient(vault=vault, opener=transport, now=lambda: 100), vault, transport

    def test_status_is_local_metadata_only(self):
        client, _, transport = self.client()
        result = client.status()
        self.assertTrue(result["connected"])
        self.assertTrue(result["refresh_available"])
        self.assertEqual(transport.calls, [])
        self.assertNotIn("secret-", json.dumps(result))

    def test_missing_vault_status_is_nonfatal_and_does_not_connect(self):
        client, vault, transport = self.client(stored=None)
        self.assertFalse(client.status()["connected"])
        vault.read = mock.Mock(side_effect=x.XClientError("vault unavailable"))
        self.assertFalse(client.status()["vault_available"])
        self.assertEqual(transport.calls, [])

    def test_account_checked_before_create_and_only_reviewed_text_sent(self):
        client, vault, transport = self.client([IDENTITY, {"data": {"id": "999", "text": "复盘 https://t.co/abc"}}])
        result = client.create_post("复盘 https://rexmiao.github.io/projects/trading-reflections/")
        self.assertEqual(result["id"], "999")
        self.assertEqual([(r.method, urllib.parse.urlsplit(r.full_url).path) for r in transport.calls],
                         [("GET", "/2/users/me"), ("POST", "/2/tweets")])
        self.assertEqual(json.loads(transport.calls[1].data),
                         {"text": "复盘 https://rexmiao.github.io/projects/trading-reflections/"})
        self.assertEqual(vault.writes, [])

    def test_wrong_account_or_changed_bound_id_stops_before_write(self):
        for identity in [{"data": {"id": "12345", "username": "OtherUser"}},
                         {"data": {"id": "67890", "username": x.ACCOUNT}}]:
            with self.subTest(identity=identity):
                client, _, transport = self.client([identity])
                with self.assertRaises(x.XClientError):
                    client.create_post("Reviewed note")
                self.assertEqual(len(transport.calls), 1)
                self.assertEqual(transport.calls[0].method, "GET")

    def test_publish_preflight_and_post_reuse_same_verified_identity(self):
        client, _, transport = self.client([IDENTITY, {"data": {"id": "999", "text": "note"}}])
        self.assertEqual(client.whoami()["username"], x.ACCOUNT)
        client.create_post("note")
        self.assertEqual([request.method for request in transport.calls], ["GET", "POST"])

    def test_read_owned_post_returns_author_and_url_entities(self):
        post = {"id": "999", "text": "note https://t.co/abc", "author_id": "12345",
                "entities": {"urls": [{"url": "https://t.co/abc", "expanded_url": "https://rexmiao.github.io/"}]}}
        client, _, transport = self.client([IDENTITY, {"data": post}])
        self.assertEqual(client.get_post("999"), post)
        self.assertEqual(urllib.parse.parse_qs(urllib.parse.urlsplit(transport.calls[-1].full_url).query),
                         {"tweet.fields": ["author_id,entities"]})

    def test_reconciliation_rejects_another_author_or_post(self):
        for post in [{"id": "999", "text": "note", "author_id": "777"},
                     {"id": "888", "text": "note", "author_id": "12345"}]:
            with self.subTest(post=post):
                client, _, _ = self.client([IDENTITY, {"data": post}])
                with self.assertRaises(x.XClientError):
                    client.get_post("999")

    def test_refresh_rotation_saved_before_identity_and_post_requests(self):
        stored = {**STORED, "expires_utc": 140}
        refreshed = {"access_token": "rotated-access", "refresh_token": "rotated-refresh", "expires_in": 7200,
                     "token_type": "bearer", "scope": x.SCOPES}
        client, vault, transport = self.client([refreshed, IDENTITY, {"data": {"id": "999", "text": "note"}}], stored)
        original = transport.__call__
        def checked(request, timeout):
            if request.full_url.endswith("/users/me"):
                self.assertEqual(vault.value["refresh_token"], "rotated-refresh")
            return original(request, timeout)
        client.opener = checked
        client.create_post("note")
        self.assertEqual(len(vault.writes), 1)
        form = urllib.parse.parse_qs(transport.calls[0].data.decode())
        self.assertEqual(form["grant_type"], ["refresh_token"])
        self.assertEqual(transport.calls[1].get_header("Authorization"), "Bearer rotated-access")

    def test_failed_rotation_save_stops_before_post(self):
        client, vault, transport = self.client(
            [{"access_token": "rotated", "refresh_token": "new-refresh", "expires_in": 7200}],
            {**STORED, "expires_utc": 0})
        vault.write = mock.Mock(side_effect=x.XClientError("OS vault save failed"))
        with self.assertRaises(x.XClientError):
            client.create_post("note")
        self.assertEqual(len(transport.calls), 1)
        self.assertTrue(transport.calls[0].full_url.endswith("/oauth2/token"))

    def test_transport_failure_and_5xx_are_ambiguous_and_never_retried(self):
        cases = [TimeoutError("secret-token-server-details"), http.client.IncompleteRead(b"secret-body"),
                 urllib.error.URLError("secret-token-server-details"),
                 urllib.error.HTTPError(x.API + "/tweets", 503, "secret-token-server-details", {}, io.BytesIO(b"secret-body")),
                 b"not-json-secret-server-response", {"data": {"text": "missing post ID"}}]
        for failure in cases:
            with self.subTest(failure=type(failure).__name__):
                client, _, transport = self.client([IDENTITY, failure])
                with self.assertRaises(x.XClientError) as caught:
                    client.create_post("note")
                self.assertTrue(caught.exception.ambiguous)
                self.assertNotIn("secret", str(caught.exception))
                self.assertEqual(len(transport.calls), 2)

    def test_known_api_rejection_is_sanitized_and_not_retried(self):
        for status in [400, 401, 403, 429]:
            with self.subTest(status=status):
                error = urllib.error.HTTPError(x.API + "/tweets", status, "secret-token", {}, io.BytesIO(b"secret-body"))
                client, _, transport = self.client([IDENTITY, error])
                with self.assertRaises(x.XClientError) as caught:
                    client.create_post("note")
                self.assertFalse(caught.exception.ambiguous)
                self.assertEqual(caught.exception.status, status)
                self.assertNotIn("secret", str(caught.exception))
                self.assertEqual(len(transport.calls), 2)

    def test_connect_pkce_and_public_client_form_without_files(self):
        token = {"access_token": "new-access", "refresh_token": "new-refresh", "expires_in": 7200,
                 "token_type": "bearer", "scope": x.SCOPES}
        client, vault, transport = self.client([token, IDENTITY], stored=None)
        recorded = {}
        def callback(url, state, browser):
            params = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
            recorded.update(params)
            self.assertEqual(params["state"], [state])
            self.assertEqual(params["redirect_uri"], [x.REDIRECT])
            self.assertEqual(params["scope"], [x.SCOPES])
            self.assertEqual(params["code_challenge_method"], ["S256"])
            return "secret-code-sentinel"
        with mock.patch("builtins.open", side_effect=AssertionError("No plaintext files")):
            result = client.connect("public_client_123", callback=callback, browser=mock.Mock())
        form = urllib.parse.parse_qs(transport.calls[0].data.decode())
        verifier = form["code_verifier"][0]
        expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode()
        self.assertEqual(recorded["code_challenge"], [expected])
        self.assertEqual(form["code"], ["secret-code-sentinel"])
        self.assertNotIn("client_secret", form)
        self.assertEqual(vault.value["user_id"], "12345")
        self.assertNotIn("secret-code", json.dumps(vault.value))
        self.assertEqual(result, {"connected": True, "id": "12345", "username": x.ACCOUNT})

    def test_connect_other_account_does_not_overwrite_existing_credentials(self):
        token = {"access_token": "new-access", "refresh_token": "new-refresh", "expires_in": 7200}
        client, vault, _ = self.client([token, {"data": {"id": "99999", "username": "OtherUser"}}])
        with self.assertRaises(x.XClientError):
            client.connect("public_client_123", callback=lambda *args: "secret-code")
        self.assertEqual(vault.value, STORED)
        self.assertEqual(vault.writes, [])

    def test_alternate_callback_is_identical_in_authorization_listener_and_token_exchange(self):
        redirect = "http://127.0.0.1:8766/callback"
        token = {"access_token": "new-access", "refresh_token": "new-refresh", "expires_in": 7200}
        client, _, transport = self.client([token, IDENTITY], stored=None)
        def callback(url, state, browser, *, redirect_uri):
            self.assertEqual(redirect_uri, redirect)
            params = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
            self.assertEqual(params["redirect_uri"], [redirect])
            return "secret-code"
        client.connect("public_client_123", callback=callback, browser=mock.Mock(), redirect_uri=redirect)
        form = urllib.parse.parse_qs(transport.calls[0].data.decode())
        self.assertEqual(form["redirect_uri"], [redirect])

    def test_redirect_validation_rejects_external_privileged_or_modified_callbacks_before_actions(self):
        invalid = [None, "", "http://localhost:8766/callback", "https://127.0.0.1:8766/callback",
                   "http://127.0.0.2:8766/callback", "http://127.0.0.1/callback", "http://127.0.0.1:80/callback",
                   "http://127.0.0.1:1023/callback", "http://127.0.0.1:65536/callback", "http://127.0.0.1:08766/callback",
                   "http://user@127.0.0.1:8766/callback", "http://127.0.0.1:8766/other",
                   "http://127.0.0.1:8766/callback/", "http://127.0.0.1:8766/callback?",
                   "http://127.0.0.1:8766/callback#fragment", "http://127.0.0.1:8766/callback\n"]
        for redirect in invalid:
            with self.subTest(redirect=redirect):
                client, vault, transport = self.client()
                callback = mock.Mock()
                with self.assertRaises(x.XClientError):
                    client.connect("public_client_123", callback=callback, redirect_uri=redirect)
                with mock.patch.object(x, "HTTPServer") as server, self.assertRaises(x.XClientError):
                    x.receive_callback("https://x.com/oauth", "expected", mock.Mock(), redirect_uri=redirect)
                callback.assert_not_called()
                server.assert_not_called()
                self.assertEqual(vault.writes, [])
                self.assertEqual(transport.calls, [])
        self.assertEqual(x.redirect_port("http://127.0.0.1:1024/callback"), 1024)
        self.assertEqual(x.redirect_port("http://127.0.0.1:65535/callback"), 65535)

    def test_missing_scopes_or_refresh_tokens_are_not_saved(self):
        for value in [{"access_token": "new-access", "expires_in": 7200},
                      {"access_token": "new-access", "refresh_token": "refresh", "expires_in": 7200, "scope": "tweet.read"}]:
            with self.subTest(value=value):
                client, vault, transport = self.client([value], stored=None)
                with self.assertRaises(x.XClientError):
                    client.connect("public_client_123", callback=lambda *args: "secret-code")
                self.assertEqual(vault.writes, [])
                self.assertEqual(len(transport.calls), 1)

    def test_callback_rejects_wrong_state_duplicates_and_noncallback_paths(self):
        self.assertEqual(x.callback_values("/callback?code=secret-code&state=expected", "expected"), {"code": "secret-code"})
        self.assertEqual(x.callback_values("/callback?error=access_denied&state=expected", "expected"), {"denied": True})
        for path in ["/callback?code=secret&state=wrong", "/else?code=secret&state=expected",
                     "/callback?code=secret&state=expected&state=expected", "/callback?state=expected",
                     "/callback?code=a&code=b&state=expected", "/callback?state=%E9%94%99%E8%AF%AF&code=a",
                     "/callback?code=a&state=expected#fragment", "https://evil.invalid/callback?state=expected&code=a"]:
            with self.subTest(path=path):
                self.assertIsNone(x.callback_values(path, "expected"))

    def test_callback_server_is_loopback_only_silent_and_closes_without_network(self):
        class Server:
            def __init__(self, address, handler):
                self.address, self.handler, self.closed = address, handler, False

            def __enter__(self):
                return self

            def __exit__(self, *args):
                self.closed = True

            def handle_request(self):
                fake = SimpleNamespace(path="/callback?code=secret-code&state=expected", headers={"Host": "127.0.0.1:8765"},
                                       send_response=mock.Mock(), send_header=mock.Mock(), end_headers=mock.Mock(), wfile=io.BytesIO())
                self.handler.do_GET(fake)
                self.handler.log_message(fake, "secret-code")
                self.sent = fake
        instances = []
        def factory(*args):
            instances.append(Server(*args))
            return instances[-1]
        browser = mock.Mock(return_value=True)
        with mock.patch.object(x, "HTTPServer", side_effect=factory), mock.patch("sys.stderr", new_callable=io.StringIO) as stderr:
            self.assertEqual(x.receive_callback("https://x.com/oauth", "expected", browser), "secret-code")
            self.assertEqual(stderr.getvalue(), "")
        self.assertEqual(instances[0].address, ("127.0.0.1", 8765))
        self.assertTrue(instances[0].closed)
        self.assertNotIn(b"secret-code", instances[0].sent.wfile.getvalue())
        browser.assert_called_once_with("https://x.com/oauth")

    def test_corrupt_credential_metadata_is_sanitized_before_network(self):
        for field, value in [("expires_utc", "secret-invalid-expiry"), ("expires_utc", float("nan")),
                             ("account", {"secret": "sentinel"}), ("access_token", None)]:
            with self.subTest(field=field):
                client, _, transport = self.client(stored={**STORED, field: value})
                with self.assertRaises(x.XClientError) as caught:
                    client.create_post("note")
                self.assertNotIn("secret", str(caught.exception))
                self.assertNotIn("secret", json.dumps(client.status()))
                self.assertEqual(transport.calls, [])

    def test_alternate_listener_port_requires_matching_host_and_never_binds_default_port(self):
        requests = []
        hosts = ["127.0.0.1:8765", "localhost:8766", "127.0.0.1:8766"]
        class Server:
            def __init__(self, address, handler):
                self.address, self.handler = address, handler

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def handle_request(self):
                fake = SimpleNamespace(path="/callback?code=secret-code&state=expected", headers={"Host": hosts.pop(0)},
                                       send_response=mock.Mock(), send_header=mock.Mock(), end_headers=mock.Mock(), wfile=io.BytesIO())
                self.handler.do_GET(fake)
                requests.append(fake)
        with mock.patch.object(x, "HTTPServer", side_effect=Server) as factory:
            result = x.receive_callback("https://x.com/oauth", "expected", mock.Mock(return_value=True),
                                        redirect_uri="http://127.0.0.1:8766/callback")
        self.assertEqual(result, "secret-code")
        self.assertEqual(factory.call_args.args[0], ("127.0.0.1", 8766))
        self.assertEqual([fake.send_response.call_args.args[0] for fake in requests], [400, 400, 200])

    def test_cli_forwards_optional_redirect_to_connect(self):
        client, _, _ = self.client()
        client.connect = mock.Mock(return_value={"connected": True})
        with mock.patch.object(x, "XClient", return_value=client), mock.patch("sys.stdout", new_callable=io.StringIO):
            self.assertEqual(x.main(["connect", "--client-id", "public_client_123", "--redirect-uri",
                                     "http://127.0.0.1:8766/callback"]), 0)
        client.connect.assert_called_once_with("public_client_123", redirect_uri="http://127.0.0.1:8766/callback")

    def test_no_redirect_for_authorization_bearing_requests(self):
        self.assertIsNone(x.NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://other.invalid"))

    def test_validation_fails_before_network(self):
        client, _, transport = self.client()
        for invalid in ["", None, " " * 5]:
            with self.assertRaises(x.XClientError):
                client.create_post(invalid)
        for invalid in ["", "1/other", "123?x=1", "../"]:
            with self.assertRaises(x.XClientError):
                client.get_post(invalid)
        self.assertEqual(transport.calls, [])

    def test_vault_is_account_scoped_and_no_plaintext_fallback(self):
        self.assertEqual(x.WindowsVault(x.ACCOUNT).target, "Codex/TradingReflections/X/rexy69492164")
        with mock.patch.object(x.os, "name", "posix"), self.assertRaises(x.XClientError):
            x.WindowsVault().read()

    def test_cli_metadata_error_and_disconnect_output_never_include_tokens(self):
        client, vault, _ = self.client()
        with mock.patch.object(x, "XClient", return_value=client), mock.patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(x.main(["status"]), 0)
            self.assertNotIn("secret", output.getvalue())
            output.seek(0)
            output.truncate(0)
            self.assertEqual(x.main(["disconnect"]), 0)
            self.assertIsNone(vault.value)
            self.assertNotIn("secret", output.getvalue())


if __name__ == "__main__":
    unittest.main()
