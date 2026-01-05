"""企业数据访问仓库。"""
from datetime import datetime
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole


class EnterpriseRepository:
    """
    企业数据访问仓库类。
    
    提供企业相关的数据库操作方法，包括 CRUD 操作和查询功能。
    """
    
    def __init__(self, db: AsyncSession):
        """
        初始化企业仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
    
    async def create(self, enterprise: Enterprise) -> Enterprise:
        """
        创建新企业。
        
        Args:
            enterprise (Enterprise): 企业模型实例。
            
        Returns:
            Enterprise: 创建后的企业实例（包含生成的 ID）。
        """
        self.db.add(enterprise)
        await self.db.flush()
        await self.db.refresh(enterprise)
        return enterprise
    
    async def get_by_id(self, enterprise_id: UUID) -> Optional[Enterprise]:
        """
        根据 ID 获取企业。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            Optional[Enterprise]: 找到的企业，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(Enterprise)
            .options(selectinload(Enterprise.members))
            .where(Enterprise.id == enterprise_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id_simple(self, enterprise_id: UUID) -> Optional[Enterprise]:
        """
        根据 ID 获取企业（不加载关联数据）。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            Optional[Enterprise]: 找到的企业，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(Enterprise).where(Enterprise.id == enterprise_id)
        )
        return result.scalar_one_or_none()

    async def get_by_wallet_address(self, wallet_address: str) -> Optional[Enterprise]:
        """
        根据钱包地址获取企业。
        
        Args:
            wallet_address (str): 企业钱包地址。
            
        Returns:
            Optional[Enterprise]: 找到的企业，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(Enterprise).where(
                Enterprise.wallet_address == wallet_address.lower()
            )
        )
        return result.scalar_one_or_none()
    
    async def get_list(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Enterprise], int]:
        """
        获取企业列表（分页）。
        
        Args:
            page (int): 页码，从 1 开始。
            page_size (int): 每页数量。
            is_active (Optional[bool]): 筛选激活状态。
            search (Optional[str]): 搜索关键词（匹配名称）。
            
        Returns:
            Tuple[List[Enterprise], int]: 企业列表和总数量的元组。
        """
        # 构建查询条件
        conditions = []
        if is_active is not None:
            conditions.append(Enterprise.is_active == is_active)
        if search:
            conditions.append(Enterprise.name.ilike(f"%{search}%"))
        
        # 查询总数
        count_query = select(func.count(Enterprise.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # 查询列表
        query = select(Enterprise).order_by(Enterprise.created_at.desc())
        if conditions:
            query = query.where(and_(*conditions))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(query)
        enterprises = list(result.scalars().all())
        
        return enterprises, total
    
    async def get_user_enterprises(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Enterprise], int]:
        """
        获取用户所属的企业列表。
        
        Args:
            user_id (UUID): 用户 ID。
            page (int): 页码，从 1 开始。
            page_size (int): 每页数量。
            
        Returns:
            Tuple[List[Enterprise], int]: 企业列表和总数量的元组。
        """
        # 查询总数
        count_query = (
            select(func.count(Enterprise.id))
            .join(EnterpriseMember)
            .where(EnterpriseMember.user_id == user_id)
        )
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # 查询列表
        query = (
            select(Enterprise)
            .join(EnterpriseMember)
            .where(EnterpriseMember.user_id == user_id)
            .order_by(Enterprise.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        enterprises = list(result.scalars().all())
        
        return enterprises, total
    
    async def update(
        self,
        enterprise_id: UUID,
        **kwargs,
    ) -> Optional[Enterprise]:
        """
        更新企业信息。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            **kwargs: 要更新的字段和值。
            
        Returns:
            Optional[Enterprise]: 更新后的企业实例。
        """
        # 过滤掉 None 值
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        if not update_data:
            return await self.get_by_id(enterprise_id)
        
        await self.db.execute(
            update(Enterprise)
            .where(Enterprise.id == enterprise_id)
            .values(**update_data)
        )
        return await self.get_by_id(enterprise_id)
    
    async def update_wallet_address(
        self,
        enterprise_id: UUID,
        wallet_address: str,
    ) -> Optional[Enterprise]:
        """
        更新企业钱包地址。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            wallet_address (str): 新的钱包地址。
            
        Returns:
            Optional[Enterprise]: 更新后的企业实例。
        """
        await self.db.execute(
            update(Enterprise)
            .where(Enterprise.id == enterprise_id)
            .values(wallet_address=wallet_address.lower())
        )
        return await self.get_by_id(enterprise_id)
    
    async def delete(self, enterprise_id: UUID) -> bool:
        """
        删除企业。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            bool: 删除是否成功。
        """
        result = await self.db.execute(
            delete(Enterprise).where(Enterprise.id == enterprise_id)
        )
        return result.rowcount > 0
    
    async def wallet_address_exists(self, wallet_address: str) -> bool:
        """
        检查钱包地址是否已被使用。
        
        Args:
            wallet_address (str): 钱包地址。
            
        Returns:
            bool: 是否已存在。
        """
        result = await self.db.execute(
            select(Enterprise.id).where(
                Enterprise.wallet_address == wallet_address.lower()
            )
        )
        return result.scalar_one_or_none() is not None
    
    async def get_member_count(self, enterprise_id: UUID) -> int:
        """
        获取企业成员数量。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            int: 成员数量。
        """
        result = await self.db.execute(
            select(func.count(EnterpriseMember.id)).where(
                EnterpriseMember.enterprise_id == enterprise_id
            )
        )
        return result.scalar_one()


class EnterpriseMemberRepository:
    """
    企业成员数据访问仓库类。
    
    提供企业成员关系的数据库操作方法。
    """
    
    def __init__(self, db: AsyncSession):
        """
        初始化企业成员仓库。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
    
    async def create(self, member: EnterpriseMember) -> EnterpriseMember:
        """
        创建企业成员关系。
        
        Args:
            member (EnterpriseMember): 成员关系模型实例。
            
        Returns:
            EnterpriseMember: 创建后的成员关系实例。
        """
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member
    
    async def get_by_id(self, member_id: UUID) -> Optional[EnterpriseMember]:
        """
        根据 ID 获取成员关系。
        
        Args:
            member_id (UUID): 成员关系 ID。
            
        Returns:
            Optional[EnterpriseMember]: 找到的成员关系，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(EnterpriseMember)
            .options(selectinload(EnterpriseMember.user))
            .where(EnterpriseMember.id == member_id)
        )
        return result.scalar_one_or_none()
    
    async def get_member(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> Optional[EnterpriseMember]:
        """
        获取指定企业中指定用户的成员关系。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Returns:
            Optional[EnterpriseMember]: 找到的成员关系，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(EnterpriseMember)
            .options(selectinload(EnterpriseMember.user))
            .where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def get_enterprise_members(
        self,
        enterprise_id: UUID,
    ) -> List[EnterpriseMember]:
        """
        获取企业的所有成员。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            List[EnterpriseMember]: 成员关系列表。
        """
        result = await self.db.execute(
            select(EnterpriseMember)
            .options(selectinload(EnterpriseMember.user))
            .where(EnterpriseMember.enterprise_id == enterprise_id)
            .order_by(EnterpriseMember.joined_at)
        )
        return list(result.scalars().all())
    
    async def get_user_role(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> Optional[MemberRole]:
        """
        获取用户在企业中的角色。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Returns:
            Optional[MemberRole]: 用户角色，若不是成员则返回 None。
        """
        result = await self.db.execute(
            select(EnterpriseMember.role).where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def update_role(
        self,
        enterprise_id: UUID,
        user_id: UUID,
        role: MemberRole,
    ) -> Optional[EnterpriseMember]:
        """
        更新成员角色。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            role (MemberRole): 新角色。
            
        Returns:
            Optional[EnterpriseMember]: 更新后的成员关系实例。
        """
        await self.db.execute(
            update(EnterpriseMember)
            .where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
            .values(role=role)
        )
        return await self.get_member(enterprise_id, user_id)
    
    async def delete(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        删除成员关系。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Returns:
            bool: 删除是否成功。
        """
        result = await self.db.execute(
            delete(EnterpriseMember).where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
        )
        return result.rowcount > 0
    
    async def is_member(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        检查用户是否是企业成员。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Returns:
            bool: 是否是成员。
        """
        result = await self.db.execute(
            select(EnterpriseMember.id).where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None
    
    async def get_owner(
        self,
        enterprise_id: UUID,
    ) -> Optional[EnterpriseMember]:
        """
        获取企业所有者。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            
        Returns:
            Optional[EnterpriseMember]: 所有者的成员关系，若不存在则返回 None。
        """
        result = await self.db.execute(
            select(EnterpriseMember)
            .options(selectinload(EnterpriseMember.user))
            .where(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.role == MemberRole.OWNER,
            )
        )
        return result.scalar_one_or_none()
