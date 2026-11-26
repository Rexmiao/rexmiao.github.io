"""Stage the public Lévy Volatility Lab for a Hugging Face Static Space."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "levy-volatility"
PUBLIC_FILES = (
    ".gitattributes",
    "index.html",
    "assets/app.js",
    "assets/data-methodology.js",
    "assets/style.css",
    "data/DATA.md",
    "data/equity-cleaning.json",
    "data/equity-results.json",
    "data/observations.csv",
    "data/results.json",
    "data/source.json",
    "data-methodology/index.html",
    "scripts/export_equity_cleaning.py",
    "scripts/export_equity_results.py",
    "scripts/fetch_data.py",
    "scripts/model.py",
)

README = """---
title: Lévy Volatility Lab
emoji: 📈
colorFrom: green
colorTo: blue
sdk: static
app_file: index.html
license: mit
short_description: Explore historical FX and equity volatility forecasts
---

# Lévy Volatility Lab

This Space mirrors Runtian Miao’s bilingual volatility research lab. Explore Gamma–OU forecast bands for USD/JPY, compare models across the daily and minute-derived U.S. equity targets, and inspect the dated cleaning records and annual overview.

本 Space 镜像个人网站上的中英双语波动率实验室。可交互查看 USD/JPY 预测区间、切换美股标的和数据口径，以及查看年度清洗概览和逐日审计。

The browser loads the published research snapshots bundled here. The USD/JPY snapshot includes historical H.10 observations and provenance. The U.S. equity files contain the published aggregate scores and derived cleaning records. The included Python scripts reproduce the FX model or export equity results from the original research outputs when run locally.

The application and public snapshots come from the [canonical source revision](https://github.com/Rexmiao/rexmiao.github.io/tree/{revision}/labs/levy-volatility). The source repository’s MIT notice is included. [Official H.10 USD/JPY source](https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm)

[Canonical personal-site lab](https://rexmiao.github.io/labs/levy-volatility/) · [Volatility research project](https://rexmiao.github.io/projects/volatility-modeling/) · [Data sources and methodology](https://rexmiao.github.io/labs/levy-volatility/data-methodology/)
"""


def read_lf(path: Path) -> bytes:
    """Keep output stable across Git checkout line-ending settings."""
    return path.read_bytes().replace(b"\r\n", b"\n")


def stage(output: Path, revision: str) -> int:
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("The output directory must be empty or nonexistent")

    files = {name: read_lf(LAB / name) for name in PUBLIC_FILES}
    data_source = json.loads(files["data/source.json"])
    if hashlib.sha256(files["data/observations.csv"]).hexdigest() != data_source["observationsSha256"]:
        raise ValueError("The staged FX observations do not match their provenance checksum")

    # Static Spaces serve named files. Link explicitly to the nested document.
    files["index.html"] = re.sub(rb'href="data-methodology/(?=["#])', b'href="data-methodology/index.html', files["index.html"])
    files["data-methodology/index.html"] = re.sub(rb'href="\.\./(?=["#])', b'href="../index.html', files["data-methodology/index.html"])
    files["LICENSE"] = read_lf(ROOT / "LICENSE")
    files["README.md"] = README.format(revision=revision).encode("utf-8")

    for name, content in files.items():
        path = output / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    return len(files)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revision", required=True, help="40-character source Git commit SHA")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.revision):
        parser.error("--revision must be a 40-character lowercase hexadecimal Git SHA")
    try:
        count = stage(args.output, args.revision)
    except (OSError, ValueError, KeyError) as error:
        parser.error(str(error))
    print(f"Staged {count} public files at {args.output}")


if __name__ == "__main__":
    main()
