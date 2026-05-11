from app.analysis.indicators import calculate_indicators


def test_calculate_indicators_returns_core_fields():
    rows = [{"close": 10 + index * 0.2, "high": 10.4 + index * 0.2, "low": 9.8 + index * 0.2, "volume": 1000 + index * 50} for index in range(30)]
    result = calculate_indicators(rows)
    assert result["ma5"] is not None
    assert result["ma20"] is not None
    assert result["macd"]["histogram"] is not None
    assert result["rsi14"] is not None
    assert result["boll"]["upper"] > result["boll"]["lower"]

