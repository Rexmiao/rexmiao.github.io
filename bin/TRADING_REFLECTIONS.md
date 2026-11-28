# Trading Reflections workflow

This chat is dedicated to the user's Trading Reflections. Keep routine work focused on the new notes, the current draft, and this workflow.

For an approved release, follow [TRADING_RELEASE_QUICKSTART.md](TRADING_RELEASE_QUICKSTART.md) and the `trading_release.py` worker. It replaces the one-off publication and live-check scripts; use concise plan/state output and inspect detailed logs only as needed.

1. Accept informal Chinese notes, trade records, and screenshots. Preserve the user's voice. Distinguish information available at the time from hindsight. Never invent prices, dates, returns, or motives. The article date does not establish the trading date.
2. Use `TRADING_REFLECTION_TEMPLATE.md`. Reuse its five sections as appropriate; short reflections can have fewer sections. Prepare English and Chinese versions for review using the existing language switch.
3. Keep raw notes and unapproved drafts **outside the source checkout** in `../.work/trading-reflections/`. `published: false` does not hide a file in a public GitHub repository.
4. Share the draft with the user, including both languages. Run `check` and retain its SHA-256. User approval applies to that specific version; substantive later edits need review again. A hash records content identity and does not itself constitute user approval.
5. Only after explicit approval, run `prepare` with the reviewed hash. It creates a new article with `published: true` and refuses to overwrite any existing file. It never commits, pushes, or deploys.
6. Prefer the release worker to validate and prepare the approved batch, format with the lockfile's Prettier, commit selected files, push through the existing repository connection, wait for all required workflows, and run live HTTP/browser verification. The earlier `prepare` command remains a local drafting helper; do not use it before `publish`, which prepares its own transaction. Keep both tracked specifications and the workspace specification current.

Run from the source checkout (Ruby and its standard library only; no installation, API calls, or background service):

```powershell
ruby bin/trading_reflections.rb new --date 2026-11-28 --slug sample-reflection --title 'English title' --summary 'English summary' --title-zh '中文标题' --summary-zh '中文摘要'
ruby bin/trading_reflections.rb check '../.work/trading-reflections/2026-11-28-sample-reflection.md'
# Optional local bilingual review; accepts one or more drafts in the same directory:
ruby bin/review_trading_reflections.rb '../.work/trading-reflections/2026-11-28-sample-reflection.md'
# After the user approves the checked version, substitute the full hash returned by check:
ruby bin/trading_reflections.rb prepare '../.work/trading-reflections/2026-11-28-sample-reflection.md' --approved-sha256 '<reviewed hash>'
```

`new` writes UTF-8/LF and deliberately leaves TODOs. `check` validates metadata, dates, placeholders, content, and bilingual containers and prints compact JSON with the derived URL and content hash. Generated drafts use flat YAML fields; retain the template's container attributes. Detailed factual review and full build/link/deployment checks remain part of publication.

`review_trading_reflections.rb` renders an offline HTML review with article and language controls, using the existing Jekyll Kramdown dependency. It accepts only unpublished drafts and performs no network requests. Keep image files private under `../.work/trading-reflections/YYYY-MM-DD-materials/assets/` while draft Markdown uses its final `/assets/img/trading-reflections/YYYY-MM-DD/` URLs; the preview resolves those URLs locally. Use the same date in each asset URL as in its materials directory. Link companion drafts with their final article routes. After approval, copy only the reviewed assets to the matching site path, preserving binary bytes. Raw workbooks, chat screenshots, rejected image variants, and private audit material are never publication assets by default.

For speed, use targeted specification lookups and concise script output. Routine draft creation needs no full website build or network request. Inspect related source only when the notes or an observed failure require it. Avoid repeating unchanged checks. Keep total CPU near or below the user's 85% preference; check system load before heavy builds and reduce concurrency when needed.

Write equations as LaTeX: use `$$...$$` within a paragraph for Kramdown inline math and put opening/closing `$$` on separate lines for display math. Do not use plain code blocks for formulas. Local previews use the project's MathJax 3.2.0 SVG runtime cached privately at `../.work/trading-reflections/.review-runtime/mathjax-3.2.0-tex-svg.js`, with its pinned SHA-256 and source/license in that directory's README. Obtain that unmodified version once from `https://cdn.jsdelivr.net/npm/mathjax@3.2.0/es5/tex-svg.js` if missing; subsequent rendering is offline. The runtime is not a publication asset; the existing website already enables MathJax. Keep the observation time and contract expiration separate in formulas, tables, and image captions.

Follow each display equation with a short bilingual intuitive explanation in `<aside class="reflection-intuition" markdown="1">`. Use labeled `.intuition-input`, `.intuition-effect`, and `.intuition-limit` spans for restrained blue, mint, and amber emphasis, with the explanation understandable without color. Numerical examples must be explicitly hypothetical and distinguish sensitivities, intrinsic payouts, and realized P/L. The shared stylesheet and local preview provide matching callout styles; publish any approved style dependency alongside the approved articles.
