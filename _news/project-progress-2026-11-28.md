---
layout: post
title: "Project Progress: A Trading System, New Domains, and a Daily Briefing"
date: 2026-11-28 00:00:00-0500
inline: false
related_posts: false
description: A progress report across the LévyQuant Trading System, the personal site, LévyQuant Daily, Alpha Lab, PCR Market Watch, and the Lévy Volatility Lab.
---

Today I released the open-source LévyQuant Trading System, moved my projects onto a shared `levyquant.ai` domain, added the LévyQuant Daily Briefing to the portfolio, and gave each project app a consistent day/night display.

### LévyQuant Trading System

- Released [the LévyQuant Trading System]({{ '/projects/levyquant-trading/' | relative_url }}) as an open-source repository under the MIT license. It is a local trading back end for U.S. stocks that runs on your own computer against a moomoo paper account. It captures 5-minute bars, produces signals, applies limits you set yourself, sends orders, and reconciles every order with the broker, in alert-only, confirm-before-send, or fully automatic mode.
- **Status:** Paper trading only. Live trading is not implemented. Early stage: most behavior is verified by offline tests, not yet on the real service.

### Personal Site

- The site now lives at [rexy.levyquant.ai](https://rexy.levyquant.ai/). Old `rexmiao.github.io` links, including project pages, redirect automatically.
- The homepage now shows the Trading System beside Alpha Lab.
- Added the [LévyQuant Daily Briefing]({{ '/projects/levyquant-daily/' | relative_url }}) to Projects as a pilot, with a direct link to the briefing site and an animated diagram of its pipeline from selected public sources through LLM editing and translation to email.
- Demo links now use the new project domains: [Lévy Volatility Lab](https://volatility.levyquant.ai/) and [Alpha Lab](https://alphalab.levyquant.ai/).
- Published two bilingual [Trading Reflections]({{ '/projects/trading-reflections/' | relative_url }}): a framework for using GEX and Max Pain across indices and expirations, and a review of QQQ and SPY 0DTE trades on November 27.
- Long formulas in reflections no longer widen the page on phones.

### LévyQuant Daily Briefing

- The briefing site moved to [daily.levyquant.ai](https://daily.levyquant.ai/), and the brand is now written LévyQuant.
- Added a day/night switch, with day mode as the default.
- Delivery is more efficient and more careful near the sending limit: batched delivery records, one mail login per run, and an admin warning as the recipient list approaches its cap.
- Confirmation and unsubscribe emails are moving to the new domain.

### Alpha Lab

- The research interface is now at [alphalab.levyquant.ai](https://alphalab.levyquant.ai/).
- Releases 0.12.5 to 0.12.7 added a day/night toggle in the header, with day mode as the default.

### PCR Market Watch

- Releases v0.2.19 to v0.2.21 added a dark theme, a PCR snapshot strip, a refreshed summary table, and a day/night display mode, and prepared the app for a custom domain.

### Lévy Volatility Lab

- The Hugging Face demo is now served at [volatility.levyquant.ai](https://volatility.levyquant.ai/) and was republished from the site's source.

[All projects]({{ '/projects/' | relative_url }}) · [All news]({{ '/news/' | relative_url }})
