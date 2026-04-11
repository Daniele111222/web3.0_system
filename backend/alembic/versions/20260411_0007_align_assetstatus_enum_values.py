"""Align assetstatus enum values with current application model.

Revision ID: 20260411_0007
Revises: 20260319_0006
Create Date: 2026-04-11
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260411_0007"
down_revision: Union[str, None] = "20260319_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ASSET_STATUS_VALUES = (
    "PENDING",
    "MINTING",
    "REJECTED",
    "MINT_FAILED",
)


def upgrade() -> None:
    for value in ASSET_STATUS_VALUES:
        op.execute(f"ALTER TYPE assetstatus ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely in place.
    pass
