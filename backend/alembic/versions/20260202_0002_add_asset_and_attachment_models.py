"""Add asset and attachment models.

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create asset type enum
    op.execute("""
        DO $$
        BEGIN
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
    """)
    
    # Create legal status enum
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'legalstatus') THEN
                CREATE TYPE legalstatus AS ENUM (
                    'PENDING',
                    'GRANTED',
                    'EXPIRED'
                );
            END IF;
        END $$;
    """)
    
    # Create asset status enum
    op.execute("""
        DO $$
        BEGIN
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
    """)
    
    # Create assets table
    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, comment='资产唯一标识符'),
        sa.Column('enterprise_id', postgresql.UUID(as_uuid=True), nullable=False, comment='所属企业 ID'),
        sa.Column('creator_user_id', postgresql.UUID(as_uuid=True), nullable=True, comment='创建者用户 ID'),
        sa.Column('name', sa.String(200), nullable=False, comment='资产名称'),
        sa.Column('type', postgresql.ENUM('PATENT', 'TRADEMARK', 'COPYRIGHT', 'TRADE_SECRET', 'DIGITAL_WORK', name='assettype', create_type=False), nullable=False, comment='资产类型'),
        sa.Column('description', sa.Text(), nullable=False, comment='资产描述'),
        sa.Column('creator_name', sa.String(100), nullable=False, comment='创作人姓名'),
        sa.Column('creation_date', sa.Date(), nullable=False, comment='创作日期'),
        sa.Column('legal_status', postgresql.ENUM('PENDING', 'GRANTED', 'EXPIRED', name='legalstatus', create_type=False), nullable=False, comment='法律状态'),
        sa.Column('application_number', sa.String(100), nullable=True, comment='申请号/注册号'),
        sa.Column('asset_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb"), comment='资产元数据（JSON 格式）'),
        sa.Column('status', postgresql.ENUM('DRAFT', 'MINTED', 'TRANSFERRED', 'LICENSED', 'STAKED', name='assetstatus', create_type=False), nullable=False, server_default=sa.text("'DRAFT'::assetstatus"), comment='资产状态'),
        sa.Column('nft_token_id', sa.String(100), nullable=True, comment='NFT Token ID'),
        sa.Column('nft_contract_address', sa.String(42), nullable=True, comment='NFT 合约地址'),
        sa.Column('nft_chain', sa.String(50), nullable=True, comment='NFT 所在区块链'),
        sa.Column('metadata_uri', sa.String(500), nullable=True, comment='NFT 元数据 URI（IPFS）'),
        sa.Column('mint_tx_hash', sa.String(66), nullable=True, comment='铸造交易哈希'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['creator_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_assets_name', 'assets', ['name'])
    op.create_index('ix_assets_enterprise_id', 'assets', ['enterprise_id'])
    op.create_index('ix_assets_creator_user_id', 'assets', ['creator_user_id'])
    op.create_index('ix_assets_type', 'assets', ['type'])
    op.create_index('ix_assets_legal_status', 'assets', ['legal_status'])
    op.create_index('ix_assets_application_number', 'assets', ['application_number'])
    op.create_index('ix_assets_status', 'assets', ['status'])
    op.create_index('ix_assets_nft_token_id', 'assets', ['nft_token_id'])
    op.create_index('ix_assets_nft_contract_address', 'assets', ['nft_contract_address'])
    op.create_index('ix_assets_enterprise_status', 'assets', ['enterprise_id', 'status'])
    op.create_index('ix_assets_type_status', 'assets', ['type', 'status'])
    op.create_index('ix_assets_created_at', 'assets', ['created_at'])

    # Create attachments table
    op.create_table(
        'attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, comment='附件唯一标识符'),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False, comment='所属资产 ID'),
        sa.Column('file_name', sa.String(255), nullable=False, comment='文件名'),
        sa.Column('file_type', sa.String(100), nullable=False, comment='文件类型（MIME type）'),
        sa.Column('file_size', sa.BigInteger(), nullable=False, comment='文件大小（字节）'),
        sa.Column('ipfs_cid', sa.String(100), nullable=False, comment='IPFS 内容标识符（CID）'),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, comment='上传时间'),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ipfs_cid'),
    )
    op.create_index('ix_attachments_asset_id', 'attachments', ['asset_id'])
    op.create_index('ix_attachments_ipfs_cid', 'attachments', ['ipfs_cid'])
    op.create_index('ix_attachments_asset_uploaded', 'attachments', ['asset_id', 'uploaded_at'])


def downgrade() -> None:
    op.drop_table('attachments')
    op.drop_table('assets')
    op.execute('DROP TYPE IF EXISTS assetstatus')
    op.execute('DROP TYPE IF EXISTS legalstatus')
    op.execute('DROP TYPE IF EXISTS assettype')
