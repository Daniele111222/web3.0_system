"""NFT API模块。

提供NFT铸造、转移和查询功能。
"""
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, BlockchainException
from app.models.asset import Asset
from app.services.nft_service import NFTService
from app.services.ownership_service import OwnershipService
from app.repositories.enterprise_repository import EnterpriseMemberRepository

router = APIRouter(prefix="/nft", tags=["NFT"])


def parse_current_user_id(current_user_id: UUID) -> UUID:
    try:
        return UUID(str(current_user_id))
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的用户凭证")


async def ensure_asset_member_access(db: AsyncSession, asset_id: UUID, current_user_id: UUID) -> Asset:
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset with ID {asset_id} not found")

    user_id = parse_current_user_id(current_user_id)
    member_repo = EnterpriseMemberRepository(db)
    member = await member_repo.get_member(asset.enterprise_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您无权访问该资产")

    return asset


class MintRequest(BaseModel):
    minter_address: Optional[str] = Field(None, description="接收地址（可选，未提供时服务端自动回填）")
    royalty_receiver: Optional[str] = Field(None, description="版税接收地址")
    royalty_fee_bps: Optional[int] = Field(None, ge=0, le=1000, description="版税比例（基点）")
    signed_message: Optional[str] = Field(None, description="钱包签名原文")
    wallet_signature: Optional[str] = Field(None, description="钱包签名值")


class BatchMintRequest(BaseModel):
    asset_ids: List[UUID]
    minter_address: Optional[str] = Field(None, description="接收地址（可选，未提供时服务端自动回填）")


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

    将资产铸造为NFT。资产必须处于审批通过状态才能铸造。
    
    Args:
        asset_id: 要铸造NFT的资产ID
        request: 包含minter_address的请求体
        db: 数据库会话
        current_user_id: 当前用户ID

    Returns:
        包含铸造结果的字典，包括token_id、交易哈希，元数据URI等
    """
    await ensure_asset_member_access(db, asset_id, current_user_id)
    nft_service = NFTService(db)

    try:
        result = await nft_service.mint_asset_nft(
            asset_id=asset_id,
            minter_address=request.minter_address,
            royalty_receiver=request.royalty_receiver,
            royalty_fee_bps=request.royalty_fee_bps,
            signed_message=request.signed_message,
            wallet_signature=request.wallet_signature,
            operator_id=current_user_id,
        )
        await db.commit()
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
    "/{asset_id}/mint",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="铸造NFT（路径参数版本）",
    deprecated=True,
)
async def mint_nft_by_asset_path(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await mint_nft(
        asset_id=asset_id,
        request=request,
        db=db,
        current_user_id=current_user_id,
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
    for asset_id in request.asset_ids:
        await ensure_asset_member_access(db, asset_id, current_user_id)

    nft_service = NFTService(db)

    try:
        result = await nft_service.batch_mint_assets(
            asset_ids=request.asset_ids,
            minter_address=request.minter_address,
            operator_id=current_user_id,
        )
        await db.commit()
        return result
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to batch mint NFT: {str(e)}",
        )


@router.post(
    "/mint/estimate",
    response_model=dict,
    summary="预估铸造Gas",
    description="预估指定资产铸造时的 Gas 费用",
)
async def estimate_mint_gas(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    await ensure_asset_member_access(db, asset_id, current_user_id)
    nft_service = NFTService(db)
    try:
        return await nft_service.estimate_mint_fee(
            asset_id=asset_id,
            minter_address=request.minter_address,
            royalty_receiver=request.royalty_receiver,
            royalty_fee_bps=request.royalty_fee_bps,
        )
    except (NotFoundException, BadRequestException) as e:
        if isinstance(e, NotFoundException):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to estimate mint gas: {str(e)}",
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
    await ensure_asset_member_access(db, asset_id, current_user_id)
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


@router.get(
    "/mint/{asset_id}/status",
    response_model=dict,
    summary="获取铸造状态（别名路径）",
    deprecated=True,
)
async def get_mint_status_alias(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await get_mint_status(
        asset_id=asset_id,
        db=db,
        current_user_id=current_user_id,
    )


@router.get(
    "/mint-status/{task_id}",
    response_model=dict,
    summary="获取铸造状态（规格别名路径）",
)
async def get_mint_status_task_alias(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await get_mint_status(
        asset_id=task_id,
        db=db,
        current_user_id=current_user_id,
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
    await ensure_asset_member_access(db, asset_id, current_user_id)
    nft_service = NFTService(db)

    try:
        result = await nft_service.retry_mint(
            asset_id=asset_id,
            minter_address=request.minter_address,
            operator_id=current_user_id,
        )
        await db.commit()
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
    "/mint/{asset_id}/retry",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="重试铸造（别名路径）",
    deprecated=True,
)
async def retry_mint_nft_alias(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await retry_mint_nft(
        asset_id=asset_id,
        request=request,
        db=db,
        current_user_id=current_user_id,
    )


@router.post(
    "/retry-mint/{asset_id}",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="重试铸造（规格别名路径）",
)
async def retry_mint_nft_spec_alias(
    asset_id: UUID,
    request: MintRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await retry_mint_nft(
        asset_id=asset_id,
        request=request,
        db=db,
        current_user_id=current_user_id,
    )


@router.post(
    "/transfer",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="转移NFT",
    description="将NFT从当前持有者转移到另一个地址",
)
async def transfer_nft(
    token_id: int = Query(..., description="NFT Token ID"),
    to_address: str = Query(..., description="接收方钱包地址"),
    to_enterprise_id: Optional[UUID] = Query(None, description="接收方企业 ID（可选）"),
    remarks: Optional[str] = Query(None, description="转移备注"),
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """转移NFT所有权。

    调用链上 transferNFT 合约函数，并同步更新数据库权属记录。
    """
    service = OwnershipService(db)
    try:
        result = await service.transfer_nft(
            token_id=token_id,
            to_address=to_address,
            to_enterprise_id=to_enterprise_id,
            operator_id=UUID(str(current_user_id)),
            remarks=remarks,
        )
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BlockchainException as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"转移失败: {str(e)}",
        )


@router.get(
    "/{token_id}/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="获取NFT历史",
    description="获取NFT的完整权属变更历史记录",
)
async def get_nft_history(
    token_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """获取NFT权属变更历史。"""
    service = OwnershipService(db)
    try:
        records, total = await service.get_transfer_history(
            token_id=int(token_id),
            page=page,
            page_size=page_size,
        )
        return {
            "items": records,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="token_id 必须为整数")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询失败: {str(e)}",
        )


@router.get(
    "/mint/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="获取NFT铸造历史",
    description="分页查询企业维度NFT铸造历史记录",
)
async def get_nft_mint_history(
    enterprise_id: UUID = Query(..., description="企业ID"),
    record_status: Optional[str] = Query(None, description="按记录状态筛选：PENDING/SUCCESS/FAILED"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    user_id = parse_current_user_id(current_user_id)
    member_repo = EnterpriseMemberRepository(db)
    member = await member_repo.get_member(enterprise_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您无权访问该企业铸造历史")

    nft_service = NFTService(db)
    try:
        return await nft_service.get_mint_history(
            enterprise_id=enterprise_id,
            page=page,
            page_size=page_size,
            status_filter=record_status,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get mint history: {str(e)}",
        )


@router.get(
    "/history/{token_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="获取NFT历史（别名路径）",
    deprecated=True,
)
async def get_nft_history_alias(
    token_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    return await get_nft_history(
        token_id=token_id,
        page=page,
        page_size=page_size,
        db=db,
        current_user_id=current_user_id,
    )
