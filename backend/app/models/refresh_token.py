"""用于安全令牌管理的刷新令牌模型。"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base


class RefreshToken(Base):
    """用于令牌轮换和撤销的刷新令牌模型。"""
    
    __tablename__ = "refresh_tokens"
    
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
    )
    
    # 用户关系
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # 令牌元数据
    device_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    # 令牌状态
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # 复合索引
    __table_args__ = (
        Index("ix_refresh_tokens_user_id_is_revoked", "user_id", "is_revoked"),
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )
    
    def __repr__(self) -> str:
        """
        返回刷新令牌对象的字符串表示形式。
        
        Returns:
            str: 包含令牌 ID、用户 ID 和撤销状态的格式化字符串。
        """
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, is_revoked={self.is_revoked})>"
