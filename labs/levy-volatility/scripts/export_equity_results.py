"""Export public equity scores from the local study's expanded benchmark files."""

import argparse
import json
import math
from pathlib import Path


STUDIES = ("long", "sndk", "nbis")
MODES = ("daily", "intraday")
HORIZONS = (1, 5, 22)
MODELS = {
    "daily": {"training_mean", "ewma", "har_direct", "gamma_ou", "garch"},
    "intraday": {"training_mean", "ewma", "har_direct", "gamma_ou"},
}
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "equity-results.json"


def export_mode(result, symbol, mode):
    if result["status"] == "skipped":
        if result["reason"] != "Insufficient span for a fixed split and all horizons":
            raise ValueError(f"Unexpected skip reason for {symbol}/{mode}: {result['reason']}")
        return {
            "status": "skipped",
            "reason": "insufficient-span",
            "sessions": result["sessions"],
            "raw_input_rows": result["raw_input_rows"][symbol],
            "required_training": result["required_training"],
            "required_test_origins": result["required_test_origins"],
            "start": result["start"],
            "end": result["end"],
        }

    if result["status"] != "evaluated":
        raise ValueError(f"Unexpected evaluation status for {symbol}/{mode}: {result['status']}")

    horizons = {}
    origins = result["test_origins"]
    for horizon in map(str, HORIZONS):
        metric = result["symbols"][symbol]["metrics"][horizon]
        if metric["observations"] != origins or set(metric["scores"]) != MODELS[mode]:
            raise ValueError(f"Inconsistent score sample or model set for {symbol}/{mode}/{horizon}")
        scores = {
            model: {
                "qlike": values["qlike_difference_vs_training_mean"],
                "rmse": values["rmse_annualized_volatility_pp"],
            }
            for model, values in metric["scores"].items()
        }
        for model, score in scores.items():
            if not math.isfinite(score["qlike"]) or not math.isfinite(score["rmse"]) or score["rmse"] < 0:
                raise ValueError(f"Invalid score for {symbol}/{mode}/{horizon}/{model}")
        if scores["training_mean"]["qlike"] != 0:
            raise ValueError(f"Expected zero relative QLIKE for the baseline in {symbol}/{mode}/{horizon}")

        dates = result["target_dates_by_horizon"][horizon]
        horizons[horizon] = {"target_start": dates["start"], "target_end": dates["end"], "scores": scores}

    return {
        "status": "evaluated",
        "origins": origins,
        "first_origin": result["first_test_origin"],
        "last_origin": result["last_test_origin"],
        "horizons": horizons,
    }


def build_export(results_dir):
    results = {}
    for study in STUDIES:
        path = results_dir / f"expanded-{study}-benchmark.json"
        benchmark = json.loads(path.read_text(encoding="utf-8-sig"))
        if benchmark["schema_version"] != 1 or tuple(benchmark["forecast_horizons"]) != HORIZONS:
            raise ValueError(f"Unsupported benchmark version or horizons in {path}")
        for symbol in benchmark["symbols"]:
            if symbol in results:
                raise ValueError(f"Duplicate ticker {symbol} in {path}")
            results[symbol] = {mode: export_mode(benchmark["results"][mode], symbol, mode) for mode in MODES}

    return {"schema_version": 1, "symbols": list(results), "horizons": list(HORIZONS), "results": results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("results_dir", type=Path, help="Local equity-study results directory")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    public_results = build_export(args.results_dir)
    payload = json.dumps(public_results, indent=2, allow_nan=False) + "\n"
    args.output.write_bytes(payload.encode("utf-8"))


if __name__ == "__main__":
    main()
