"""用户数据库模型。"""
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.refresh_token import RefreshToken
    from app.models.enterprise import EnterpriseMember
    from app.models.asset import Asset


class User(Base):
    """用于身份验证和个人资料管理的用户模型。"""
    
    __tablename__ = "users"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # 认证字段
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # 个人资料字段
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Web3 钱包绑定
    wallet_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        unique=True,
        nullable=True,
        index=True,
    )
    
    # 账户状态
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # 关系
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    enterprise_memberships: Mapped[List["EnterpriseMember"]] = relationship(
        "EnterpriseMember",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    created_assets: Mapped[List["Asset"]] = relationship(
        "Asset",
        back_populates="creator",
        lazy="selectin",
    )
    
    # 常用查询的复合索引
    __table_args__ = (
        Index("ix_users_email_is_active", "email", "is_active"),
    )
    
    def __repr__(self) -> str:
        """
        返回用户对象的字符串表示形式。
        
        Returns:
            str: 包含用户 ID、邮箱和用户名的格式化字符串。
        """
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
