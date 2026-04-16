"""Add updated_at to nft_transfer_records

Revision ID: 20260416_0009
Revises: 20260411_0008_add_asset_submit_approval_type
Create Date: 2026-04-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260416_0009"
down_revision: Union[str, None] = "20260411_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "nft_transfer_records",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("nft_transfer_records", "updated_at")
