"""权属管理数据模型。"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SQLEnum, BigInteger, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.enterprise import Enterprise
    from app.models.user import User


class OwnershipStatus(str, Enum):
    """NFT 资产权属状态。

    - ACTIVE: 有效持有中
    - LICENSED: 已对外许可使用
    - STAKED: 已质押
    - TRANSFERRED: 已转移给他方
    """
    ACTIVE = "ACTIVE"
    LICENSED = "LICENSED"
    STAKED = "STAKED"
    TRANSFERRED = "TRANSFERRED"


class TransferType(str, Enum):
    """权属变更类型。"""
    MINT = "MINT"
    TRANSFER = "TRANSFER"
    LICENSE = "LICENSE"
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"
    BURN = "BURN"


class TransferStatus(str, Enum):
    """转移记录状态。"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class NFTTransferRecord(Base):
    """NFT 权属变更历史记录表。

    记录每一次链上转移操作，包括铸造、转移、许可、质押等。
    与 MintRecord 职责分离：MintRecord 专注铸造审计，本表专注权属流转。
    """

    __tablename__ = "nft_transfer_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="记录唯一标识符",
    )

    # 关联资产
    token_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
        comment="NFT Token ID",
    )
    contract_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="合约地址",
    )

    # 变更类型
    transfer_type: Mapped[TransferType] = mapped_column(
        SQLEnum(TransferType),
        nullable=False,
        default=TransferType.TRANSFER,
        comment="权属变更类型",
    )

    # 转出方
    from_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="转出方钱包地址",
    )
    from_enterprise_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enterprises.id", ondelete="SET NULL"),
        nullable=True,
        comment="转出方企业 ID",
    )
    from_enterprise_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        comment="转出方企业名称（冗余存储，防止企业被删除后丢失历史）",
    )

    # 转入方
    to_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="转入方钱包地址",
    )
    to_enterprise_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enterprises.id", ondelete="SET NULL"),
        nullable=True,
        comment="转入方企业 ID",
    )
    to_enterprise_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        comment="转入方企业名称（冗余存储）",
    )

    # 操作者
    operator_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="操作者用户 ID",
    )

    # 链上信息
    tx_hash: Mapped[Optional[str]] = mapped_column(
        String(66),
        nullable=True,
        unique=True,
        index=True,
        comment="链上交易哈希",
    )
    block_number: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
        comment="所在区块号",
    )
    block_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="区块时间戳",
    )

    # 状态与备注
    status: Mapped[TransferStatus] = mapped_column(
        SQLEnum(TransferStatus),
        nullable=False,
        default=TransferStatus.PENDING,
        comment="转移状态",
    )
    remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="备注",
    )

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="记录创建时间",
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="链上确认时间",
    )

    # 关系
    from_enterprise: Mapped[Optional["Enterprise"]] = relationship(
        "Enterprise",
        foreign_keys=[from_enterprise_id],
    )
    to_enterprise: Mapped[Optional["Enterprise"]] = relationship(
        "Enterprise",
        foreign_keys=[to_enterprise_id],
    )
    operator: Mapped[Optional["User"]] = relationship("User")

    # 索引
    __table_args__ = (
        Index("ix_nft_transfers_token_status", "token_id", "status"),
        Index("ix_nft_transfers_from_enterprise", "from_enterprise_id"),
        Index("ix_nft_transfers_to_enterprise", "to_enterprise_id"),
        Index("ix_nft_transfers_created", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<NFTTransferRecord(id={self.id}, token_id={self.token_id}, "
            f"type={self.transfer_type}, status={self.status})>"
        )
