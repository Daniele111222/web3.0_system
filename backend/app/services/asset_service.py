"""资产业务逻辑层。"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status

from app.models.asset import Asset, Attachment, AssetStatus
from app.models.approval import Approval, ApprovalType, ApprovalStatus
from app.repositories.asset_repository import AssetRepository
from app.repositories.approval_repository import ApprovalRepository
from app.schemas.asset import (
    AssetCreateRequest,
    AssetUpdateRequest,
    AssetFilterParams,
    AttachmentUploadRequest,
)


class AssetService:
    """资产业务逻辑类。"""
    
    def __init__(self, asset_repo: AssetRepository):
        """
        初始化资产服务。
        
        Args:
            asset_repo: 资产仓库
        """
        self.asset_repo = asset_repo
    
    async def create_asset(
        self,
        enterprise_id: UUID,
        creator_user_id: UUID,
        data: AssetCreateRequest,
    ) -> Asset:
        """
        创建资产草稿。
        
        Args:
            enterprise_id: 企业 ID
            creator_user_id: 创建者用户 ID
            data: 资产创建请求数据
            
        Returns:
            Asset: 创建的资产
        """
        asset = Asset(
            enterprise_id=enterprise_id,
            creator_user_id=creator_user_id,
            name=data.name,
            type=data.type,
            description=data.description,
            creator_name=data.creator_name,
            creation_date=data.creation_date,
            legal_status=data.legal_status,
            application_number=data.application_number,
            asset_metadata=data.asset_metadata,
            status=AssetStatus.DRAFT,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        return await self.asset_repo.create_asset(asset)
    
    async def get_asset(self, asset_id: UUID) -> Asset:
        """
        获取资产详情。
        
        Args:
            asset_id: 资产 ID
            
        Returns:
            Asset: 资产对象
            
        Raises:
            HTTPException: 资产不存在
        """
        asset = await self.asset_repo.get_asset_by_id(asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="资产不存在",
            )
        return asset
    
    async def get_assets(
        self,
        enterprise_id: UUID,
        filters: AssetFilterParams,
    ) -> Tuple[List[Asset], int]:
        """
        获取企业的资产列表。
        
        Args:
            enterprise_id: 企业 ID
            filters: 筛选参数
            
        Returns:
            Tuple[List[Asset], int]: (资产列表, 总数)
        """
        skip = (filters.page - 1) * filters.page_size
        
        assets, total = await self.asset_repo.get_assets_by_enterprise(
            enterprise_id=enterprise_id,
            asset_type=filters.type,
            status=filters.status,
            legal_status=filters.legal_status,
            start_date=filters.start_date,
            end_date=filters.end_date,
            search=filters.search,
            skip=skip,
            limit=filters.page_size,
        )
        
        return assets, total
    
    async def update_asset(
        self,
        asset_id: UUID,
        enterprise_id: UUID,
        data: AssetUpdateRequest,
    ) -> Asset:
        """
        更新资产草稿。
        
        Args:
            asset_id: 资产 ID
            enterprise_id: 企业 ID
            data: 资产更新请求数据
            
        Returns:
            Asset: 更新后的资产
            
        Raises:
            HTTPException: 资产不存在、不属于该企业或不是草稿状态
        """
        asset = await self.get_asset(asset_id)
        
        # 验证资产属于该企业
        if asset.enterprise_id != enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权访问该资产",
            )
        
        # 只能更新草稿状态的资产
        if asset.status != AssetStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能更新草稿状态的资产",
            )
        
        # 更新字段
        if data.name is not None:
            asset.name = data.name
        if data.description is not None:
            asset.description = data.description
        if data.creator_name is not None:
            asset.creator_name = data.creator_name
        if data.creation_date is not None:
            asset.creation_date = data.creation_date
        if data.legal_status is not None:
            asset.legal_status = data.legal_status
        if data.application_number is not None:
            asset.application_number = data.application_number
        if data.asset_metadata is not None:
            asset.asset_metadata = data.asset_metadata
        
        asset.updated_at = datetime.utcnow()
        
        return await self.asset_repo.update_asset(asset)
    
    async def delete_asset(
        self,
        asset_id: UUID,
        enterprise_id: UUID,
    ) -> None:
        """
        删除资产（仅草稿状态）。
        
        Args:
            asset_id: 资产 ID
            enterprise_id: 企业 ID
            
        Raises:
            HTTPException: 资产不存在、不属于该企业或不是草稿状态
        """
        asset = await self.get_asset(asset_id)
        
        # 验证资产属于该企业
        if asset.enterprise_id != enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权访问该资产",
            )
        
        # 只能删除草稿状态的资产
        if asset.status != AssetStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能删除草稿状态的资产",
            )
        
        await self.asset_repo.delete_asset(asset)
    
    async def add_attachment(
        self,
        asset_id: UUID,
        enterprise_id: UUID,
        data: AttachmentUploadRequest,
    ) -> Attachment:
        """
        为资产添加附件。
        
        Args:
            asset_id: 资产 ID
            enterprise_id: 企业 ID
            data: 附件上传请求数据
            
        Returns:
            Attachment: 创建的附件
            
        Raises:
            HTTPException: 资产不存在、不属于该企业、不是草稿状态或 CID 已存在
        """
        asset = await self.get_asset(asset_id)
        
        # 验证资产属于该企业
        if asset.enterprise_id != enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权访问该资产",
            )
        
        # 只能为草稿状态的资产添加附件
        if asset.status != AssetStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能为草稿状态的资产添加附件",
            )
        
        # 检查 CID 是否已存在
        existing_attachment = await self.asset_repo.get_attachment_by_cid(data.ipfs_cid)
        if existing_attachment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="该文件已存在",
            )
        
        attachment = Attachment(
            asset_id=asset_id,
            file_name=data.file_name,
            file_type=data.file_type,
            file_size=data.file_size,
            ipfs_cid=data.ipfs_cid,
            uploaded_at=datetime.utcnow(),
        )
        
        return await self.asset_repo.add_attachment(attachment)
    
    async def get_attachments(self, asset_id: UUID) -> List[Attachment]:
        """
        获取资产的所有附件。
        
        Args:
            asset_id: 资产 ID
            
        Returns:
            List[Attachment]: 附件列表
        """
        return await self.asset_repo.get_attachments_by_asset(asset_id)
    
    async def submit_for_approval(
        self,
        asset_id: UUID,
        enterprise_id: UUID,
        applicant_id: UUID,
        remarks: Optional[str] = None,
    ) -> Tuple[Asset, Approval]:
        """
        提交资产进行审批。
        
        Args:
            asset_id: 资产 ID
            enterprise_id: 企业 ID
            applicant_id: 申请人用户 ID
            remarks: 申请备注
            
        Returns:
            Tuple[Asset, Approval]: (资产, 审批记录)
            
        Raises:
            HTTPException: 资产不存在、不是草稿状态或没有附件
        """
        asset = await self.get_asset(asset_id)
        
        if asset.enterprise_id != enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权访问该资产",
            )
        
        if asset.status != AssetStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只有草稿状态的资产才能提交审批",
            )
        
        attachments = await self.asset_repo.get_attachments_by_asset(asset_id)
        if not attachments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="资产必须至少有一个附件才能提交审批",
            )
        
        asset.status = AssetStatus.PENDING
        asset.updated_at = datetime.utcnow()
        await self.asset_repo.update_asset(asset)
        
        approval = Approval(
            type=ApprovalType.ASSET_SUBMIT,
            target_id=enterprise_id,
            target_type="enterprise",
            applicant_id=applicant_id,
            status=ApprovalStatus.PENDING,
            asset_id=asset_id,
            remarks=remarks,
        )
        
        approval_repo = ApprovalRepository(self.asset_repo.db)
        approval = await approval_repo.create_approval(approval)
        
        return asset, approval
