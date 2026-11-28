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

<div class="project-launch">
  <a class="project-launch-primary" href="https://alphalab.levyquant.ai/">Launch Research Lab <span aria-hidden="true">↗</span></a>
  <div class="project-launch-meta">
    <span class="project-launch-url">alphalab.levyquant.ai</span>
    <span class="project-launch-links">
      <a class="project-launch-secondary" href="https://alphalab.levyquant.ai/?view=guide">Training Guide</a>
      <a class="project-launch-secondary" href="https://huggingface.co/spaces/Rexymiao/alpha-trading-lab">Hugging Face project</a>
      <a class="project-launch-secondary" href="https://github.com/Rexmiao/alpha-trading-lab">Source code</a>
    </span>
  </div>
</div>

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

## Training Guide

The Training Guide is part of the Research Lab. It explains the workflow through an animated training sequence, interactive EWMA and allocation examples, and mathematical notes, in English with a Chinese switch. Its examples use illustrative values. Open it from the lab's top bar or directly.

[Open the Training Guide](https://alphalab.levyquant.ai/?view=guide) · [Launch Research Lab](https://alphalab.levyquant.ai/) · [Hugging Face project](https://huggingface.co/spaces/Rexymiao/alpha-trading-lab) · [Browse the public project repository](https://github.com/Rexmiao/alpha-trading-lab)

Launch Research Lab opens the research interface directly. The Hugging Face project page also provides the app, source files, and deployment information.

[All projects]({{ '/projects/' | relative_url }})
