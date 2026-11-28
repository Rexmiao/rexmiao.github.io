# Trading Reflections release quickstart

Use this for routine releases after reading the applicable workspace instructions. Keep detailed logs and all review material in `../.work/trading-reflections/`. The user approves the specific bilingual draft and selected images in chat; reuse that approval without asking again for the same version. A hash identifies the approved content and does not itself grant permission.

The normal path is draft and plan → one review of the article, images and English X summary → `publish` → verified website and one X post per article. Canonical public links use **`https://rexy.levyquant.ai/`**; `https://rexmiao.github.io/` is the redirecting legacy host. Routine releases reuse local preferences, authorization and saved progress rather than repeating setup.

## Routine steps

1. Draft and preview with the existing helpers. Keep canonical article/image URLs in Markdown. Put private images under `../.work/trading-reflections/YYYY-MM-DD-materials/assets/`.
2. Synchronize `WEBSITE_SPEC.md` and `WEBSITE_SPEC.zh-CN.md` for the new content, then run `plan`, listing those metadata changes as support files. It automatically includes the configured English X summary and canonical article link for review with the draft and images. Keep the specification entry concise: article titles, routes and scope; detailed deployment evidence belongs in the private receipt. The planner discovers referenced images, validates drafts, hashes every selected file, and writes a private plan. It performs no Git mutation, publication, or network request.
3. After the user's confirmation, use the native GitHub connector to verify personal installation **180370859** contains **Rexmiao/rexmiao.github.io** and read current `master`. An installation check already established in the same chat need not be repeated unless access changes. Do not infer App write access from account-level `permissions.push`.
4. Run `publish` with the approved plan hash and current full remote SHA. The release worker uses only the existing, repository-scoped GitHub CLI credential and the established workflow; it does not log in, broaden access, alter global Git config, or force-push.
5. Report publication only when the worker prints `published_and_verified`. Link the returned live article URLs. If optional X delivery needs attention, report that separately from the verified website. Read detailed logs only on a failure or a specific user question.

Run from the source checkout; the operator substitutes paths and hashes, not the user:

```powershell
# Repeat --draft for multiple articles. Selected referenced images are discovered automatically.
python bin/trading_release.py plan --draft '../.work/trading-reflections/YYYY-MM-DD-topic.md'

# The plan_ready JSON gives the plan path and hash. Run only after user approval.
python bin/trading_release.py publish --plan '<private release-plan.json>' --approved-sha256 '<approved plan hash>' --expected-head '<verified full master SHA>'

# Continue an interrupted authorized release; do not start another publish or commit.
python bin/trading_release.py resume --state '<private release-plan.state.json>'

# Fresh read-only verification of an already published release.
python bin/trading_release.py verify --plan '<private release-plan.json>' --source-sha '<published source SHA>'
```

Use `plan --manifest '<private reviewed manifest.json>'` for an existing explicit image manifest. Add `--support-file '<repository-relative file>'` only for specifically authorized style, specification, or tool changes. These hashes become part of the reviewed plan; unrelated work and existing staged changes are preserved. Article/image changes use the manifest, not support-file overrides. Plans are immutable; use `--out` with a new private filename for a revised version.

## X announcements: English default, connected locally

On November 28, 2026, the user confirmed **@Rexy69492164** and **one English summary plus the canonical article link per future article**, using `https://rexy.levyquant.ai/`. Reviewing and approving a future draft covers its website and X publication together; do not ask again for the same approved version. OAuth connection succeeded that day, and independent identity and local vault checks passed. No posts have been sent. Existing notes remain unchanged and are not posted retroactively. GitHub tracks the X tooling; OAuth and local preferences remain machine-local. Keep synchronization and deployment evidence in the private release receipt.

The connection uses the existing **public Native App** with OAuth 2.0 Authorization Code and PKCE and scopes `tweet.read tweet.write users.read offline.access`, without a client secret. The client's general callback default remains `http://127.0.0.1:8765/callback`. An unrelated Python HTTP server occupied port 8765 and was preserved; this connection used the App's exact callback **`http://127.0.0.1:8766/callback`**. For any later reconnect, the registered callback and selected `--redirect-uri` must match exactly; do not stop another program to free the default port. Tokens stay in this machine's Windows Credential Manager, never in credential files. See [X's official OAuth documentation](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).

App registration use case (copyable):

```text
My app publishes one English summary and a canonical link to each of my own Trading Reflections articles after I approve the draft. It verifies my account identity and reads only my own posts when reconciling an interrupted publication. It does not send replies or Direct Messages, use other people's posts, or resell X data.
```

```powershell
# For a later reconnect only; normal releases reuse the machine-local vault.
python bin/trading_x_client.py connect --client-id PUBLIC_ID --account Rexy69492164 --redirect-uri http://127.0.0.1:8766/callback
# Optional connection diagnostics; repeat only when needed.
python bin/trading_x_client.py status --account Rexy69492164
python bin/trading_x_client.py check --account Rexy69492164
```

`status` reads local metadata; `check` calls GET identity to confirm the account. `disconnect --account Rexy69492164` removes the local vault entry; revoke the app separately in X's official Connected apps settings. As consulted on November 28, 2026, [X pricing](https://docs.x.com/x-api/getting-started/pricing) lists **$0.20 per URL-containing post**; prices and other requests may differ. The user controls credits and spending limits; the worker never purchases credits or enables automatic recharge.

For a future release, `plan` automatically reads the nonsecret local file `../.work/trading-reflections/x-preferences.json` (`schema_version: 1`, `enabled: true`, account `Rexy69492164`, language `en`). No language/account flags are needed each time. `enabled` records the chosen preference, not an authenticated connection. Use `--no-x` to omit X for one batch, or `--x-debrief '<private reviewed JSON>'` for reviewed custom copy; other language choices require a user-directed change. Existing frozen plans remain unchanged and receive no retrofitted X posts. The exact account and post text become part of each new plan hash and are shown alongside the articles and images; one confirmation of that version covers both website and X publication. For deterministic description-plus-link copy:

```powershell
python bin/trading_x.py draft --plan '<private release-plan.json>' --language en --out '<private x-draft.json>'
```

If editing that copy, freeze the reviewed JSON into a new plan with `--x-debrief`; do not edit the frozen plan. POST is attempted only after the website passes deployment and live checks. `verify` never posts. Resume preserves successful post IDs and skips duplicates. An interrupted `sending` or uncertain `unknown` result becomes `needs_reconciliation`; never retry it blindly. Confirm a candidate post's owner and exact text before resuming:

```powershell
python bin/trading_x.py reconcile --state '<private release-plan.state.json>' --index 0 --post-id '<confirmed post ID>'
python bin/trading_release.py resume --state '<private release-plan.state.json>'
```

X failures are separate from a verified website release. Exit code `2` means X needs attention; report the website URL and X status distinctly.

## What the worker checks

- Draft and image hashes, UTF-8/LF, duplicate/escaping paths, expected existing targets, locked formatter versions, and staged blobs. It commits only selected files and refuses concurrent source or remote changes.
- Exact source SHA for Deploy site, Prettier, source links and compiled-site links; then the generated commit's source mapping and its exact Pages deployment. All five must succeed.
- Live articles, archive, Projects and four portrait resources; image bytes must match the approved hashes.
- Each article's English/Chinese titles, descriptions, bodies and persistence; LaTeX counts and errors; images including lazy loading; desktop/mobile, light/dark, explanation readability, navigation and page width. Long formulas may scroll inside their own container.

Progress output is compact and appears when state changes. Polling defaults to 20 seconds with a bounded wait; screenshots default to two representative views or a failure view. `--screenshots` saves all browser states. Reports and state stay beside the private plan: `http-checks.json`, `browser-checks.json`, and its `.state.json`. Successful HTTP checks and completed steps are reused on resume. Resuming an already completed state returns `previously_verified`, a stored receipt; use `verify` for a fresh check.

## Recovery and dependencies

An actual failed check stops the worker with its run/job summary. Fix its cause, or use the native connector to retry only the failed job when evidence supports a transient failure, then resume the same source SHA. Never accept failed statuses, drop required checks, or rerun everything without a reason. A changed approved draft/image needs review of that changed version. Concurrent remote changes require inspection; no automatic rebase or overwrite occurs.

A leftover `.publish.lock` identifies its PID and state. Inspect the process before removing a confirmed stale lock; do not terminate other programs. Network-restricted sessions may need the existing narrow command approval to reach the repository and public site. Access failures do not authorize a new login or broader token.

Reuse installed Python, Ruby, Node, locked repository formatters, Playwright and Edge/Chrome. The worker installs nothing. If needed, set `TRADING_PLAYWRIGHT_MODULE` and `TRADING_BROWSER_EXECUTABLE` to existing local tools. Keep dependencies outside the public content. CPU sampling adjusts lightweight HTTP concurrency and postpones starting browser QA when system CPU is at or above 85%; this is best effort, not a system-wide limit.

Run offline regression tests with:

```powershell
python -B -m unittest discover -s bin/tests -p 'test_trading_release*.py'
python -B -m unittest discover -s bin/tests -p 'test_trading_x*.py'
```

The reusable implementation is `trading_release.py`, `trading_release_remote.py`, and `trading_release_browser.mjs`, with optional `trading_x.py` and `trading_x_client.py`. Browser selectors target the established al-folio journal layout. Read `TRADING_REFLECTIONS.md` for editorial and formula conventions, not for every successful publishing step.
