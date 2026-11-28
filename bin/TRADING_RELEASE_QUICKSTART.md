# Trading Reflections release quickstart

Use this for routine releases after reading the applicable workspace instructions. Keep detailed logs and all review material in `../.work/trading-reflections/`. The user approves the specific bilingual draft and selected images in chat; reuse that approval without asking again for the same version. A hash identifies the approved content and does not itself grant permission.

## Routine steps

1. Draft and preview with the existing helpers. Keep canonical article/image URLs in Markdown. Put private images under `../.work/trading-reflections/YYYY-MM-DD-materials/assets/`.
2. Synchronize `WEBSITE_SPEC.md` and `WEBSITE_SPEC.zh-CN.md` for the new content, then freeze the reviewed content with `plan`, listing those metadata changes as support files. Keep the specification entry concise: article titles, routes and scope; detailed deployment evidence belongs in the private receipt. The planner discovers referenced images, validates drafts, hashes every selected file, and writes a private plan. It performs no Git mutation, publication, or network request.
3. After the user's confirmation, use the native GitHub connector to verify personal installation **180370859** contains **Rexmiao/rexmiao.github.io** and read current `master`. An installation check already established in the same chat need not be repeated unless access changes. Do not infer App write access from account-level `permissions.push`.
4. Run `publish` with the approved plan hash and current full remote SHA. The release worker uses only the existing, repository-scoped GitHub CLI credential and the established workflow; it does not log in, broaden access, alter global Git config, or force-push.
5. Report publication only when the worker prints `published_and_verified`. Link the returned live article URLs. Read detailed logs only on a failure or a specific user question.

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
```

The reusable implementation is `trading_release.py`, `trading_release_remote.py`, and `trading_release_browser.mjs`. Browser selectors target the established al-folio journal layout. Read `TRADING_REFLECTIONS.md` for editorial and formula conventions, not for every successful publishing step.
