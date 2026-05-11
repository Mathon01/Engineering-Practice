from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config import settings
from app.database import SessionLocal, init_db
from app.services.seed_service import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.auto_seed_demo_data:
        with SessionLocal() as db:
            seed_demo_data(db)
    yield


app = FastAPI(title="Market Agent API", description="Local A-share market monitor, alert and rule-based strategy API.", version="0.1.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "Market Agent API", "docs": "/docs", "health": "/api/v1/health"}

