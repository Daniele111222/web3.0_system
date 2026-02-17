"""用于邮箱验证令牌数据访问的仓库模块。"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification_token import EmailVerificationToken


class EmailVerificationTokenRepository:
    """管理邮箱验证令牌的创建、检索和更新的仓库类。"""
    
    def __init__(self, db: AsyncSession):
        """
        初始化仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话
        """
        self.db = db
    
    async def create(self, token: EmailVerificationToken) -> EmailVerificationToken:
        """
        创建新的邮箱验证令牌。
        
        Args:
            token (EmailVerificationToken): 要创建的令牌实例
            
        Returns:
            EmailVerificationToken: 创建后的令牌实例
        """
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token
    
    async def get_by_token_hash(
        self,
        token_hash: str,
    ) -> Optional[EmailVerificationToken]:
        """
        通过令牌哈希获取邮箱验证令牌。
        
        Args:
            token_hash (str): 令牌的SHA-256哈希值
            
        Returns:
            Optional[EmailVerificationToken]: 找到的令牌，不存在则返回None
        """
        result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()
    
    async def get_valid_token(
        self,
        token_hash: str,
    ) -> Optional[EmailVerificationToken]:
        """
        获取有效的邮箱验证令牌（未过期且未被使用）。
        
        Args:
            token_hash (str): 令牌的SHA-256哈希值
            
        Returns:
            Optional[EmailVerificationToken]: 有效的令牌，不存在或已过期则返回None
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash == token_hash,
                EmailVerificationToken.is_used == False,
                EmailVerificationToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_valid_tokens(
        self,
        user_id: UUID,
    ) -> list[EmailVerificationToken]:
        """
        获取用户所有未过期的验证令牌。
        
        Args:
            user_id (UUID): 用户ID
            
        Returns:
            list[EmailVerificationToken]: 该用户未过期的验证令牌列表
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.is_used == False,
                EmailVerificationToken.expires_at > now,
            )
        )
        return list(result.scalars().all())
    
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
            update(EmailVerificationToken)
            .where(EmailVerificationToken.token_hash == token_hash)
            .values(
                is_used=True,
                used_at=now,
            )
        )
        # 检查是否有行被更新
        select_result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash == token_hash,
                EmailVerificationToken.is_used == True
            )
        )
        return select_result.scalar_one_or_none() is not None
    
    async def revoke_user_tokens(
        self,
        user_id: UUID,
    ) -> int:
        """
        撤销用户的所有未使用邮箱验证令牌。
        
        Args:
            user_id (UUID): 用户ID
            
        Returns:
            int: 撤销的令牌数量
        """
        now = datetime.now(timezone.utc)
        # 先查询将要撤销的数量
        count_result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.is_used == False,
                EmailVerificationToken.expires_at > now,
            )
        )
        count = len(list(count_result.scalars().all()))
        
        # 执行更新
        await self.db.execute(
            update(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.is_used == False,
                EmailVerificationToken.expires_at > now,
            )
            .values(is_used=True)
        )
        return count
    
    async def delete_expired_tokens(self) -> int:
        """
        删除所有已过期的邮箱验证令牌。
        
        Returns:
            int: 删除的令牌数量
        """
        now = datetime.now(timezone.utc)
        # 先查询数量
        count_result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.expires_at < now
            )
        )
        count = len(list(count_result.scalars().all()))
        
        # 执行删除
        await self.db.execute(
            delete(EmailVerificationToken).where(
                EmailVerificationToken.expires_at < now
            )
        )
        return count
    
    async def has_recent_request(
        self,
        user_id: UUID,
        seconds: int = 60,
    ) -> bool:
        """
        检查用户是否在最近指定秒内请求过验证邮件。
        
        Args:
            user_id (UUID): 用户ID
            seconds (int): 时间窗口（秒），默认60秒
            
        Returns:
            bool: 如果在指定时间内有过请求返回True
        """
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=seconds)
        result = await self.db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.created_at > cutoff,
            )
        )
        return result.scalar_one_or_none() is not None
