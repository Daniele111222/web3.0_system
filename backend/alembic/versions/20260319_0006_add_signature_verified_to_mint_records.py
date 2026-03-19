"""add signature verified to mint records

Revision ID: 20260319_0006
Revises: 20260318_0005
Create Date: 2026-03-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260319_0006"
down_revision: Union[str, None] = "20260318_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "mint_records",
        sa.Column(
            "signature_verified",
            sa.Boolean(),
            nullable=True,
            comment="钱包签名是否通过验证",
        ),
    )


def downgrade() -> None:
    op.drop_column("mint_records", "signature_verified")
