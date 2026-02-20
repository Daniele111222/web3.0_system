"""Add mint fields and mint_records table

Revision ID: 20260220_mint_fields
Revises: 20260218_asset_id
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260220_mint_fields'
down_revision: Union[str, None] = '20260218_asset_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to assets table
    op.add_column('assets', sa.Column('mint_stage', sa.String(20), nullable=True, comment='当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED'))
    op.add_column('assets', sa.Column('mint_progress', sa.Integer(), nullable=True, comment='铸造进度百分比 0-100'))
    op.add_column('assets', sa.Column('metadata_cid', sa.String(100), nullable=True, comment='元数据IPFS CID'))
    op.add_column('assets', sa.Column('mint_block_number', sa.BigInteger(), nullable=True, comment='铸造区块号'))
    op.add_column('assets', sa.Column('mint_gas_used', sa.BigInteger(), nullable=True, comment='Gas消耗'))
    op.add_column('assets', sa.Column('mint_gas_price', sa.String(30), nullable=True, comment='Gas价格 (wei)'))
    op.add_column('assets', sa.Column('mint_total_cost_eth', sa.String(30), nullable=True, comment='总成本 (ETH)'))
    op.add_column('assets', sa.Column('mint_confirmations', sa.Integer(), nullable=True, server_default='0', comment='当前确认数'))
    op.add_column('assets', sa.Column('required_confirmations', sa.Integer(), nullable=True, server_default='6', comment='所需确认数'))
    op.add_column('assets', sa.Column('recipient_address', sa.String(42), nullable=True, comment='NFT接收地址'))
    op.add_column('assets', sa.Column('mint_requested_at', sa.DateTime(timezone=True), nullable=True, comment='铸造请求时间'))
    op.add_column('assets', sa.Column('mint_submitted_at', sa.DateTime(timezone=True), nullable=True, comment='交易提交时间'))
    op.add_column('assets', sa.Column('mint_confirmed_at', sa.DateTime(timezone=True), nullable=True, comment='交易确认时间'))
    op.add_column('assets', sa.Column('mint_completed_at', sa.DateTime(timezone=True), nullable=True, comment='铸造完成时间'))
    op.add_column('assets', sa.Column('last_mint_attempt_at', sa.DateTime(timezone=True), nullable=True, comment='上次铸造尝试时间'))
    op.add_column('assets', sa.Column('mint_attempt_count', sa.Integer(), nullable=True, server_default='0', comment='铸造尝试次数'))
    op.add_column('assets', sa.Column('max_mint_attempts', sa.Integer(), nullable=True, server_default='3', comment='最大铸造尝试次数'))
    op.add_column('assets', sa.Column('last_mint_error', sa.Text(), nullable=True, comment='上次铸造错误信息'))
    op.add_column('assets', sa.Column('last_mint_error_code', sa.String(50), nullable=True, comment='上次铸造错误码'))
    op.add_column('assets', sa.Column('can_retry', sa.Boolean(), nullable=True, server_default='true', comment='是否可重试'))
    
    # Create mint_records table
    op.create_table(
        'mint_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('operation', sa.String(20), nullable=False, comment='操作类型: REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS'),
        sa.Column('stage', sa.String(20), nullable=True, comment='当前阶段'),
        sa.Column('operator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('operator_address', sa.String(42), nullable=True),
        sa.Column('token_id', sa.BigInteger(), nullable=True),
        sa.Column('tx_hash', sa.String(66), nullable=True, index=True),
        sa.Column('block_number', sa.BigInteger(), nullable=True),
        sa.Column('gas_used', sa.BigInteger(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('error_code', sa.String(50), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata_uri', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create indexes
    op.create_index('ix_mint_records_asset_created', 'mint_records', ['asset_id', 'created_at'])
    op.create_index('ix_mint_records_status', 'mint_records', ['status'])
    
    # Add MINT_FAILED and MINTING to asset status enum
    op.execute("ALTER TYPE assetstatus ADD VALUE IF NOT EXISTS 'MINTING'")
    op.execute("ALTER TYPE assetstatus ADD VALUE IF NOT EXISTS 'MINT_FAILED'")


def downgrade() -> None:
    # Drop mint_records table
    op.drop_index('ix_mint_records_status', table_name='mint_records')
    op.drop_index('ix_mint_records_asset_created', table_name='mint_records')
    op.drop_table('mint_records')
    
    # Drop columns from assets
    op.drop_column('assets', 'can_retry')
    op.drop_column('assets', 'last_mint_error_code')
    op.drop_column('assets', 'last_mint_error')
    op.drop_column('assets', 'max_mint_attempts')
    op.drop_column('assets', 'mint_attempt_count')
    op.drop_column('assets', 'last_mint_attempt_at')
    op.drop_column('assets', 'mint_completed_at')
    op.drop_column('assets', 'mint_confirmed_at')
    op.drop_column('assets', 'mint_submitted_at')
    op.drop_column('assets', 'mint_requested_at')
    op.drop_column('assets', 'recipient_address')
    op.drop_column('assets', 'required_confirmations')
    op.drop_column('assets', 'mint_confirmations')
    op.drop_column('assets', 'mint_total_cost_eth')
    op.drop_column('assets', 'mint_gas_price')
    op.drop_column('assets', 'mint_gas_used')
    op.drop_column('assets', 'mint_block_number')
    op.drop_column('assets', 'metadata_cid')
    op.drop_column('assets', 'mint_progress')
    op.drop_column('assets', 'mint_stage')
