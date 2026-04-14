"""Ownership dashboard and transfer APIs."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.core.exceptions import BadRequestException, BlockchainException, ForbiddenException, NotFoundException
from app.schemas.response import ApiResponse, PageResult
from app.services.ownership_service import OwnershipService

router = APIRouter(prefix="/ownership", tags=["Ownership"])


def parse_current_user_id(current_user_id: str) -> UUID:
    try:
        return UUID(str(current_user_id))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user credentials",
        ) from exc


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
    token_id: int = Field(..., description="NFT token ID")
    to_address: str = Field(..., description="Recipient wallet address")
    to_enterprise_id: Optional[UUID] = Field(None, description="Recipient enterprise ID")
    remarks: Optional[str] = Field(None, description="Transfer remarks")


class UpdateOwnershipStatusRequest(BaseModel):
    token_id: int = Field(..., description="NFT token ID")
    new_status: str = Field(..., description="New ownership status")
    remarks: Optional[str] = Field(None, description="Update remarks")


async def ensure_token_member_access(
    service: OwnershipService,
    token_id: int,
    current_user_id: str,
) -> dict:
    asset = await service.get_asset_by_token_id(token_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    owner_enterprise_id = asset.get("owner_enterprise_id")
    if owner_enterprise_id and not await service.verify_enterprise_member(
        UUID(owner_enterprise_id),
        parse_current_user_id(current_user_id),
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this asset")

    return asset


@router.get(
    "/{enterprise_id}/assets",
    response_model=ApiResponse[PageResult[OwnershipAssetResponse]],
    summary="Get enterprise ownership assets",
)
async def get_enterprise_ownership_assets(
    enterprise_id: UUID,
    asset_type: Optional[str] = Query(None, description="Asset type filter"),
    ownership_status: Optional[str] = Query(None, description="Ownership status filter"),
    search: Optional[str] = Query(None, description="Asset name search"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    user_id = parse_current_user_id(current_user_id)

    if not await service.verify_enterprise_member(enterprise_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this enterprise")

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
    summary="Get enterprise ownership stats",
)
async def get_enterprise_ownership_stats(
    enterprise_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    user_id = parse_current_user_id(current_user_id)

    if not await service.verify_enterprise_member(enterprise_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this enterprise")

    stats = await service.get_enterprise_stats(enterprise_id)
    return ApiResponse(data=OwnershipStatsResponse(**stats))


@router.get(
    "/assets/{token_id}",
    response_model=ApiResponse[OwnershipAssetResponse],
    summary="Get ownership asset detail",
)
async def get_ownership_asset_detail(
    token_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    asset = await ensure_token_member_access(service, token_id, current_user_id)
    return ApiResponse(data=OwnershipAssetResponse(**asset))


@router.get(
    "/assets/{token_id}/history",
    response_model=ApiResponse[PageResult[TransferRecordResponse]],
    summary="Get NFT transfer history",
)
async def get_nft_transfer_history(
    token_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    service = OwnershipService(db)
    await ensure_token_member_access(service, token_id, current_user_id)
    records, total = await service.get_transfer_history(
        token_id=token_id,
        page=page,
        page_size=page_size,
    )
    return ApiResponse(
        data=PageResult(
            items=[TransferRecordResponse(**record) for record in records],
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
    summary="Transfer NFT",
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
            operator_id=parse_current_user_id(current_user_id),
            remarks=request.remarks,
        )
        await db.commit()
        return ApiResponse(message="NFT transferred successfully", data=result)
    except (NotFoundException, BadRequestException, ForbiddenException, BlockchainException) as exc:
        await db.rollback()
        status_map = {
            NotFoundException: status.HTTP_404_NOT_FOUND,
            BadRequestException: status.HTTP_400_BAD_REQUEST,
            ForbiddenException: status.HTTP_403_FORBIDDEN,
            BlockchainException: status.HTTP_502_BAD_GATEWAY,
        }
        raise HTTPException(
            status_code=status_map.get(type(exc), status.HTTP_400_BAD_REQUEST),
            detail=str(exc),
        ) from exc
    except Exception:
        await db.rollback()
        raise


@router.patch(
    "/assets/{token_id}/status",
    response_model=ApiResponse[dict],
    summary="Update ownership status",
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
            operator_id=parse_current_user_id(current_user_id),
            remarks=request.remarks,
        )
        await db.commit()
        return ApiResponse(message="Ownership status updated", data=result)
    except (NotFoundException, BadRequestException, ForbiddenException) as exc:
        await db.rollback()
        status_map = {
            NotFoundException: status.HTTP_404_NOT_FOUND,
            BadRequestException: status.HTTP_400_BAD_REQUEST,
            ForbiddenException: status.HTTP_403_FORBIDDEN,
        }
        raise HTTPException(
            status_code=status_map.get(type(exc), status.HTTP_400_BAD_REQUEST),
            detail=str(exc),
        ) from exc
    except Exception:
        await db.rollback()
        raise
