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
    """Add refresh_tokens.is_revoked and its composite index if missing."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("refresh_tokens")}
    indexes = {index["name"] for index in inspector.get_indexes("refresh_tokens")}

    if "is_revoked" not in columns:
        op.add_column(
            "refresh_tokens",
            sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        )

    if "ix_refresh_tokens_user_id_is_revoked" not in indexes:
        op.create_index(
            "ix_refresh_tokens_user_id_is_revoked",
            "refresh_tokens",
            ["user_id", "is_revoked"],
        )


def downgrade() -> None:
    """Rollback refresh_tokens.is_revoked and its composite index."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("refresh_tokens")}
    indexes = {index["name"] for index in inspector.get_indexes("refresh_tokens")}

    if "ix_refresh_tokens_user_id_is_revoked" in indexes:
        op.drop_index("ix_refresh_tokens_user_id_is_revoked", table_name="refresh_tokens")

    if "is_revoked" in columns:
        op.drop_column("refresh_tokens", "is_revoked")
