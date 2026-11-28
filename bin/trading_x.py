#!/usr/bin/env python3
"""Reviewed X debriefs for verified Trading Reflections; no network during planning."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import unicodedata

DEFAULT_ACCOUNT = "Rexy69492164"
SITE = "https://rexy.levyquant.ai"
ARTICLE_URL = re.compile(re.escape(SITE) + r"/projects/trading-reflections/[a-z0-9-]+/(?=\s|$)")


def weight(text):
    """Conservative upper bound: NFC, ASCII=1, other codepoints=2, own URL=23.

    Deliberately overcounts some Latin/emoji sequences rather than adding a
    parser dependency. Only canonical article URLs are accepted by validate.
    """
    text = unicodedata.normalize("NFC", text)
    text = ARTICLE_URL.sub("a" * 23, text)
    return sum(1 if ord(char) < 128 else 2 for char in text)


def validate(value, articles):
    if not isinstance(value, dict) or set(value) != {"schema_version", "account", "posts"} or value["schema_version"] != 1:
        raise ValueError("Invalid X debrief schema")
    if not isinstance(value["account"], str) or not re.fullmatch(r"[A-Za-z0-9_]{1,15}", value["account"]):
        raise ValueError("Invalid X account")
    routes = {item["route"] for item in articles}
    posts, seen = value["posts"], set()
    if not isinstance(posts, list) or not 1 <= len(posts) <= 2 * len(routes):
        raise ValueError("Use one reviewed X post per article/language")
    for post in posts:
        if not isinstance(post, dict) or set(post) != {"route", "language", "text"}:
            raise ValueError("Invalid X post fields")
        if post["route"] not in routes or post["language"] not in {"en", "zh"}:
            raise ValueError("X post must reference an article/language in this release")
        key = (post["route"], post["language"])
        if key in seen:
            raise ValueError("Duplicate X debrief")
        seen.add(key)
        text = post["text"]
        if not isinstance(text, str) or not text.strip() or text != unicodedata.normalize("NFC", text):
            raise ValueError("X text must be nonempty NFC text")
        if any(ord(char) < 32 and char != "\n" for char in text) or any(0xD800 <= ord(char) <= 0xDFFF for char in text):
            raise ValueError("Invalid control character in X text")
        url = SITE + post["route"]
        if text.count(url) != 1 or re.findall(r"https?://\S+", text) != [url] or not text.endswith(url):
            raise ValueError("End each X debrief with its single canonical article URL on " + SITE)
        if weight(text) > 280:
            raise ValueError("X debrief exceeds the conservative 280-character budget")
    return value


def draft(articles, language="en", account=DEFAULT_ACCOUNT):
    posts = []
    for article in articles:
        for lang in (["en", "zh"] if language == "both" else [language]):
            suffix = "_zh" if lang == "zh" else ""
            body = unicodedata.normalize("NFC", " ".join(article["description" + suffix].split()))
            # Reuse approved prose without generating claims or exposing order data.
            url = SITE + article["route"]
            if weight(body + "\n" + url) > 280:
                while body and weight(body + "…\n" + url) > 280:
                    body = body[:-1]
                if lang == "en" and " " in body:
                    body = body.rsplit(" ", 1)[0]
                body = body.rstrip(" .，。") + "…"
            posts.append({"route": article["route"], "language": lang, "text": body + "\n" + url})
    return validate({"schema_version": 1, "account": account, "posts": posts}, articles)


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def publish(state, state_path, save, client=None):
    """Website stays verified even when X needs attention. Never blindly resend."""
    from trading_x_client import XClient
    spec = state["plan"].get("x_debrief")
    if spec is None:
        return {"status": "disabled"}
    validate(spec, state["plan"]["articles"])
    if (state.get("phase") != "verified" or state.get("http", {}).get("success") is not True
            or state.get("browser", {}).get("success") is not True):
        raise ValueError("X requires a verified website publication")
    digest = fingerprint(spec)
    receipt = state.setdefault("x_debrief", {"sha256": digest, "posts": []})
    if receipt.get("sha256") != digest:
        raise ValueError("The approved X debrief changed")
    for index, post in enumerate(spec["posts"]):
        if index == len(receipt["posts"]):
            receipt["posts"].append({"status": "pending"})
        item = receipt["posts"][index]
        if item["status"] == "posted":
            continue
        if item["status"] in {"sending", "unknown"}:
            return {"status": "needs_reconciliation", "post_index": index}
        try:
            client = client or XClient(spec["account"])
            identity = client.whoami()
            if identity.get("username", "").casefold() != spec["account"].casefold():
                raise ValueError("Wrong X account")
        except Exception:
            item.update(status="pending", error="X authorization/account check needs attention")
            save(state_path, state)
            return {"status": "needs_connection", "post_index": index}
        item.clear()
        item.update(status="sending", author_id=identity["id"])
        save(state_path, state)  # durable before any POST; crash here cannot duplicate
        try:
            result = client.create_post(post["text"])
            post_id = result.get("id", "")
            if not re.fullmatch(r"[0-9]+", post_id):
                raise RuntimeError("Uncertain X result")
        except Exception as error:
            from trading_x_client import XClientError
            definite = isinstance(error, XClientError) and not error.ambiguous
            item.update(status="rejected" if definite else "unknown", error="X rejected the request" if definite else "X result uncertain; reconcile before retrying")
            save(state_path, state)
            return {"status": "rejected" if definite else "needs_reconciliation", "post_index": index}
        item.update(status="posted", id=post_id, url=f"https://x.com/{spec['account']}/status/{post_id}")
        item.pop("error", None)
        save(state_path, state)
    return {"status": "posted", "urls": [item["url"] for item in receipt["posts"]]}


def reconcile(state, index, post_id, client, save, state_path):
    """Attach a manually located post only after checking owner and exact text."""
    spec = validate(state["plan"]["x_debrief"], state["plan"]["articles"])
    receipt = state["x_debrief"]
    if state.get("phase") != "verified" or receipt["sha256"] != fingerprint(spec):
        raise ValueError("Invalid X publication receipt")
    if not re.fullmatch(r"[0-9]+", post_id) or not 0 <= index < len(receipt["posts"]):
        raise ValueError("Invalid X post/index")
    item = receipt["posts"][index]
    if item["status"] not in {"sending", "unknown"}:
        raise ValueError("Only uncertain posts need reconciliation")
    identity, actual = client.whoami(), client.get_post(post_id)
    text = actual["text"]
    for entity in sorted(actual.get("entities", {}).get("urls", []), key=lambda value: len(value["url"]), reverse=True):
        text = text.replace(entity["url"], entity["expanded_url"])
    if (identity["username"].casefold() != spec["account"].casefold() or actual.get("author_id") != identity["id"]
            or text != spec["posts"][index]["text"]):
        raise ValueError("X post owner or content differs from the approved debrief")
    item.update(status="posted", id=post_id, url=f"https://x.com/{spec['account']}/status/{post_id}")
    item.pop("error", None)
    save(state_path, state)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    preview = sub.add_parser("draft", help="Create private X copy from a plan; no network")
    preview.add_argument("--plan", required=True)
    preview.add_argument("--language", choices=["en", "zh", "both"], default="en")
    preview.add_argument("--account", default=DEFAULT_ACCOUNT)
    preview.add_argument("--out", required=True)
    fix = sub.add_parser("reconcile", help="Read-only X lookup; record a matching uncertain post")
    fix.add_argument("--state", required=True)
    fix.add_argument("--index", required=True, type=int)
    fix.add_argument("--post-id", required=True)
    args = parser.parse_args(argv)
    import trading_release as release
    try:
        if args.command == "draft":
            plan = release.load_plan(args.plan)
            output = release.private_path(args.out, exists=False)
            if output.exists():
                raise ValueError("Choose a new private debrief filename")
            release.save_json(output, draft(plan["articles"], args.language, args.account))
            release.emit("x_draft_ready", path=str(output))
        else:
            from trading_x_client import XClient
            path = release.private_path(args.state)
            with release.release_lock(path):
                state = json.loads(path.read_text(encoding="utf-8"))
                if release.payload_hash(state["plan"]) != state["approved_sha256"]:
                    raise ValueError("The approved plan changed")
                reconcile(state, args.index, args.post_id, XClient(state["plan"]["x_debrief"]["account"]), release.save_json, path)
            release.emit("x_reconciled", post_id=args.post_id)
        return 0
    except Exception:
        release.emit("x_stopped", message="X draft/reconciliation failed; inspect private inputs and connection")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
