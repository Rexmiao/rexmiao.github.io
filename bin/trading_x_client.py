#!/usr/bin/env python3
"""X OAuth 2.0 PKCE client. Secrets stay in Windows Credential Manager.

Connecting is interactive; none of these commands publishes a post. Callers must
record an in-flight receipt before create_post and reconcile ambiguous outcomes.
"""
from __future__ import annotations

import argparse
import base64
import ctypes
from ctypes import wintypes
import hashlib
import hmac
import http.client
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import math
import os
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

ACCOUNT = "Rexy69492164"
API = "https://api.x.com/2"
REDIRECT = "http://127.0.0.1:8765/callback"
SCOPES = "tweet.read tweet.write users.read offline.access"


class XClientError(RuntimeError):
    def __init__(self, message, *, ambiguous=False, status=None):
        super().__init__(message)
        self.ambiguous = ambiguous
        self.status = status


def account_name(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_]{1,15}", value):
        raise XClientError("Specify a valid X account username without @")
    return value


def redirect_port(value):
    match = re.fullmatch(r"http://127\.0\.0\.1:([1-9]\d{3,4})/callback", value) if isinstance(value, str) else None
    if match is None or not 1024 <= int(match[1]) <= 65535:
        raise XClientError("Use an exact http://127.0.0.1:<port>/callback URI with port 1024 through 65535")
    return int(match[1])


class WindowsVault:
    """A user-scoped OS secret; no environment dumps or plaintext fallback."""
    def __init__(self, account=ACCOUNT):
        self.target = "Codex/TradingReflections/X/" + account_name(account).lower()

    @staticmethod
    def _api():
        if os.name != "nt":
            raise XClientError("Windows Credential Manager is required for X credentials")
        class Credential(ctypes.Structure):
            _fields_ = [("Flags", wintypes.DWORD), ("Type", wintypes.DWORD),
                        ("TargetName", wintypes.LPWSTR), ("Comment", wintypes.LPWSTR),
                        ("LastWritten", wintypes.FILETIME), ("CredentialBlobSize", wintypes.DWORD),
                        ("CredentialBlob", ctypes.POINTER(ctypes.c_ubyte)), ("Persist", wintypes.DWORD),
                        ("AttributeCount", wintypes.DWORD), ("Attributes", ctypes.c_void_p),
                        ("TargetAlias", wintypes.LPWSTR), ("UserName", wintypes.LPWSTR)]
        api = ctypes.WinDLL("Advapi32.dll", use_last_error=True)
        api.CredReadW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD,
                                 ctypes.POINTER(ctypes.POINTER(Credential))]
        api.CredReadW.restype = wintypes.BOOL
        api.CredWriteW.argtypes = [ctypes.POINTER(Credential), wintypes.DWORD]
        api.CredWriteW.restype = wintypes.BOOL
        api.CredDeleteW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD]
        api.CredDeleteW.restype = wintypes.BOOL
        api.CredFree.argtypes = [ctypes.c_void_p]
        api.CredFree.restype = None
        return api, Credential

    def read(self):
        api, kind = self._api()
        pointer = ctypes.POINTER(kind)()
        if not api.CredReadW(self.target, 1, 0, ctypes.byref(pointer)):
            if ctypes.get_last_error() == 1168:
                return None
            raise XClientError("Windows could not read the X credential")
        try:
            data = ctypes.string_at(pointer.contents.CredentialBlob, pointer.contents.CredentialBlobSize)
            value = json.loads(data.decode("utf-8"))
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except (ValueError, UnicodeError):
            raise XClientError("The stored X credential is invalid; reconnect") from None
        finally:
            api.CredFree(pointer)

    def write(self, value):
        api, kind = self._api()
        data = json.dumps(value, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
        if len(data) > 2560:
            raise XClientError("The X credential exceeds the Windows vault size limit")
        buffer = (ctypes.c_ubyte * len(data)).from_buffer_copy(data)
        credential = kind(Type=1, TargetName=self.target, UserName=value["account"], Persist=2,
                          CredentialBlobSize=len(data), CredentialBlob=buffer)
        try:
            if not api.CredWriteW(ctypes.byref(credential), 0):
                raise XClientError("Windows could not save the X credential")
        finally:
            ctypes.memset(buffer, 0, len(data))

    def delete(self):
        api, _ = self._api()
        if not api.CredDeleteW(self.target, 1, 0) and ctypes.get_last_error() != 1168:
            raise XClientError("Windows could not remove the X credential")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        return None


class XClient:
    def __init__(self, expected_account=ACCOUNT, *, vault=None, opener=None, now=None):
        self.account = account_name(expected_account)
        self.vault = vault if vault is not None else WindowsVault(self.account)
        self.opener = opener or urllib.request.build_opener(NoRedirect()).open
        self.now = now or time.time
        self._identity = None

    def status(self):
        try:
            value = self.vault.read()
        except XClientError:
            return {"connected": False, "account": self.account, "vault_available": False}
        if not value:
            return {"connected": False, "account": self.account, "vault_available": True}
        expiry = value.get("expires_utc")
        if not isinstance(expiry, (int, float)) or not math.isfinite(expiry):
            expiry = None
        return {"connected": isinstance(value.get("account"), str) and value["account"].lower() == self.account.lower(),
                "account": self.account, "vault_available": True,
                "expires_utc": expiry, "refresh_available": bool(value.get("refresh_token"))}

    def _http(self, method, path, *, token=None, payload=None, form=False, write=False):
        headers = {"Accept": "application/json", "User-Agent": "TradingReflections-X/1"}
        if token:
            headers["Authorization"] = "Bearer " + token
        data = None
        if payload is not None:
            data = (urllib.parse.urlencode(payload) if form else json.dumps(payload, ensure_ascii=False)).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded" if form else "application/json"
        request = urllib.request.Request(API + path, data=data, headers=headers, method=method)
        try:
            with self.opener(request, timeout=30) as response:
                raw = response.read(1048577)
                if len(raw) > 1048576:
                    raise ValueError()
                value = json.loads(raw.decode("utf-8"))
                if not isinstance(value, dict):
                    raise ValueError()
                return value
        except urllib.error.HTTPError as error:
            status = error.code
            error.close()
            raise XClientError("X API rejected the request (HTTP " + str(status) + ")",
                               ambiguous=write and (status >= 500 or status == 408), status=status) from None
        except (OSError, urllib.error.URLError, TimeoutError, http.client.HTTPException):
            raise XClientError("X API connection failed; check the saved receipt before retrying",
                               ambiguous=write) from None
        except (ValueError, UnicodeError):
            raise XClientError("X API returned an invalid response; check the saved receipt before retrying",
                               ambiguous=write) from None

    def _stored(self):
        value = self.vault.read()
        if not value or not isinstance(value.get("account"), str) or value["account"].lower() != self.account.lower():
            raise XClientError("Connect the intended X account before publishing")
        if (not isinstance(value.get("access_token"), str) or not value["access_token"]
                or not isinstance(value.get("client_id"), str)
                or not isinstance(value.get("expires_utc"), (int, float))
                or not math.isfinite(value["expires_utc"])):
            raise XClientError("The stored X credential is incomplete; reconnect")
        return value

    def _token(self):
        value = self._stored()
        if float(value.get("expires_utc", 0)) <= self.now() + 60:
            if not value.get("refresh_token"):
                raise XClientError("The X authorization expired; reconnect")
            response = self._http("POST", "/oauth2/token", form=True,
                                  payload={"grant_type": "refresh_token", "refresh_token": value["refresh_token"],
                                           "client_id": value["client_id"]})
            value = self._tokens(response, value)
            self.vault.write(value)  # Persist rotation before using the new token.
        return value["access_token"]

    def _tokens(self, response, previous):
        try:
            access = response["access_token"]
            refresh = response.get("refresh_token", previous.get("refresh_token"))
            expires = float(response["expires_in"])
            if (not isinstance(access, str) or not access or not isinstance(refresh, str) or not refresh
                    or not math.isfinite(expires) or expires <= 0):
                raise ValueError()
            if response.get("token_type", "bearer").lower() != "bearer":
                raise ValueError()
            granted = response.get("scope")
            if granted is not None and not set(SCOPES.split()).issubset(str(granted).split()):
                raise ValueError()
            return {**previous, "access_token": access, "refresh_token": refresh, "expires_utc": self.now() + expires}
        except (KeyError, TypeError, ValueError, AttributeError):
            raise XClientError("X did not return the required authorization; reconnect with the required scopes") from None

    def _me(self, token):
        response = self._http("GET", "/users/me", token=token).get("data", {})
        if (not isinstance(response, dict) or not re.fullmatch(r"\d{1,25}", str(response.get("id", "")))
                or not isinstance(response.get("username"), str)):
            raise XClientError("X returned an invalid account identity")
        if response["username"].lower() != self.account.lower():
            raise XClientError("The authenticated X account does not match the intended account")
        return {key: response[key] for key in ["id", "username"]}

    def whoami(self):
        identity = self._me(self._token())
        bound = self._stored().get("user_id")
        if bound is not None and bound != identity["id"]:
            raise XClientError("The authenticated X user ID changed; reconnect")
        self._identity = identity
        return dict(identity)

    def create_post(self, text):
        if not isinstance(text, str) or not text.strip() or len(text) > 65536:
            raise XClientError("Specify a nonempty reviewed X debrief")
        if self._identity is None:
            self.whoami()
        response = self._http("POST", "/tweets", token=self._token(), payload={"text": text}, write=True).get("data", {})
        if (not isinstance(response, dict) or not re.fullmatch(r"\d{1,25}", str(response.get("id", "")))
                or not isinstance(response.get("text"), str)):
            raise XClientError("X did not confirm the new post; reconcile before retrying", ambiguous=True)
        return {key: response[key] for key in ["id", "text"]}

    def get_post(self, post_id):
        if not isinstance(post_id, str) or not re.fullmatch(r"\d{1,25}", post_id):
            raise XClientError("Specify a valid X post ID")
        identity = self.whoami()
        value = self._http("GET", "/tweets/" + post_id + "?tweet.fields=author_id,entities", token=self._token()).get("data", {})
        if (not isinstance(value, dict) or value.get("id") != post_id or not isinstance(value.get("text"), str)
                or value.get("author_id") != identity["id"]):
            raise XClientError("The X post does not match the authenticated author or requested ID")
        return {key: value.get(key, {}) for key in ["id", "text", "author_id", "entities"]}

    def connect(self, client_id, *, browser=None, callback=None, redirect_uri=REDIRECT):
        if not isinstance(client_id, str) or not re.fullmatch(r"[A-Za-z0-9._~+/=:-]{8,512}", client_id):
            raise XClientError("Specify the public client ID of an X Native App")
        redirect_port(redirect_uri)
        verifier = secrets.token_urlsafe(64)
        state = secrets.token_urlsafe(32)
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")
        url = "https://x.com/i/oauth2/authorize?" + urllib.parse.urlencode(
            {"response_type": "code", "client_id": client_id, "redirect_uri": redirect_uri, "scope": SCOPES,
             "state": state, "code_challenge": challenge, "code_challenge_method": "S256"})
        listener = callback or receive_callback
        arguments = {} if redirect_uri == REDIRECT else {"redirect_uri": redirect_uri}
        code = listener(url, state, browser or webbrowser.open, **arguments)
        response = self._http("POST", "/oauth2/token", form=True,
                              payload={"grant_type": "authorization_code", "code": code, "client_id": client_id,
                                       "redirect_uri": redirect_uri, "code_verifier": verifier})
        value = self._tokens(response, {"account": self.account, "client_id": client_id})
        identity = self._me(value["access_token"])
        value["user_id"] = identity["id"]
        self.vault.write(value)
        self._identity = identity
        return {"connected": True, **identity}


def callback_values(path, expected_state):
    parsed = urllib.parse.urlsplit(path)
    if parsed.path != "/callback" or parsed.scheme or parsed.netloc or parsed.fragment or len(path) > 8192:
        return None
    values = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
    supplied = values.get("state", [])
    if len(supplied) != 1 or not hmac.compare_digest(supplied[0].encode("utf-8"), expected_state.encode("utf-8")):
        return None
    if "error" in values:
        return {"denied": True}
    codes = values.get("code", [])
    if len(codes) != 1 or not codes[0] or len(codes[0]) > 4096:
        return None
    return {"code": codes[0]}


def receive_callback(url, state, browser, redirect_uri=REDIRECT):
    port = redirect_port(redirect_uri)
    result = {}
    class Handler(BaseHTTPRequestHandler):
        timeout = 5

        def log_message(self, *args):
            pass  # Callback URL contains the authorization code.

        def do_GET(self):
            valid_host = self.headers.get("Host") == "127.0.0.1:" + str(port)
            value = callback_values(self.path, state) if valid_host else None
            if value is not None:
                result.update(value)
            self.send_response(200 if value is not None else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Referrer-Policy", "no-referrer")
            self.end_headers()
            self.wfile.write(b"Authorization received. Return to Codex." if value is not None else b"Invalid callback.")
    try:
        with HTTPServer(("127.0.0.1", port), Handler) as server:
            server.timeout = 1
            if browser(url) is False:
                raise XClientError("The authorization browser could not be opened")
            deadline = time.monotonic() + 300
            while not result and time.monotonic() < deadline:
                server.handle_request()
    except OSError:
        raise XClientError("The local X authorization callback could not start on port " + str(port)) from None
    if result.get("denied"):
        raise XClientError("X authorization was declined")
    if "code" not in result:
        raise XClientError("X authorization timed out; reconnect")
    return result["code"]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ["connect", "status", "check", "disconnect"]:
        sub = commands.add_parser(name)
        sub.add_argument("--account", default=ACCOUNT)
        if name == "connect":
            sub.add_argument("--client-id", required=True)
            sub.add_argument("--redirect-uri", default=REDIRECT)
    args = parser.parse_args(argv)
    try:
        client = XClient(args.account)
        if args.command == "connect":
            result = client.connect(args.client_id, redirect_uri=args.redirect_uri)
        elif args.command == "check":
            result = {"connected": True, **client.whoami()}
        elif args.command == "disconnect":
            client.vault.delete()
            result = {"local_credentials_removed": True, "account": client.account,
                      "note": "Remove the app under X Connected Apps to revoke server authorization."}
        else:
            result = client.status()
        print(json.dumps(result, ensure_ascii=True))
        return 0
    except XClientError as error:
        print(json.dumps({"error": str(error), "ambiguous": error.ambiguous, "http_status": error.status}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
