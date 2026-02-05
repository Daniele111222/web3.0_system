"""Initial schema with users, refresh_tokens, enterprises, and enterprise_members tables.

Revision ID: 0001
Revises: 
Create Date: 2026-01-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('wallet_address', sa.String(42), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('wallet_address'),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_wallet_address', 'users', ['wallet_address'])
    op.create_index('ix_users_email_is_active', 'users', ['email', 'is_active'])

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('device_info', sa.String(255), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_user_id_is_revoked', 'refresh_tokens', ['user_id', 'is_revoked'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])

    # Create enterprises table
    op.create_table(
        'enterprises',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, comment='企业唯一标识符'),
        sa.Column('name', sa.String(100), nullable=False, comment='企业名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='企业描述'),
        sa.Column('logo_url', sa.String(500), nullable=True, comment='企业 Logo URL'),
        sa.Column('website', sa.String(255), nullable=True, comment='企业官网'),
        sa.Column('contact_email', sa.String(255), nullable=True, comment='联系邮箱'),
        sa.Column('wallet_address', sa.String(42), nullable=True, comment='企业钱包地址'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='企业是否激活'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False, comment='企业是否已认证'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='更新时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('wallet_address'),
    )
    op.create_index('ix_enterprises_name', 'enterprises', ['name'])
    op.create_index('ix_enterprises_wallet_address', 'enterprises', ['wallet_address'])
    op.create_index('ix_enterprises_name_is_active', 'enterprises', ['name', 'is_active'])

    # Create enterprise_members table
    op.create_table(
        'enterprise_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, comment='成员关系唯一标识符'),
        sa.Column('enterprise_id', postgresql.UUID(as_uuid=True), nullable=False, comment='所属企业 ID'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, comment='用户 ID'),
        sa.Column('role', sa.Enum('owner', 'admin', 'member', 'viewer', name='memberrole'), nullable=False, comment='成员角色'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, comment='加入时间'),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_enterprise_members_enterprise_id', 'enterprise_members', ['enterprise_id'])
    op.create_index('ix_enterprise_members_user_id', 'enterprise_members', ['user_id'])
    op.create_index('ix_enterprise_members_enterprise_user', 'enterprise_members', ['enterprise_id', 'user_id'], unique=True)


def downgrade() -> None:
    op.drop_table('enterprise_members')
    op.execute('DROP TYPE IF EXISTS memberrole')
    op.drop_table('enterprises')
    op.drop_table('refresh_tokens')
    op.drop_table('users')
