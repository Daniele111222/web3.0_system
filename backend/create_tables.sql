CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE memberrole AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assettype') THEN
        CREATE TYPE assettype AS ENUM (
            'PATENT',
            'TRADEMARK',
            'COPYRIGHT',
            'TRADE_SECRET',
            'DIGITAL_WORK'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'legalstatus') THEN
        CREATE TYPE legalstatus AS ENUM (
            'PENDING',
            'GRANTED',
            'EXPIRED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assetstatus') THEN
        CREATE TYPE assetstatus AS ENUM (
            'DRAFT',
            'MINTED',
            'TRANSFERRED',
            'LICENSED',
            'STAKED'
        );
    END IF;
END $$;

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
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    device_info VARCHAR(255),
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
    role memberrole NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(enterprise_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_enterprise_members_enterprise_id ON enterprise_members(enterprise_id);
CREATE INDEX IF NOT EXISTS ix_enterprise_members_user_id ON enterprise_members(user_id);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    type assettype NOT NULL,
    description TEXT NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    creation_date DATE NOT NULL,
    legal_status legalstatus NOT NULL,
    application_number VARCHAR(100),
    asset_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status assetstatus NOT NULL DEFAULT 'DRAFT',
    nft_token_id VARCHAR(100),
    nft_contract_address VARCHAR(42),
    nft_chain VARCHAR(50),
    metadata_uri VARCHAR(500),
    mint_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS ix_assets_enterprise_id ON assets(enterprise_id);
CREATE INDEX IF NOT EXISTS ix_assets_creator_user_id ON assets(creator_user_id);
CREATE INDEX IF NOT EXISTS ix_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS ix_assets_legal_status ON assets(legal_status);
CREATE INDEX IF NOT EXISTS ix_assets_application_number ON assets(application_number);
CREATE INDEX IF NOT EXISTS ix_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS ix_assets_nft_token_id ON assets(nft_token_id);
CREATE INDEX IF NOT EXISTS ix_assets_nft_contract_address ON assets(nft_contract_address);
CREATE INDEX IF NOT EXISTS ix_assets_enterprise_status ON assets(enterprise_id, status);
CREATE INDEX IF NOT EXISTS ix_assets_type_status ON assets(type, status);
CREATE INDEX IF NOT EXISTS ix_assets_created_at ON assets(created_at);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    ipfs_cid VARCHAR(100) UNIQUE NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_attachments_asset_id ON attachments(asset_id);
CREATE INDEX IF NOT EXISTS ix_attachments_ipfs_cid ON attachments(ipfs_cid);
CREATE INDEX IF NOT EXISTS ix_attachments_asset_uploaded ON attachments(asset_id, uploaded_at);

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
