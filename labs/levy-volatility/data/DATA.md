# USD/JPY realized variance proxy

The Federal Reserve Board’s H.10 release provides daily noon buying rates in New York for Japanese yen per U.S. dollar. This snapshot uses the November 23, 2026 release and ends on November 20, 2026, its latest observation. The sample contains 2,720 observations from January 4, 2016 through November 20, 2026. The FRED series identifier is `DEXJPUS`. [Federal Reserve Board source table](https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm)

The Board makes its information available in the public domain unless otherwise indicated. Cite the Board of Governors of the Federal Reserve System, H.10 Foreign Exchange Rates, Historical Rates for the Japanese Yen. [Federal Reserve Board terms](https://www.federalreserve.gov/disclaimer.htm)

## Columns

| Column       | Meaning                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `date`       | Date of the published fix, in `YYYY-MM-DD` format                                              |
| `usd_jpy`    | Japanese yen per U.S. dollar                                                                   |
| `log_return` | Natural logarithm of the ratio of the current fix to the previous available fix                |
| `variance`   | 252 times the mean of the latest five squared log returns, in annualized decimal-squared units |

For FX fixes \(S*t\), the daily log change is \(r_t=\log(S_t/S*{t-1})\). The modeling target is \(v*t=\frac{252}{5}\sum*{i=0}^4 r\_{t-i}^2\). The charts express the corresponding annualized volatility as \(100\sqrt{v_t}\) percent. The first observation uses five fixes from December 2015 listed in `source.json`. Missing source values marked `ND` are skipped. Calendar gaps therefore advance by one forecast step per published fix, and an unchanged fix retains a zero log return.

This proxy measures variation between once-daily reference fixes. It omits intraday price movements and does not measure option-implied volatility. Successive proxy values share four squared changes. A one-step forecast inherits part of the target window, so the five- and twenty-two-step results also matter when comparing models.

## Reproduce the snapshot

Run `python scripts/fetch_data.py` from the repository root. The script uses the Python standard library. It reads the official source table and applies the fixed sample dates and calculation above. To use a saved source page, add `--html path/to/h10-table.html`.

Compare the generated CSV checksum with `observationsSha256` in `source.json`. The Board can revise historical rates, so a later fetch may differ from this stored snapshot. The model can run from the included CSV without a network request.
