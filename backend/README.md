# IP-NFT Enterprise Asset Management System - Backend

基于 FastAPI 构建的 Web3 IP-NFT 企业资产管理后端服务，提供 RESTful API 接口，支持用户认证、企业管理和区块链交互。

## 已实现功能

### 1. 用户认证与授权 ✅
- **用户注册/登录** - 邮箱密码认证，JWT Token 机制
- **令牌刷新** - 支持刷新令牌轮换机制
- **多端登录管理** - 支持多设备同时登录，可一键登出所有设备
- **钱包绑定** - 区块链钱包地址绑定与签名验证

### 2. 企业管理系统 ✅
- **企业 CRUD** - 创建、读取、更新、删除企业
- **成员管理** - 邀请成员、角色分配（owner/admin/member/viewer）、移除成员
- **权限控制** - 基于角色的访问控制（RBAC）
- **企业钱包** - 为企业绑定区块链钱包地址

### 3. Web3 区块链集成 ✅
- **钱包验证** - 区块链地址格式校验与签名验证
- **Web3 客户端** - 支持连接 Polygon Mumbai 等网络
- **合约交互准备** - 预留 NFT 合约交互接口

### 4. 系统特性 ✅
- **异步数据库** - SQLAlchemy 2.0 + asyncpg 异步操作
- **数据库迁移** - Alembic 版本管理
- **速率限制** - API 请求频率限制中间件
- **CORS 支持** - 跨域资源共享配置
- **健康检查** - 服务状态监控端点

### 5. 待实现功能 📝
- **资产管理** - IP 资产创建、编辑、附件上传
- **NFT 铸造** - 资产上链铸造成 NFT
- **NFT 转移** - 资产所有权转移
- **仪表盘** - 数据统计与可视化

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| Web 框架 | FastAPI | 0.115.0 |
| 数据库 | PostgreSQL + asyncpg | 2.0.35 |
| ORM | SQLAlchemy | 2.0.35 |
| 迁移 | Alembic | 1.13.3 |
| 认证 | python-jose + passlib | 3.3.0 |
| Web3 | web3.py | 7.3.0 |
| 测试 | pytest + pytest-asyncio | 8.3.3 |

## 快速开始

### 环境要求

- Python 3.12+
- PostgreSQL 14+
- IPFS 节点（可选，用于文件存储）

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

必需配置项：
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/ipnft_db
DATABASE_SYNC_URL=postgresql://postgres:password@localhost:5432/ipnft_db
SECRET_KEY=your-super-secret-key-change-in-production
```

### 3. 初始化数据库

```bash
# 创建数据库
createdb ipnft_db

# 执行迁移
alembic upgrade head
```

### 4. 启动服务

```bash
# 开发模式（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

服务启动后访问：
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

## API 端点概览

### 认证相关

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新访问令牌 |
| POST | `/api/v1/auth/logout` | 登出当前设备 |
| POST | `/api/v1/auth/logout-all` | 登出所有设备 |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |
| POST | `/api/v1/auth/bind-wallet` | 绑定钱包地址 |

### 企业管理

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/v1/enterprises` | 获取我的企业列表 |
| POST | `/api/v1/enterprises` | 创建企业 |
| GET | `/api/v1/enterprises/{id}` | 获取企业详情 |
| PUT | `/api/v1/enterprises/{id}` | 更新企业信息 |
| DELETE | `/api/v1/enterprises/{id}` | 删除企业 |
| GET | `/api/v1/enterprises/{id}/members` | 获取成员列表 |
| POST | `/api/v1/enterprises/{id}/members` | 邀请成员 |
| PUT | `/api/v1/enterprises/{id}/members/{user_id}` | 更新成员角色 |
| DELETE | `/api/v1/enterprises/{id}/members/{user_id}` | 移除成员 |
| POST | `/api/v1/enterprises/{id}/wallet` | 绑定企业钱包 |

### 资产管理（待实现）

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/assets` | 创建资产草稿 |
| GET | `/api/v1/assets` | 获取资产列表 |
| GET | `/api/v1/assets/{id}` | 获取资产详情 |
| PUT | `/api/v1/assets/{id}` | 更新资产 |
| POST | `/api/v1/assets/{id}/attachments` | 上传附件 |

### NFT 操作（待实现）

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/nft/mint` | 铸造 NFT |
| POST | `/api/v1/nft/transfer` | 转移 NFT |
| GET | `/api/v1/nft/{token_id}/history` | 获取 NFT 历史 |

### 系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 服务健康状态 |

## 测试

```bash
# 运行所有测试
pytest

# 运行单个测试
pytest tests/test_auth.py::test_login

# 带覆盖率报告
pytest --cov=app --cov-report=html
```

## 分层测试清单

按底层架构建议的逐一测试文件路径如下：

### 1. 应用入口与装配
- app/main.py
- app/api/v1/router.py

### 2. 核心基础组件
- app/core/config.py
- app/core/database.py
- app/core/security.py
- app/core/rate_limiter.py
- app/core/ipfs.py
- app/core/blockchain.py

### 3. 依赖注入与鉴权入口
- app/api/deps.py

### 4. 数据模型层
- app/models/user.py
- app/models/enterprise.py
- app/models/refresh_token.py
- app/models/asset.py

### 5. 数据访问层
- app/repositories/user_repository.py
- app/repositories/token_repository.py
- app/repositories/enterprise_repository.py
- app/repositories/asset_repository.py

### 6. 业务服务层
- app/services/auth_service.py
- app/services/enterprise_service.py
- app/services/asset_service.py

### 7. API 路由层
- app/api/v1/auth.py
- app/api/v1/enterprises.py
- app/api/v1/assets.py
- app/api/v1/users.py
- app/api/v1/nft.py
- app/api/v1/dashboard.py

## 测试注意事项与关联文件

- 配置与数据库相关测试需确保 .env 和 app/core/config.py 对齐，连接配置来自 app/core/database.py
- 认证链路测试需要同时覆盖 app/core/security.py、app/api/deps.py 与 app/services/auth_service.py
- 企业/资产相关接口需要串联 app/models、app/repositories 与 app/services 的对应文件
- 速率限制与中间件行为需验证 app/core/rate_limiter.py 及 app/main.py 中间件装配
- IPFS 与区块链相关能力测试需配置 app/core/ipfs.py 与 app/core/blockchain.py 的外部依赖

## 项目结构

```
backend/
├── alembic/              # 数据库迁移
│   └── versions/         # 迁移脚本
├── app/                  # 应用代码
│   ├── api/              # API 层
│   │   ├── v1/           # API v1 路由
│   │   │   ├── auth.py   # 认证端点
│   │   │   ├── enterprises.py  # 企业端点
│   │   │   ├── users.py  # 用户端点
│   │   │   ├── assets.py # 资产端点（TODO）
│   │   │   ├── nft.py    # NFT 端点（TODO）
│   │   │   └── dashboard.py  # 仪表盘（TODO）
│   │   └── deps.py       # 依赖注入
│   ├── core/             # 核心组件
│   │   ├── blockchain.py # 区块链客户端
│   │   ├── config.py     # 配置管理
│   │   ├── database.py   # 数据库连接
│   │   ├── rate_limiter.py  # 速率限制
│   │   └── security.py   # 安全工具
│   ├── models/           # SQLAlchemy 模型
│   │   ├── user.py       # 用户模型
│   │   ├── enterprise.py # 企业模型
│   │   └── refresh_token.py  # 刷新令牌模型
│   ├── repositories/     # 数据访问层
│   │   ├── user_repository.py
│   │   ├── token_repository.py
│   │   └── enterprise_repository.py
│   ├── schemas/          # Pydantic 模型
│   │   ├── auth.py
│   │   └── enterprise.py
│   ├── services/         # 业务逻辑层
│   │   ├── auth_service.py
│   │   └── enterprise_service.py
│   └── main.py           # 应用入口
├── tests/                # 测试代码
├── .env.example          # 环境变量示例
├── alembic.ini           # Alembic 配置
├── pytest.ini            # Pytest 配置
└── requirements.txt      # 依赖清单
```

## 数据库模型

```
users (用户表)
├── id, email, username, hashed_password
├── full_name, avatar_url, wallet_address
├── is_active, is_verified, is_superuser
└── created_at, updated_at, last_login_at

refresh_tokens (刷新令牌表)
├── id, user_id, token_hash
├── expires_at, created_at, revoked_at
└── device_info, ip_address

enterprises (企业表)
├── id, name, description, logo_url
├── website, contact_email, wallet_address
├── is_active, is_verified
└── created_at, updated_at

enterprise_members (企业成员表)
├── id, enterprise_id, user_id
├── role (owner/admin/member/viewer)
└── joined_at
```

## 开发规范

### 代码风格
- 遵循 PEP 8 规范
- 使用类型注解
- 异步函数使用 `async/await`
- 异常使用自定义异常类

### 提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
refactor: 重构
test: 测试相关
```

## 常见问题

### Q: 数据库连接失败？
A: 检查 `.env` 中的 `DATABASE_URL` 配置，确保 PostgreSQL 服务已启动。

### Q: 迁移失败？
A: 确保数据库已创建，使用 `createdb ipnft_db` 创建。

### Q: 端口被占用？
A: 使用 `lsof -i :8000` 查看占用进程，或修改启动端口 `--port 8001`。

## 详细技术文档

详细的架构文档请参考原 README 的技术架构部分，包含：
- 分层架构设计
- 核心模块详解
- 安全特性
- 错误处理
- 性能优化
- 部署和运维指南

## 许可证

MIT License
