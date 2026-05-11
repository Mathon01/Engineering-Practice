from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Notification, Stock, Watchlist


def create_notification(db: Session, notification_type: str, title: str, content: str, payload: dict[str, Any] | None = None, status: str = "pending") -> Notification:
    row = Notification(notification_type=notification_type, target_channel=settings.qqbot_target, title=title, content=content, payload=payload or {}, status=status)
    db.add(row)
    db.flush()
    return row


def create_price_alert_if_needed(db: Session, stock: Stock, change_pct: Decimal | None, price: Decimal | None) -> None:
    if not settings.qqbot_enable_price_alert or change_pct is None:
        return
    watch = db.execute(select(Watchlist).where(Watchlist.stock_id == stock.id)).scalar_one_or_none()
    if watch is None or not watch.alert_enabled or abs(float(change_pct)) < float(watch.alert_threshold_pct):
        return
    recent_alerts = db.execute(select(Notification).where(Notification.notification_type == "price_alert").order_by(desc(Notification.created_at)).limit(50)).scalars().all()
    existing = next((row for row in recent_alerts if (row.payload or {}).get("code") == stock.code), None)
    if existing is not None and existing.created_at.date() == datetime.now(timezone.utc).date():
        return
    create_notification(
        db,
        "price_alert",
        f"{stock.name} 价格异动",
        f"{stock.code} 最新价 {float(price) if price is not None else '-'}，涨跌幅 {float(change_pct):.2f}%。",
        {"code": stock.code, "name": stock.name, "price": float(price) if price is not None else None, "change_pct": float(change_pct)},
    )


def update_notification_result(db: Session, notification_id: int, status: str, sent_at: datetime | None = None, error_message: str | None = None) -> Notification:
    row = db.get(Notification, notification_id)
    if row is None:
        raise ValueError(f"Notification {notification_id} not found")
    row.status = status
    row.error_message = error_message
    if status == "sent":
        row.sent_at = sent_at or datetime.now(timezone.utc)
    elif status == "failed":
        row.retry_count += 1
    db.flush()
    return row

