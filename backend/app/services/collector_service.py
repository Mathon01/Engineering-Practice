from __future__ import annotations

import math
import random
from datetime import date, datetime, timedelta, timezone
from typing import Any


DEMO_SECURITIES = [
    {"code": "000001.SH", "name": "上证指数", "market": "INDEX", "security_type": "index", "industry": "指数"},
    {"code": "399001.SZ", "name": "深证成指", "market": "INDEX", "security_type": "index", "industry": "指数"},
    {"code": "399006.SZ", "name": "创业板指", "market": "INDEX", "security_type": "index", "industry": "指数"},
    {"code": "000300.SH", "name": "沪深300", "market": "INDEX", "security_type": "index", "industry": "指数"},
    {"code": "000905.SH", "name": "中证500", "market": "INDEX", "security_type": "index", "industry": "指数"},
    {"code": "600519.SH", "name": "贵州茅台", "market": "SH", "security_type": "stock", "industry": "白酒"},
    {"code": "000858.SZ", "name": "五粮液", "market": "SZ", "security_type": "stock", "industry": "白酒"},
    {"code": "300750.SZ", "name": "宁德时代", "market": "SZ", "security_type": "stock", "industry": "电池"},
    {"code": "002475.SZ", "name": "立讯精密", "market": "SZ", "security_type": "stock", "industry": "消费电子"},
    {"code": "600036.SH", "name": "招商银行", "market": "SH", "security_type": "stock", "industry": "银行"},
    {"code": "601318.SH", "name": "中国平安", "market": "SH", "security_type": "stock", "industry": "保险"},
    {"code": "688981.SH", "name": "中芯国际", "market": "SH", "security_type": "stock", "industry": "半导体"},
    {"code": "000333.SZ", "name": "美的集团", "market": "SZ", "security_type": "stock", "industry": "家电"},
]

WATCH_CODES = {"600519.SH", "300750.SZ", "600036.SH", "688981.SH", "000333.SZ"}


def _base_price(code: str) -> float:
    return {
        "000001.SH": 3165,
        "399001.SZ": 9850,
        "399006.SZ": 1925,
        "000300.SH": 3740,
        "000905.SH": 5630,
        "600519.SH": 1588,
        "000858.SZ": 134,
        "300750.SZ": 212,
        "002475.SZ": 34,
        "600036.SH": 36,
        "601318.SH": 48,
        "688981.SH": 89,
        "000333.SZ": 68,
    }.get(code, 20)


def build_demo_market_payload(now: datetime | None = None, watch_only: bool = False) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    rnd = random.Random(now.strftime("%Y%m%d%H%M") + ("watch" if watch_only else "market"))
    items: list[dict[str, Any]] = []
    for idx, security in enumerate(DEMO_SECURITIES):
        if watch_only and security["code"] not in WATCH_CODES:
            continue
        base = _base_price(security["code"])
        wave = math.sin((now.hour * 60 + now.minute + idx * 13) / 48) * 1.2
        noise = rnd.uniform(-0.6, 0.8)
        change_pct = round(wave + noise, 2)
        price = round(base * (1 + change_pct / 100), 2)
        open_price = round(base * (1 + (change_pct - rnd.uniform(-0.7, 0.7)) / 100), 2)
        high = round(max(price, open_price) * (1 + rnd.uniform(0.002, 0.014)), 2)
        low = round(min(price, open_price) * (1 - rnd.uniform(0.002, 0.014)), 2)
        volume = int(800000 + rnd.random() * 7000000 + idx * 110000)
        amount = round(volume * price * (1 if security["security_type"] == "stock" else 0.12), 2)
        items.append(
            {
                **security,
                "price": price,
                "change_pct": change_pct,
                "change_amount": round(price - base, 2),
                "volume": volume,
                "amount": amount,
                "open": open_price,
                "high": high,
                "low": low,
                "amplitude": round((high - low) / base * 100, 2),
                "turnover_rate": round(rnd.uniform(0.2, 4.8), 2) if security["security_type"] == "stock" else None,
                "volume_ratio": round(rnd.uniform(0.7, 2.4), 2),
                "pe": round(rnd.uniform(9, 48), 2) if security["security_type"] == "stock" else None,
                "pb": round(rnd.uniform(0.8, 7.2), 2) if security["security_type"] == "stock" else None,
                "total_mv": round(rnd.uniform(300, 22000) * 100000000, 2) if security["security_type"] == "stock" else None,
                "circ_mv": round(rnd.uniform(250, 18000) * 100000000, 2) if security["security_type"] == "stock" else None,
                "is_watch": security["code"] in WATCH_CODES,
                "idempotency_key": f"market:{security['code']}:{now.isoformat(timespec='minutes')}",
                "watch_idempotency_key": f"watch:{security['code']}:{now.isoformat(timespec='minutes')}",
            }
        )
    return {"job_type": "watch_snapshot" if watch_only else "market_snapshot", "source": "demo", "fetched_at": now.isoformat(), "items": items, "failed_items": []}


def build_demo_kline_payload(days: int = 90, end_date: date | None = None) -> dict[str, Any]:
    end_date = end_date or date.today()
    items: list[dict[str, Any]] = []
    for security in DEMO_SECURITIES:
        rnd = random.Random(f"{security['code']}-{end_date.isoformat()}")
        price = _base_price(security["code"]) * (0.92 + rnd.random() * 0.12)
        generated = 0
        cursor = end_date - timedelta(days=days * 2)
        while cursor <= end_date and generated < days:
            cursor += timedelta(days=1)
            if cursor.weekday() >= 5:
                continue
            drift = math.sin(generated / 8 + rnd.random()) * 0.012 + rnd.uniform(-0.016, 0.018)
            open_price = price * (1 + rnd.uniform(-0.006, 0.006))
            close = max(0.1, price * (1 + drift))
            high = max(open_price, close) * (1 + rnd.uniform(0.002, 0.02))
            low = min(open_price, close) * (1 - rnd.uniform(0.002, 0.02))
            volume = int(700000 + rnd.random() * 8000000)
            change_pct = (close - price) / price * 100 if price else 0
            items.append({**security, "trade_date": cursor.isoformat(), "open": round(open_price, 2), "high": round(high, 2), "low": round(low, 2), "close": round(close, 2), "volume": volume, "amount": round(volume * close, 2), "amplitude": round((high - low) / price * 100, 2), "change_pct": round(change_pct, 2), "turnover_rate": round(rnd.uniform(0.2, 5.2), 2) if security["security_type"] == "stock" else None})
            price = close
            generated += 1
    return {"job_type": "daily_kline", "source": "demo", "fetched_at": datetime.now(timezone.utc).isoformat(), "items": items, "failed_items": []}


def build_demo_news_payload(now: datetime | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    templates = [
        {"scope": "market", "title": "主要指数震荡整理，资金继续关注高股息与科技成长方向", "summary": "市场成交维持活跃，结构性机会仍以业绩和政策确定性为主。", "sentiment": "neutral", "importance": 3},
        {"scope": "market", "title": "多部门释放稳增长信号，市场风险偏好小幅回升", "summary": "政策预期改善带动部分顺周期板块上升。", "sentiment": "positive", "importance": 4},
        {"scope": "stock", "code": "600519.SH", "title": "贵州茅台分红方案落地，渠道库存保持稳定", "summary": "分红与经营质量继续支撑长期关注度。", "sentiment": "positive", "importance": 4},
        {"scope": "stock", "code": "300750.SZ", "title": "宁德时代发布新电池技术，海外订单增长", "summary": "技术突破和订单增长改善成长预期。", "sentiment": "positive", "importance": 5},
        {"scope": "stock", "code": "600036.SH", "title": "招商银行资产质量保持稳健，净息差压力仍需观察", "summary": "基本面稳健但行业净息差风险仍未完全消除。", "sentiment": "neutral", "importance": 3},
        {"scope": "stock", "code": "688981.SH", "title": "中芯国际扩产计划推进，半导体景气度回升", "summary": "行业复苏预期增强，但短期波动较大。", "sentiment": "positive", "importance": 4},
        {"scope": "stock", "code": "000333.SZ", "title": "美的集团回购进展更新，海外业务收入增长", "summary": "回购和海外增长对估值形成支撑。", "sentiment": "positive", "importance": 4},
    ]
    items = []
    for idx, item in enumerate(templates):
        code = item.get("code")
        security = next((entry for entry in DEMO_SECURITIES if entry["code"] == code), {}) if code else {}
        items.append({**security, **item, "source": "demo-finance", "url": f"https://example.com/market-agent/news/{now.strftime('%Y%m%d')}-{idx}", "published_at": (now - timedelta(hours=idx * 2 + 1)).isoformat(), "idempotency_key": f"news:{now.strftime('%Y%m%d')}:{idx}:{code or 'market'}"})
    return {"job_type": "news", "source": "demo", "fetched_at": now.isoformat(), "items": items, "failed_items": []}

