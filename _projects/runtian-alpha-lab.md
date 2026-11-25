---
layout: page
title: Alpha Lab
permalink: /projects/alpha-lab/
description: A local AI alpha research prototype with Alpha Training Lab, a public bilingual guide to the research workflow.
category: Quantitative Research
importance: 2
portfolio: runtian
---

**Status:** Local research prototype with a separate public teaching demonstration.

Alpha Lab investigates a daily U.S. equity research workflow: historical market data, factor prediction, portfolio risk constraints, and simulated order drafts. It compares Ridge regression and multilayer perceptrons with resampling and conditional DDPM data augmentation. A separate experiment studies an ADNN-inspired smooth information-coefficient objective.

### Research methods

- Chronological training, validation, and test splits, with labels crossing split boundaries removed.
- Held-out rank information coefficients alongside simulated portfolio results.
- EWMA covariance estimates, volatility-aware allocation, single-stock limits, and cash allocation.
- Next-open execution assumptions, transaction costs, and integer-share simulated order drafts.

These are research experiments and selected paper mechanisms. The local Python application has no public source-code release linked here.

### Alpha Training Lab

The companion Chinese and English teaching website explains the workflow through an animated training sequence, interactive EWMA and allocation examples, and mathematical notes. Its examples use illustrative values and run independently of the local research application.

[Open the public training guide](https://alpha-training-lab-guide.totalbluebell3.chatgpt.site)

[All projects]({{ '/projects/' | relative_url }})
