from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from common.scheduler import run_forever


def main() -> None:
    run_forever()


if __name__ == "__main__":
    main()

