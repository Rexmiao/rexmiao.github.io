# Runtian Miao website specification

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

| Project | Detail page | Category |
| --- | --- | --- |
| PCR Market Watch | `/projects/pcr-market-watch/` | Quantitative Research |
| Alpha Lab | `/projects/alpha-lab/` | Quantitative Research |
| Volatility Modeling with Lévy and OU Processes | `/projects/volatility-modeling/` | Quantitative Research |
| Quick Annotator | `/projects/quick-annotator/` | Research Software |
| HistoQC | `/projects/histoqc/` | Research Software |

PCR Market Watch links to its public overview, personal source repository, and
latest release. Alpha Lab is a local research prototype with a separate public
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

Update this specification when content, navigation, or deployment behavior changes.

The 2026-11-25 content baseline passed a production Jekyll build. Deployment
results remain available in the repository's Actions history:
<https://github.com/Rexmiao/rexmiao.github.io/actions/workflows/deploy.yml>.
Consult the matching deployment and live site when checking publication status.
