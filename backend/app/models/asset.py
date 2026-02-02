"""资产数据库模型。"""
from datetime import datetime, date
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Index, Text, Date, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.enterprise import Enterprise


class AssetType(str, Enum):
    """
    资产类型枚举。
    
    定义支持的知识产权资产类型：
    - PATENT: 专利
    - TRADEMARK: 商标
    - COPYRIGHT: 版权
    - TRADE_SECRET: 商业秘密
    - DIGITAL_WORK: 数字作品
    """
    PATENT = "PATENT"
    TRADEMARK = "TRADEMARK"
    COPYRIGHT = "COPYRIGHT"
    TRADE_SECRET = "TRADE_SECRET"
    DIGITAL_WORK = "DIGITAL_WORK"


class LegalStatus(str, Enum):
    """
    法律状态枚举。
    
    定义资产的法律状态：
    - PENDING: 待审批
    - GRANTED: 已授权
    - EXPIRED: 已过期
    """
    PENDING = "PENDING"
    GRANTED = "GRANTED"
    EXPIRED = "EXPIRED"


class AssetStatus(str, Enum):
    """
    资产状态枚举。
    
    定义资产在系统中的状态：
    - DRAFT: 草稿（未铸造）
    - MINTED: 已铸造为 NFT
    - TRANSFERRED: 已转移
    - LICENSED: 已授权
    - STAKED: 已质押
    """
    DRAFT = "DRAFT"
    MINTED = "MINTED"
    TRANSFERRED = "TRANSFERRED"
    LICENSED = "LICENSED"
    STAKED = "STAKED"


class Asset(Base):
    """
    IP 资产模型。
    
    用于存储知识产权资产的详细信息，包括元数据、附件和 NFT 信息。
    每个资产属于一个企业，由一个用户创建。
    """
    
    __tablename__ = "assets"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="资产唯一标识符",
    )
    
    # 外键
    enterprise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enterprises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所属企业 ID",
    )
    creator_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="创建者用户 ID",
    )
    
    # 基本信息
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
        comment="资产名称",
    )
    type: Mapped[AssetType] = mapped_column(
        SQLEnum(AssetType),
        nullable=False,
        index=True,
        comment="资产类型",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="资产描述",
    )
    
    # 创作信息
    creator_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="创作人姓名",
    )
    creation_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="创作日期",
    )
    
    # 法律信息
    legal_status: Mapped[LegalStatus] = mapped_column(
        SQLEnum(LegalStatus),
        nullable=False,
        index=True,
        comment="法律状态",
    )
    application_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="申请号/注册号",
    )
    
    # 元数据（JSONB 格式，支持灵活扩展）
    asset_metadata: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment="资产元数据（JSON 格式）",
    )
    
    # 资产状态
    status: Mapped[AssetStatus] = mapped_column(
        SQLEnum(AssetStatus),
        default=AssetStatus.DRAFT,
        nullable=False,
        index=True,
        comment="资产状态",
    )
    
    # NFT 信息
    nft_token_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="NFT Token ID",
    )
    nft_contract_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        nullable=True,
        index=True,
        comment="NFT 合约地址",
    )
    nft_chain: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="NFT 所在区块链",
    )
    metadata_uri: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="NFT 元数据 URI（IPFS）",
    )
    mint_tx_hash: Mapped[Optional[str]] = mapped_column(
        String(66),
        nullable=True,
        comment="铸造交易哈希",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="创建时间",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="更新时间",
    )
    
    # 关系
    enterprise: Mapped["Enterprise"] = relationship(
        "Enterprise",
        lazy="selectin",
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        lazy="selectin",
    )
    attachments: Mapped[List["Attachment"]] = relationship(
        "Attachment",
        back_populates="asset",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_assets_enterprise_status", "enterprise_id", "status"),
        Index("ix_assets_type_status", "type", "status"),
        Index("ix_assets_created_at", "created_at"),
    )
    
    def __repr__(self) -> str:
        """
        返回资产对象的字符串表示形式。
        
        Returns:
            str: 包含资产 ID、名称和类型的格式化字符串。
        """
        return f"<Asset(id={self.id}, name={self.name}, type={self.type})>"


class Attachment(Base):
    """
    资产附件模型。
    
    用于存储资产相关的文件附件信息，文件实际存储在 IPFS 上。
    每个附件关联到一个资产。
    """
    
    __tablename__ = "attachments"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="附件唯一标识符",
    )
    
    # 外键
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所属资产 ID",
    )
    
    # 文件信息
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="文件名",
    )
    file_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="文件类型（MIME type）",
    )
    file_size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        comment="文件大小（字节）",
    )
    
    # IPFS 信息
    ipfs_cid: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
        comment="IPFS 内容标识符（CID）",
    )
    
    # 时间戳
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="上传时间",
    )
    
    # 关系
    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="attachments",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_attachments_asset_uploaded", "asset_id", "uploaded_at"),
    )
    
    def __repr__(self) -> str:
        """
        返回附件对象的字符串表示形式。
        
        Returns:
            str: 包含附件 ID、文件名和 IPFS CID 的格式化字符串。
        """
        return f"<Attachment(id={self.id}, file_name={self.file_name}, ipfs_cid={self.ipfs_cid})>"
