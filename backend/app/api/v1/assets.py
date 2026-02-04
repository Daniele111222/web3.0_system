"""资产管理 API 路由。"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from math import ceil

from app.api.deps import DBSession, CurrentUserId
from app.repositories.asset_repository import AssetRepository
from app.repositories.enterprise_repository import EnterpriseRepository
from app.services.asset_service import AssetService
from app.schemas.asset import (
    AssetCreateRequest,
    AssetUpdateRequest,
    AssetResponse,
    AssetListResponse,
    AssetFilterParams,
    AttachmentResponse,
    AttachmentUploadRequest,
)
from app.schemas.auth import MessageResponse
from app.models.asset import AssetType, AssetStatus, LegalStatus
from datetime import date

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.post(
    "",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建资产草稿",
    description="创建一个新的资产草稿，需要指定所属企业",
)
async def create_asset(
    db: DBSession,
    current_user_id: CurrentUserId,
    data: AssetCreateRequest,
    enterprise_id: UUID = Query(..., description="所属企业 ID"),
) -> AssetResponse:
    """
    创建资产草稿。
    
    Args:
        data: 资产创建请求数据
        enterprise_id: 所属企业 ID
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        AssetResponse: 创建的资产
        
    Raises:
        HTTPException: 企业不存在或用户无权限
    """
    # 验证企业存在且用户是成员
    enterprise_repo = EnterpriseRepository(db)
    enterprise = await enterprise_repo.get_enterprise_by_id(enterprise_id)
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="企业不存在",
        )
    
    # 验证用户是企业成员
    member = await enterprise_repo.get_member(enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该企业的成员",
        )
    
    # 创建资产
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    asset = await asset_service.create_asset(
        enterprise_id=enterprise_id,
        creator_user_id=current_user_id,
        data=data,
    )
    
    return AssetResponse.model_validate(asset)


@router.get(
    "",
    response_model=AssetListResponse,
    summary="获取资产列表",
    description="获取指定企业的资产列表，支持筛选和分页",
)
async def get_assets(
    db: DBSession,
    current_user_id: CurrentUserId,
    enterprise_id: UUID = Query(..., description="企业 ID"),
    asset_type: Optional[AssetType] = Query(None, description="资产类型筛选"),
    asset_status: Optional[AssetStatus] = Query(None, description="资产状态筛选"),
    legal_status: Optional[LegalStatus] = Query(None, description="法律状态筛选"),
    start_date: Optional[date] = Query(None, description="创作日期起始"),
    end_date: Optional[date] = Query(None, description="创作日期结束"),
    search: Optional[str] = Query(None, max_length=200, description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
) -> AssetListResponse:
    """
    获取资产列表。
    
    Args:
        enterprise_id: 企业 ID
        asset_type: 资产类型筛选
        asset_status: 资产状态筛选
        legal_status: 法律状态筛选
        start_date: 创作日期起始
        end_date: 创作日期结束
        search: 搜索关键词
        page: 页码
        page_size: 每页数量
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        AssetListResponse: 资产列表响应
        
    Raises:
        HTTPException: 企业不存在或用户无权限
    """
    # 验证企业存在且用户是成员
    enterprise_repo = EnterpriseRepository(db)
    enterprise = await enterprise_repo.get_enterprise_by_id(enterprise_id)
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="企业不存在",
        )
    
    member = await enterprise_repo.get_member(enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该企业的成员",
        )
    
    # 构建筛选参数
    filters = AssetFilterParams(
        type=asset_type,
        status=asset_status,
        legal_status=legal_status,
        start_date=start_date,
        end_date=end_date,
        search=search,
        page=page,
        page_size=page_size,
    )
    
    # 获取资产列表
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    assets, total = await asset_service.get_assets(enterprise_id, filters)
    
    # 计算总页数
    total_pages = ceil(total / page_size) if total > 0 else 0
    
    return AssetListResponse(
        items=[AssetResponse.model_validate(asset) for asset in assets],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="获取资产详情",
    description="获取指定资产的详细信息",
)
async def get_asset(
    asset_id: UUID,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> AssetResponse:
    """
    获取资产详情。
    
    Args:
        asset_id: 资产 ID
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        AssetResponse: 资产详情
        
    Raises:
        HTTPException: 资产不存在或用户无权限
    """
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    asset = await asset_service.get_asset(asset_id)
    
    # 验证用户是企业成员
    enterprise_repo = EnterpriseRepository(db)
    member = await enterprise_repo.get_member(asset.enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您无权访问该资产",
        )
    
    return AssetResponse.model_validate(asset)


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="更新资产草稿",
    description="更新资产草稿信息（仅草稿状态可更新）",
)
async def update_asset(
    asset_id: UUID,
    data: AssetUpdateRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> AssetResponse:
    """
    更新资产草稿。
    
    Args:
        asset_id: 资产 ID
        data: 资产更新请求数据
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        AssetResponse: 更新后的资产
        
    Raises:
        HTTPException: 资产不存在、用户无权限或不是草稿状态
    """
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    
    # 获取资产
    asset = await asset_service.get_asset(asset_id)
    
    # 验证用户是企业成员
    enterprise_repo = EnterpriseRepository(db)
    member = await enterprise_repo.get_member(asset.enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您无权访问该资产",
        )
    
    # 更新资产
    updated_asset = await asset_service.update_asset(
        asset_id=asset_id,
        enterprise_id=asset.enterprise_id,
        data=data,
    )
    
    return AssetResponse.model_validate(updated_asset)


@router.delete(
    "/{asset_id}",
    response_model=MessageResponse,
    summary="删除资产草稿",
    description="删除资产草稿（仅草稿状态可删除）",
)
async def delete_asset(
    asset_id: UUID,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MessageResponse:
    """
    删除资产草稿。
    
    Args:
        asset_id: 资产 ID
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        MessageResponse: 删除成功消息
        
    Raises:
        HTTPException: 资产不存在、用户无权限或不是草稿状态
    """
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    
    # 获取资产
    asset = await asset_service.get_asset(asset_id)
    
    # 验证用户是企业成员
    enterprise_repo = EnterpriseRepository(db)
    member = await enterprise_repo.get_member(asset.enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您无权访问该资产",
        )
    
    # 删除资产
    await asset_service.delete_asset(
        asset_id=asset_id,
        enterprise_id=asset.enterprise_id,
    )
    
    return MessageResponse(message="资产删除成功")


@router.post(
    "/{asset_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="上传资产附件",
    description="为资产添加附件（文件需先上传到 IPFS）",
)
async def upload_attachment(
    asset_id: UUID,
    data: AttachmentUploadRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> AttachmentResponse:
    """
    上传资产附件。
    
    Args:
        asset_id: 资产 ID
        data: 附件上传请求数据
        db: 数据库会话
        current_user_id: 当前用户 ID
        
    Returns:
        AttachmentResponse: 创建的附件
        
    Raises:
        HTTPException: 资产不存在、用户无权限、不是草稿状态或 CID 已存在
    """
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    
    # 获取资产
    asset = await asset_service.get_asset(asset_id)
    
    # 验证用户是企业成员
    enterprise_repo = EnterpriseRepository(db)
    member = await enterprise_repo.get_member(asset.enterprise_id, current_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您无权访问该资产",
        )
    
    # 添加附件
    attachment = await asset_service.add_attachment(
        asset_id=asset_id,
        enterprise_id=asset.enterprise_id,
        data=data,
    )
    
    return AttachmentResponse.model_validate(attachment)
