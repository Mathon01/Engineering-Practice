# 智能证券市场监视、提醒与策略建议系统

本项目按 `GPTPlan` 的计划书实现，代码全部放在 `Project` 目录下。第一版提供本地可运行的 MVP：FastAPI 后端、React/Vite 前端、OpenClaw 任务脚本、数据库模型、策略规则引擎、演示采集数据和 QQBot 推送记录闭环。

## 功能范围

- 行情：全市场快照、自选股快照、历史日 K、主要指数。
- 资讯：市场新闻、个股新闻、关键词情绪标注和重要性。
- 策略：MA、MACD、RSI、BOLL、KDJ、量能、区间位置和新闻聚合的本地规则引擎。
- 前端：Dashboard、Market、StockDetail、News、Advice、Settings、Notifications。
- OpenClaw：行情采集、资讯采集、分析触发、QQBot 推送结果回写脚本。
- 成本：默认不依赖付费 API、在线 LLM、云服务器或云数据库。

## 本地运行

后端默认使用 SQLite 并自动写入演示数据，适合课程验收和离线展示。需要 PostgreSQL 时设置 `DATABASE_URL` 即可。

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e .\backend
.\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

前端：

```powershell
Set-Location frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

打开 `http://127.0.0.1:3000`。

## Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:8000/docs`

## OpenClaw 脚本

OpenClaw 可按计划调用以下脚本：

```powershell
.\.venv\Scripts\python openclaw\market-data-fetcher\run.py
.\.venv\Scripts\python openclaw\market-info-fetcher\run.py
.\.venv\Scripts\python openclaw\market-analysis-trigger\run.py
.\.venv\Scripts\python openclaw\market-alert-publisher\run.py
```

这些脚本通过 `BACKEND_BASE_URL` 调用后端接口。没有真实 QQBot 时，推送脚本会把 pending 通知标记为 sent，保证推送记录闭环可验收。

## 验证

```powershell
.\.venv\Scripts\python -m pytest .\backend\tests
Set-Location frontend
npm run build
```

## 风险提示

本系统生成的交易建议仅用于课程项目、学习研究和辅助分析，不构成任何投资建议，不承诺收益，也不替代用户独立判断。

