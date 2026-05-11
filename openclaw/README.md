# OpenClaw 任务脚本

这些脚本面向 OpenClaw 的本地任务编排使用。第一版默认调用后端内置的演示采集端点，保证没有外部免费数据源或 QQBot 时仍可完成端到端验收。

## 任务映射

| OpenClaw 任务 | 脚本 | 后端动作 |
| --- | --- | --- |
| `market-data-fetcher` | `market-data-fetcher/run.py` | 采集全市场快照和关注股快照 |
| `market-info-fetcher` | `market-info-fetcher/run.py` | 采集市场和个股资讯 |
| `market-analysis-trigger` | `market-analysis-trigger/run.py` | 触发自选股策略分析 |
| `market-alert-publisher` | `market-alert-publisher/run.py` | 发布 pending 通知并回写状态 |

## 环境变量

- `BACKEND_BASE_URL`：默认 `http://localhost:8000`。
- `QQBOT_DRY_RUN`：默认 `true`，只在控制台打印并将通知标记为 sent。

