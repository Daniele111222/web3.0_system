"""用于数据访问操作的刷新令牌仓库。"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class TokenRepository:
    """用于刷新令牌数据访问操作的仓库类。"""
    
    def __init__(self, db: AsyncSession):
        """
        初始化令牌仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
    
    async def create(self, token: RefreshToken) -> RefreshToken:
        """
        创建新的刷新令牌。
        
        Args:
            token (RefreshToken): 刷新令牌模型实例。
            
        Returns:
            RefreshToken: 创建后的刷新令牌实例。
        """
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token
    
    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """
        根据哈希值获取刷新令牌。
        
        Args:
            token_hash (str): 令牌哈希。
            
        Returns:
            Optional[RefreshToken]: 找到的刷新令牌，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()
    
    async def get_valid_token(self, token_hash: str) -> Optional[RefreshToken]:
        """
        获取有效的（未撤销且未过期）刷新令牌。
        
        Args:
            token_hash (str): 令牌哈希。
            
        Returns:
            Optional[RefreshToken]: 有效的刷新令牌，若不存在或无效则返回 None。
        """
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        )
        return result.scalar_one_or_none()
    
    async def revoke_token(self, token_hash: str) -> bool:
        """
        撤销指定的刷新令牌。
        
        Args:
            token_hash (str): 令牌哈希。
            
        Returns:
            bool: 撤销是否成功。
        """
        result = await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
        return result.rowcount > 0
    
    async def revoke_all_user_tokens(self, user_id: UUID) -> int:
        """
        撤销用户的所有刷新令牌。
        
        Args:
            user_id (UUID): 用户 ID。
            
        Returns:
            int: 被撤销的令牌数量。
        """
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            )
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
        return result.rowcount
    
    async def delete_expired_tokens(self) -> int:
        """
        删除所有已过期的令牌（清理任务）。
        
        Returns:
            int: 被删除的令牌数量。
        """
        result = await self.db.execute(
            delete(RefreshToken).where(
                RefreshToken.expires_at < datetime.now(timezone.utc)
            )
        )
        await self.db.commit()
        return result.rowcount
    
    async def count_active_tokens(self, user_id: UUID) -> int:
        """
        计算用户当前活跃的令牌数量。
        
        Args:
            user_id (UUID): 用户 ID。
            
        Returns:
            int: 活跃令牌的数量。
        """
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        )
        return len(result.scalars().all())
