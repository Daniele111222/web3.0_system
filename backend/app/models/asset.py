"""资产数据库模型。"""
from datetime import datetime, date, timezone
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Index, Text, Date, BigInteger, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.enterprise import Enterprise
    from app.models.asset import MintRecord


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
    - PENDING: 待审批
    - MINTING: 铸造中
    - MINTED: 已铸造为 NFT
    - REJECTED: 已拒绝
    - TRANSFERRED: 已转移
    - LICENSED: 已授权
    - STAKED: 已质押
    - MINT_FAILED: 铸造失败
    """
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    MINTING = "MINTING"
    MINTED = "MINTED"
    REJECTED = "REJECTED"
    TRANSFERRED = "TRANSFERRED"
    LICENSED = "LICENSED"
    STAKED = "STAKED"
    MINT_FAILED = "MINT_FAILED"


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
    
    # 元数据（JSON 格式，支持灵活扩展）
    asset_metadata: Mapped[dict] = mapped_column(
        JSON,
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
        index=True,
        comment="铸造交易哈希",
    )
    metadata_cid: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="元数据IPFS CID",
    )
    
    # 铸造进度
    mint_stage: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED",
    )
    mint_progress: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="铸造进度百分比 0-100",
    )
    
    # 链上信息
    mint_block_number: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="铸造区块号",
    )
    mint_gas_used: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="Gas消耗",
    )
    mint_gas_price: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        comment="Gas价格 (wei)",
    )
    mint_total_cost_eth: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        comment="总成本 (ETH)",
    )
    
    # 确认信息
    mint_confirmations: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        default=0,
        comment="当前确认数",
    )
    required_confirmations: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        default=6,
        comment="所需确认数",
    )
    
    # 接收者
    recipient_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        nullable=True,
        comment="NFT接收地址",
    )

    # 权属状态（独立于资产流程状态，专门记录链上所有权）
    ownership_status: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True,
        comment="权属状态: ACTIVE/LICENSED/STAKED/TRANSFERRED",
    )
    owner_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        nullable=True,
        index=True,
        comment="当前持有者钱包地址（铸造后更新，转移后变更）",
    )
    current_owner_enterprise_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enterprises.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="当前归属企业 ID（可能与创建时的 enterprise_id 不同）",
    )
    
    # 时间戳
    mint_requested_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="铸造请求时间",
    )
    mint_submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="交易提交时间",
    )
    mint_confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="交易确认时间",
    )
    mint_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="铸造完成时间",
    )
    last_mint_attempt_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="上次铸造尝试时间",
    )
    
    # 错误处理
    mint_attempt_count: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        default=0,
        comment="铸造尝试次数",
    )
    max_mint_attempts: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        default=3,
        comment="最大铸造尝试次数",
    )
    last_mint_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="上次铸造错误信息",
    )
    last_mint_error_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="上次铸造错误码",
    )
    can_retry: Mapped[Optional[bool]] = mapped_column(
        nullable=True,
        default=True,
        comment="是否可重试",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="创建时间",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="更新时间",
    )
    
    # 关系
    enterprise: Mapped["Enterprise"] = relationship(
        "Enterprise",
        foreign_keys=[enterprise_id],
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
    mint_records: Mapped[List["MintRecord"]] = relationship(
        "MintRecord",
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
        default=lambda: datetime.now(timezone.utc),
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


class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="铸造记录唯一标识符",
    )
    
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="关联资产ID",
    )
    
    operation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="操作类型: REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS",
    )
    
    stage: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED",
    )
    
    operator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="操作者用户ID",
    )
    
    operator_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        nullable=True,
        comment="操作者钱包地址",
    )
    
    token_id: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="NFT Token ID",
    )
    
    tx_hash: Mapped[Optional[str]] = mapped_column(
        String(66),
        nullable=True,
        index=True,
        comment="交易哈希",
    )
    
    block_number: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="区块号",
    )
    
    gas_used: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="Gas消耗",
    )
    
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        comment="状态: PENDING/SUCCESS/FAILED",
    )
    
    error_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="错误码",
    )
    
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="错误信息",
    )
    
    metadata_uri: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="NFT元数据URI",
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="创建时间",
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="更新时间",
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="完成时间",
    )
    
    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="mint_records",
    )
    
    operator: Mapped[Optional["User"]] = relationship("User")
    
    __table_args__ = (
        Index("ix_mint_records_asset_created", "asset_id", "created_at"),
        Index("ix_mint_records_tx_hash", "tx_hash"),
        Index("ix_mint_records_status", "status"),
    )
    
    def __repr__(self) -> str:
        return f"<MintRecord(id={self.id}, asset_id={self.asset_id}, operation={self.operation}, status={self.status})>"
