---
layout: page
title: LévyQuant Daily Briefing
permalink: /projects/levyquant-daily/
description: An automated, bilingual morning briefing on U.S. macro, equities, and quantitative research, assembled from public sources and reviewed before publication.
category: Quantitative Research
importance: 4
portfolio: runtian
status: Pilot
resources:
  - title: Briefing Site
    kind: site
    url: https://daily.levyquant.ai/
  - title: Source Code
    kind: code
    url: https://github.com/Rexmiao/levyquant-digest
---

**Status:** Pilot. The briefing site, archive, and email subscription are online.

<div class="project-launch">
  <a class="project-launch-primary" href="https://daily.levyquant.ai/">Read the LévyQuant Daily Briefing <span aria-hidden="true">↗</span></a>
  <div class="project-launch-meta">
    <span class="project-launch-url">daily.levyquant.ai</span>
    <a class="project-launch-secondary" href="https://daily.levyquant.ai/archive">Browse past editions</a>
  </div>
</div>

LévyQuant Daily is a morning briefing on U.S. macro and policy, U.S. companies and sectors, and new quantitative research. Its goal is to help readers keep up with recent quantitative ideas and the macro news that moves markets, so they can make better-informed trading decisions.

**This is not original research.** Each edition is collected automatically from public sources, edited and translated with AI, and reviewed by me before it is published. Every item links to its original source. The briefing is for information only and is not investment advice.

### How Each Edition Is Made

- **Collection:** GitHub Actions starts the pipeline every morning at 07:00 New York time. It gathers headlines from public news feeds, Moomoo's public news search, media and podcast summaries, and research abstracts.
- **Editing and translation:** An AI model selects and summarizes the items. Each edition has a full English version followed by a matching Simplified Chinese version, with the same items, sources, and times. Numbers, exact dates, and market calls without supporting evidence are left out.
- **Review and publication:** I check each edition in a private preview before publishing it to the site. Published editions are frozen and are not rewritten.
- **Delivery:** Subscribers receive one email per day. Times are shown in New York time.

### Subscription and Privacy

Subscribing requires confirming the address from a confirmation email. Every issue has an unsubscribe link. Subscriber addresses are never shown publicly, and delivery records are stored encrypted. The archive can be browsed by date and searched by month.

[Read the briefing](https://daily.levyquant.ai/) · [Browse the archive](https://daily.levyquant.ai/archive) · [Source code](https://github.com/Rexmiao/levyquant-digest) · [简体中文说明](https://github.com/Rexmiao/levyquant-digest/blob/main/README.zh-CN.md)

[All projects]({{ '/projects/' | relative_url }})
