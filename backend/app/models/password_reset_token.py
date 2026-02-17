"""用于密码重置功能的数据库模型。"""
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetToken(Base):
    """用于安全密码重置流程的密码重置令牌模型。
    
    该模型管理一次性密码重置令牌，具有以下安全特性：
    - 令牌哈希安全存储（不存储原始令牌）
    - 30分钟过期时间
    - 一次性使用（使用后标记为已使用）
    - 与用户账户关联
    """
    
    __tablename__ = "password_reset_tokens"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # 令牌数据 - 存储哈希值而非原始令牌
    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        comment="SHA-256哈希后的令牌值",
    )
    
    # 用户关系 - 关联到请求重置的用户账户
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="请求密码重置的用户ID",
    )
    
    # 使用状态追踪 - 确保令牌只能使用一次
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
        comment="令牌过期时间（默认30分钟）",
    )
    
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="令牌使用时间",
    )
    
    # 关系 - 反向关联到用户模型
    user: Mapped["User"] = relationship(
        "User",
        back_populates="password_reset_tokens",
        lazy="selectin",
    )
    
    # 数据库索引优化
    __table_args__ = (
        # 复合索引：按用户和状态查询活跃令牌
        Index("ix_password_reset_tokens_user_is_used", "user_id", "is_used"),
        # 索引：清理过期令牌
        Index("ix_password_reset_tokens_expires_at", "expires_at"),
    )
    
    def is_valid(self) -> bool:
        """
        检查令牌是否有效（未过期且未被使用）。
        
        Returns:
            bool: 令牌有效返回True，否则返回False
        """
        now = datetime.now(timezone.utc)
        return not self.is_used and self.expires_at > now
    
    def mark_as_used(self) -> None:
        """
        标记令牌为已使用状态。
        
        在成功重置密码后调用此方法，确保令牌不能被重复使用。
        """
        self.is_used = True
        self.used_at = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        """
        返回密码重置令牌对象的字符串表示。
        
        Returns:
            str: 包含令牌ID、用户ID和有效状态的格式化字符串
        """
        is_valid_str = "valid" if self.is_valid() else "invalid"
        return (
            f"<PasswordResetToken("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"is_used={self.is_used}, "
            f"status={is_valid_str})>"
        )
