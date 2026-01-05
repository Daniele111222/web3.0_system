"""企业数据库模型。"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class MemberRole(str, Enum):
    """
    企业成员角色枚举。
    
    定义企业内成员的权限级别：
    - OWNER: 所有者，拥有最高权限
    - ADMIN: 管理员，可管理成员和资产
    - MEMBER: 普通成员，可查看和操作资产
    - VIEWER: 观察者，仅可查看资产
    """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Enterprise(Base):
    """
    企业模型。
    
    用于存储企业组织信息，支持多租户架构。
    每个企业可以拥有多个成员和 IP 资产。
    """
    
    __tablename__ = "enterprises"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="企业唯一标识符",
    )
    
    # 基本信息
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="企业名称",
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="企业描述",
    )
    logo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="企业 Logo URL",
    )

    # 联系信息
    website: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="企业官网",
    )
    contact_email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="联系邮箱",
    )
    
    # 区块链相关
    wallet_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        unique=True,
        nullable=True,
        index=True,
        comment="企业钱包地址",
    )
    
    # 状态
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="企业是否激活",
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="企业是否已认证",
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
    members: Mapped[List["EnterpriseMember"]] = relationship(
        "EnterpriseMember",
        back_populates="enterprise",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_enterprises_name_is_active", "name", "is_active"),
    )
    
    def __repr__(self) -> str:
        """
        返回企业对象的字符串表示形式。
        
        Returns:
            str: 包含企业 ID 和名称的格式化字符串。
        """
        return f"<Enterprise(id={self.id}, name={self.name})>"


class EnterpriseMember(Base):
    """
    企业成员关联模型。
    
    用于存储用户与企业的关联关系，包括成员角色和加入时间。
    支持一个用户加入多个企业。
    """
    
    __tablename__ = "enterprise_members"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="成员关系唯一标识符",
    )
    
    # 外键
    enterprise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enterprises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所属企业 ID",
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="用户 ID",
    )
    
    # 角色
    role: Mapped[MemberRole] = mapped_column(
        SQLEnum(MemberRole),
        default=MemberRole.MEMBER,
        nullable=False,
        comment="成员角色",
    )
    
    # 时间戳
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        comment="加入时间",
    )
    
    # 关系
    enterprise: Mapped["Enterprise"] = relationship(
        "Enterprise",
        back_populates="members",
    )
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )
    
    # 唯一约束：一个用户在一个企业中只能有一个成员记录
    __table_args__ = (
        Index(
            "ix_enterprise_members_enterprise_user",
            "enterprise_id",
            "user_id",
            unique=True,
        ),
    )
    
    def __repr__(self) -> str:
        """
        返回企业成员对象的字符串表示形式。
        
        Returns:
            str: 包含成员 ID、企业 ID、用户 ID 和角色的格式化字符串。
        """
        return f"<EnterpriseMember(id={self.id}, enterprise_id={self.enterprise_id}, user_id={self.user_id}, role={self.role})>"
