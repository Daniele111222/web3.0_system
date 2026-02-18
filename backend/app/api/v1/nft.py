"""NFT API模块。

提供NFT铸造、转移和查询功能。
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.services.nft_service import NFTService

router = APIRouter(prefix="/nft", tags=["NFT"])


@router.post(
    "/mint",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def mint_nft(
    asset_id: UUID,
    minter_address: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """铸造资产的NFT。

    将已审批通过的资产铸造为NFT。资产必须处于PENDING状态才能铸造。
    只有资产的创建者或企业管理员可以执行铸造操作。

    Args:
        asset_id: 要铸造NFT的资产ID
        minter_address: 铸造者钱包地址，用于接收NFT
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含铸造结果的字典，包括token_id、交易哈希、元数据URI等

    Raises:
        NotFoundException: 资产不存在
        ForbiddenException: 无权操作
        BadRequestException: 资产状态不正确或其他业务逻辑错误
    """
    nft_service = NFTService(db)

    try:
        result = await nft_service.mint_asset_nft(
            asset_id=asset_id,
            minter_address=minter_address,
        )
        return result
    except (NotFoundException, ForbiddenException, BadRequestException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mint NFT: {str(e)}",
        )


@router.post(
    "/transfer",
    response_model=dict,
    status_code=status.HTTP_200_OK,
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

    Args:
        token_id: NFT的token ID
        to_address: 接收地址
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含转移结果的字典

    Raises:
        HTTPException: 功能尚未实现
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="NFT transfer functionality is not yet implemented.",
    )


@router.get(
    "/{token_id}/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_nft_history(
    token_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """获取NFT历史记录。

    获取指定NFT的完整历史记录，包括铸造、转移等操作。
    **注意**: 此功能尚未实现。

    Args:
        token_id: NFT的token ID
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含NFT历史记录的字典

    Raises:
        HTTPException: 功能尚未实现
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="NFT history functionality is not yet implemented.",
    )