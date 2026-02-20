"""NFT API模块。

提供NFT铸造、转移和查询功能。
"""
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.services.nft_service import NFTService

router = APIRouter(prefix="/nft", tags=["NFT"])


class MintRequest(BaseModel):
    minter_address: str


class BatchMintRequest(BaseModel):
    asset_ids: List[UUID]
    minter_address: str


@router.post(
    "/mint",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="铸造NFT",
    description="将资产铸造为NFT",
)
async def mint_nft(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """铸造资产的NFT。

    将资产铸造为NFT。资产必须处于DRAFT或PENDING状态才能铸造。
    
    Args:
        asset_id: 要铸造NFT的资产ID
        request: 包含minter_address的请求体
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含铸造结果的字典，包括token_id、交易哈希，元数据URI等
    """
    nft_service = NFTService(db)

    try:
        result = await nft_service.mint_asset_nft(
            asset_id=asset_id,
            minter_address=request.minter_address,
            operator_id=current_user_id,
        )
        return result
    except (NotFoundException, BadRequestException) as e:
        if isinstance(e, NotFoundException):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif isinstance(e, BadRequestException):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mint NFT: {str(e)}",
        )


@router.post(
    "/batch-mint",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="批量铸造NFT",
    description="批量将多个资产铸造为NFT",
)
async def batch_mint_nft(
    request: BatchMintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """批量铸造NFT。

    将多个资产批量铸造为NFT。
    
    Args:
        request: 包含asset_ids和minter_address的请求体
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含批量铸造结果的字典
    """
    nft_service = NFTService(db)

    try:
        result = await nft_service.batch_mint_assets(
            asset_ids=request.asset_ids,
            minter_address=request.minter_address,
            operator_id=current_user_id,
        )
        return result
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to batch mint NFT: {str(e)}",
        )


@router.get(
    "/{asset_id}/mint/status",
    response_model=dict,
    summary="获取铸造状态",
    description="获取资产的铸造状态",
)
async def get_mint_status(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """获取资产的铸造状态。

    Args:
        asset_id: 资产ID
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含铸造状态的字典
    """
    nft_service = NFTService(db)

    try:
        result = await nft_service.get_mint_status(asset_id=asset_id)
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get mint status: {str(e)}",
        )


@router.post(
    "/{asset_id}/mint/retry",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="重试铸造",
    description="重试铸造失败的NFT",
)
async def retry_mint_nft(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """重试铸造失败的NFT。

    Args:
        asset_id: 资产ID
        request: 包含minter_address的请求体
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含重试结果的字典
    """
    nft_service = NFTService(db)

    try:
        result = await nft_service.retry_mint(
            asset_id=asset_id,
            minter_address=request.minter_address,
            operator_id=current_user_id,
        )
        return result
    except (NotFoundException, BadRequestException) as e:
        if isinstance(e, NotFoundException):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif isinstance(e, BadRequestException):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry mint: {str(e)}",
        )


@router.post(
    "/transfer",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="转移NFT",
    description="将NFT从一个地址转移到另一个地址",
)
async def transfer_nft(
    token_id: int,
    to_address: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """转移NFT。

    将NFT从一个地址转移到另一个地址。
    **注意**: 此功能尚未实现。
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="NFT transfer functionality is not yet implemented.",
    )


@router.get(
    "/{token_id}/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="获取NFT历史",
    description="获取NFT的完整历史记录",
)
async def get_nft_history(
    token_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """获取NFT历史记录。

    获取指定NFT的完整历史记录，包括铸造、转移等操作。
    **注意**: 此功能尚未实现。
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="NFT history functionality is not yet implemented.",
    )
