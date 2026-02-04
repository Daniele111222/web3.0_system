-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    wallet_address VARCHAR(42) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS ix_users_email_is_active ON users(email, is_active);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    device_info VARCHAR(500),
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id_is_revoked ON refresh_tokens(user_id, is_revoked);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Create enterprises table
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    contact_email VARCHAR(255),
    wallet_address VARCHAR(42) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_enterprises_name ON enterprises(name);
CREATE INDEX IF NOT EXISTS ix_enterprises_wallet_address ON enterprises(wallet_address);
CREATE INDEX IF NOT EXISTS ix_enterprises_name_is_active ON enterprises(name, is_active);

-- Create enterprise_members table
CREATE TABLE IF NOT EXISTS enterprise_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(enterprise_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_enterprise_members_enterprise_id ON enterprise_members(enterprise_id);
CREATE INDEX IF NOT EXISTS ix_enterprise_members_user_id ON enterprise_members(user_id);

-- Create enum type for MemberRole
DO $$ BEGIN
    CREATE TYPE memberrole AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TABLE enterprises IS '企业表';
COMMENT ON COLUMN enterprises.id IS '企业唯一标识符';
COMMENT ON COLUMN enterprises.name IS '企业名称';
COMMENT ON COLUMN enterprises.description IS '企业描述';
COMMENT ON COLUMN enterprises.logo_url IS '企业 Logo URL';
COMMENT ON COLUMN enterprises.website IS '企业官网';
COMMENT ON COLUMN enterprises.contact_email IS '联系邮箱';
COMMENT ON COLUMN enterprises.wallet_address IS '企业钱包地址';
COMMENT ON COLUMN enterprises.is_active IS '企业是否激活';
COMMENT ON COLUMN enterprises.is_verified IS '企业是否已认证';
COMMENT ON COLUMN enterprises.created_at IS '创建时间';
COMMENT ON COLUMN enterprises.updated_at IS '更新时间';

COMMENT ON TABLE enterprise_members IS '企业成员表';
COMMENT ON COLUMN enterprise_members.id IS '成员关系唯一标识符';
COMMENT ON COLUMN enterprise_members.enterprise_id IS '所属企业 ID';
COMMENT ON COLUMN enterprise_members.user_id IS '用户 ID';
COMMENT ON COLUMN enterprise_members.role IS '成员角色';
COMMENT ON COLUMN enterprise_members.joined_at IS '加入时间';
