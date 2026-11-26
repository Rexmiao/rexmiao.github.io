"""Export date-level cleaning counts and reasons from the local equity study."""

import argparse
import csv
import hashlib
from importlib.metadata import version
import json
import math
from pathlib import Path

import exchange_calendars as xcals
import pandas as pd
import pyarrow.parquet as pq


CALENDAR_VERSION = "4.11.1"
NEW_YORK = "America/New_York"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "equity-cleaning.json"
SKIP_REASONS = {
    "missing_5m_bins",
    "missing_opening_bar",
    "missing_adjusted_daily_endpoints",
    "daily_and_minute_session_return_disagree",
}


def check_hash(path, expected):
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f"Snapshot hash mismatch: {path}")


def load_csv(path, checksum):
    check_hash(path, checksum)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def load_manifest(directory):
    return json.loads((directory / "manifest.json").read_text(encoding="utf-8-sig"))


def session_dates(calendar, start, end):
    return [session.date().isoformat() for session in calendar.sessions_in_range(start, end)]


def daily_summary(rows, entry, dates):
    available = {row["date"] for row in rows}
    null_bars = set(entry["null_bar_sessions"])
    if len(rows) != len(available) or len(available) != entry["daily_bars"]:
        raise ValueError("Daily CSV row count or unique dates differ from manifest")
    if not (available | null_bars).issubset(dates) or available & null_bars:
        raise ValueError("Daily CSV or recorded null dates conflict with the expected calendar")

    excluded_prices = [
        {"date": day, "reason": "null-provider-row" if day in null_bars else "missing-provider-row"}
        for day in dates if day not in available
    ]
    excluded_returns = []
    for previous, day in zip(dates, dates[1:]):
        missing = [endpoint for endpoint in (previous, day) if endpoint not in available]
        if missing:
            if len(missing) == 2:
                reason = "missing-both-closes"
            else:
                reason = "missing-current-close" if day in missing else "missing-previous-close"
            excluded_returns.append({"date": day, "reason": reason, "missing_dates": missing})

    return {
        "start": dates[0],
        "end": dates[-1],
        "warmup_date": dates[0],
        "calendar_sessions": len(dates),
        "provider_rows": len(available) + len(null_bars),
        "provider_ohlc_rows": len(available),
        "return_candidates": len(dates) - 1,
        "valid_returns": len(dates) - 1 - len(excluded_returns),
        "excluded_prices": excluded_prices,
        "excluded_returns": excluded_returns,
    }


def pre_regime_dates(path, entry):
    cutoff = pd.Timestamp(entry["analysis_start_local_date"], tz=NEW_YORK).tz_convert("UTC")
    check_hash(path, entry["normalized_sha256"])
    table = pq.read_table(path, columns=["timestamp_utc"], filters=[("timestamp_utc", "<", cutoff)])
    timestamps = table.to_pandas()["timestamp_utc"]
    days = timestamps.dt.tz_convert(NEW_YORK).dt.strftime("%Y-%m-%d")
    if len(days) != entry["pre_analysis_start_rows"]:
        raise ValueError(f"Pre-regime Parquet count differs from manifest: {path}")
    return [{"date": day, "bars": int(count)} for day, count in days.value_counts().sort_index().items()]


def intraday_summary(rows, entry, archive, pre_regime, daily_dates, calendar):
    first, last = rows[0]["date"], rows[-1]["date"]
    dates = session_dates(calendar, first, last)
    if [row["date"] for row in rows] != dates or len(rows) != entry["calendar_sessions"]:
        raise ValueError("Realized-variance dates differ from the study calendar or manifest")

    first_daily_date = min(daily_dates)
    excluded_sessions = []
    for row in rows:
        if row["rv_full"]:
            if row["skip_reason"] or not row["rv_intraday"]:
                raise ValueError(f"Inconsistent complete full-day observation on {row['date']}")
            continue
        day, reason = row["date"], row["skip_reason"]
        if reason not in SKIP_REASONS:
            raise ValueError(f"Unexpected exclusion on {day}: {reason}")
        exclusion = {
            "date": day,
            "reason": reason,
            "expected_5m_bars": int(row["expected_5m_bars"]),
            "observed_5m_bars": int(row["observed_5m_bars"]),
            "intraday_available": bool(row["rv_intraday"]),
        }
        if reason == "missing_adjusted_daily_endpoints":
            previous = calendar.previous_session(day).date().isoformat()
            missing = [endpoint for endpoint in (previous, day) if endpoint not in daily_dates]
            if missing:
                exclusion["missing_dates"] = missing
            if day == first == first_daily_date and missing == [previous]:
                exclusion["reason"] = "warmup-no-prior-close"
        if reason == "daily_and_minute_session_return_disagree":
            discrepancy = float(row["minute_minus_daily_return_bps"])
            if not math.isfinite(discrepancy) or abs(discrepancy) <= 50:
                raise ValueError(f"Invalid cross-feed discrepancy on {day}")
            exclusion["minute_minus_daily_return_bps"] = discrepancy
        excluded_sessions.append(exclusion)

    regular_bars = sum(int(row["regular_source_bars"]) for row in rows)
    unusable_bars = sum(int(row["unusable_source_bars"]) for row in rows)
    complete_intraday = sum(bool(row["rv_intraday"]) for row in rows)
    complete_full = len(rows) - len(excluded_sessions)
    regime_bars = archive["rows"] - sum(day["bars"] for day in pre_regime)
    if (
        complete_intraday != entry["complete_intraday_days"]
        or complete_full != entry["complete_full_days"]
        or regime_bars != entry["raw_bars"]
        or not 0 <= unusable_bars <= regular_bars <= regime_bars
    ):
        raise ValueError("Minute CSV counts differ from the manifests")
    return {
        "start": first,
        "end": last,
        "archive_bars": archive["rows"],
        "regime_bars": regime_bars,
        "regular_bars": regular_bars,
        "valid_regular_bars": regular_bars - unusable_bars,
        "expected_5m_bars": sum(int(row["expected_5m_bars"]) for row in rows),
        "observed_5m_bars": sum(int(row["observed_5m_bars"]) for row in rows),
        "calendar_sessions": len(rows),
        "complete_intraday_days": complete_intraday,
        "complete_full_days": complete_full,
        "excluded_sessions": excluded_sessions,
        "pre_regime_dates": pre_regime,
    }


def build_export(root):
    if version("exchange-calendars") != CALENDAR_VERSION:
        raise ValueError(f"Use exchange-calendars=={CALENDAR_VERSION} as in the equity study")
    calendar = xcals.get_calendar("XNYS", start="2015-12-01", end="2030-01-01")
    daily_dir = root / "data" / "daily"
    archive_dir = root / "data" / "intraday" / "syncster_1m"
    realized_dir = root / "data" / "intraday" / "realized"
    daily = load_manifest(daily_dir)["tickers"]
    archive = {entry["ticker"]: entry for entry in load_manifest(archive_dir)["files"]}
    realized = load_manifest(realized_dir)["symbols"]
    if daily.keys() != archive.keys() or daily.keys() != realized.keys():
        raise ValueError("Local equity manifests must contain the same tickers")

    results = {}
    for symbol, info in daily.items():
        daily_rows = load_csv(daily_dir / info["daily_file"], info["daily_sha256"])
        dates = session_dates(calendar, info["effective_start"], info["effective_end_inclusive"])
        archive_info, realized_info = archive[symbol], realized[symbol]
        pre_regime = []
        if "analysis_start_local_date" in archive_info:
            pre_regime = pre_regime_dates(archive_dir / archive_info["file"], archive_info)
        minute_rows = load_csv(realized_dir / f"{symbol}.csv", realized_info["output_sha256"])
        daily_dates = {row["date"] for row in daily_rows}
        results[symbol] = {
            "daily": daily_summary(daily_rows, info, dates),
            "intraday": intraday_summary(minute_rows, realized_info, archive_info, pre_regime, daily_dates, calendar),
        }
    return {"schema_version": 1, "symbols": list(results), "results": results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study_dir", type=Path, help="Local equity-study directory")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    payload = json.dumps(build_export(args.study_dir), separators=(",", ":"), allow_nan=False) + "\n"
    args.output.write_bytes(payload.encode("utf-8"))


if __name__ == "__main__":
    main()
