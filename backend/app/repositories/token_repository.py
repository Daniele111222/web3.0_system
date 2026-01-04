"""Refresh token repository for data access operations."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class TokenRepository:
    """Repository for refresh token data access operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, token: RefreshToken) -> RefreshToken:
        """Create a new refresh token."""
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token
    
    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Get refresh token by hash."""
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()
    
    async def get_valid_token(self, token_hash: str) -> Optional[RefreshToken]:
        """Get valid (not revoked, not expired) refresh token."""
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()
    
    async def revoke_token(self, token_hash: str) -> bool:
        """Revoke a refresh token."""
        result = await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(is_revoked=True, revoked_at=datetime.utcnow())
        )
        return result.rowcount > 0
    
    async def revoke_all_user_tokens(self, user_id: UUID) -> int:
        """Revoke all refresh tokens for a user."""
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            )
            .values(is_revoked=True, revoked_at=datetime.utcnow())
        )
        return result.rowcount
    
    async def delete_expired_tokens(self) -> int:
        """Delete all expired tokens (cleanup task)."""
        result = await self.db.execute(
            delete(RefreshToken).where(
                RefreshToken.expires_at < datetime.utcnow()
            )
        )
        return result.rowcount
    
    async def count_active_tokens(self, user_id: UUID) -> int:
        """Count active tokens for a user."""
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        return len(result.scalars().all())
