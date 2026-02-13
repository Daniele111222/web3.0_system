---
description: 后端代码规范总览
manual: true
---

# 后端代码规范

## 技术栈

- Python + FastAPI
- PostgreSQL 数据库
- SQLAlchemy 异步 ORM

## 详细规则

后端规则已拆分为多个触发器规则文件：

| 规则文件                                             | 描述                       | 触发条件                                    |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------- |
| [backend-api.md](./backend-api.md)                   | FastAPI API 路由规范       | `/api/` 路径或包含 `APIRouter`              |
| [backend-models.md](./backend-models.md)             | SQLAlchemy 数据模型规范    | `/models/` 路径或包含 `Base`、`Mapped`      |
| [backend-schemas.md](./backend-schemas.md)           | Pydantic Schema 规范       | `/schemas/` 路径或包含 `BaseModel`          |
| [backend-services.md](./backend-services.md)         | 业务逻辑服务层规范         | `/services/` 路径或包含 `Service` 类        |
| [backend-repositories.md](./backend-repositories.md) | 数据访问层 Repository 规范 | `/repositories/` 路径或包含 `Repository` 类 |
| [backend-core.md](./backend-core.md)                 | 核心模块规范               | `/core/` 路径                               |
| [backend-async.md](./backend-async.md)               | Python 异步编程规范        | 包含 `async def`、`await`、`asyncio`        |

## 通用规则

1. 必须使用中文回答问题
2. 关键函数必须要有注释
3. 复杂逻辑必须要有行内注释
4. 注释要说"为什么"而不只是"做什么"
5. 所有注释都必须是中文的
