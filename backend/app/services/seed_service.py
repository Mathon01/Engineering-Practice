from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Stock, Watchlist
from app.services.analysis_service import analyze_stock
from app.services.collector_service import WATCH_CODES, build_demo_kline_payload, build_demo_market_payload, build_demo_news_payload
from app.services.ingest_service import ingest_kline_payload, ingest_market_payload, ingest_news_payload


def seed_demo_data(db: Session) -> None:
    has_stock = db.execute(select(Stock.id).limit(1)).scalar_one_or_none()
    if has_stock is None:
        ingest_kline_payload(db, build_demo_kline_payload(days=90))
        ingest_market_payload(db, build_demo_market_payload())
        ingest_news_payload(db, build_demo_news_payload())

    for order, code in enumerate(sorted(WATCH_CODES), start=1):
        stock = db.execute(select(Stock).where(Stock.code == code)).scalar_one_or_none()
        if stock is None:
            continue
        existing = db.execute(select(Watchlist).where(Watchlist.stock_id == stock.id)).scalar_one_or_none()
        if existing is None:
            db.add(Watchlist(stock_id=stock.id, display_order=order, alert_threshold_pct=3.0))
    db.commit()

    for code in sorted(WATCH_CODES):
        stock = db.execute(select(Stock).where(Stock.code == code)).scalar_one_or_none()
        if stock is not None and not stock.advice:
            analyze_stock(db, code)

