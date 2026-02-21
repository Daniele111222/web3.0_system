"""Add ownership fields to assets and create nft_transfer_records table

Revision ID: 20260221_ownership
Revises: 20260220_mint_fields
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260221_ownership'
down_revision: Union[str, None] = '20260220_mint_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 在 assets 表添加权属字段
    op.add_column('assets', sa.Column(
        'ownership_status', sa.String(20), nullable=True,
        comment='权属状态: ACTIVE/LICENSED/STAKED/TRANSFERRED'
    ))
    op.add_column('assets', sa.Column(
        'owner_address', sa.String(42), nullable=True,
        comment='当前持有者钱包地址'
    ))
    op.add_column('assets', sa.Column(
        'current_owner_enterprise_id',
        postgresql.UUID(as_uuid=True),
        sa.ForeignKey('enterprises.id', ondelete='SET NULL'),
        nullable=True,
        comment='当前归属企业 ID'
    ))

    op.create_index('ix_assets_ownership_status', 'assets', ['ownership_status'])
    op.create_index('ix_assets_owner_address', 'assets', ['owner_address'])
    op.create_index('ix_assets_current_owner_enterprise', 'assets', ['current_owner_enterprise_id'])

    # 2. 创建 nft_transfer_records 表
    op.create_table(
        'nft_transfer_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('token_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('contract_address', sa.String(42), nullable=False),
        sa.Column('transfer_type', sa.String(20), nullable=False, server_default='TRANSFER'),
        sa.Column('from_address', sa.String(42), nullable=False),
        sa.Column('from_enterprise_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('enterprises.id', ondelete='SET NULL'), nullable=True),
        sa.Column('from_enterprise_name', sa.String(200), nullable=True),
        sa.Column('to_address', sa.String(42), nullable=False),
        sa.Column('to_enterprise_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('enterprises.id', ondelete='SET NULL'), nullable=True),
        sa.Column('to_enterprise_name', sa.String(200), nullable=True),
        sa.Column('operator_user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('tx_hash', sa.String(66), nullable=True, unique=True, index=True),
        sa.Column('block_number', sa.BigInteger(), nullable=True),
        sa.Column('block_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index('ix_nft_transfers_token_status', 'nft_transfer_records', ['token_id', 'status'])
    op.create_index('ix_nft_transfers_from_enterprise', 'nft_transfer_records', ['from_enterprise_id'])
    op.create_index('ix_nft_transfers_to_enterprise', 'nft_transfer_records', ['to_enterprise_id'])
    op.create_index('ix_nft_transfers_created', 'nft_transfer_records', ['created_at'])

    # 3. 为 transfer_type 和 status 添加枚举值（使用字符串列，无需 ALTER TYPE）


def downgrade() -> None:
    # 删除 nft_transfer_records 表
    op.drop_index('ix_nft_transfers_created', table_name='nft_transfer_records')
    op.drop_index('ix_nft_transfers_to_enterprise', table_name='nft_transfer_records')
    op.drop_index('ix_nft_transfers_from_enterprise', table_name='nft_transfer_records')
    op.drop_index('ix_nft_transfers_token_status', table_name='nft_transfer_records')
    op.drop_table('nft_transfer_records')

    # 删除 assets 表新增字段
    op.drop_index('ix_assets_current_owner_enterprise', table_name='assets')
    op.drop_index('ix_assets_owner_address', table_name='assets')
    op.drop_index('ix_assets_ownership_status', table_name='assets')
    op.drop_column('assets', 'current_owner_enterprise_id')
    op.drop_column('assets', 'owner_address')
    op.drop_column('assets', 'ownership_status')
