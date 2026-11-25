---
layout: page
title: Quick Annotator
permalink: /projects/quick-annotator/
description: Published research software for deep-learning-assisted annotation of digital pathology images.
category: Research Software
importance: 1
portfolio: runtian
---

**Status:** Open-source research software with a peer-reviewed publication in 2021.

Developed Quick Annotator during my research at Case Western Reserve University. The platform helps researchers annotate regions of interest in digital pathology whole-slide images, including nuclei, tubules, lymphocytes, and tumor cells.

### Approach and contribution

A U-Net-based model learns from annotations while the user works in a browser interface. Users review predicted regions, accept useful suggestions, and correct errors to guide subsequent model updates. This iterative workflow supports the creation of annotated datasets for downstream image analysis.

My development work used Python, JavaScript, and SQL. The project connects image segmentation, model training, and interactive annotation in a research software workflow.

### Publication and code

Miao, R., Toth, R., Zhou, Y., Madabhushi, A., and Janowczyk, A. (2021). _Quick Annotator: An open-source digital pathology based rapid image annotation tool._ The Journal of Pathology: Clinical Research, 7(6), 542–547.

[Journal article](https://doi.org/10.1002/cjp2.229) · [Preprint](https://arxiv.org/abs/2101.02183) · [Personal GitHub repository](https://github.com/Rexmiao/QuickAnnotator)

[All projects]({{ '/projects/' | relative_url }})
