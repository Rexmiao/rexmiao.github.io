# Personal website maintenance

- Work only in the selected personal `Rexmiao/rexmiao.github.io` repository through the existing GitHub App/native connection. Do not request organization access or restart a broad CLI/OAuth login.
- Keep the existing al-folio/Jekyll theme, `master` source branch, and `gh-pages` publication branch. Check the expected branch head before publishing a commit.
- Keep [WEBSITE_SPEC.md](WEBSITE_SPEC.md) and [WEBSITE_SPEC.zh-CN.md](WEBSITE_SPEC.zh-CN.md) current together when content, navigation, or deployment changes.
- Preserve verified biography and project facts. Do not infer private account data, investment performance, or unpublished research acceptance.
- Fix failed format/link/build checks at their cause. Do not disable checks or globally accept failed HTTP statuses to obtain a green result.
- Deployment and compiled-site checks need compatible Ruby and ImageMagick. Verify actual generated responsive images as well as command exit status.
- Verify the final commit's workflows and live pages before reporting completion. Historical failure emails are not the current deployment state.
