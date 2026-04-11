"""Add missing ASSET_SUBMIT approval enum value.

Revision ID: 20260411_0008
Revises: 20260411_0007
Create Date: 2026-04-11
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260411_0008"
down_revision: Union[str, None] = "20260411_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE approvaltype ADD VALUE IF NOT EXISTS 'ASSET_SUBMIT'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely in place.
    pass
