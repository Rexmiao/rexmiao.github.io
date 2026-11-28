"""Fit a Gamma-OU variance proxy model and generate the static site's data.

The observed proxy is used as the state. The fit is a moment calibration, not
a latent stochastic volatility likelihood fit. Only the standard library is
needed. Run with Python 3.10 or newer.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from statistics import fmean, pvariance


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "data" / "observations.csv"
TRAIN_FRACTION = 0.8
HORIZONS = (1, 5, 22)
EWMA_DECAY = 0.94
PHI_BOUNDS = (0.01, 0.995)
SIMULATIONS = 20_000
SEED = 20261125
QUANTILES = (0.05, 0.25, 0.50, 0.75, 0.95)
QUANTILE_NAMES = ("q05", "q25", "q50", "q75", "q95")
METHODS = ("levy", "ewma", "persistence")


@dataclass(frozen=True)
class GammaOU:
    mean_variance: float
    phi: float
    phi_unconstrained: float
    decay_rate: float
    gamma_shape: float
    gamma_scale: float
    jump_intensity: float

    def forecast(self, initial_variance: float, horizon: int) -> float:
        persistence = self.phi**horizon
        return persistence * initial_variance + (1 - persistence) * self.mean_variance


def read_observations(path: Path) -> tuple[list[str], list[float]]:
    dates, variances = [], []
    with path.open(encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        if not {"date", "variance"}.issubset(reader.fieldnames or []):
            raise ValueError("Input CSV needs date and variance columns")

        for line, row in enumerate(reader, start=2):
            raw_date = row["date"]
            try:
                parsed_date = date.fromisoformat(raw_date)
                variance = float(row["variance"])
            except (ValueError, TypeError) as error:
                raise ValueError(f"Invalid date or variance on line {line}") from error

            if raw_date != parsed_date.isoformat() or (dates and raw_date <= dates[-1]):
                raise ValueError(f"Dates must be ascending, unique YYYY-MM-DD on line {line}")
            if not math.isfinite(variance) or variance <= 0:
                raise ValueError(f"Variance must be finite and positive on line {line}")
            dates.append(raw_date)
            variances.append(variance)

    return dates, variances


def fit_gamma_ou(train: list[float]) -> GammaOU:
    """Match the stationary mean, variance, and centered lag-one slope."""
    mean = fmean(train)
    spread = pvariance(train)
    if spread <= 0:
        raise ValueError("Training variance proxy must vary to fit the Gamma-OU model")

    centered = [value - mean for value in train]
    past, future = centered[:-1], centered[1:]
    phi_raw = math.fsum(x * y for x, y in zip(past, future)) / math.fsum(x * x for x in past)
    phi = min(max(phi_raw, PHI_BOUNDS[0]), PHI_BOUNDS[1])
    decay = -math.log(phi)
    shape = mean**2 / spread
    scale = spread / mean
    return GammaOU(mean, phi, phi_raw, decay, shape, scale, decay * shape)


def sample_quantile(sorted_values: list[float], probability: float) -> float:
    position = probability * (len(sorted_values) - 1)
    lower = math.floor(position)
    upper = math.ceil(position)
    fraction = position - lower
    return sorted_values[lower] + fraction * (sorted_values[upper] - sorted_values[lower])


def simulate_innovations(
    model: GammaOU, horizon: int, paths: int, seed: int
) -> list[dict[str, float]]:
    """Sample X_h in V_h = phi**h * V_0 + X_h using exact jump times.

    The arrival process is homogeneous Poisson. Exponential interarrival times
    give an arbitrary number of jumps per session. Each jump size is drawn
    from an exponential distribution with mean gamma_scale and then decays
    from its continuous arrival time to the end of the session.
    """
    rng = random.Random(seed)
    samples_by_step = [[] for _ in range(horizon + 1)]

    for _ in range(paths):
        state = 0.0
        next_jump = rng.expovariate(model.jump_intensity)
        for step in range(1, horizon + 1):
            state *= model.phi
            while next_jump <= step:
                jump = rng.expovariate(1 / model.gamma_scale)
                state += jump * math.exp(-model.decay_rate * (step - next_jump))
                next_jump += rng.expovariate(model.jump_intensity)
            samples_by_step[step].append(state)

    quantiles = [{name: 0.0 for name in QUANTILE_NAMES}]
    for samples in samples_by_step[1:]:
        samples.sort()
        quantiles.append({name: sample_quantile(samples, p) for name, p in zip(QUANTILE_NAMES, QUANTILES)})
    return quantiles


def ewma_series(variances: list[float]) -> list[float]:
    """The estimate at date t uses data through and including t."""
    estimates = [variances[0]]
    for current in variances[1:]:
        estimates.append(EWMA_DECAY * estimates[-1] + (1 - EWMA_DECAY) * current)
    return estimates


def evaluate(
    dates: list[str],
    variances: list[float],
    model: GammaOU,
    train_count: int,
    innovations: list[dict[str, float]],
    proxy_window: int | None,
) -> list[dict]:
    ewma = ewma_series(variances)
    evaluation = []
    # Use the same target dates for all horizons. Every origin is at or after
    # the final training observation, so no fit contains a forecast target.
    first_target = train_count - 1 + max(HORIZONS)
    for horizon in HORIZONS:
        series = []
        qlike = {method: [] for method in METHODS}
        squared_volatility_error = {method: [] for method in METHODS}
        interval_hits = 0
        below_support = 0
        for target in range(first_target, len(dates)):
            origin = target - horizon
            initial = variances[origin]
            actual = variances[target]
            observed_volatility = math.sqrt(actual)
            forecasts = {
                "levy": model.forecast(initial, horizon),
                "ewma": ewma[origin],
                "persistence": initial,
            }
            point = {"date": dates[target], "origin_date": dates[origin], "actual": observed_volatility}
            for method, forecast in forecasts.items():
                ratio = actual / forecast
                qlike[method].append(ratio - 1 - math.log(ratio))
                forecast_volatility = math.sqrt(forecast)
                squared_volatility_error[method].append((forecast_volatility - observed_volatility) ** 2)
                point[method] = forecast_volatility
            series.append(point)

            support_floor = model.phi**horizon * initial
            lower = support_floor + innovations[horizon]["q05"]
            upper = support_floor + innovations[horizon]["q95"]
            interval_hits += lower <= actual <= upper
            below_support += actual < support_floor

        evaluation.append({
            "horizon": horizon,
            "count": len(series),
            "overlap_returns": max(0, proxy_window - horizon) if proxy_window is not None else None,
            "metrics": {
                method: {
                    "qlike": fmean(qlike[method]),
                    "rmse_volatility": math.sqrt(fmean(squared_volatility_error[method])),
                }
                for method in METHODS
            },
            "coverage_90": interval_hits / len(series),
            "below_support_share": below_support / len(series),
            "series": series,
        })
    return evaluation


def forecast_fan(
    dates: list[str],
    variances: list[float],
    origin: int,
    model: GammaOU,
    innovations: list[dict[str, float]],
) -> dict:
    initial = variances[origin]
    series = []
    for step, quantiles in enumerate(innovations):
        target = origin + step
        support_floor = model.phi**step * initial
        series.append({
            "horizon": step,
            "target_date": dates[target] if target < len(dates) else None,
            **{name: math.sqrt(support_floor + value) for name, value in quantiles.items()},
            "mean": math.sqrt(model.forecast(initial, step)),
        })
    return {
        "as_of": dates[origin],
        "initial_variance": initial,
        "initial_volatility": math.sqrt(initial),
        "paths": SIMULATIONS,
        "seed": SEED,
        "series": series,
    }


def make_results(dates: list[str], variances: list[float], source: dict | None = None) -> dict:
    train_count = int(len(dates) * TRAIN_FRACTION)
    if train_count < 30 or len(dates) - train_count < max(HORIZONS) + 10:
        raise ValueError("Need at least 30 training observations and 32 holdout observations")

    model = fit_gamma_ou(variances[:train_count])
    window_value = (source or {}).get("window")
    proxy_window = window_value if isinstance(window_value, int) and window_value > 0 else None
    innovations = simulate_innovations(model, max(HORIZONS), SIMULATIONS, SEED)
    evaluation = evaluate(dates, variances, model, train_count, innovations, proxy_window)
    # All historical fans have all 22 eventual observations. Dates are evenly
    # spaced through the eligible holdout origins, not selected on performance.
    first_origin = train_count
    last_origin = len(dates) - 1 - max(HORIZONS)
    history_fan_count = min(12, last_origin - first_origin + 1)
    if history_fan_count == 1:
        historical_origins = [first_origin]
    else:
        historical_origins = [
            round(first_origin + index * (last_origin - first_origin) / (history_fan_count - 1))
            for index in range(history_fan_count)
        ]

    return {
        "schema_version": 1,
        "source": source or {},
        "data": {
            "start": dates[0],
            "end": dates[-1],
            "count": len(dates),
            "train_start": dates[0],
            "train_end": dates[train_count - 1],
            "train_count": train_count,
            "test_start": dates[train_count],
            "test_end": dates[-1],
            "test_count": len(dates) - train_count,
            "evaluation_start": evaluation[0]["series"][0]["date"],
            "evaluation_end": dates[-1],
        },
        "model": {
            **asdict(model),
            "mean_volatility": math.sqrt(model.mean_variance),
            "phi_bounds": PHI_BOUNDS,
            "half_life_sessions": math.log(2) / model.decay_rate,
            "jump_mean_variance": model.gamma_scale,
        },
        "history": [
            {"date": stamp, "variance": variance, "volatility": math.sqrt(variance)}
            for stamp, variance in zip(dates, variances)
        ],
        "evaluation": evaluation,
        "fan": forecast_fan(dates, variances, len(dates) - 1, model, innovations),
        "historical_fans": [
            forecast_fan(dates, variances, index, model, innovations) for index in historical_origins
        ],
        "settings": {
            "train_fraction": TRAIN_FRACTION,
            "ewma_decay": EWMA_DECAY,
            "interval_quantiles": QUANTILES,
            "forecast_horizons": HORIZONS,
            "shared_evaluation_targets": True,
            "state": "Observed daily annualized variance proxy",
            "target": "Terminal variance proxy measured at the target observation",
            "proxy_window": proxy_window,
            "time_unit": "quote observations",
            "variance_unit": "annualized decimal squared",
            "volatility_unit": "annualized decimal",
        },
    }


def compact_numbers(value):
    """Retain ten significant digits without rounding small numbers to zero."""
    if isinstance(value, float):
        return float(f"{value:.10g}")
    if isinstance(value, dict):
        return {key: compact_numbers(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [compact_numbers(item) for item in value]
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=ROOT / "data" / "results.json")
    parser.add_argument("--source", type=Path, help="Provenance JSON for a custom input CSV")
    args = parser.parse_args()

    source_path = args.source
    if source_path is None and args.input.resolve() == DEFAULT_INPUT:
        source_path = ROOT / "data" / "source.json"
    source = None
    if source_path is not None:
        source = json.loads(source_path.read_text(encoding="utf-8-sig"))
        if not isinstance(source, dict):
            raise ValueError("Source metadata must be a JSON object")
    dates, variances = read_observations(args.input)
    results = make_results(dates, variances, source)
    output = json.dumps(compact_numbers(results), ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    args.output.write_text(output + "\n", encoding="utf-8", newline="\n")

    summary = results["data"]
    print(f"{summary['count']} observations: {summary['start']} to {summary['end']}")
    print(f"Train ends {summary['train_end']}. Matched holdout targets begin {summary['evaluation_start']}.")
    print(f"Gamma-OU persistence: {results['model']['phi']:.4f}")
    print("Horizon  Pairs    QLIKE: Lévy / EWMA / Persistence    Lévy 90% interval coverage")
    for result in results["evaluation"]:
        losses = " / ".join(f"{result['metrics'][method]['qlike']:.6f}" for method in METHODS)
        print(f"{result['horizon']:>7}  {result['count']:>5}    {losses}    {result['coverage_90']:.1%}")


if __name__ == "__main__":
    main()
