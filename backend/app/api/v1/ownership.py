"""权属看板 API 路由。"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException, BlockchainException
from app.models.ownership import OwnershipStatus
from app.schemas.response import ApiResponse, PageResult
from app.services.ownership_service import OwnershipService

router = APIRouter(prefix="/ownership", tags=["Ownership"])


# ------------------------------------------------------------------ #
# Request / Response Schemas                                           #
# ------------------------------------------------------------------ #

class OwnershipAssetResponse(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    token_id: int
    contract_address: str
    owner_address: str
    owner_enterprise_id: Optional[str] = None
    owner_enterprise_name: Optional[str] = None
    ownership_status: str
    metadata_uri: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class OwnershipStatsResponse(BaseModel):
    total_count: int
    active_count: int
    licensed_count: int
    staked_count: int
    transferred_count: int


class TransferRecordResponse(BaseModel):
    id: str
    token_id: int
    contract_address: str
    transfer_type: str
    from_address: str
    from_enterprise_id: Optional[str] = None
    from_enterprise_name: Optional[str] = None
    to_address: str
    to_enterprise_id: Optional[str] = None
    to_enterprise_name: Optional[str] = None
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    timestamp: str
    status: str
    remarks: Optional[str] = None


class TransferRequest(BaseModel):
    token_id: int = Field(..., description="NFT Token ID")
    to_address: str = Field(..., description="接收方钱包地址（0x...）")
    to_enterprise_id: Optional[UUID] = Field(None, description="接收方企业 ID（可选）")
    remarks: Optional[str] = Field(None, description="转移备注")


class UpdateOwnershipStatusRequest(BaseModel):
    token_id: int = Field(..., description="NFT Token ID")
    new_status: str = Field(..., description="新权属状态: ACTIVE/LICENSED/STAKED")
    remarks: Optional[str] = Field(None, description="备注")


# ------------------------------------------------------------------ #
# Endpoints                                                            #
# ------------------------------------------------------------------ #

@router.get(
    "/{enterprise_id}/assets",
    response_model=ApiResponse[PageResult[OwnershipAssetResponse]],
    summary="获取企业权属资产列表",
)
async def get_enterprise_ownership_assets(
    enterprise_id: UUID,
    asset_type: Optional[str] = Query(None, description="资产类型筛选"),
    ownership_status: Optional[str] = Query(None, description="权属状态筛选"),
    search: Optional[str] = Query(None, description="资产名称关键词"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)

    if not await service.verify_enterprise_member(enterprise_id, UUID(current_user_id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您不是该企业成员")

    items, total = await service.get_enterprise_assets(
        enterprise_id=enterprise_id,
        asset_type=asset_type,
        ownership_status=ownership_status,
        search=search,
        page=page,
        page_size=page_size,
    )

    return ApiResponse(
        data=PageResult(
            items=[OwnershipAssetResponse(**item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )
    )


@router.get(
    "/{enterprise_id}/stats",
    response_model=ApiResponse[OwnershipStatsResponse],
    summary="获取企业权属统计",
)
async def get_enterprise_ownership_stats(
    enterprise_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)

    if not await service.verify_enterprise_member(enterprise_id, UUID(current_user_id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您不是该企业成员")

    stats = await service.get_enterprise_stats(enterprise_id)
    return ApiResponse(data=OwnershipStatsResponse(**stats))


@router.get(
    "/assets/{token_id}",
    response_model=ApiResponse[OwnershipAssetResponse],
    summary="获取单个 NFT 资产详情",
)
async def get_ownership_asset_detail(
    token_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    asset = await service.get_asset_by_token_id(token_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资产不存在")
    return ApiResponse(data=OwnershipAssetResponse(**asset))


@router.get(
    "/assets/{token_id}/history",
    response_model=ApiResponse[PageResult[TransferRecordResponse]],
    summary="获取 NFT 权属变更历史",
)
async def get_nft_transfer_history(
    token_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    records, total = await service.get_transfer_history(
        token_id=token_id,
        page=page,
        page_size=page_size,
    )
    return ApiResponse(
        data=PageResult(
            items=[TransferRecordResponse(**r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )
    )


@router.post(
    "/transfer",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="发起 NFT 转移",
)
async def transfer_nft(
    request: TransferRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    try:
        result = await service.transfer_nft(
            token_id=request.token_id,
            to_address=request.to_address,
            to_enterprise_id=request.to_enterprise_id,
            operator_id=UUID(current_user_id),
            remarks=request.remarks,
        )
        return ApiResponse(message="NFT 转移成功", data=result)
    except (NotFoundException, BadRequestException, ForbiddenException, BlockchainException) as e:
        status_map = {
            NotFoundException: status.HTTP_404_NOT_FOUND,
            BadRequestException: status.HTTP_400_BAD_REQUEST,
            ForbiddenException: status.HTTP_403_FORBIDDEN,
            BlockchainException: status.HTTP_502_BAD_GATEWAY,
        }
        raise HTTPException(
            status_code=status_map.get(type(e), status.HTTP_400_BAD_REQUEST),
            detail=str(e),
        )


@router.patch(
    "/assets/{token_id}/status",
    response_model=ApiResponse[dict],
    summary="更新权属状态（许可/质押等）",
)
async def update_ownership_status(
    token_id: int,
    request: UpdateOwnershipStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    try:
        result = await service.update_ownership_status(
            token_id=token_id,
            new_status=request.new_status,
            operator_id=UUID(current_user_id),
            remarks=request.remarks,
        )
        return ApiResponse(message="权属状态已更新", data=result)
    except (NotFoundException, BadRequestException, ForbiddenException) as e:
        status_map = {
            NotFoundException: status.HTTP_404_NOT_FOUND,
            BadRequestException: status.HTTP_400_BAD_REQUEST,
            ForbiddenException: status.HTTP_403_FORBIDDEN,
        }
        raise HTTPException(
            status_code=status_map.get(type(e), status.HTTP_400_BAD_REQUEST),
            detail=str(e),
        )
