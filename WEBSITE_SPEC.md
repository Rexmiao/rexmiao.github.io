# Runtian Miao website specification

[简体中文](WEBSITE_SPEC.zh-CN.md) | **English**

Updated: 2026-11-25.

## Website and deployment

- URL: <https://rexmiao.github.io/>.
- Repository: `Rexmiao/rexmiao.github.io`.
- Framework/theme: existing al-folio/Jekyll.
- Source branch: `master`; generated publication branch: `gh-pages`.
- Deployment workflow: `.github/workflows/deploy.yml`.
- Ruby setup follows the latest patch of the `3.2` series, so newer GitHub runner
  images can use an available build instead of the retired `3.2.2` binary.
- Install ImageMagick before the build and verify that all three responsive
  portrait WebP files are nonempty. The image plugin can report success even if
  its `convert` executable is missing, so a green build alone is insufficient.
- The compiled-site link-check workflow uses the same Ruby `3.2` series,
  ImageMagick prerequisite, and responsive-image assertions as deployment. It
  checks out the triggering deployment's exact source SHA before rebuilding.
- Prettier checks remain enabled; format changed YAML, Markdown, and Liquid source
  with the workflow's Prettier and Liquid-plugin versions before publication.
- Source link checking excludes `_projects/3_project.md`, an unpublished al-folio
  Unsplash redirect already excluded by Jekyll. Keep checks on real portfolio
  links and other source files; do not globally allow HTTP 401 responses.
- Primary navigation: About, Publications, Projects, CV.

Retain the existing URL, hosting, and theme. Build and verify the website before
claiming that changes are published. Verify both the deployment result and the
live page after a source update.

## Content baseline

The user-supplied `Resume202611220310.docx` is the source for Runtian Miao's research
profile, education, professional experience, skills, scholarly output, peer review,
leadership, university service, and research support environment. The user also
supplied the replacement portrait stored at `assets/img/runtian-miao.jpg`.

- Name: Runtian Miao.
- Position: Ph.D. Candidate, Applied Mathematics and Computational Science,
  University of Pennsylvania.
- Email: `rexmiao@sas.upenn.edu`.
- Google Scholar ID: `A5aYtioAAAAJ`.
- ORCID: `0000-0002-2754-2630`.
- ResearchGate profile setting: `Runtian_Miao2`.
- GitHub: `Rexmiao`.

Do not infer missing degree dates, graduation, manuscript acceptance, personal
grant ownership, or investment performance. Preserve the 2026 npj Dementia
manuscript's under-review status and the ISFTD 2026 poster's accepted status.
Treat the Quick Annotator journal article and preprint as versions of one work.

## Project portfolio

Projects are listed at `/projects/`, with individual pages and return navigation:

| Project                                        | Detail page                      | Category              |
| ---------------------------------------------- | -------------------------------- | --------------------- |
| PCR Market Watch                               | `/projects/pcr-market-watch/`    | Quantitative Research |
| Alpha Lab                                      | `/projects/alpha-lab/`           | Quantitative Research |
| Volatility Modeling with Lévy and OU Processes | `/projects/volatility-modeling/` | Quantitative Research |
| Quick Annotator                                | `/projects/quick-annotator/`     | Research Software     |
| HistoQC                                        | `/projects/histoqc/`             | Research Software     |

PCR Market Watch links to its public overview, personal source repository,
latest release, English-default README/user guide, and separate Chinese README.
Alpha Lab is a local research prototype with a separate public
Alpha Training Lab teaching guide; do not imply a public source-code release or
production trading operation. Preserve verified project links and factual status.

Only portfolio entries marked `portfolio: runtian` appear on the Projects page.
Template projects, sample publications, and sample CV data must not appear as
Runtian Miao's work.

## Permissions and maintenance

Prefer the native GitHub connector and the existing personal GitHub App
installation. Keep repository selection restricted to the specific personal
repositories needed. Account `permissions.push` does not prove integration write
access. If an actual write fails with HTTP 403, verify the installation's selected
repositories before changing the authorization method.

Do not broaden access to all repositories, use broad OAuth login as the default,
or request access to the `ftdc-picsl` organization. Never store credentials or
verification codes in the repository.

Update this specification and its Chinese counterpart when content, navigation,
or deployment behavior changes. Keep matching source links and limitations.

## CI acceptance

- For the final source commit, Prettier and source-link checks complete successfully.
- Its deployment build completes successfully and produces the three portrait WebP files.
- The triggered compiled-site link check rebuilds the same commit successfully and checks local generated links.
- The live homepage and PCR project page load, with working README links to both languages.
- Earlier failed-run email notifications remain historical; use the latest commit's Actions results to assess the current state.

The 2026-11-25 content baseline passed a production Jekyll build. Deployment
results remain available in the repository's Actions history:
<https://github.com/Rexmiao/rexmiao.github.io/actions/workflows/deploy.yml>.
Consult the matching deployment and live site when checking publication status.
