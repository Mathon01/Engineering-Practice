from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from common.client import get_json, post_json


def main() -> None:
    dry_run = os.getenv("QQBOT_DRY_RUN", "true").lower() != "false"
    pending = get_json("/api/v1/notifications?status=pending&limit=100").get("items", [])
    for item in pending:
        if dry_run:
            print(f"[QQBot dry-run] {item['title']}: {item['content']}")
        post_json("/api/v1/ingest/openclaw/notification-result", {"notification_id": item["id"], "status": "sent", "payload": {"dry_run": dry_run}})
    print({"published": len(pending), "dry_run": dry_run})


if __name__ == "__main__":
    main()

