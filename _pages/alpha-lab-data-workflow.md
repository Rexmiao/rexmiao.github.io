---
layout: page
title: Data Sources & Research Workflow
permalink: /projects/alpha-lab/data-workflow/
description: How I turn a research idea into a test, document the data, and decide whether the result can inform a trading decision.
---

[Back to Alpha Lab]({{ '/projects/alpha-lab/' | relative_url }})

[Research questions](#research-questions) · [Data sources](#data-sources) · [Cleaning rules](#cleaning-rules) · [Testing usefulness](#testing-usefulness) · [S&P 500 put hedge](#sp-500-put-hedge)

## Research questions

I start with an observation from a trade review, a company filing, industry news, or a market move. Before collecting data, I write down the decision it could change, when I would need the information, and what would count as an improvement. An observation can become a hypothesis such as “Would a portfolio stress check have flagged an underhedged position before I took profit on part of my put hedge?”

## Data sources

### Used in Alpha Lab

- **Moomoo historical U.S. equity bars.** Fixed snapshots use adjusted daily bars and separate, unadjusted five-minute bars. Both contain open, high, low, close, and volume (OHLCV), with SPY as a benchmark where applicable. I record the collection time, coverage, adjustment method, and file checksum for repeat runs. Access to the raw snapshots follows the provider's permissions. [Moomoo historical candlestick documentation](https://openapi.moomoo.com/moomoo-api-doc/en/quote/request-history-kline.html)
- **Yahoo Finance daily history.** The online research app can fetch daily U.S. stock and ETF bars. It scales open, high, low, and close by the ratio of adjusted close to close, keeps the reported volume, and records coverage and retrieval time. The app supports exporting the online snapshot with its source metadata. [Yahoo adjusted-close documentation](https://help.yahoo.com/kb/SLN28256.html)
- **Uploaded OHLCV CSVs and teaching data.** The app validates a daily CSV supplied by a visitor and identifies it as an upload. Synthetic teaching data are labeled and selected explicitly. Source and coverage are shown with each run so a reader can tell which data produced the results.

### Under evaluation

- **Company disclosures.** EDGAR provides filing histories and structured financial statement data. I would match the time a filing became public to the earliest decision that could use it. [SEC Financial Statement Data Sets on Data.gov](https://catalog.data.gov/dataset/financial-statement-data-sets)
- **Macroeconomic releases.** ALFRED preserves historical versions of economic series. I would pair the relevant vintage with the release timestamp when testing a signal that reacts within a trading day. [St. Louis Fed guide to ALFRED](https://www.stlouisfed.org/open-vault/2021/august/using-the-alfred-database)
- **Historical option quotes.** Cboe's interval data include timestamped bid and ask quotes and displayed size. I would check contract coverage and data access first, then align quotes with underlying prices and the time of the hedge decision. [Cboe Option Quotes](https://datashop.cboe.com/option-quote-intervals)

## Cleaning rules

1. **Check the records.** Validate identifiers, trading dates or timestamps, finite positive prices, OHLC consistency, and nonnegative volume. Check for duplicate symbol and time pairs and report any gaps against the expected trading sessions.
2. **Align the trading calendar.** Use completed bars and, for the five-minute studies, regular U.S. trading hours. Keep unavailable observations missing, including dates before a listing. Exclude windows that need an unavailable input and record the reason.
3. **Record adjustments and cross-check anomalies.** Keep each provider's price adjustment convention with its snapshot. Investigate unusually large moves against another source and known corporate actions. Preserve source coverage, retrieval times, and any exclusions with the run results.
4. **Track when information became available.** For a price bar, distinguish its timestamp from when it was complete. For an event, record the public release time and any delivery delay. This determines which observations qualify for a historical decision.

For an example of a published audit with daily and intraday coverage, see the [Lévy Volatility Lab data methodology]({{ '/labs/levy-volatility/data-methodology/' | relative_url }}).

One daily snapshot covered 400 completed SPY sessions from April 24, 2025 to November 24, 2026. In the audit, six closes around three unusually large moves agreed with Yahoo Finance to the cent. The spot check supported retaining those observations.

## Testing usefulness

Compare the rule with the new input to the same rule with its existing inputs, on the same held-out dates. Keep training, validation, and testing in time order, and remove training labels whose outcome windows cross the split. Model fills using prices that could be available after the decision and include bid–ask spreads and fees where applicable.

Judge the result against the decision named in advance. A hedge check should be judged on residual portfolio loss and hedge cost, including what happens across market conditions. If it helps on the held-out sample, it can first be shown as an alert, then evaluated in the human-confirmed and automated simulation workflows.

## S&P 500 put hedge {#sp-500-put-hedge}

In the trade I wrote about, I sold part of an S&P 500 put hedge after it gained value while keeping the long exposure in place. The remaining puts rose further, yet the hedge gains fell short of the losses on the long positions. At the next partial exit, the question I would want the system to answer is how much portfolio loss the remaining puts could offset if the market fell another **5% or 10%**. [Read the original trading reflection (Chinese)]({{ '/projects/trading-reflections/2026-11-26-sp500-put-hedge/' | relative_url }})

- **Inputs.** At each proposed sale, take a timestamped snapshot of the long positions, quantities and leverage, the underlying price, and the exact put contracts, including strikes, expirations, multipliers, and contemporaneous bid and ask quotes.
- **Comparison.** Set a common horizon and revalue the longs and puts under both market shocks. Test a range of implied-volatility assumptions for the puts. Compare keeping the hedge, selling some puts while keeping long exposure, and selling some puts while also reducing long exposure. Use observed quotes and costs to estimate what each adjustment would require at the decision time.
- **Decision.** Report the estimated loss on the long positions, the offset from the remaining puts, and the residual portfolio loss in each scenario. If the residual loss exceeds the chosen risk budget, flag the proposed sale for review.

**Case status.** The original trade is documented in the reflection. The scenario comparison is a proposed historical replay, with results pending reconstruction of the position snapshots and option quotes.
