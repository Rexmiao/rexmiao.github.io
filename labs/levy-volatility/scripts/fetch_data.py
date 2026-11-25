"""Build the fixed USD/JPY research snapshot from the Federal Reserve H.10 table."""

import argparse
import csv
from datetime import date, datetime
import hashlib
import json
import math
from pathlib import Path
import re
from urllib.request import urlopen


SOURCE_URL = "https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm"
BOARD_TERMS = "https://www.federalreserve.gov/disclaimer.htm"
SOURCE_RELEASE_DATE = "2026-11-23"
START = date(2016, 1, 1)
END = date(2026, 11, 20)
WINDOW = 5
ANNUALIZATION = 252
ROOT = Path(__file__).resolve().parent.parent
ROW = re.compile(
    r"<tr\b[^>]*>\s*<th\b[^>]*>\s*(\d{1,2}-[A-Z]{3}-\d{2})\s*</th>"
    r"\s*<td\b[^>]*>\s*([\d.]+|ND)\s*</td>\s*</tr>",
    flags=re.IGNORECASE,
)


def extract_fixes(html):
    fixes = []
    for date_text, quote_text in ROW.findall(html):
        day = datetime.strptime(date_text, "%d-%b-%y").date()
        if day > END or quote_text.upper() == "ND":
            continue
        quote = float(quote_text)
        if not math.isfinite(quote) or quote <= 0:
            raise ValueError(f"Invalid exchange rate for {day}")
        if fixes and day <= fixes[-1][0]:
            raise ValueError(f"Source dates not strictly increasing at {day}")
        fixes.append((day, quote))

    if not fixes or fixes[-1][0] != END:
        raise ValueError(f"H.10 table is missing the required ending fix, {END}")
    return fixes


def build_observations(fixes):
    if sum(day < START for day, _ in fixes) < WINDOW:
        raise ValueError("H.10 table lacks sufficient fixes before the sample start")

    returns = [math.log(fixes[i][1] / fixes[i - 1][1]) for i in range(1, len(fixes))]
    observations = []
    for index, (day, quote) in enumerate(fixes):
        if day < START:
            continue
        trailing = returns[index - WINDOW : index]
        variance = ANNUALIZATION * math.fsum(value * value for value in trailing) / WINDOW
        if not math.isfinite(variance) or variance <= 0:
            raise ValueError(f"Nonpositive variance for {day}. Inspect the source fixes.")
        observations.append((day, variance, quote, returns[index - 1]))

    return observations


def write_snapshot(fixes, observations, output):
    output.mkdir(parents=True, exist_ok=True)
    csv_path = output / "observations.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(["date", "variance", "usd_jpy", "log_return"])
        for day, variance, quote, log_return in observations:
            writer.writerow([day.isoformat(), format(variance, ".17g"), f"{quote:.4f}", format(log_return, ".17g")])

    warmup = [(day, quote) for day, quote in fixes if day < START][-WINDOW:]
    metadata = {
        "name": "Federal Reserve Board H.10 Foreign Exchange Rates",
        "asset": "USD/JPY",
        "series": "H.10 daily Japanese yen per U.S. dollar",
        "url": SOURCE_URL,
        "license": "Public domain (U.S. Federal Reserve Board), citation requested",
        "licenseUrl": BOARD_TERMS,
        "releaseDate": SOURCE_RELEASE_DATE,
        "annualization": ANNUALIZATION,
        "window": WINDOW,
        "observation": "252 × mean of five squared log changes between consecutive published USD/JPY fixes",
        "startDate": observations[0][0].isoformat(),
        "endDate": observations[-1][0].isoformat(),
        "rows": len(observations),
        "observationsSha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        "warmupFixes": [{"date": day.isoformat(), "usd_jpy": quote} for day, quote in warmup],
        "notes": [
            "The source reports noon buying rates in New York, in Japanese yen per U.S. dollar.",
            "ND observations are skipped. No holidays or missing observations are filled.",
            "Each forecast step advances one published fix. Adjacent proxies share four squared log changes.",
            "The series measures variation between reference fixes and omits within-day price movements.",
            "The source can revise historical values. Compare observationsSha256 to verify the snapshot.",
        ],
    }
    (output / "source.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    print(f"Wrote {len(observations):,} observations from {metadata['startDate']} to {metadata['endDate']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, help="Read a locally saved copy of the H.10 source table")
    parser.add_argument("--output", type=Path, default=ROOT / "data", help="Output directory")
    args = parser.parse_args()
    if args.html:
        html = args.html.read_text(encoding="utf-8")
    else:
        with urlopen(SOURCE_URL, timeout=30) as response:
            html = response.read().decode("utf-8")
    fixes = extract_fixes(html)
    write_snapshot(fixes, build_observations(fixes), args.output)


if __name__ == "__main__":
    main()
