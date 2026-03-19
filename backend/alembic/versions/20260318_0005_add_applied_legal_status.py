"""add applied legal status

Revision ID: 20260318_0005
Revises: 20260318_0004
Create Date: 2026-03-18
"""
from typing import Sequence, Union

from alembic import op


revision: str = "20260318_0005"
down_revision: Union[str, None] = "20260318_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE legalstatus ADD VALUE IF NOT EXISTS 'APPLIED'")


def downgrade() -> None:
    pass
