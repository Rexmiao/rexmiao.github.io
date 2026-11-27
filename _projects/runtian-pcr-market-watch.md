---
layout: page
title: PCR Market Watch
permalink: /projects/pcr-market-watch/
description: A released, bilingual options dashboard for daily put/call ratios, historical trends, and comparisons.
category: Quantitative Research
importance: 1
portfolio: runtian
---

**Status:** Open-source release with a public project page and a Windows download.

PCR Market Watch (PCR 观察台) helps users explore U.S. options activity across market categories and individual stocks or ETFs. The Chinese and English interface combines daily put/call ratios with longer trends, historical percentiles, and comparisons with the same period in earlier years.

### Methods and features

- Daily, 20-session, and 60-session volume PCR. Rolling ratios divide total put volume by total call volume over the window.
- Historical percentiles calculated from prior observations, with the available sample size shown explicitly.
- Separate source coverage and activity dates for Cboe market categories and OCC symbol reports.
- Editable market references and a separate personal watchlist, supported by local SQLite storage in the downloadable application.

The project page includes interface demonstrations, data definitions, and installation instructions. Its GitHub Pages website presents the project; the full application runs locally with Node.js and Python.

[Project overview](https://rexmiao.github.io/pcr-market-watch/) · [Source code](https://github.com/Rexmiao/pcr-market-watch) · [Download the latest release](https://github.com/Rexmiao/pcr-market-watch/releases/latest)

[README / User guide](https://github.com/Rexmiao/pcr-market-watch#readme) · [简体中文说明](https://github.com/Rexmiao/pcr-market-watch/blob/refs/heads/main/README.zh-CN.md)

[All projects]({{ '/projects/' | relative_url }})
