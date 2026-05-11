from __future__ import annotations

from math import sqrt
from statistics import mean
from typing import Any


def _num(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def _sma(values: list[float], window: int) -> float | None:
    if not values:
        return None
    sample = values[-window:] if len(values) >= window else values
    return round(mean(sample), 4)


def _ema(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    alpha = 2 / (period + 1)
    result = [values[0]]
    for value in values[1:]:
        result.append(alpha * value + (1 - alpha) * result[-1])
    return result


def _rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) < 2:
        return None
    diffs = [values[i] - values[i - 1] for i in range(1, len(values))]
    sample = diffs[-period:] if len(diffs) >= period else diffs
    gains = [max(diff, 0) for diff in sample]
    losses = [abs(min(diff, 0)) for diff in sample]
    avg_gain = mean(gains) if gains else 0
    avg_loss = mean(losses) if losses else 0
    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0
    rs = avg_gain / avg_loss
    return round(100 - 100 / (1 + rs), 4)


def _boll(values: list[float], window: int = 20) -> dict[str, float | None]:
    if not values:
        return {"middle": None, "upper": None, "lower": None}
    sample = values[-window:] if len(values) >= window else values
    middle = mean(sample)
    variance = mean([(value - middle) ** 2 for value in sample])
    std = sqrt(variance)
    return {"middle": round(middle, 4), "upper": round(middle + 2 * std, 4), "lower": round(middle - 2 * std, 4)}


def _macd(values: list[float]) -> dict[str, float | str | None]:
    if not values:
        return {"dif": None, "dea": None, "histogram": None, "cross": "neutral"}
    ema12 = _ema(values, 12)
    ema26 = _ema(values, 26)
    dif_series = [a - b for a, b in zip(ema12, ema26)]
    dea_series = _ema(dif_series, 9)
    histogram = [2 * (d - e) for d, e in zip(dif_series, dea_series)]
    cross = "neutral"
    if len(histogram) >= 2:
        if histogram[-2] <= 0 < histogram[-1]:
            cross = "golden"
        elif histogram[-2] >= 0 > histogram[-1]:
            cross = "death"
    return {"dif": round(dif_series[-1], 4), "dea": round(dea_series[-1], 4), "histogram": round(histogram[-1], 4), "cross": cross}


def _kdj(rows: list[dict[str, Any]], period: int = 9) -> dict[str, float | None]:
    if not rows:
        return {"k": None, "d": None, "j": None}
    k = 50.0
    d = 50.0
    for idx, row in enumerate(rows):
        sample = rows[max(0, idx - period + 1) : idx + 1]
        lows = [_num(item.get("low")) for item in sample if _num(item.get("low")) is not None]
        highs = [_num(item.get("high")) for item in sample if _num(item.get("high")) is not None]
        close = _num(row.get("close"))
        if close is None or not lows or not highs or max(highs) == min(lows):
            rsv = 50.0
        else:
            rsv = (close - min(lows)) / (max(highs) - min(lows)) * 100
        k = (2 / 3) * k + (1 / 3) * rsv
        d = (2 / 3) * d + (1 / 3) * k
    j = 3 * k - 2 * d
    return {"k": round(k, 4), "d": round(d, 4), "j": round(j, 4)}


def calculate_indicators(rows: list[dict[str, Any]]) -> dict[str, Any]:
    closes = [_num(row.get("close")) for row in rows]
    closes = [value for value in closes if value is not None]
    volumes = [_num(row.get("volume")) for row in rows]
    volumes = [value for value in volumes if value is not None]

    latest_close = closes[-1] if closes else None
    recent20 = closes[-20:] if closes else []
    price_position = None
    if latest_close is not None and recent20 and max(recent20) != min(recent20):
        price_position = round((latest_close - min(recent20)) / (max(recent20) - min(recent20)), 4)

    volume_change_rate = None
    if len(volumes) >= 20:
        avg5 = mean(volumes[-5:])
        avg20 = mean(volumes[-20:])
        if avg20:
            volume_change_rate = round((avg5 - avg20) / avg20, 4)

    return {
        "ma5": _sma(closes, 5),
        "ma10": _sma(closes, 10),
        "ma20": _sma(closes, 20),
        "ma60": _sma(closes, 60),
        "macd": _macd(closes),
        "rsi14": _rsi(closes, 14),
        "boll": _boll(closes),
        "kdj": _kdj(rows),
        "volume_change_rate": volume_change_rate,
        "price_position": price_position,
        "latest_close": round(latest_close, 4) if latest_close is not None else None,
    }

