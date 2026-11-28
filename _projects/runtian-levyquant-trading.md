---
layout: page
title: LévyQuant Trading System
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
    <a class="project-launch-secondary" href="https://github.com/Rexmiao/levyquant-trading/blob/main/README.zh-CN.md">简体中文说明</a>
  </div>
</div>

The LévyQuant Trading System is a local trading back end for U.S. stocks. It runs on your own computer and connects to a moomoo paper (simulated) account. It captures 5-minute bars, produces signals, applies limits you set yourself, sends orders, and reconciles every order with the broker. The code, specification, and validation record are public, so anyone can set up the same system with their own paper account. Accounts, ledgers, market data, and credentials stay on the user's machine.

### What It Does

- **Three ways to run:** alert only, confirm before send, or fully automatic, all on the same strategy engine.
- **Order tickets:** limit, stop, stop-limit, and trailing stops for orders you decide yourself.
- **Your limits:** shares per order, dollars per buy order, and the number of working orders come from a file you write. Strategy orders also keep position size and cash within fixed shares of account equity.
- **Journal first:** each order is written to a local ledger before it is sent, nothing is sent twice, and an order with an unknown outcome blocks further sending until it is reconciled.
- **End of day:** while it is running, it cancels its own unfilled orders shortly before the close and writes a daily report.

### Current Limits

- Stops and trailing stops are synthetic: the program watches quotes and sends a limit order when a trigger fires, so they offer no protection while it is not running.
- Signals come from completed 5-minute bars, so it suits minute-level and slower strategies.
- One strategy is included, a 5-minute intraday momentum rule. Options, short selling, and bracket orders are not available yet.

Open source under the MIT license. Not affiliated with or endorsed by moomoo, Futu, or the VeighNa project. This is software for learning and research, and nothing here is investment advice.

[Source code and setup guide](https://github.com/Rexmiao/levyquant-trading) · [简体中文说明](https://github.com/Rexmiao/levyquant-trading/blob/main/README.zh-CN.md)

[All projects]({{ '/projects/' | relative_url }})
