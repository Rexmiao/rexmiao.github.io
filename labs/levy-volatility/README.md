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

The Federal Reserve Board's H.10 series reports Japanese yen per U.S. dollar at the New York noon buying rate. Each proxy observation annualizes the mean squared log change across the most recent five observed changes by multiplying by 252. See [data and reproducibility notes](data/DATA.md).

The model lets annualized variance decay at rate λ between positive exponential jumps. The jumps arrive according to a homogeneous Poisson process. The stationary variance distribution is Gamma, with shape k and scale θ. Its mean is m = kθ, and the jump rate is λk. Calibrate the stationary moments and one-step persistence on the first 80% of the sample. On the remaining observations, update the input state at each forecast origin while keeping the fitted parameters fixed.

At horizon h, the conditional expected variance is m + (Vₜ − m) exp(−λh). Forecast comparisons use this conditional mean, the EWMA estimate with decay 0.94, and the last observed proxy. All three models target the trailing-five-change proxy ending at the same future observation. Results include QLIKE on variance and RMSE on annualized volatility. Smaller scores indicate better performance on this sample.

The one-observation target shares four returns with the origin's proxy. Five- and 22-observation targets use disjoint return windows from the originating proxy, though consecutive evaluation targets still overlap. The model treats the proxy as its current variance state. Narrow intervals can miss observed moves when a large past return drops out of the five-return window. A mean-reverting AR(1) with the same mean and persistence has the same point forecast. Use the interval coverage to assess the jump distribution.

## References

- Federal Reserve Board, H.10 historical USD/JPY rates. [Source series](https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm)
- Barndorff-Nielsen and Shephard (2001), _Non-Gaussian Ornstein–Uhlenbeck-based models and some of their uses in financial economics_. [Oxford Research Archive](https://ora.ox.ac.uk/objects/uuid:19a83a30-f460-4c6e-8cb9-f59da3016c56)
- Patton (2011), _Volatility forecast comparison using imperfect volatility proxies_. [Paper](https://public.econ.duke.edu/~ap172/Patton_vol_proxies_JoE_2011.pdf)
