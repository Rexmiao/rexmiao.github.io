# Runtian Miao website specification

[简体中文](WEBSITE_SPEC.zh-CN.md) | **English**

Updated: 2026-11-27.

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

The homepage presents a quantitative research profile with a dark, grid-lined
hero and cards for PCR Market Watch, Alpha Lab, and Lévy Volatility Lab before
the academic biography. The portrait has compact social icons and two clickable
email links displayed with uppercase `AT` and `DOT` separators. The homepage bio
mentions varsity track and multiple half marathons. The bold
program and software names link to the [Penn AMCS program](https://amcs.upenn.edu/),
the Quick Annotator and HistoQC portfolio pages, the [Sedeen Viewer product page](https://www.pathcore.com/products/sedeen-viewer),
and the [WRDS homepage](https://wrds-www.wharton.upenn.edu/).

The navy and mint quantitative theme uses the shared Jekyll palette, grid,
header, navigation, and card styles across the personal site. The two standalone
Lévy pages use the matching palette and chart colors. Dark is the default and
the theme control cycles dark, light, and system. The Jekyll and Lévy pages on
this origin store explicit choices under `quant-theme`. Preserve explicit older
light and dark settings. The CV uses light paper colors in print.

Typography uses IBM Plex Sans for text and IBM Plex Mono for labels, dates,
and tags. They are loaded from Google Fonts in `_includes/head.liquid` and set
through `--global-sans-font` and `--global-mono-font`. Chinese text falls back
to the system Chinese face. The two Lévy pages load the same pair. The content
column is 1080 pixels wide (`max_width` in `_config.yml`), and the Projects
grid uses three columns at that width.

Headings, short subtitles, button labels, and card link titles use Title
Case (for example, Quantitative Research and Projects). Longer descriptive
sentences keep sentence case. Mint is reserved for clickable elements and
data: the homepage identity line, page layer labels, and the tagline bar use
the light text color, and card top edges stay neutral until hover.

Shared UI components live in `_sass/_quant-site.scss`. Page headers can show
a mono layer label above the title. Project overviews show `Project overview ·
<category>`, resource pages show `Project resource` or their `layer` front
matter, and Trading Reflections entries show `Trading reflection · Article`.
Project cards show a `status` chip from front matter and an **Overview** row.
Resource links carry a kind tag from `resources[].kind`: `demo`, `data`,
`article`, `code`, or `site` (rendered as Demo, Data & method, Article, Code,
and Project page). The Trading Reflections card links its latest published
entry automatically through `latest_entries_from: trading_reflections`. The
Projects page explains the tags in a legend that is hidden on phones. The
homepage cards use the same tags through `status` and `resource_kind` in
`_pages/about.md`. Homepage email addresses break only between the mailbox
and the `AT …` domain part. On phones the portrait sits beside the contact
details so the project cards begin within the first screen.

`assets/js/quant-hero.js` draws a decorative canvas behind `.quant-hero` and
`.post-header`. The homepage hero reserves a strip below its content for a
seeded, simulated mean-reverting path with jumps, labeled **Simulated Lévy–OU
path**, over a Vietoris–Rips complex of drifting points whose distance
threshold breathes like a filtration. Page headers set `data-backdrop` in
`_layouts/page.liquid`. Listing pages (News, Publications, Projects, CV) show a
rotating wireframe torus with its meridian and longitude generators
highlighted. Project, resource, and reflection pages show the path. The script
measures where header text ends and draws only to its right. When a long
subtitle leaves no room, the path becomes a thin trace along the header's
bottom edge. Jumps and one-sample spikes on the path fire short spark bursts
with a vertical flash and an expanding ring, and spike tips carry a small
glint. Rips vertices twinkle, and a spark with a fading tail travels along each
torus generator. A warm secondary color, `--global-spark-color`, is used
only in these animations: most jump sparks, the jump flash, one generator
spark, and some twinkles. Ambient glints also twinkle around the path. The
homepage label sits on a small solid backing so the path never obscures it.
Header drawings are omitted below 600 pixels. Header subtitles on
News, Projects, and Publications use Title Case.
The canvas is `aria-hidden`, follows the theme switch, pauses when off-screen
or in a hidden tab, renders a static frame for `prefers-reduced-motion`, and is
hidden in print. Cards and hero content use short entrance and hover motion,
also disabled for reduced motion. Every Jekyll page has a **Skip to content**
link. The active navigation item has an underline marker, and body links in
articles are underlined. Text contrast meets WCAG AA in both themes. The
standalone Lévy pages begin their breadcrumb with **Rexy Miao**, which links to
the homepage.

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
three Penn Pendergrass posters, and the 2024 and 2026 ISFTD posters. The 2024
entry records attendance in Amsterdam and the program's listing of the user as
presenting author of Poster P159. Label the accepted 2026 ISFTD poster by its
program status. Use `date_label` for entries
with only month-level precision. The date in their front matter sorts the
entry by month. The American Journal of Artificial Intelligence reviewer
appointment is listed on November 24, 2026, with a term through November 24,
2029, and a link to the publisher's public reviewer roster.

The 2026-11-27 quantitative project update covers the verified daily market-news
email test, the local options-positioning prototype and research plan, and Alpha
Lab's beta comparison, local five-minute backtest, and data-workflow page.

## Invited peer review

The About and CV pages use the same official journal or publisher links in
their peer review sections. About highlights available Journal Impact Factors
(JIF) and review counts and links to `/cv/#peer-review`. The homepage lists the
American Journal of Artificial Intelligence peer reviewer role. The CV shows
its dates as November 24, 2026 to November 24, 2029. News describes the
appointment term. This entry carries no review count.
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

Project cards link to their overview and expose shortcuts to selected resources
from the card's `resources` front matter. The breadcrumb shows Projects, the
category, the project, and the current resource or article when applicable.
Category crumbs link to the existing section anchors. Jekyll resource pages set
`project_parent` to their overview URL. Trading Reflections entries inherit it
from their collection. The standalone Lévy lab and methodology show the same
hierarchy in their own bilingual navigation.

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
stay out of the generated archive and article pages. The user's first approved personal entry is
_一笔标普 500 Put 对冲的仓位复盘_, dated November 26, 2026, at
`/projects/trading-reflections/2026-11-26-sp500-put-hedge/`.

Trading Reflections are English-first. A bilingual entry sets English `title`
and `description` plus `title_zh` and `description_zh`, and wraps each body in
`<div class="reflection-body" data-lang="en|zh" markdown="1">` with the Chinese
block `hidden`. The layout then shows an **English / 中文** switch beside the
date. It swaps the body, title, summary, and tab title, and remembers the
choice under `reflection-lang`. The first entry now has the English title
_Position Review of an S&P 500 Put Hedge_ over the user's original Chinese
text. The user approved the English translation as written on 2026-11-27.
Future bilingual entries need the same review of the English before
publication.

PCR Market Watch links to its public overview, personal source repository,
latest release, English-default README/user guide, and separate Chinese README.
Alpha Lab is a quantitative trading system in development. The homepage links
to its project page and describes signal capture, manual trading decisions,
human-approved simulated execution, and fully automated simulated execution.
The project page links to the public project repository, Alpha Training Lab
teaching guide, and Hugging Face research demo. Describe backtest results as
simulated and verify any claims about live executions or investment returns.

The Alpha Lab card on `/projects/` exposes separate **Launch Research Lab**
(<https://rexymiao-alpha-trading-lab.hf.space/>) and **Hugging Face Project**
(<https://huggingface.co/spaces/Rexymiao/alpha-trading-lab>) shortcuts, alongside
its data-workflow resource. The overview at `/projects/alpha-lab/` repeats both
links and explains their roles. These are two entrypoints to the same research
application: the standalone URL opens the interface directly, while the project
page also provides the Space's files and deployment information.

The homepage and Alpha Lab project page link to Data Sources & Research Workflow
at `/projects/alpha-lab/data-workflow/`. It documents source status, coverage,
adjustments, cleaning, point-in-time availability, and held-out comparisons.
The published S&P 500 put article is available in Trading Reflections.

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
