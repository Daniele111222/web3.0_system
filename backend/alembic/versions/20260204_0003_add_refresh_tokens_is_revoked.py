"""Add is_revoked column to refresh_tokens.

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    添加 refresh_tokens.is_revoked 字段及复合索引。
    """
    op.add_column(
        "refresh_tokens",
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(
        "ix_refresh_tokens_user_id_is_revoked",
        "refresh_tokens",
        ["user_id", "is_revoked"],
    )


def downgrade() -> None:
    """
    回滚 refresh_tokens.is_revoked 字段及复合索引。
    """
    op.drop_index("ix_refresh_tokens_user_id_is_revoked", table_name="refresh_tokens")
    op.drop_column("refresh_tokens", "is_revoked")
