"""Align asset and nft schema with updated requirements

Revision ID: 20260318_0004
Revises: 20260221_ownership
Create Date: 2026-03-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260318_0004"
down_revision: Union[str, None] = "20260221_ownership"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE assetstatus ADD VALUE IF NOT EXISTS 'APPROVED'")

    op.add_column(
        "assets",
        sa.Column(
            "inventors",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::json"),
            comment="发明人列表",
        ),
    )
    op.add_column(
        "assets",
        sa.Column(
            "rights_declaration",
            sa.Text(),
            nullable=True,
            comment="权利声明",
        ),
    )
    op.add_column(
        "attachments",
        sa.Column(
            "is_primary",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment="是否主附件",
        ),
    )

    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY asset_id
                       ORDER BY uploaded_at ASC, id ASC
                   ) AS rn
            FROM attachments
        )
        UPDATE attachments AS a
        SET is_primary = (ranked.rn = 1)
        FROM ranked
        WHERE a.id = ranked.id
        """
    )

    op.alter_column("assets", "inventors", server_default=None)
    op.alter_column("attachments", "is_primary", server_default=None)


def downgrade() -> None:
    op.drop_column("attachments", "is_primary")
    op.drop_column("assets", "rights_declaration")
    op.drop_column("assets", "inventors")
