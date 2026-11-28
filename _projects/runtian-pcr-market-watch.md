---
layout: page
title: PCR Market Watch
permalink: /projects/pcr-market-watch/
description: A released, bilingual options dashboard for daily put/call ratios, historical trends, and comparisons.
category: Quantitative Research
importance: 1
portfolio: runtian
status: Released
resources:
  - title: Live Dashboard
    kind: demo
    url: https://option-chain-watcher.levyquant.ai/
  - title: Project Site
    kind: site
    url: https://rexy.levyquant.ai/pcr-market-watch/
  - title: Source Code
    kind: code
    url: https://github.com/Rexmiao/pcr-market-watch
---

**Status:** Open-source release with a live dashboard, a public project page, and a Windows download.

<div class="project-launch">
  <a class="project-launch-primary" href="https://option-chain-watcher.levyquant.ai/">Open the Live Dashboard <span aria-hidden="true">↗</span></a>
  <div class="project-launch-meta">
    <span class="project-launch-url">option-chain-watcher.levyquant.ai</span>
    <span class="project-launch-links">
      <a class="project-launch-secondary" href="https://github.com/Rexmiao/pcr-market-watch">Source code</a>
      <a class="project-launch-secondary" href="https://github.com/Rexmiao/pcr-market-watch/releases/latest">Latest release</a>
    </span>
  </div>
</div>

PCR Market Watch (PCR 观察台) helps users explore U.S. options activity across market categories and individual stocks or ETFs. The Chinese and English interface combines daily put/call ratios with longer trends, historical percentiles, and comparisons with the same period in earlier years.

### Methods and Features

- Daily, 20-session, and 60-session volume PCR. Rolling ratios divide total put volume by total call volume over the window.
- Historical percentiles calculated from prior observations, with the available sample size shown explicitly.
- Separate source coverage and activity dates for Cboe market categories and OCC symbol reports.
- Editable market references and a separate personal watchlist, supported by local SQLite storage in the downloadable application.

The live dashboard runs on Hugging Face at [option-chain-watcher.levyquant.ai](https://option-chain-watcher.levyquant.ai/). The project page includes interface demonstrations, data definitions, and installation instructions, and the downloadable application runs locally with Node.js and Python.

[Project overview](https://rexy.levyquant.ai/pcr-market-watch/) · [Source code](https://github.com/Rexmiao/pcr-market-watch) · [Download the latest release](https://github.com/Rexmiao/pcr-market-watch/releases/latest)

[README / User guide](https://github.com/Rexmiao/pcr-market-watch#readme) · [简体中文说明](https://github.com/Rexmiao/pcr-market-watch/blob/refs/heads/main/README.zh-CN.md)

[All projects]({{ '/projects/' | relative_url }})
