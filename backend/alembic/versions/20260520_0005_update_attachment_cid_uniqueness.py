"""Allow attachment CID reuse across different assets.

Revision ID: 20260520_0005
Revises: 20260416_0009
Create Date: 2026-05-20 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260520_0005"
down_revision = "20260416_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_ipfs_cid_key"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_attachments_ipfs_cid"))
    op.create_index(op.f("ix_attachments_ipfs_cid"), "attachments", ["ipfs_cid"], unique=False)
    op.create_unique_constraint(
        "uq_attachments_asset_ipfs_cid",
        "attachments",
        ["asset_id", "ipfs_cid"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_attachments_asset_ipfs_cid", "attachments", type_="unique")
    op.execute(sa.text("DROP INDEX IF EXISTS ix_attachments_ipfs_cid"))
    op.create_index(op.f("ix_attachments_ipfs_cid"), "attachments", ["ipfs_cid"], unique=True)
    op.create_unique_constraint(op.f("attachments_ipfs_cid_key"), "attachments", ["ipfs_cid"])
