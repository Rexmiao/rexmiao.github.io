---
layout: page
title: Alpha Lab
permalink: /projects/alpha-lab/
description: A quantitative trading system in development, with signal capture, manual trading decisions, and simulated execution workflows.
category: Quantitative Research
importance: 2
portfolio: runtian
status: In development
resources:
  - title: Launch Research Lab
    kind: demo
    url: https://alphalab.levyquant.ai/
  - title: Hugging Face Project
    kind: site
    url: https://huggingface.co/spaces/Rexymiao/alpha-trading-lab
  - title: Data Sources and Research Workflow
    kind: data
    url: /projects/alpha-lab/data-workflow/
---

**In development.** Alpha Lab collects market data, records trading signals, and generates order proposals subject to risk checks. The local execution prototype is tested with historical replay and simulated orders.

[Data Sources & Research Workflow]({{ '/projects/alpha-lab/data-workflow/' | relative_url }}) explains how I source, clean, and test market data.

## Trading Workflows

- **Manual trading.** Review signal alerts and decide whether to act.
- **Semi-automated execution.** Review and approve proposed orders before simulated submission.
- **Fully automated execution.** Process eligible proposals through simulated submission and reconciliation without approval for each order.

## Research Methods

Alpha Lab investigates a daily U.S. equity research workflow: historical market data, factor prediction, portfolio risk constraints, and simulated order drafts. It compares Ridge regression and multilayer perceptrons with resampling and conditional DDPM data augmentation. A separate experiment studies an ADNN-inspired smooth information-coefficient objective.

- Chronological training, validation, and test splits, with labels crossing split boundaries removed.
- Held-out rank information coefficients alongside simulated portfolio results.
- EWMA covariance estimates, volatility-aware allocation, single-stock limits, and cash allocation.
- Next-open execution assumptions, transaction costs, and integer-share simulated order drafts.

I use these experiments to study how signals and portfolio decisions perform after simulated trading costs.

## Alpha Training Lab

The companion Chinese and English teaching website explains the workflow through an animated training sequence, interactive EWMA and allocation examples, and mathematical notes. Its examples use illustrative values and run independently of the local research application.

[Open the public training guide](https://alpha-training-lab-guide.totalbluebell3.chatgpt.site) · [Launch Research Lab](https://alphalab.levyquant.ai/) · [Hugging Face project](https://huggingface.co/spaces/Rexymiao/alpha-trading-lab) · [Browse the public project repository](https://github.com/Rexmiao/alpha-trading-lab)

Launch Research Lab opens the research interface directly. The Hugging Face project page also provides the app, source files, and deployment information.

[All projects]({{ '/projects/' | relative_url }})
