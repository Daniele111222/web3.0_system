"""资产数据访问层。"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import date
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, Attachment, AssetType, AssetStatus, LegalStatus


class AssetRepository:
    """资产数据访问类。"""
    
    def __init__(self, db: AsyncSession):
        """
        初始化资产仓库。
        
        Args:
            db: 异步数据库会话
        """
        self.db = db
    
    async def create_asset(self, asset: Asset) -> Asset:
        """
        创建资产。
        
        Args:
            asset: 资产对象
            
        Returns:
            Asset: 创建的资产
        """
        self.db.add(asset)
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def get_asset_by_id(self, asset_id: UUID) -> Optional[Asset]:
        """
        根据 ID 获取资产。
        
        Args:
            asset_id: 资产 ID
            
        Returns:
            Optional[Asset]: 资产对象，不存在则返回 None
        """
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        return result.scalar_one_or_none()
    
    async def get_assets_by_enterprise(
        self,
        enterprise_id: UUID,
        asset_type: Optional[AssetType] = None,
        status: Optional[AssetStatus] = None,
        legal_status: Optional[LegalStatus] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Asset], int]:
        """
        获取企业的资产列表（支持筛选和分页）。
        
        Args:
            enterprise_id: 企业 ID
            asset_type: 资产类型筛选
            status: 资产状态筛选
            legal_status: 法律状态筛选
            start_date: 创作日期起始
            end_date: 创作日期结束
            search: 搜索关键词
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            Tuple[List[Asset], int]: (资产列表, 总数)
        """
        # 构建查询
        query = select(Asset).where(Asset.enterprise_id == enterprise_id)
        
        # 应用筛选条件
        if asset_type is not None:
            query = query.where(Asset.type == asset_type)
        
        if status is not None:
            query = query.where(Asset.status == status)
        
        if legal_status is not None:
            query = query.where(Asset.legal_status == legal_status)
        
        if start_date is not None:
            query = query.where(Asset.creation_date >= start_date)
        
        if end_date is not None:
            query = query.where(Asset.creation_date <= end_date)
        
        if search is not None and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Asset.name.ilike(search_pattern),
                    Asset.description.ilike(search_pattern),
                    Asset.creator_name.ilike(search_pattern),
                )
            )
        
        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # 应用分页和排序
        query = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit)
        
        # 执行查询
        result = await self.db.execute(query)
        assets = list(result.scalars().all())
        
        return assets, total
    
    async def update_asset(self, asset: Asset) -> Asset:
        """
        更新资产。
        
        Args:
            asset: 资产对象
            
        Returns:
            Asset: 更新后的资产
        """
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def delete_asset(self, asset: Asset) -> None:
        """
        删除资产。
        
        Args:
            asset: 资产对象
        """
        await self.db.delete(asset)
        await self.db.commit()
    
    async def add_attachment(self, attachment: Attachment) -> Attachment:
        """
        添加附件。
        
        Args:
            attachment: 附件对象
            
        Returns:
            Attachment: 创建的附件
        """
        self.db.add(attachment)
        await self.db.commit()
        await self.db.refresh(attachment)
        return attachment
    
    async def get_attachment_by_id(self, attachment_id: UUID) -> Optional[Attachment]:
        """
        根据 ID 获取附件。
        
        Args:
            attachment_id: 附件 ID
            
        Returns:
            Optional[Attachment]: 附件对象，不存在则返回 None
        """
        result = await self.db.execute(
            select(Attachment).where(Attachment.id == attachment_id)
        )
        return result.scalar_one_or_none()
    
    async def get_attachments_by_asset(self, asset_id: UUID) -> List[Attachment]:
        """
        获取资产的所有附件。
        
        Args:
            asset_id: 资产 ID
            
        Returns:
            List[Attachment]: 附件列表
        """
        result = await self.db.execute(
            select(Attachment)
            .where(Attachment.asset_id == asset_id)
            .order_by(Attachment.uploaded_at.desc())
        )
        return list(result.scalars().all())
    
    async def get_attachment_by_cid(self, ipfs_cid: str) -> Optional[Attachment]:
        """
        根据 IPFS CID 获取附件。
        
        Args:
            ipfs_cid: IPFS CID
            
        Returns:
            Optional[Attachment]: 附件对象，不存在则返回 None
        """
        result = await self.db.execute(
            select(Attachment).where(Attachment.ipfs_cid == ipfs_cid)
        )
        return result.scalar_one_or_none()
