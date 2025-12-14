# IP-NFT 管理平台后端

基于 FastAPI + SQLAlchemy + PostgreSQL 构建的企业知识产权 NFT 资产管理平台后端服务。

## 📋 项目简介

本项目是 IP-NFT 管理系统的后端部分，提供 RESTful API 服务，支持：
- 用户认证与授权（JWT）
- 企业与组织管理
- IP 资产信息管理
- NFT 铸造与转移
- 区块链交互
- IPFS 文件存储

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | 3.11+ | 编程语言 |
| FastAPI | 0.115.x | Web 框架 |
| SQLAlchemy | 2.0.x | ORM 框架 |
| Alembic | 1.13.x | 数据库迁移 |
| PostgreSQL | 14+ | 关系型数据库 |
| Pydantic | 2.9.x | 数据验证 |
| Web3.py | 7.x | 以太坊交互 |
| python-jose | 3.3.x | JWT 处理 |
| Passlib | 1.7.x | 密码哈希 |
| Hypothesis | 6.x | 属性基测试 |
| pytest | 8.x | 测试框架 |

## 📁 目录结构

```
backend/
├── app/                       # 应用主目录
│   ├── api/                   # API 路由层
│   │   ├── v1/               # API v1 版本
│   │   │   ├── __init__.py
│   │   │   ├── auth.py       # 认证接口
│   │   │   ├── users.py      # 用户接口
│   │   │   ├── enterprises.py # 企业接口
│   │   │   ├── assets.py     # 资产接口
│   │   │   ├── nft.py        # NFT 接口
│   │   │   ├── dashboard.py  # 看板接口
│   │   │   └── router.py     # 路由汇总
│   │   ├── __init__.py
│   │   └── deps.py           # 依赖注入
│   ├── core/                  # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py         # 应用配置
│   │   ├── security.py       # 安全工具（JWT、密码哈希）
│   │   ├── database.py       # 数据库连接
│   │   └── blockchain.py     # 区块链客户端
│   ├── models/                # SQLAlchemy 数据模型
│   │   └── __init__.py       # User, Enterprise, Asset, NFTEvent 等
│   ├── schemas/               # Pydantic 数据模式
│   │   └── __init__.py       # 请求/响应模式定义
│   ├── services/              # 业务逻辑层
│   │   └── __init__.py       # AuthService, AssetService, NFTService 等
│   ├── repositories/          # 数据访问层
│   │   └── __init__.py       # UserRepository, AssetRepository 等
│   ├── utils/                 # 工具函数
│   │   └── __init__.py
│   ├── __init__.py
│   └── main.py               # 应用入口
├── alembic/                   # 数据库迁移
│   ├── versions/             # 迁移版本文件
│   ├── env.py                # 迁移环境配置
│   └── script.py.mako        # 迁移脚本模板
├── tests/                     # 测试目录
│   ├── __init__.py
│   ├── conftest.py           # pytest 配置
│   └── test_health.py        # 健康检查测试
├── scripts/                   # 工具脚本
│   └── init_db.sql           # 数据库初始化脚本
├── .env.example              # 环境变量示例
├── alembic.ini               # Alembic 配置
├── pytest.ini                # pytest 配置
├── requirements.txt          # Python 依赖
└── README.md                 # 项目说明
```

## 🚀 快速开始

### 环境要求

- **Python**: >= 3.11
- **PostgreSQL**: >= 14
- **pip**: 最新版本

### 1. 创建虚拟环境

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
# Windows:
copy .env.example .env
# Linux/Mac:
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# 应用配置
APP_NAME=IP-NFT Management API
APP_VERSION=1.0.0
DEBUG=true

# 数据库配置
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ipnft_db
DATABASE_SYNC_URL=postgresql://postgres:postgres@localhost:5432/ipnft_db

# JWT 配置
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 配置
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# IPFS 配置
IPFS_API_URL=http://localhost:5001

# 区块链配置
WEB3_PROVIDER_URL=https://polygon-mumbai.g.alchemy.com/v2/your-api-key
CONTRACT_ADDRESS=
```

### 4. 设置数据库

创建 PostgreSQL 数据库：

```sql
-- 使用 psql 或数据库管理工具执行
CREATE DATABASE ipnft_db;
```

或使用初始化脚本：

```bash
psql -U postgres -f scripts/init_db.sql
```

### 5. 运行数据库迁移

```bash
alembic upgrade head
```

### 6. 启动开发服务器

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：
- API 文档 (Swagger): http://localhost:8000/docs
- API 文档 (ReDoc): http://localhost:8000/redoc
- 健康检查: http://localhost:8000/health

## 📡 API 接口

### 认证接口 `/api/v1/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录 |
| POST | `/bind-wallet` | 绑定钱包 |
| POST | `/refresh` | 刷新令牌 |

### 用户接口 `/api/v1/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/me` | 获取当前用户 |
| PUT | `/me` | 更新当前用户 |

### 企业接口 `/api/v1/enterprises`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建企业 |
| GET | `/{id}` | 获取企业详情 |
| PUT | `/{id}` | 更新企业 |
| POST | `/{id}/members` | 邀请成员 |
| PUT | `/{id}/members/{user_id}` | 设置成员角色 |
| DELETE | `/{id}/members/{user_id}` | 移除成员 |

### 资产接口 `/api/v1/assets`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建资产草稿 |
| GET | `/` | 资产列表（分页） |
| GET | `/{id}` | 资产详情 |
| PUT | `/{id}` | 更新资产 |
| POST | `/{id}/attachments` | 上传附件 |

### NFT 接口 `/api/v1/nft`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/mint` | 铸造 NFT |
| POST | `/transfer` | 转移 NFT |
| GET | `/{token_id}/history` | NFT 历史 |

### 看板接口 `/api/v1/dashboard`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/assets` | 看板资产列表 |

## 🧪 测试

### 运行所有测试

```bash
pytest
```

### 运行特定测试

```bash
pytest tests/test_health.py
```

### 运行带覆盖率的测试

```bash
pytest --cov=app tests/
```

### 属性基测试 (Hypothesis)

项目使用 Hypothesis 进行属性基测试，配置如下：

```python
from hypothesis import settings, Phase

@settings(
    max_examples=100,  # 每个属性至少运行 100 次
    phases=[Phase.generate, Phase.target, Phase.shrink],
    deadline=None
)
def test_property():
    pass
```

## 🗄️ 数据库迁移

### 创建新迁移

```bash
alembic revision --autogenerate -m "描述信息"
```

### 应用迁移

```bash
alembic upgrade head
```

### 回滚迁移

```bash
# 回滚一个版本
alembic downgrade -1

# 回滚到指定版本
alembic downgrade <revision_id>

# 回滚所有
alembic downgrade base
```

### 查看迁移历史

```bash
alembic history
```

### 查看当前版本

```bash
alembic current
```

## 🔐 安全配置

### JWT 令牌

- Access Token: 默认 30 分钟过期
- Refresh Token: 默认 7 天过期
- 算法: HS256

### 密码哈希

使用 bcrypt 算法进行密码哈希：

```python
from app.core.security import get_password_hash, verify_password

# 哈希密码
hashed = get_password_hash("plain_password")

# 验证密码
is_valid = verify_password("plain_password", hashed)
```

### CORS 配置

默认允许的源：
- http://localhost:5173 (Vite 开发服务器)
- http://localhost:3000 (备用)

## 📦 核心模块说明

### Core（核心配置）

| 模块 | 功能 |
|------|------|
| `config.py` | 应用配置，从环境变量加载 |
| `security.py` | JWT 生成/验证、密码哈希 |
| `database.py` | 异步数据库连接、会话管理 |
| `blockchain.py` | Web3 客户端、签名验证 |

### API 依赖注入

```python
from app.api.deps import DBSession, CurrentUserId

@router.get("/me")
async def get_me(
    db: DBSession,           # 数据库会话
    user_id: CurrentUserId   # 当前用户 ID
):
    pass
```

### 错误处理

自定义异常类：

```python
from app.core.exceptions import (
    IPNFTException,
    AuthenticationError,
    AuthorizationError,
    AssetNotFoundError,
    BlockchainError,
    IPFSError
)
```

## 🐛 常见问题

### 1. 数据库连接失败

确保：
- PostgreSQL 服务已启动
- 数据库已创建
- `.env` 中的连接字符串正确

### 2. 迁移失败

```bash
# 重置迁移
alembic downgrade base
alembic upgrade head
```

### 3. 依赖安装失败

```bash
# 升级 pip
pip install --upgrade pip

# 重新安装
pip install -r requirements.txt
```

### 4. Web3 连接失败

确保：
- RPC URL 正确
- 网络可访问
- API Key 有效（如使用 Alchemy/Infura）

## 📝 开发规范

### 代码风格

- 遵循 PEP 8 规范
- 使用类型注解
- 函数和类添加文档字符串

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 📄 许可证

MIT License
