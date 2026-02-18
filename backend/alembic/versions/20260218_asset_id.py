"""add_asset_id_to_approvals

Revision ID: 20260218_asset_id
Revises: a44b7efcd33a
Create Date: 2026-02-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260218_asset_id'
down_revision: Union[str, None] = 'a44b7efcd33a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'approvals',
        sa.Column('asset_id', sa.UUID(), nullable=True, comment='关联资产ID'),
    )
    op.create_index(
        'ix_approvals_asset_id',
        'approvals',
        ['asset_id'],
        unique=False,
    )
    op.create_foreign_key(
        'fk_approvals_asset_id_assets',
        'approvals',
        'assets',
        ['asset_id'],
        ['id'],
        ondelete='CASCADE',
    )
    
    approval_type = sa.Enum(
        'ENTERPRISE_CREATE',
        'ENTERPRISE_UPDATE',
        'MEMBER_JOIN',
        'ASSET_SUBMIT',
        name='approvaltype',
    )
    approval_type.create(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    op.drop_constraint(
        'fk_approvals_asset_id_assets',
        'approvals',
        type_='foreignkey',
    )
    op.drop_index(
        'ix_approvals_asset_id',
        table_name='approvals',
    )
    op.drop_column('approvals', 'asset_id')
