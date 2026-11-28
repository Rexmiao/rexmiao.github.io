---
layout: page
title: Data Sources & Research Workflow
permalink: /projects/alpha-lab/data-workflow/
project_parent: /projects/alpha-lab/
layer: Data & method · Alpha Lab
description: How I turn a research idea into a test, document the data, and decide whether the result can inform a trading decision.
---

[Research Questions](#research-questions) · [Data Sources](#data-sources) · [Cleaning Rules](#cleaning-rules) · [Testing Usefulness](#testing-usefulness)

## Research Questions

I start with an observation from a trade review, a company filing, industry news, or a market move. Before collecting data, I write down the decision it could change, when I would need the information, and what would count as an improvement. For example, I could test whether a liquidity filter reduces simulated trading costs for a daily equity signal.

## Data Sources

### Used in Alpha Lab

- **Moomoo historical U.S. equity bars.** Fixed snapshots use adjusted daily bars and separate, unadjusted five-minute bars. Both contain open, high, low, close, and volume (OHLCV), with SPY as a benchmark where applicable. I record the collection time, coverage, adjustment method, and file checksum for repeat runs. Access to the raw snapshots follows the provider's permissions. [Moomoo historical candlestick documentation](https://openapi.moomoo.com/moomoo-api-doc/en/quote/request-history-kline.html)
- **Yahoo Finance daily history.** The online research app can fetch daily U.S. stock and ETF bars. It scales open, high, low, and close by the ratio of adjusted close to close, keeps the reported volume, and records coverage and retrieval time. The app supports exporting the online snapshot with its source metadata. [Yahoo adjusted-close documentation](https://help.yahoo.com/kb/SLN28256.html)
- **Uploaded OHLCV CSVs and teaching data.** The app validates a daily CSV supplied by a visitor and identifies it as an upload. Synthetic teaching data are labeled and selected explicitly. Source and coverage are shown with each run so a reader can tell which data produced the results.

### Under Evaluation

- **Company disclosures.** EDGAR provides filing histories and structured financial statement data. I would match the time a filing became public to the earliest decision that could use it. [SEC Financial Statement Data Sets on Data.gov](https://catalog.data.gov/dataset/financial-statement-data-sets)
- **Macroeconomic releases.** ALFRED preserves historical versions of economic series. I would pair the relevant vintage with the release timestamp when testing a signal that reacts within a trading day. [Federal Reserve data downloads and vintage access](https://www.federalreserve.gov/data/data-download-fred-information.htm)
- **Historical option quotes.** Cboe's interval data include timestamped bid and ask quotes and displayed size. I would check contract coverage and data access first, then align quotes with underlying prices and the time of the decision being tested. [Cboe Option Quotes](https://datashop.cboe.com/option-quote-intervals)

## Cleaning Rules

1. **Check the records.** Validate identifiers, trading dates or timestamps, finite positive prices, OHLC consistency, and nonnegative volume. Check for duplicate symbol and time pairs and report any gaps against the expected trading sessions.
2. **Align the trading calendar.** Use completed bars and, for the five-minute studies, regular U.S. trading hours. Keep unavailable observations missing, including dates before a listing. Exclude windows that need an unavailable input and record the reason.
3. **Record adjustments and cross-check anomalies.** Keep each provider's price adjustment convention with its snapshot. Investigate unusually large moves against another source and known corporate actions. Preserve source coverage, retrieval times, and any exclusions with the run results.
4. **Track when information became available.** For a price bar, distinguish its timestamp from when it was complete. For an event, record the public release time and any delivery delay. This determines which observations qualify for a historical decision.

For an example of a published audit with daily and intraday coverage, see the [Lévy Volatility Lab data methodology]({{ '/labs/levy-volatility/data-methodology/' | relative_url }}).

One daily snapshot covered 400 completed SPY sessions from April 24, 2025 to November 24, 2026. In the audit, six closes around three unusually large moves agreed with Yahoo Finance to the cent. The spot check supported retaining those observations.

## Testing Usefulness

Compare the rule with the new input to the same rule with its existing inputs, on the same held-out dates. Keep training, validation, and testing in time order, and remove training labels whose outcome windows cross the split. Model fills using prices that could be available after the decision and include bid–ask spreads and fees where applicable.

Judge the result against the decision named in advance. For a liquidity filter, I would compare simulated costs and the share of signals that remain eligible for execution across market conditions. If the filter helps on the held-out sample, it can first be shown as an alert, then evaluated in the human-confirmed and automated simulation workflows.
