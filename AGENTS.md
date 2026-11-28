# Personal website maintenance

- Trading Reflections has a dedicated chat and reusable workflow: use `bin/TRADING_REFLECTIONS.md` for drafting and `bin/TRADING_RELEASE_QUICKSTART.md` for approved publication. Unapproved drafts belong outside this checkout in `../.work/trading-reflections/`. Draft/preview helpers never publish; `python bin/trading_release.py plan|publish|resume|verify` handles approved batches. Reuse the user's confirmation for that exact version, avoid repeated permission questions, and inspect detailed logs only when necessary.
- For local bilingual previews use `ruby bin/review_trading_reflections.rb draft.md [draft.md ...]`. Keep assets private until approval, use their final publication URLs in drafts, and follow the workflow's asset mapping when preparing an approved release.

- Work only in the selected personal `Rexmiao/rexmiao.github.io` repository through the existing GitHub App/native connection. Do not request organization access or restart a broad CLI/OAuth login.
- Keep the existing al-folio/Jekyll theme, `master` source branch, and `gh-pages` publication branch. Check the expected branch head before publishing a commit.
- Keep [WEBSITE_SPEC.md](WEBSITE_SPEC.md) and [WEBSITE_SPEC.zh-CN.md](WEBSITE_SPEC.zh-CN.md) current together when content, navigation, or deployment changes.
- Preserve verified biography and project facts. Do not infer private account data, investment performance, or unpublished research acceptance.
- Fix failed format/link/build checks at their cause. Do not disable checks or globally accept failed HTTP statuses to obtain a green result.
- Deployment and compiled-site checks need compatible Ruby and ImageMagick. Verify actual generated responsive images as well as command exit status.
- Verify the final commit's workflows and live pages before reporting completion. Historical failure emails are not the current deployment state.
