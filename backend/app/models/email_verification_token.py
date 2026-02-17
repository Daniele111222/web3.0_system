"""用于邮箱验证功能的数据库模型。"""
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class EmailVerificationToken(Base):
    """用于安全邮箱验证流程的邮箱验证令牌模型。"""
    
    __tablename__ = "email_verification_tokens"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # 令牌数据
    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        comment="SHA-256哈希后的令牌值",
    )
    
    # 用户关系
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="需要验证邮箱的用户ID",
    )
    
    # 使用状态追踪
    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="标记令牌是否已被使用",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="令牌创建时间",
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="令牌过期时间（默认24小时）",
    )
    
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="令牌使用时间",
    )
    
    # 关系
    user: Mapped["User"] = relationship(
        "User",
        back_populates="email_verification_tokens",
        lazy="selectin",
    )
    
    # 数据库索引优化
    __table_args__ = (
        Index("ix_email_verification_tokens_user_is_used", "user_id", "is_used"),
        Index("ix_email_verification_tokens_expires_at", "expires_at"),
    )
    
    def is_valid(self) -> bool:
        """检查令牌是否有效（未过期且未被使用）。"""
        now = datetime.now(timezone.utc)
        return not self.is_used and self.expires_at > now
    
    def mark_as_used(self) -> None:
        """标记令牌为已使用状态。"""
        self.is_used = True
        self.used_at = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        """返回邮箱验证令牌对象的字符串表示。"""
        is_valid_str = "valid" if self.is_valid() else "invalid"
        return (
            f"<EmailVerificationToken("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"is_used={self.is_used}, "
            f"status={is_valid_str})>"
        )
