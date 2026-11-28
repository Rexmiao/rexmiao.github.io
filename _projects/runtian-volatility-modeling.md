---
layout: page
title: Volatility Modeling with Lévy and OU Processes
permalink: /projects/volatility-modeling/
description: Master's research on Lévy and Ornstein–Uhlenbeck models for option pricing, plus the interactive Lévy Volatility Lab for USD/JPY and U.S. equities.
category: Quantitative Research
importance: 3
portfolio: runtian
status: Master's research · Interactive lab
resources:
  - title: Interactive Lab
    kind: demo
    url: /labs/levy-volatility/
  - title: Data Sources and Cleaning
    kind: data
    url: /labs/levy-volatility/data-methodology/
---

**Status:** Master's research at Case Western Reserve University.

<div class="project-launch">
  <a class="project-launch-primary" href="https://volatility.levyquant.ai/">Open the Interactive Lab <span aria-hidden="true">↗</span></a>
  <div class="project-launch-meta">
    <span class="project-launch-url">volatility.levyquant.ai</span>
    <span class="project-launch-links">
      <a class="project-launch-secondary" href="{{ '/labs/levy-volatility/' | relative_url }}">Lab on this site</a>
      <a class="project-launch-secondary" href="{{ '/labs/levy-volatility/data-methodology/' | relative_url }}">Data methodology</a>
    </span>
  </div>
</div>

**Advisor:** [Prof. Wojbor A. Woyczynski](https://pl.wikipedia.org/wiki/Wojbor_A._Woyczy%C5%84ski).

Studied volatility modeling using Lévy processes and Ornstein–Uhlenbeck (OU) models in the context of option pricing. This work forms part of my background in financial mathematics, stochastic modeling, and computational research.

**Methods:** Lévy processes, Ornstein–Uhlenbeck models, and volatility modeling.

## Lévy Volatility Lab

The lab is a new experiment on USD/JPY exchange-rate volatility using daily Federal Reserve H.10 rates. It calibrates a Lévy-driven OU variance process, compares its out-of-sample forecasts with EWMA and persistence, and lets readers inspect simulated volatility intervals at different horizons.

The lab also compares U.S. equity volatility forecasts across nine tickers. Readers can switch between daily and minute-derived variance targets and inspect model scores at 1-, 5-, and 22-session horizons when the evaluation sample is sufficient.

[Open the interactive lab]({{ '/labs/levy-volatility/' | relative_url }}) · [Open the Hugging Face demo](https://volatility.levyquant.ai/)

[Compare U.S. equities]({{ '/labs/levy-volatility/#equity-evaluation' | relative_url }}) · [Data sources and cleaning]({{ '/labs/levy-volatility/data-methodology/' | relative_url }}) · [Browse the lab source on GitHub](https://github.com/Rexmiao/rexmiao.github.io/tree/master/labs/levy-volatility)

[View my CV]({{ '/cv/' | relative_url }}) · [All projects]({{ '/projects/' | relative_url }})
