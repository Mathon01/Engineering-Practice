import os

os.environ["DATABASE_URL"] = "sqlite:///./data/test_market_agent.db"
os.environ["AUTO_SEED_DEMO_DATA"] = "true"

from fastapi.testclient import TestClient

from app.main import app


def test_health_and_seeded_market_snapshot():
    with TestClient(app) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"
        market = client.get("/api/v1/market/snapshot?page_size=10")
        assert market.status_code == 200
        assert market.json()["total"] > 0


def test_trigger_analysis_for_seeded_stock():
    with TestClient(app) as client:
        response = client.post("/api/v1/analysis/600519.SH")
        assert response.status_code == 200
        assert response.json()["signal"] in {"重点关注", "谨慎买入", "持有", "减仓", "回避"}

