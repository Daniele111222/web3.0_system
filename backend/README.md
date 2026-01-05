# IP-NFT 管理平台后端架构文档

## 项目概述

IP-NFT 管理平台后端是基于 FastAPI 构建的企业知识产权 NFT 资产管理系统，采用分层架构设计，支持多租户企业组织管理、用户认证、区块链钱包集成等核心功能。

## 技术栈

- **框架**: FastAPI 0.115.x
- **语言**: Python 3.11+
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库**: PostgreSQL 14+
- **认证**: JWT (python-jose) + bcrypt (Passlib)
- **区块链**: Web3.py 7.x
- **迁移**: Alembic

## 项目架构

### 分层设计

```
backend/app/
├── api/                  # API 路由层
│   ├── deps.py          # 依赖注入
│   └── v1/              # API v1 版本
│       ├── auth.py      # 认证接口
│       ├── enterprises.py # 企业管理接口
│       ├── users.py     # 用户管理接口
│       ├── assets.py    # 资产管理接口
│       ├── nft.py       # NFT 操作接口
│       └── dashboard.py # 看板接口
├── core/                # 核心配置
│   ├── config.py        # 环境配置
│   ├── security.py      # 安全相关（JWT、密码哈希）
│   ├── database.py      # 数据库连接
│   └── blockchain.py    # 区块链客户端
├── models/              # 数据模型层
│   ├── user.py          # 用户模型
│   ├── enterprise.py    # 企业模型
│   └── refresh_token.py # 刷新令牌模型
├── schemas/             # 请求/响应架构层
│   ├── auth.py          # 认证相关架构
│   └── enterprise.py    # 企业相关架构
├── services/            # 业务逻辑层
│   ├── auth_service.py  # 认证服务
│   └── enterprise_service.py # 企业服务
├── repositories/        # 数据访问层
│   ├── user_repository.py # 用户数据访问
│   ├── token_repository.py # 令牌数据访问
│   └── enterprise_repository.py # 企业数据访问
├── utils/               # 工具函数
└── main.py              # 应用入口
```

### 设计模式

采用经典的分层架构模式：**API → Service → Repository → Model**

- **API 层**: 处理 HTTP 请求/响应，参数验证，错误处理
- **Service 层**: 业务逻辑处理，权限验证，事务管理
- **Repository 层**: 数据访问抽象，SQL 查询封装
- **Model 层**: 数据库表结构定义，关系映射

## 核心模块详解

### 1. 用户认证模块 (Authentication)

#### 数据模型 (`models/user.py`)

**User 模型**
- 用户基础信息存储，支持邮箱/用户名登录
- 集成 Web3 钱包地址绑定
- 包含账户状态管理（激活、验证、超级用户）

**RefreshToken 模型** (`models/refresh_token.py`)
- 刷新令牌安全存储
- 支持多设备会话管理
- 令牌轮换机制

#### 请求/响应架构 (`schemas/auth.py`)

**核心架构类**:
- `UserRegisterRequest`: 用户注册请求验证
- `UserLoginRequest`: 用户登录请求验证
- `TokenResponse`: JWT 令牌响应
- `UserResponse`: 用户信息响应
- `AuthResponse`: 完整认证响应（用户+令牌）
- `WalletBindRequest`: 钱包绑定请求验证

#### 数据访问层 (`repositories/user_repository.py`)

**UserRepository 核心方法**:
- `create(user)`: 创建新用户
- `get_by_id(user_id)`: 根据 ID 获取用户
- `get_by_email(email)`: 根据邮箱获取用户
- `get_by_username(username)`: 根据用户名获取用户
- `get_by_wallet_address(wallet_address)`: 根据钱包地址获取用户
- `update_last_login(user_id)`: 更新最后登录时间
- `update_wallet_address(user_id, wallet_address)`: 更新钱包地址
- `email_exists(email)`: 检查邮箱是否存在
- `username_exists(username)`: 检查用户名是否存在
- `wallet_address_exists(wallet_address)`: 检查钱包地址是否已绑定

**TokenRepository 核心方法** (`repositories/token_repository.py`):
- `create(token)`: 创建刷新令牌记录
- `get_valid_token(token_hash)`: 获取有效令牌
- `revoke_token(token_hash)`: 撤销指定令牌
- `revoke_all_user_tokens(user_id)`: 撤销用户所有令牌
- `count_active_tokens(user_id)`: 统计用户活跃令牌数

#### 业务逻辑层 (`services/auth_service.py`)

**AuthService 核心方法**:
- `register(data, ip_address, device_info)`: 用户注册
  - 验证邮箱和用户名唯一性
  - 密码哈希处理
  - 自动生成认证令牌
- `login(data, ip_address, device_info)`: 用户登录
  - 凭据验证
  - 账户状态检查
  - 更新登录时间
  - 生成新令牌
- `refresh_tokens(refresh_token, ip_address, device_info)`: 令牌刷新
  - 令牌验证和解码
  - 令牌轮换机制
  - 会话限制管理
- `logout(refresh_token)`: 单设备注销
- `logout_all(user_id)`: 全设备注销
- `bind_wallet(user_id, wallet_address, signature, message)`: 钱包绑定
  - Web3 签名验证
  - 钱包地址唯一性检查
- `get_current_user(user_id)`: 获取当前用户信息

**安全特性**:
- 密码强度验证（大小写字母、数字、特殊字符）
- JWT 令牌 + 刷新令牌双令牌机制
- 令牌轮换防止重放攻击
- 多设备会话限制（最大 5 个活跃会话）
- Web3 签名验证确保钱包所有权

#### API 路由层 (`api/v1/auth.py`)

**认证端点**:
- `POST /auth/register`: 用户注册
- `POST /auth/login`: 用户登录
- `POST /auth/refresh`: 令牌刷新
- `POST /auth/logout`: 注销登录
- `POST /auth/logout-all`: 全设备注销
- `POST /auth/bind-wallet`: 绑定钱包
- `GET /auth/me`: 获取当前用户信息

### 2. 企业管理模块 (Enterprise Management)

#### 数据模型 (`models/enterprise.py`)

**Enterprise 模型**
- 企业基础信息（名称、描述、Logo、官网等）
- 联系信息和钱包地址
- 企业状态管理（激活、认证）
- 与成员的一对多关系

**EnterpriseMember 模型**
- 用户与企业的多对多关联
- 成员角色管理（OWNER、ADMIN、MEMBER、VIEWER）
- 加入时间记录
- 唯一约束确保用户在企业中只有一个角色

**MemberRole 枚举**
- `OWNER`: 所有者，拥有最高权限
- `ADMIN`: 管理员，可管理成员和资产
- `MEMBER`: 普通成员，可查看和操作资产
- `VIEWER`: 观察者，仅可查看资产

#### 请求/响应架构 (`schemas/enterprise.py`)

**核心架构类**:
- `EnterpriseCreateRequest`: 创建企业请求验证
- `EnterpriseUpdateRequest`: 更新企业请求验证
- `EnterpriseResponse`: 企业基础信息响应
- `EnterpriseDetailResponse`: 企业详情响应（含成员列表）
- `EnterpriseListResponse`: 企业列表分页响应
- `MemberResponse`: 成员信息响应
- `InviteMemberRequest`: 邀请成员请求验证
- `UpdateMemberRoleRequest`: 更新成员角色请求验证
- `BindWalletRequest`: 企业钱包绑定请求验证

#### 数据访问层 (`repositories/enterprise_repository.py`)

**EnterpriseRepository 核心方法**:
- `create(enterprise)`: 创建新企业
- `get_by_id(enterprise_id)`: 获取企业详情（含成员）
- `get_by_id_simple(enterprise_id)`: 获取企业基础信息
- `get_by_wallet_address(wallet_address)`: 根据钱包地址获取企业
- `get_list(page, page_size, is_active, search)`: 获取企业列表（分页、筛选）
- `get_user_enterprises(user_id, page, page_size)`: 获取用户所属企业
- `update(enterprise_id, **kwargs)`: 更新企业信息
- `update_wallet_address(enterprise_id, wallet_address)`: 更新钱包地址
- `delete(enterprise_id)`: 删除企业
- `wallet_address_exists(wallet_address)`: 检查钱包地址是否已使用
- `get_member_count(enterprise_id)`: 获取企业成员数量

**EnterpriseMemberRepository 核心方法**:
- `create(member)`: 创建成员关系
- `get_by_id(member_id)`: 获取成员关系详情
- `get_member(enterprise_id, user_id)`: 获取指定成员关系
- `get_enterprise_members(enterprise_id)`: 获取企业所有成员
- `get_user_role(enterprise_id, user_id)`: 获取用户在企业中的角色
- `update_role(enterprise_id, user_id, role)`: 更新成员角色
- `delete(enterprise_id, user_id)`: 删除成员关系
- `is_member(enterprise_id, user_id)`: 检查是否为成员
- `get_owner(enterprise_id)`: 获取企业所有者

#### 业务逻辑层 (`services/enterprise_service.py`)

**EnterpriseService 核心方法**:
- `create_enterprise(data, owner_id)`: 创建企业
  - 验证创建者存在
  - 创建企业记录
  - 自动设置创建者为所有者
- `get_enterprise(enterprise_id, user_id)`: 获取企业详情
  - 权限验证（必须是成员）
  - 返回完整企业信息
- `get_user_enterprises(user_id, page, page_size)`: 获取用户企业列表
  - 分页查询用户所属企业
  - 包含成员数量统计
- `update_enterprise(enterprise_id, data, user_id)`: 更新企业信息
  - 权限验证（OWNER 或 ADMIN）
  - 更新指定字段
- `delete_enterprise(enterprise_id, user_id)`: 删除企业
  - 权限验证（仅 OWNER）
  - 级联删除所有关联数据
- `invite_member(enterprise_id, data, inviter_id)`: 邀请成员
  - 权限验证（OWNER 或 ADMIN）
  - 检查用户存在性和重复邀请
  - 创建成员关系
- `update_member_role(enterprise_id, target_user_id, data, operator_id)`: 更新成员角色
  - 权限验证（仅 OWNER）
  - 防止更改所有者角色
- `remove_member(enterprise_id, target_user_id, operator_id)`: 移除成员
  - 权限验证（管理员移除或自己退出）
  - 防止移除所有者
- `get_enterprise_members(enterprise_id, user_id)`: 获取成员列表
  - 权限验证（必须是成员）
- `bind_wallet(enterprise_id, wallet_address, signature, message, user_id)`: 绑定企业钱包
  - 权限验证（仅 OWNER）
  - Web3 签名验证
  - 钱包地址唯一性检查

**权限控制方法**:
- `_check_owner_permission(enterprise_id, user_id)`: 检查所有者权限
- `_check_admin_permission(enterprise_id, user_id)`: 检查管理员权限
- `_verify_wallet_signature(wallet_address, signature, message)`: 验证钱包签名

**异常处理**:
- `EnterpriseNotFoundError`: 企业不存在
- `PermissionDeniedError`: 权限不足
- `MemberExistsError`: 成员已存在
- `MemberNotFoundError`: 成员不存在
- `UserNotFoundError`: 用户不存在
- `WalletBindError`: 钱包绑定失败
- `CannotRemoveOwnerError`: 不能移除所有者

#### API 路由层 (`api/v1/enterprises.py`)

**企业管理端点**:
- `POST /enterprises`: 创建企业
- `GET /enterprises`: 获取我的企业列表
- `GET /enterprises/{enterprise_id}`: 获取企业详情
- `PUT /enterprises/{enterprise_id}`: 更新企业信息
- `DELETE /enterprises/{enterprise_id}`: 删除企业

**成员管理端点**:
- `GET /enterprises/{enterprise_id}/members`: 获取成员列表
- `POST /enterprises/{enterprise_id}/members`: 邀请成员
- `PUT /enterprises/{enterprise_id}/members/{user_id}`: 更新成员角色
- `DELETE /enterprises/{enterprise_id}/members/{user_id}`: 移除成员

**钱包管理端点**:
- `POST /enterprises/{enterprise_id}/wallet`: 绑定企业钱包

### 3. 依赖注入 (`api/deps.py`)

**核心依赖**:
- `get_current_user_id()`: 从 JWT 令牌解析当前用户 ID
- `DBSession`: 数据库会话依赖注入
- `CurrentUserId`: 当前用户 ID 依赖注入

**安全机制**:
- HTTP Bearer 令牌验证
- JWT 令牌解码和验证
- 自动错误处理和 401 响应

## 数据库设计

### 用户表 (users)
```sql
- id: UUID (主键)
- email: VARCHAR(255) (唯一)
- username: VARCHAR(50) (唯一)
- hashed_password: VARCHAR(255)
- full_name: VARCHAR(100)
- avatar_url: VARCHAR(500)
- wallet_address: VARCHAR(42) (唯一)
- is_active: BOOLEAN
- is_verified: BOOLEAN
- is_superuser: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login_at: TIMESTAMP
```

### 企业表 (enterprises)
```sql
- id: UUID (主键)
- name: VARCHAR(100)
- description: TEXT
- logo_url: VARCHAR(500)
- website: VARCHAR(255)
- contact_email: VARCHAR(255)
- wallet_address: VARCHAR(42) (唯一)
- is_active: BOOLEAN
- is_verified: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 企业成员表 (enterprise_members)
```sql
- id: UUID (主键)
- enterprise_id: UUID (外键)
- user_id: UUID (外键)
- role: ENUM(owner, admin, member, viewer)
- joined_at: TIMESTAMP
- UNIQUE(enterprise_id, user_id)
```

### 刷新令牌表 (refresh_tokens)
```sql
- id: UUID (主键)
- token_hash: VARCHAR(64) (唯一)
- user_id: UUID (外键)
- ip_address: VARCHAR(45)
- device_info: VARCHAR(255)
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
- is_revoked: BOOLEAN
```

## 安全特性

### 认证安全
- JWT 访问令牌 + 刷新令牌双令牌机制
- 令牌轮换防止重放攻击
- 密码 bcrypt 哈希存储
- 多设备会话限制
- IP 地址和设备信息记录

### 权限控制
- 基于角色的访问控制 (RBAC)
- 企业级权限隔离
- API 级别权限验证
- 资源所有权验证

### 区块链安全
- Web3 签名验证钱包所有权
- 钱包地址唯一性约束
- 签名消息防重放

## 错误处理

### 统一异常体系
- 服务层自定义异常
- HTTP 状态码映射
- 结构化错误响应
- 详细错误消息

### 事务管理
- 数据库事务自动回滚
- 操作原子性保证
- 并发控制

## 性能优化

### 数据库优化
- 复合索引优化查询
- 关系预加载减少 N+1 查询
- 分页查询避免大数据集
- 连接池管理

### 缓存策略
- SQLAlchemy 二级缓存
- 查询结果缓存
- 会话状态缓存

## 部署和运维

### 环境配置
- Pydantic Settings 环境变量管理
- 多环境配置支持
- 敏感信息加密存储

### 数据库迁移
- Alembic 版本控制
- 自动迁移脚本生成
- 回滚机制支持

### 监控和日志
- 结构化日志记录
- 性能指标监控
- 错误追踪和报警

## 开发指南

### 代码规范
- 函数级中文注释
- 类型提示完整性
- 异常处理规范
- 测试覆盖要求

### 扩展指南
- 新模块开发流程
- API 版本管理
- 数据库模式变更
- 第三方集成规范

这个架构文档详细说明了整个后端系统的设计思路、核心模块功能、数据库设计、安全特性等各个方面，为开发和维护提供了完整的技术参考。