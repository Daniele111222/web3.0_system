# 认证模块数据库迁移指南

## 概述

本文档描述了为支持忘记密码、邮箱验证和"记住我"功能所需的数据库迁移。

## 新增数据表

### 1. password_reset_tokens (密码重置令牌表)

用于存储密码重置令牌，支持安全的密码重置流程。

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_password_reset_tokens_token_hash (token_hash),
    INDEX idx_password_reset_tokens_user_is_used (user_id, is_used),
    INDEX idx_password_reset_tokens_expires_at (expires_at)
);
```

**字段说明：**
- `token_hash`: 使用SHA-256哈希后的令牌值（不存储原始令牌）
- `user_id`: 请求密码重置的用户ID
- `is_used`: 标记令牌是否已被使用（一次性使用）
- `expires_at`: 令牌过期时间（默认30分钟）

### 2. email_verification_tokens (邮箱验证令牌表)

用于存储邮箱验证令牌，支持安全的邮箱验证流程。

```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_email_verification_tokens_token_hash (token_hash),
    INDEX idx_email_verification_tokens_user_is_used (user_id, is_used),
    INDEX idx_email_verification_tokens_expires_at (expires_at)
);
```

**字段说明：**
- `token_hash`: 使用SHA-256哈希后的令牌值（不存储原始令牌）
- `user_id`: 需要验证邮箱的用户ID
- `is_used`: 标记令牌是否已被使用（一次性使用）
- `expires_at`: 令牌过期时间（默认24小时）

## 现有表更新

### users 表

`users` 表已经包含 `is_verified` 字段，无需修改。

确认字段存在：
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_verified';
```

如果不存在，添加字段：
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

## Alembic 迁移脚本

创建迁移脚本：

```bash
# 进入后端目录
cd backend

# 生成迁移脚本（自动检测模型变化）
alembic revision --autogenerate -m "add_password_reset_and_email_verification"

# 应用迁移
alembic upgrade head
```

### 手动迁移脚本示例

如果自动迁移有问题，可以使用以下手动脚本：

```python
"""add_password_reset_and_email_verification

Revision ID: xxxxxxxx
Revises: previous_revision
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'xxxxxxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade():
    # 创建 password_reset_tokens 表
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('token_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # 创建索引
    op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'])
    op.create_index('ix_password_reset_tokens_user_is_used', 'password_reset_tokens', ['user_id', 'is_used'])
    op.create_index('ix_password_reset_tokens_expires_at', 'password_reset_tokens', ['expires_at'])
    
    # 创建 email_verification_tokens 表
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('token_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # 创建索引
    op.create_index('ix_email_verification_tokens_token_hash', 'email_verification_tokens', ['token_hash'])
    op.create_index('ix_email_verification_tokens_user_is_used', 'email_verification_tokens', ['user_id', 'is_used'])
    op.create_index('ix_email_verification_tokens_expires_at', 'email_verification_tokens', ['expires_at'])


def downgrade():
    # 删除表（顺序很重要，先删除有外键依赖的）
    op.drop_index('ix_email_verification_tokens_expires_at', table_name='email_verification_tokens')
    op.drop_index('ix_email_verification_tokens_user_is_used', table_name='email_verification_tokens')
    op.drop_index('ix_email_verification_tokens_token_hash', table_name='email_verification_tokens')
    op.drop_table('email_verification_tokens')
    
    op.drop_index('ix_password_reset_tokens_expires_at', table_name='password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_user_is_used', table_name='password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_token_hash', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')
```

## 部署检查清单

### 数据库迁移
- [ ] 运行 Alembic 迁移脚本
- [ ] 验证 `password_reset_tokens` 表已创建
- [ ] 验证 `email_verification_tokens` 表已创建
- [ ] 验证索引已正确创建

### 配置更新
- [ ] 更新 `.env` 文件，添加邮件服务配置
- [ ] 确保 `SECRET_KEY` 已设置
- [ ] 配置 `FRONTEND_URL` 指向正确的前端地址

### 依赖安装
```bash
pip install aiosmtplib jinja2
```

### 测试验证
- [ ] 调用 `/auth/forgot-password` 端点
- [ ] 调用 `/auth/verify-reset-token` 端点
- [ ] 调用 `/auth/reset-password` 端点
- [ ] 调用 `/auth/send-verification` 端点
- [ ] 调用 `/auth/verify-email` 端点
- [ ] 调用 `/auth/verification-status` 端点
- [ ] 测试登录时传递 `remember_me` 参数

## 回滚计划

如果出现问题，执行以下回滚步骤：

```bash
# 1. 回滚数据库迁移
alembic downgrade -1

# 2. 恢复代码到之前的版本
git checkout <previous-commit>

# 3. 重启服务
systemctl restart your-service
```