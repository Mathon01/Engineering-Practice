from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from common.client import post_json


def main() -> None:
    result = post_json("/api/v1/analysis/watchlist")
    print({"analyzed": result.get("total", 0)})


if __name__ == "__main__":
    main()

