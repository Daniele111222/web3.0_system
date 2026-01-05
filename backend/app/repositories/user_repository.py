"""用于数据访问操作的用户仓库。"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """用于用户数据访问操作的仓库类。"""
    
    def __init__(self, db: AsyncSession):
        """
        初始化用户仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
    
    async def create(self, user: User) -> User:
        """
        创建新用户。
        
        Args:
            user (User): 用户模型实例。
            
        Returns:
            User: 创建后的用户实例。
        """
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """
        根据 ID 获取用户。
        
        Args:
            user_id (UUID): 用户 ID。
            
        Returns:
            Optional[User]: 找到的用户，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        根据电子邮箱获取用户。
        
        Args:
            email (str): 电子邮箱。
            
        Returns:
            Optional[User]: 找到的用户，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """
        根据用户名获取用户。
        
        Args:
            username (str): 用户名。
            
        Returns:
            Optional[User]: 找到的用户，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_wallet_address(self, wallet_address: str) -> Optional[User]:
        """
        根据钱包地址获取用户。
        
        Args:
            wallet_address (str): 钱包地址。
            
        Returns:
            Optional[User]: 找到的用户，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(User).where(User.wallet_address == wallet_address.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_active_by_email(self, email: str) -> Optional[User]:
        """
        根据邮箱获取活跃用户。
        
        Args:
            email (str): 电子邮箱。
            
        Returns:
            Optional[User]: 找到的活跃用户，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(User).where(
                User.email == email.lower(),
                User.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def update_last_login(self, user_id: UUID) -> None:
        """
        更新用户的最后登录时间戳。
        
        Args:
            user_id (UUID): 用户 ID。
        """
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
    
    async def update_wallet_address(
        self, user_id: UUID, wallet_address: str
    ) -> Optional[User]:
        """
        更新用户的钱包地址。
        
        Args:
            user_id (UUID): 用户 ID。
            wallet_address (str): 新的钱包地址。
            
        Returns:
            Optional[User]: 更新后的用户实例。
        """
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(wallet_address=wallet_address.lower())
        )
        return await self.get_by_id(user_id)
    
    async def email_exists(self, email: str) -> bool:
        """
        检查电子邮箱是否已存在。
        
        Args:
            email (str): 电子邮箱。
            
        Returns:
            bool: 是否存在。
        """
        result = await self.db.execute(
            select(User.id).where(User.email == email.lower())
        )
        return result.scalar_one_or_none() is not None
    
    async def username_exists(self, username: str) -> bool:
        """
        检查用户名是否已存在。
        
        Args:
            username (str): 用户名。
            
        Returns:
            bool: 是否存在。
        """
        result = await self.db.execute(
            select(User.id).where(User.username == username.lower())
        )
        return result.scalar_one_or_none() is not None
    
    async def wallet_address_exists(self, wallet_address: str) -> bool:
        """
        检查钱包地址是否已绑定。
        
        Args:
            wallet_address (str): 钱包地址。
            
        Returns:
            bool: 是否已绑定。
        """
        result = await self.db.execute(
            select(User.id).where(User.wallet_address == wallet_address.lower())
        )
        return result.scalar_one_or_none() is not None
