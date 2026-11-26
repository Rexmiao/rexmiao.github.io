# Runtian Miao website specification

[简体中文](WEBSITE_SPEC.zh-CN.md) | **English**

Updated: 2026-11-26.

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
- Prettier checks remain enabled. Use Node.js `22` and `npm ci --ignore-scripts`
  with the committed `package-lock.json`, which pins Prettier `3.1.1` and
  `@shopify/prettier-plugin-liquid` `1.4.0`. Do not upgrade the formatters in CI.
  Format changed YAML, Markdown, and Liquid source with these versions before
  publication.
- Source link checking selects Markdown and HTML files using the Jekyll
  configuration's `include`, `exclude`, and output collections, excluding
  dependencies and unpublished template content. This also excludes the
  `_projects/3_project.md` Unsplash redirect through Jekyll configuration rather
  than treating it as the only file to skip. Check HTTP and HTTPS external links
  in the selected files; do not globally allow HTTP 401 responses.
- The separate compiled-site check validates generated internal routes offline,
  using `_site/` as the explicit base directory. Source checks validate external
  URLs; compiled-site checks resolve local links against the built website.
- Primary navigation: About, News, Publications, Projects, CV.

Retain the existing URL, hosting, and theme. Build and verify the website before
claiming that changes are published. Verify both the deployment result and the
live page after a source update.

The lab has a separate Static HTML target on Hugging Face, `Rexymiao/levy-volatility-lab`.
`.github/workflows/publish-huggingface.yml` stages an explicit set of the lab's
public files and uploads to that Space. Configure a repository-scoped Trusted
Publisher for `Rexmiao/rexmiao.github.io`, branch `master`, and workflow
`publish-huggingface.yml`. GitHub Actions receives a short-lived credential at
run time. The Static Space uses precomputed results.

## Content baseline

The user-supplied `Resume202611220310.docx` is the source for Runtian Miao's research
profile, education, professional experience, skills, scholarly output, peer review,
leadership, university service, and research support environment. The user also
supplied the replacement portrait stored at `assets/img/runtian-miao.jpg`.

- Name: Runtian Miao. Homepage heading: Rexy (Runtian) Miao. Navigation brand:
  Rexy Miao.
- Position: Ph.D. Candidate, Applied Mathematics and Computational Science,
  University of Pennsylvania.
- Homepage contact links: `rexmiao@sas.upenn.edu` and `miaoruntian1997@gmail.com`.
- Google Scholar ID: `A5aYtioAAAAJ`.
- ORCID: `0000-0002-2754-2630`.
- ResearchGate profile setting: `Runtian_Miao2`.
- GitHub: `Rexmiao`.
- Hugging Face: `Rexymiao`, <https://huggingface.co/Rexymiao>, linked in the
  homepage social icons.
- X: `@Rexy69492164`, <https://x.com/Rexy69492164>, confirmed by the user's
  supplied screenshot.

The homepage shows compact social icons and two email links under the portrait.
The homepage bio mentions varsity track and multiple half marathons. The bold
program and software names link to the [Penn AMCS program](https://amcs.upenn.edu/),
the Quick Annotator and HistoQC portfolio pages, the [Sedeen Viewer product page](https://www.pathcore.com/products/sedeen-viewer),
and the [WRDS homepage](https://wrds-www.wharton.upenn.edu/).

Do not infer missing degree dates, graduation, manuscript acceptance, personal
grant ownership, or investment performance. Preserve the 2026 npj Dementia
manuscript's under-review status and the ISFTD 2026 poster's accepted status.
Treat the Quick Annotator journal article and preprint as versions of one work.

## News and social updates

Enable the homepage News section through `_pages/about.md` and the announcements
setting in `_config.yml`. The News navigation entry opens `/news/`, which lists
the published news collection and links to the verified X account.

The first current update is `_news/website-update.md`, dated 2026-11-25 in the
user's America/New_York timezone. It reports the actual CV, publications, and
quantitative project portfolio update, with links to the relevant pages. Keep
template announcements excluded; do not invent publication dates or research
milestones. Add new verified milestones as dated entries in `_news/`. The
homepage shows up to five recent items and `/news/` lists all entries. The
archive covers the CV's seven conference and symposium records from 2018 to 2026,
including the CWRU SURES presentations, Swiss Society of Pathology abstract,
three Penn Pendergrass posters, and the 2024 and 2026 ISFTD posters. Label the
accepted 2026 ISFTD poster by its program status. Use `date_label` for entries
with only month-level precision. The date in their front matter sorts the
entry by month.

## Invited peer review

The About page highlights each journal, its Journal Impact Factor (JIF), and
the peer review counts documented in the CV. It links to `/cv/#peer-review`.
The 36 completed reviews include revision rounds. Manuscript counts belong in
the CV.
Keep the one _NeuroImage_ collaborative review and _The Journal of Pathology:
Clinical Research_ reviewer-pool membership separate from that total.
Keep manuscript details private. The 2025 JIFs come from the 2026 edition of
Journal Citation Reports. Its [public table](https://www.niic.nsc.ru/phocadownload/publications/2025/JCR_JournalImpactFactor_2026.pdf)
labels columns by release year.

## Project portfolio

Projects are listed at `/projects/`, with category jump links, responsive cards,
and individual pages with return navigation. Display each card's original
title casing. Use the primary theme text color for project descriptions in
light and dark modes.

| Project                                        | Detail page                      | Category              |
| ---------------------------------------------- | -------------------------------- | --------------------- |
| PCR Market Watch                               | `/projects/pcr-market-watch/`    | Quantitative Research |
| Alpha Lab                                      | `/projects/alpha-lab/`           | Quantitative Research |
| Volatility Modeling with Lévy and OU Processes | `/projects/volatility-modeling/` | Quantitative Research |
| Trading Reflections                            | `/projects/trading-reflections/` | Trading               |
| Quick Annotator                                | `/projects/quick-annotator/`     | Research Software     |
| HistoQC                                        | `/projects/histoqc/`             | Research Software     |

Trading Reflections is the user's personal trading journal. The archive lists
published, dated entries newest first and links back to `/projects/#trading`.
Each entry has a full article page and a return link. Write entries in
`_trading_reflections/YYYY-MM-DD-short-title.md` using `TRADING_REFLECTION_TEMPLATE.md`.
Fill in the title, date and summary, then set `published: true` when ready.
The template is excluded from the site build. Drafts and future-dated entries
stay out of the generated archive and article pages.

PCR Market Watch links to its public overview, personal source repository,
latest release, English-default README/user guide, and separate Chinese README.
Alpha Lab is a local research prototype with a separate public
Alpha Training Lab teaching guide; do not imply a public source-code release or
production trading operation. Preserve verified project links and factual status.

The volatility modeling project links its advisor, Prof. Wojbor A. Woyczynski,
to his [Polish Wikipedia biography](https://pl.wikipedia.org/wiki/Wojbor_A._Woyczy%C5%84ski).
It also links to the standalone [Lévy Volatility Lab](labs/levy-volatility/)
with its model, documented data, and bilingual replication instructions. The
lab is a new empirical experiment using daily Federal Reserve H.10 USD/JPY rates,
separate from the master's research described on the portfolio page. Its rolling
five-return proxy, fixed training split, benchmarks, and simulation assumptions
are documented in the lab. The lab lives under `labs/levy-volatility/` and deploys
with the existing GitHub Pages workflow.
The project page links directly to the [Hugging Face demo](https://rexymiao-levy-volatility-lab.static.hf.space/)
under the Lévy Volatility Lab heading. The Projects card names the lab. The
homepage groups the lab with PCR Market Watch and Alpha Lab in its Quantitative
research and projects section, describing the trading research workflows and
linking to the project details and Hugging Face demo.

The lab's [U.S. equity comparison](labs/levy-volatility/#equity-evaluation) adds
bilingual ticker, variance target, and forecast-horizon controls on the same
page. It covers SPY, NVDA, JPM, AMD, QQQ, AVGO, MU, SNDK, and NBIS with 1-, 5-,
and 22-session horizons. Each view reports the available sample dates and QLIKE
differences versus the training mean, alongside RMSE in annualized volatility
percentage points. The daily target uses squared adjusted close-to-close
returns. The minute-derived target combines regular-session realized variance
computed from one-minute data with squared overnight returns. The NBIS daily
sample is evaluated separately. Both SNDK views and the NBIS minute-derived view
show sample insufficiency. Publish aggregate results and keep the raw U.S. equity
data in the local research project.

The bilingual [equity findings](labs/levy-volatility/#equity-findings) summarize
the per-ticker leaders by data frequency and horizon. The summary uses the full
benchmark scores and explains which Gamma–OU cases also beat both HAR and EWMA.
Interpret the findings as point forecast comparisons within the historical
evaluation samples.

The standalone [data sources and cleaning page](labs/levy-volatility/data-methodology/)
documents acquisition and coverage, price adjustments, missing observations,
regular-session and overnight construction, and the realized variance quality
gates. It maps the published artifacts to their FX and U.S. equity input
snapshots. Link to it from the lab and the volatility project page.

The [equity cleaning audit](labs/levy-volatility/data-methodology/#cleaning-audit)
provides bilingual ticker and frequency controls for all nine equities. Report
input counts and accepted observations with their units. Show the dates and
recorded reasons for missing daily bars or return endpoints, failed minute
quality rules, and archived bars before the selected ticker regime. Record
initialization and model evaluation as separate stages. Keep raw market data in
the local research project.

The audit's selectable date timeline uses the exported XNYS calendar, saved
source gaps, and minute session coverage. Show usability and a dated reason
for the selected ticker and frequency. Distinguish missing source observations
from quality exclusions, sample initialization, dates outside scope, and
market closures. Minute coverage details use archived counts with no prices.

The cleaning timeline includes a 12-month overview for the selected year.
It counts missing and excluded dates using the same status as the calendar.
Selecting a covered month opens its date view. Outside-coverage months are
marked distinctly from audited months with zero issues.

The bilingual lab explains the selected equity model scores, how to interpret
the lowest-QLIKE counts, and the equity forward-average variance target. The FX
fan explanation gives the underlying reference fixes, terminal proxy, point
forecast, simulated quantiles, and fixed-parameter interpretation. The data
methodology explains why each source is cleaned and how SHA-256 identifies the
saved file snapshot. Navigation labels distinguish the lab home from its
equity comparison and findings anchors.

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

- For the final source commit, the locked-version Prettier check and the
  Jekyll-selected HTTP/HTTPS source-link check complete successfully.
- Its deployment build completes successfully and produces the three portrait WebP files.
- The triggered compiled-site link check checks out the deployment's exact source
  SHA, rebuilds it successfully with Ruby `3.2` and ImageMagick, and checks local
  generated links offline against the `_site/` base directory.
- The live homepage, News page, and PCR project page load. The five navigation
  entries, homepage news update, verified X link, and README links to both
  languages work.
- Earlier failed-run email notifications remain historical; use the latest commit's Actions results to assess the current state.

The 2026-11-25 content baseline passed a production Jekyll build. Deployment
results remain available in the repository's Actions history:
<https://github.com/Rexmiao/rexmiao.github.io/actions/workflows/deploy.yml>.
Consult the matching deployment and live site when checking publication status.
