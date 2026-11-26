# Lévy Volatility Lab

**English** · [简体中文](README.zh-CN.md)

This experiment fits a Lévy-driven Ornstein–Uhlenbeck model to a volatility proxy built from daily USD/JPY exchange rates. The interactive page shows when the fit was made, compares three forecasts on held-out observations, and simulates how variance can decay between positive jumps.

## Run locally

Use Python 3.10 or later. From this directory, run:

```powershell
python scripts/model.py
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/`. The first command rebuilds `data/results.json` from the included `data/observations.csv`. The browser reads the same results file when the page is published on GitHub Pages.

## Data and model

The [data sources and cleaning page](data-methodology/) documents how the FX and equity snapshots were obtained, cleaned, and turned into evaluation targets.

The Federal Reserve Board's H.10 series reports Japanese yen per U.S. dollar at the New York noon buying rate. Each proxy observation annualizes the mean squared log change across the most recent five observed changes by multiplying by 252. See [data and reproducibility notes](data/DATA.md).

The model lets annualized variance decay at rate λ between positive exponential jumps. The jumps arrive according to a homogeneous Poisson process. The stationary variance distribution is Gamma, with shape k and scale θ. Its mean is m = kθ, and the jump rate is λk. Calibrate the stationary moments and one-step persistence on the first 80% of the sample. On the remaining observations, update the input state at each forecast origin while keeping the fitted parameters fixed.

At horizon h, the conditional expected variance is m + (Vₜ − m) exp(−λh). Forecast comparisons use this conditional mean, the EWMA estimate with decay 0.94, and the last observed proxy. All three models target the trailing-five-change proxy ending at the same future observation. Results include QLIKE on variance and RMSE on annualized volatility. Smaller scores indicate better performance on this sample.

The one-observation target shares four returns with the origin's proxy. Five- and 22-observation targets use disjoint return windows from the originating proxy, though consecutive evaluation targets still overlap. The model treats the proxy as its current variance state. Narrow intervals can miss observed moves when a large past return drops out of the five-return window. A mean-reverting AR(1) with the same mean and persistence has the same point forecast. Use the interval coverage to assess the jump distribution.

## U.S. equity forecast comparison

The same page has a U.S. equity section with aggregate out-of-sample results for SPY, NVDA, JPM, AMD, QQQ, AVGO, MU, SNDK, and NBIS. It compares fixed training mean, EWMA, HAR, and Gamma–OU forecasts of the annualized average daily variance over the next 1, 5, or 22 trading sessions. The daily comparison also includes GARCH.

The daily target uses squared adjusted close-to-close log returns. The minute-derived target combines regular-session realized variance from five-minute samples of one-minute bars with squared adjusted overnight log returns. The seven long-history tickers share 527 eligible forecast origins for daily evaluation and 190 for minute-derived evaluation. NBIS has 85 origins in a separate daily evaluation. The other views for NBIS and SNDK report insufficient samples. Sample dates can differ by target because the minute-derived evaluation requires complete aligned windows across the seven long-history tickers.

QLIKE is shown as a loss difference from the fixed training mean on the same origins. A negative difference indicates lower loss. RMSE is measured in annualized volatility percentage points. Use scores to compare models for the selected target, ticker, and horizon.

See the [equity findings](index.html#equity-findings) for the count of per-ticker winners by target and horizon and for the cases where Gamma–OU beats both HAR and EWMA. The ranking uses full-precision scores. A pairwise lead over both models can occur while another model scores lower. The short NBIS daily evaluation has its own forecast origins. These are point forecast scores for the historical samples.

The browser reads the [aggregate results](data/equity-results.json). To rebuild them from the original benchmark outputs, run this command with the path to the local equity study results:

```powershell
python scripts/export_equity_results.py "<path-to-equity-study>/results"
```

The benchmark files and raw market data are retained in the local project at `D:\Dropbox\量化反思总结\Levy波动率建模\equity-study`.

## Equity cleaning audit

The [interactive audit](data-methodology/#cleaning-audit) reports source counts, accepted observations, and dated exclusions for each equity. Daily coverage and return counts are measured in exchange sessions. Minute counts distinguish source bars, regular-session bars, five-minute bins, and days with usable variance. The audit tracks cleaning decisions separately from the contiguous windows used in model evaluation.

With the local equity-study inputs and dependencies in place, regenerate the [audit data](data/equity-cleaning.json) from this directory:

```powershell
python scripts/export_equity_cleaning.py "<path-to-equity-study>"
```

## References

- Federal Reserve Board, H.10 historical USD/JPY rates. [Source series](https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm)
- Barndorff-Nielsen and Shephard (2001), _Non-Gaussian Ornstein–Uhlenbeck-based models and some of their uses in financial economics_. [Oxford Research Archive](https://ora.ox.ac.uk/objects/uuid:19a83a30-f460-4c6e-8cb9-f59da3016c56)
- Patton (2011), _Volatility forecast comparison using imperfect volatility proxies_. [Paper](https://public.econ.duke.edu/~ap172/Patton_vol_proxies_JoE_2011.pdf)
