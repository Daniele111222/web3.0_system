"""NFT服务模块。

提供NFT铸造、元数据生成和区块链交互功能。
"""
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.asset import Asset, AssetStatus, Attachment, MintRecord
from app.core.blockchain import get_blockchain_client
from app.core.ipfs import get_ipfs_client
from app.core.exceptions import NotFoundException, BadRequestException, BlockchainException


class NFTService:
    """NFT服务类。
    
    提供NFT相关的业务逻辑，包括：
    - NFT元数据生成
    - IPFS上传
    - 智能合约交互
    - 资产状态更新
    - 批量铸造
    - 铸造状态查询
    - 铸造重试
    """

    def __init__(self, db: AsyncSession):
        """初始化NFT服务。
        
        Args:
            db: 数据库会话
        """
        self.db = db

    async def mint_asset_nft(
        self,
        asset_id: UUID,
        minter_address: str,
        operator_id: Optional[UUID] = None,
        operator_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """铸造资产的NFT。

        完整的NFT铸造流程：
        1. 验证资产状态和权限
        2. 获取资产详情和附件
        3. 生成NFT元数据
        4. 上传元数据到IPFS
        5. 调用智能合约铸造NFT
        6. 更新资产状态

        Args:
            asset_id: 资产ID
            minter_address: 铸造者钱包地址
            operator_id: 操作者用户ID
            operator_address: 操作者钱包地址

        Returns:
            包含NFT信息的字典

        Raises:
            NotFoundException: 资产不存在
            BadRequestException: 资产状态不正确
            BlockchainException: 区块链交互失败
        """
        # 1. 验证资产存在
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundException(f"Asset with ID {asset_id} not found")

        # 2. 验证资产状态 - 必须是DRAFT或PENDING状态才能铸造
        if asset.status not in [AssetStatus.DRAFT, AssetStatus.PENDING]:
            raise BadRequestException(
                f"Cannot mint NFT for asset with status '{asset.status.value}'. "
                f"Asset must be in DRAFT or PENDING status."
            )

        # 检查是否可以重试
        if asset.status == AssetStatus.MINT_FAILED:
            if not asset.can_retry:
                raise BadRequestException(
                    f"Asset has reached maximum retry attempts ({asset.max_mint_attempts}). "
                    f"Please contact administrator."
                )

        # 3. 获取资产附件
        stmt = select(Attachment).where(Attachment.asset_id == asset_id)
        result = await self.db.execute(stmt)
        attachments = list(result.scalars().all())

        if not attachments:
            raise BadRequestException(
                "Cannot mint NFT for asset without attachments. "
                "Please upload at least one attachment."
            )

        # 更新铸造尝试信息
        asset.mint_attempt_count = (asset.mint_attempt_count or 0) + 1
        asset.last_mint_attempt_at = datetime.now(timezone.utc)
        asset.mint_stage = "PREPARING"
        asset.mint_progress = 10
        asset.status = AssetStatus.MINTING
        asset.recipient_address = minter_address
        asset.mint_requested_at = datetime.now(timezone.utc)

        # 创建铸造记录
        mint_record = MintRecord(
            asset_id=asset_id,
            operation="REQUEST",
            stage="PREPARING",
            operator_id=operator_id,
            operator_address=operator_address,
            metadata_uri="",
            status="PENDING",
        )
        self.db.add(mint_record)
        self.db.add(asset)
        await self.db.flush()

        # 4. 生成NFT元数据
        metadata = self._generate_nft_metadata(asset, attachments)

        # 5. 上传元数据到IPFS
        asset.mint_stage = "SUBMITTING"
        asset.mint_progress = 30
        await self.db.flush()

        try:
            ipfs_client = get_ipfs_client()
            loop = asyncio.get_event_loop()
            metadata_cid = await loop.run_in_executor(
                None, ipfs_client.upload_json, metadata
            )
            metadata_uri = f"ipfs://{metadata_cid}"
            asset.metadata_cid = metadata_cid
            asset.metadata_uri = metadata_uri
            mint_record.metadata_uri = metadata_uri
        except Exception as e:
            asset.status = AssetStatus.MINT_FAILED
            asset.mint_stage = "FAILED"
            asset.mint_progress = 0
            asset.last_mint_error = f"IPFS upload failed: {str(e)}"
            asset.last_mint_error_code = "IPFS_UPLOAD_FAILED"
            
            mint_record.status = "FAILED"
            mint_record.error_code = "IPFS_UPLOAD_FAILED"
            mint_record.error_message = str(e)
            mint_record.completed_at = datetime.now(timezone.utc)
            
            await self.db.flush()
            raise BadRequestException(f"Failed to upload metadata to IPFS: {str(e)}")

        # 6. 调用智能合约铸造NFT
        asset.mint_progress = 50
        await self.db.flush()

        try:
            token_id, tx_hash = await self._call_mint_contract(
                to_address=minter_address,
                metadata_uri=metadata_uri,
            )
            
            asset.mint_tx_hash = tx_hash
            asset.mint_submitted_at = datetime.now(timezone.utc)
            asset.mint_stage = "CONFIRMING"
            asset.mint_progress = 70
            
            mint_record.tx_hash = tx_hash
            mint_record.stage = "SUBMITTING"
            
            await self.db.flush()
            
        except Exception as e:
            asset.status = AssetStatus.MINT_FAILED
            asset.mint_stage = "FAILED"
            asset.mint_progress = 0
            asset.last_mint_error = f"Contract call failed: {str(e)}"
            asset.last_mint_error_code = "CONTRACT_CALL_FAILED"
            
            # 检查是否可重试
            max_attempts = asset.max_mint_attempts or 3
            current_attempts = asset.mint_attempt_count or 0
            if current_attempts < max_attempts:
                asset.can_retry = True
            else:
                asset.can_retry = False
            
            mint_record.status = "FAILED"
            mint_record.error_code = "CONTRACT_CALL_FAILED"
            mint_record.error_message = str(e)
            mint_record.completed_at = datetime.now(timezone.utc)
            
            await self.db.flush()
            raise BlockchainException(f"Failed to mint NFT: {str(e)}")

        # 7. 更新资产状态为已铸造
        asset.status = AssetStatus.MINTED
        asset.nft_token_id = str(token_id)
        asset.nft_contract_address = get_blockchain_client().contract_address
        asset.nft_chain = str(get_blockchain_client().chain_id) if get_blockchain_client().chain_id else "31337"
        asset.mint_stage = "COMPLETED"
        asset.mint_progress = 100
        asset.mint_confirmed_at = datetime.now(timezone.utc)
        asset.mint_completed_at = datetime.now(timezone.utc)
        asset.can_retry = False
        # 铸造完成后初始化权属信息
        asset.owner_address = minter_address
        asset.ownership_status = "ACTIVE"
        
        mint_record.token_id = token_id
        mint_record.stage = "COMPLETED"
        mint_record.status = "SUCCESS"
        mint_record.completed_at = datetime.now(timezone.utc)

        await self.db.flush()

        return {
            "message": "NFT minted successfully",
            "asset_id": str(asset_id),
            "token_id": token_id,
            "tx_hash": tx_hash,
            "metadata_uri": metadata_uri,
            "contract_address": asset.nft_contract_address,
            "status": AssetStatus.MINTED.value,
        }

    async def batch_mint_assets(
        self,
        asset_ids: List[UUID],
        minter_address: str,
        operator_id: Optional[UUID] = None,
        operator_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """批量铸造多个资产的NFT。

        Args:
            asset_ids: 资产ID列表
            minter_address: 铸造者钱包地址
            operator_id: 操作者用户ID
            operator_address: 操作者钱包地址

        Returns:
            包含批量铸造结果的字典

        Raises:
            BadRequestException: 资产列表为空或包含无效状态的资产
        """
        if not asset_ids:
            raise BadRequestException("Asset list cannot be empty")
        
        if len(asset_ids) > 50:
            raise BadRequestException("Batch size cannot exceed 50 assets")

        results = []
        successful = []
        failed = []

        for asset_id in asset_ids:
            try:
                result = await self.mint_asset_nft(
                    asset_id=asset_id,
                    minter_address=minter_address,
                    operator_id=operator_id,
                    operator_address=operator_address,
                )
                successful.append({
                    "asset_id": str(asset_id),
                    "status": "success",
                    "token_id": result.get("token_id"),
                    "tx_hash": result.get("tx_hash"),
                })
            except Exception as e:
                failed.append({
                    "asset_id": str(asset_id),
                    "status": "failed",
                    "error": str(e),
                })

        return {
            "message": f"Batch mint completed: {len(successful)} succeeded, {len(failed)} failed",
            "total": len(asset_ids),
            "successful": len(successful),
            "failed": len(failed),
            "results": successful + failed,
        }

    async def get_mint_status(
        self,
        asset_id: UUID,
    ) -> Dict[str, Any]:
        """获取资产的铸造状态。

        Args:
            asset_id: 资产ID

        Returns:
            包含铸造状态的字典

        Raises:
            NotFoundException: 资产不存在
        """
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundException(f"Asset with ID {asset_id} not found")

        # 获取最新的铸造记录
        stmt = select(MintRecord).where(
            MintRecord.asset_id == asset_id
        ).order_by(MintRecord.created_at.desc()).limit(1)
        result = await self.db.execute(stmt)
        mint_record = result.scalar_one_or_none()

        return {
            "asset_id": str(asset_id),
            "current_status": asset.status.value,
            "mint_stage": asset.mint_stage,
            "mint_progress": asset.mint_progress,
            "token_id": asset.nft_token_id,
            "contract_address": asset.nft_contract_address,
            "tx_hash": asset.mint_tx_hash,
            "metadata_uri": asset.metadata_uri,
            "recipient_address": asset.recipient_address,
            "mint_requested_at": asset.mint_requested_at.isoformat() if asset.mint_requested_at else None,
            "mint_submitted_at": asset.mint_submitted_at.isoformat() if asset.mint_submitted_at else None,
            "mint_confirmed_at": asset.mint_confirmed_at.isoformat() if asset.mint_confirmed_at else None,
            "mint_completed_at": asset.mint_completed_at.isoformat() if asset.mint_completed_at else None,
            "mint_attempt_count": asset.mint_attempt_count,
            "max_mint_attempts": asset.max_mint_attempts,
            "can_retry": asset.can_retry,
            "last_mint_error": asset.last_mint_error,
            "last_mint_error_code": asset.last_mint_error_code,
            "mint_record": {
                "id": str(mint_record.id) if mint_record else None,
                "operation": mint_record.operation if mint_record else None,
                "stage": mint_record.stage if mint_record else None,
                "status": mint_record.status if mint_record else None,
                "error_code": mint_record.error_code if mint_record else None,
                "error_message": mint_record.error_message if mint_record else None,
            } if mint_record else None,
        }

    async def retry_mint(
        self,
        asset_id: UUID,
        minter_address: str,
        operator_id: Optional[UUID] = None,
        operator_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """重试铸造失败的NFT。

        Args:
            asset_id: 资产ID
            minter_address: 铸造者钱包地址
            operator_id: 操作者用户ID
            operator_address: 操作者钱包地址

        Returns:
            包含重试结果的字典

        Raises:
            NotFoundException: 资产不存在
            BadRequestException: 资产状态不允许重试
        """
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundException(f"Asset with ID {asset_id} not found")

        # 只有铸造失败的资产才能重试
        if asset.status != AssetStatus.MINT_FAILED:
            raise BadRequestException(
                f"Cannot retry mint for asset with status '{asset.status.value}'. "
                f"Only MINT_FAILED assets can be retried."
            )

        # 检查是否可重试
        if not asset.can_retry:
            raise BadRequestException(
                f"Asset has reached maximum retry attempts ({asset.max_mint_attempts}). "
                f"Please contact administrator."
            )

        # 重置状态并重新铸造
        asset.status = AssetStatus.DRAFT
        asset.can_retry = True
        
        await self.db.flush()

        return await self.mint_asset_nft(
            asset_id=asset_id,
            minter_address=minter_address,
            operator_id=operator_id,
            operator_address=operator_address,
        )

    def _generate_nft_metadata(
        self,
        asset: Asset,
        attachments: List[Attachment],
    ) -> Dict[str, Any]:
        """生成符合ERC-721标准的NFT元数据。

        Args:
            asset: 资产对象
            attachments: 附件列表

        Returns:
            NFT元数据字典
        """
        image_cid = attachments[0].ipfs_cid if attachments else ""

        metadata = {
            "name": asset.name,
            "description": asset.description,
            "image": f"ipfs://{image_cid}" if image_cid else "",
            "external_url": f"https://platform.example.com/assets/{asset.id}",
            "attributes": [
                {
                    "trait_type": "Asset Type",
                    "value": asset.type.value,
                },
                {
                    "trait_type": "Creator",
                    "value": asset.creator_name,
                },
                {
                    "trait_type": "Creation Date",
                    "value": asset.creation_date.isoformat(),
                },
                {
                    "trait_type": "Legal Status",
                    "value": asset.legal_status.value,
                },
            ],
            "properties": {
                "asset_id": str(asset.id),
                "enterprise_id": str(asset.enterprise_id),
                "application_number": asset.application_number,
            },
        }

        if len(attachments) > 1:
            metadata["attachments"] = [
                {
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "ipfs_cid": att.ipfs_cid,
                }
                for att in attachments[1:]
            ]

        return metadata

    async def _call_mint_contract(
        self,
        to_address: str,
        metadata_uri: str,
    ) -> tuple[int, str]:
        """调用智能合约铸造NFT。

        Args:
            to_address: 接收NFT的钱包地址
            metadata_uri: 元数据URI

        Returns:
            (token_id, tx_hash)元组

        Raises:
            BlockchainException: 区块链交互失败
        """
        try:
            token_id, tx_hash = await get_blockchain_client().mint_nft(
                to_address=to_address,
                metadata_uri=metadata_uri,
            )
            return token_id, tx_hash
        except Exception as e:
            raise BlockchainException(f"Failed to call mint contract: {str(e)}")

    async def update_asset_status_after_approval(
        self,
        asset_id: UUID,
        approved: bool,
    ) -> Asset:
        """根据审批结果更新资产状态。

        Args:
            asset_id: 资产ID
            approved: 是否通过审批

        Returns:
            更新后的资产对象

        Raises:
            NotFoundException: 资产不存在
        """
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundException(f"Asset with ID {asset_id} not found")

        if approved:
            asset.status = AssetStatus.PENDING
        else:
            asset.status = AssetStatus.REJECTED

        self.db.add(asset)
        await self.db.flush()

        return asset
