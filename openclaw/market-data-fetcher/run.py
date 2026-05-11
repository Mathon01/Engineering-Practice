from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from common.client import post_json


def main() -> None:
    market = post_json("/api/v1/collector/demo/market")
    watch = post_json("/api/v1/collector/demo/watch")
    print({"market": market, "watch": watch})


if __name__ == "__main__":
    main()

