---
layout: page
title: Lévy Quant Trading System
permalink: /projects/levyquant-trading/
description: An open-source, local trading back end for U.S. stocks that runs on your own computer against a moomoo paper account.
category: Trading
importance: 0
portfolio: runtian
status: New · Paper trading
resources:
  - title: Source Code
    kind: code
    url: https://github.com/Rexmiao/levyquant-trading
---

**Status:** Paper trading only. Live trading is not implemented. Early stage: most behavior is verified by offline tests, not yet on the real service.

<div class="project-launch">
  <a class="project-launch-primary" href="https://github.com/Rexmiao/levyquant-trading">View the Trading System on GitHub <span aria-hidden="true">↗</span></a>
  <div class="project-launch-meta">
    <span class="project-launch-url">github.com/Rexmiao/levyquant-trading</span>
    <span class="project-launch-links">
      <a class="project-launch-secondary" href="https://github.com/Rexmiao/levyquant-trading#set-up">English README &amp; setup</a>
      <a class="project-launch-secondary" href="https://github.com/Rexmiao/levyquant-trading/blob/main/README.zh-CN.md">简体中文说明</a>
    </span>
  </div>
</div>

A local trading back end for U.S. stocks that runs on your own computer against a moomoo paper account. It captures 5-minute bars, produces signals, applies limits you set, sends orders, and reconciles each one with the broker. Accounts, ledgers, and credentials stay on your machine.

### What It Looks Like

The system runs in a terminal; there is no graphical interface. This is the included offline demo, which runs the full order loop against a fake broker with generated market data:

<figure class="terminal-shot">
  <div class="terminal-bar" aria-hidden="true"><span></span><span></span><span></span><b>PowerShell</b></div>
<pre><code><span class="t-prompt">PS&gt;</span> python -m trading_system.demo
{
  "scenario": "OFFLINE_FAKE_BROKER",
  "status": "PASS_OFFLINE",
  "real_broker_requests": 0,
  "framework": "VeighNa MainEngine + OmsEngine + BaseGateway",
  "counts": { "signals": 3, "order_routes": 2, "cancel_routes": 1,
              "stale_quote_rejections": 1, "restart_new_posts": 0 },
  "checks": {
    "signal_routes_through_mainengine": <span class="t-ok">true</span>,
    "same_bar_is_idempotent": <span class="t-ok">true</span>,
    "cancel_terminal_reconciled": <span class="t-ok">true</span>,
    "cumulative_fill_reconciled": <span class="t-ok">true</span>,
    "stale_quote_rejected_before_order": <span class="t-ok">true</span>,
    "restart_reconciliation_does_not_resubmit": <span class="t-ok">true</span>,
    "submit_and_cancel_durable_before_rpc": <span class="t-ok">true</span>,
    <span class="t-dim">… 7 more checks, all true</span>
  }
}</code></pre>
  <figcaption>Offline demo output (trimmed). Fake broker and generated data; no real orders.</figcaption>
</figure>

### Highlights

- **Three modes:** alert only, confirm before send, or fully automatic.
- **Order tickets:** limit, stop, stop-limit, and trailing stops. Stops are synthetic, so they work only while the program runs.
- **Safety first:** your own limits, a local journal written before each order, and no order sent twice.

Open source under the MIT license. Not affiliated with moomoo, Futu, or VeighNa. For learning and research only; not investment advice.

[All projects]({{ '/projects/' | relative_url }})
