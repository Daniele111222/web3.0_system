"""User repository for data access operations."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """Repository for user data access operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, user: User) -> User:
        """Create a new user."""
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_wallet_address(self, wallet_address: str) -> Optional[User]:
        """Get user by wallet address."""
        result = await self.db.execute(
            select(User).where(User.wallet_address == wallet_address.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_active_by_email(self, email: str) -> Optional[User]:
        """Get active user by email."""
        result = await self.db.execute(
            select(User).where(
                User.email == email.lower(),
                User.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def update_last_login(self, user_id: UUID) -> None:
        """Update user's last login timestamp."""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
    
    async def update_wallet_address(
        self, user_id: UUID, wallet_address: str
    ) -> Optional[User]:
        """Update user's wallet address."""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(wallet_address=wallet_address.lower())
        )
        return await self.get_by_id(user_id)
    
    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        result = await self.db.execute(
            select(User.id).where(User.email == email.lower())
        )
        return result.scalar_one_or_none() is not None
    
    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        result = await self.db.execute(
            select(User.id).where(User.username == username.lower())
        )
        return result.scalar_one_or_none() is not None
    
    async def wallet_address_exists(self, wallet_address: str) -> bool:
        """Check if wallet address already bound."""
        result = await self.db.execute(
            select(User.id).where(User.wallet_address == wallet_address.lower())
        )
        return result.scalar_one_or_none() is not None
