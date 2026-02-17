"""用于密码重置令牌数据访问的仓库模块。"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken


class PasswordResetTokenRepository:
    """管理密码重置令牌的创建、检索和更新的仓库类。"""
    
    def __init__(self, db: AsyncSession):
        """
        初始化仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话
        """
        self.db = db
    
    async def create(self, token: PasswordResetToken) -> PasswordResetToken:
        """
        创建新的密码重置令牌。
        
        Args:
            token (PasswordResetToken): 要创建的令牌实例
            
        Returns:
            PasswordResetToken: 创建后的令牌实例
        """
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token
    
    async def get_by_token_hash(
        self,
        token_hash: str,
    ) -> Optional[PasswordResetToken]:
        """
        通过令牌哈希获取密码重置令牌。
        
        Args:
            token_hash (str): 令牌的SHA-256哈希值
            
        Returns:
            Optional[PasswordResetToken]: 找到的令牌，不存在则返回None
        """
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()
    
    async def get_valid_token(
        self,
        token_hash: str,
    ) -> Optional[PasswordResetToken]:
        """
        获取有效的密码重置令牌（未过期且未被使用）。
        
        Args:
            token_hash (str): 令牌的SHA-256哈希值
            
        Returns:
            Optional[PasswordResetToken]: 有效的令牌，不存在或已过期则返回None
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.is_used == False,
                PasswordResetToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none()
    
    async def mark_as_used(
        self,
        token_hash: str,
    ) -> bool:
        """
        标记令牌为已使用状态。
        
        Args:
            token_hash (str): 令牌的SHA-256哈希值
            
        Returns:
            bool: 是否成功标记
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.token_hash == token_hash)
            .values(
                is_used=True,
                used_at=now,
            )
        )
        # 对于update操作，检查是否有行被更新
        # 使用fetchone检查是否有结果
        select_result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.is_used == True
            )
        )
        return select_result.scalar_one_or_none() is not None
    
    async def revoke_user_tokens(
        self,
        user_id: UUID,
    ) -> int:
        """
        撤销用户的所有未使用密码重置令牌。
        
        Args:
            user_id (UUID): 用户ID
            
        Returns:
            int: 撤销的令牌数量
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.is_used == False,
                PasswordResetToken.expires_at > now,
            )
            .values(is_used=True)
        )
        # 查询并返回被更新的数量
        count_result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.is_used == True,
            )
        )
        return len(list(count_result.scalars().all()))
    
    async def delete_expired_tokens(self) -> int:
        """
        删除所有已过期的密码重置令牌。
        
        Returns:
            int: 删除的令牌数量
        """
        now = datetime.now(timezone.utc)
        # 先查询数量
        count_result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.expires_at < now
            )
        )
        count = len(list(count_result.scalars().all()))
        
        # 执行删除
        await self.db.execute(
            delete(PasswordResetToken).where(
                PasswordResetToken.expires_at < now
            )
        )
        return count
    
    async def has_recent_request(
        self,
        user_id: UUID,
        minutes: int = 5,
    ) -> bool:
        """
        检查用户是否在最近指定时间内请求过密码重置。
        
        Args:
            user_id (UUID): 用户ID
            minutes (int): 时间窗口（分钟），默认5分钟
            
        Returns:
            bool: 如果在指定时间内有过请求返回True
        """
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.created_at > cutoff,
            )
        )
        return result.scalar_one_or_none() is not None
