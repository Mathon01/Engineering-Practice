from __future__ import annotations


POSITIVE_WORDS = {"利好", "增长", "突破", "上升", "盈利", "回购", "分红", "涨停", "创新高", "扩产", "中标"}
NEGATIVE_WORDS = {"利空", "下跌", "亏损", "风险", "减持", "处罚", "跌停", "暴雷", "问询", "退市", "下修"}


def classify_sentiment(text: str | None) -> str:
    if not text:
        return "neutral"
    positive = sum(1 for word in POSITIVE_WORDS if word in text)
    negative = sum(1 for word in NEGATIVE_WORDS if word in text)
    if positive > negative:
        return "positive"
    if negative > positive:
        return "negative"
    return "neutral"


def estimate_importance(text: str | None) -> int:
    if not text:
        return 3
    strong_words = {"重大", "公告", "监管", "涨停", "跌停", "处罚", "业绩", "回购", "减持"}
    score = 3 + sum(1 for word in strong_words if word in text)
    return max(1, min(5, score))

