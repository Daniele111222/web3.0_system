"""NFT服务模块。

提供NFT铸造、元数据生成和区块链交互功能。
"""
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from eth_account.messages import encode_defunct
from web3 import Web3

from app.models.asset import Asset, AssetStatus, Attachment, MintRecord
from app.models.enterprise import Enterprise
from app.core.blockchain import get_blockchain_client
from app.core.exceptions import NotFoundException, BadRequestException, BlockchainException
from app.services.pinata_service import get_pinata_service


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
        minter_address: Optional[str] = None,
        royalty_receiver: Optional[str] = None,
        royalty_fee_bps: Optional[int] = None,
        wallet_signature: Optional[str] = None,
        signed_message: Optional[str] = None,
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

        if asset.status != AssetStatus.APPROVED:
            raise BadRequestException(
                f"Cannot mint NFT for asset with status '{asset.status.value}'. "
                f"Asset must be in APPROVED status."
            )
        resolved_minter_address = await self._resolve_minter_address(asset, minter_address)

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

        signature_verified = self._verify_wallet_signature(
            wallet_address=resolved_minter_address,
            signature=wallet_signature,
            message=signed_message,
        )
        mint_record.signature_verified = signature_verified
        if (wallet_signature or signed_message) and not signature_verified:
            mint_record.status = "FAILED"
            mint_record.error_code = "SIGNATURE_VERIFICATION_FAILED"
            mint_record.error_message = "Wallet signature verification failed."
            mint_record.completed_at = datetime.now(timezone.utc)
            await self.db.flush()
            raise BadRequestException("SIGNATURE_VERIFICATION_FAILED: Wallet signature verification failed.")

        # 3. 获取资产附件
        stmt = select(Attachment).where(Attachment.asset_id == asset_id)
        result = await self.db.execute(stmt)
        attachments = list(result.scalars().all())

        if not attachments:
            mint_record.status = "FAILED"
            mint_record.error_code = "INSUFFICIENT_ATTACHMENTS"
            mint_record.error_message = "Cannot mint NFT for asset without attachments."
            mint_record.completed_at = datetime.now(timezone.utc)
            await self.db.flush()
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
        asset.recipient_address = resolved_minter_address
        if royalty_receiver:
            asset.royalty_receiver = royalty_receiver
        if royalty_fee_bps is not None:
            asset.royalty_percentage = royalty_fee_bps / 100
        asset.mint_requested_at = datetime.now(timezone.utc)

        self.db.add(asset)
        await self.db.flush()

        # 4. 生成NFT元数据
        metadata = self._generate_nft_metadata(asset, attachments)

        # 5. 上传元数据到Pinata
        asset.mint_stage = "SUBMITTING"
        asset.mint_progress = 30
        await self.db.flush()

        try:
            pinata_service = get_pinata_service()
            loop = asyncio.get_event_loop()
            metadata_result = await loop.run_in_executor(
                None,
                pinata_service.upload_json,
                metadata,
                f"asset-{asset_id}-metadata.json",
                {
                    "asset_id": str(asset_id),
                    "enterprise_id": str(asset.enterprise_id),
                    "type": "nft_metadata",
                },
            )
            metadata_cid = metadata_result["cid"]
            metadata_uri = f"ipfs://{metadata_cid}"
            asset.metadata_cid = metadata_cid
            asset.metadata_uri = metadata_uri
            mint_record.metadata_uri = metadata_uri
        except Exception as e:
            asset.status = AssetStatus.MINT_FAILED
            asset.mint_stage = "FAILED"
            asset.mint_progress = 0
            asset.last_mint_error = f"Pinata upload failed: {str(e)}"
            asset.last_mint_error_code = "PINATA_UPLOAD_FAILED"
            
            mint_record.status = "FAILED"
            mint_record.error_code = "PINATA_UPLOAD_FAILED"
            mint_record.error_message = str(e)
            mint_record.completed_at = datetime.now(timezone.utc)
            
            await self.db.flush()
            raise BadRequestException(f"Failed to upload metadata to Pinata: {str(e)}")

        # 6. 调用智能合约铸造NFT
        asset.mint_progress = 50
        await self.db.flush()

        try:
            token_id, tx_hash = await self._call_mint_contract(
                to_address=resolved_minter_address,
                metadata_uri=metadata_uri,
                royalty_receiver=royalty_receiver,
                royalty_fee_bps=royalty_fee_bps,
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
        asset.owner_address = resolved_minter_address
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
            "royalty_receiver": royalty_receiver,
            "royalty_fee_bps": royalty_fee_bps or 0,
            "signature_verified": signature_verified,
        }

    async def estimate_mint_fee(
        self,
        asset_id: UUID,
        minter_address: Optional[str] = None,
        royalty_receiver: Optional[str] = None,
        royalty_fee_bps: Optional[int] = None,
    ) -> Dict[str, Any]:
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundException(f"Asset with ID {asset_id} not found")
        if asset.status != AssetStatus.APPROVED:
            raise BadRequestException("仅 APPROVED 状态资产可预估 Gas")
        resolved_minter_address = await self._resolve_minter_address(asset, minter_address)

        stmt = select(Attachment).where(Attachment.asset_id == asset_id)
        result = await self.db.execute(stmt)
        attachments = list(result.scalars().all())
        if not attachments:
            raise BadRequestException("请先上传附件后再进行 Gas 估算")

        pseudo_metadata_uri = f"ipfs://estimate-{asset_id}"
        try:
            estimate = await get_blockchain_client().estimate_mint_gas(
                to_address=resolved_minter_address,
                metadata_uri=pseudo_metadata_uri,
                royalty_receiver=royalty_receiver,
                royalty_fee_bps=royalty_fee_bps,
            )
            return {
                "asset_id": str(asset_id),
                "estimated": estimate,
                "minter_address": resolved_minter_address,
                "royalty_receiver": royalty_receiver,
                "royalty_fee_bps": royalty_fee_bps or 0,
            }
        except Exception as e:
            raise BlockchainException(f"Failed to estimate gas: {str(e)}")

    async def batch_mint_assets(
        self,
        asset_ids: List[UUID],
        minter_address: Optional[str] = None,
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
                "signature_verified": mint_record.signature_verified if mint_record else None,
                "error_code": mint_record.error_code if mint_record else None,
                "error_message": mint_record.error_message if mint_record else None,
            } if mint_record else None,
        }

    async def retry_mint(
        self,
        asset_id: UUID,
        minter_address: Optional[str] = None,
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

        asset.status = AssetStatus.APPROVED
        asset.can_retry = True
        
        await self.db.flush()

        return await self.mint_asset_nft(
            asset_id=asset_id,
            minter_address=minter_address,
            operator_id=operator_id,
            operator_address=operator_address,
        )

    async def _resolve_minter_address(self, asset: Asset, requested_address: Optional[str]) -> str:
        normalized_requested = requested_address.strip() if requested_address else ""
        if normalized_requested:
            return normalized_requested

        enterprise_wallet_address = ""
        enterprise = await self.db.get(Enterprise, asset.enterprise_id)
        if enterprise and enterprise.wallet_address:
            enterprise_wallet_address = enterprise.wallet_address.strip()
        if enterprise_wallet_address:
            return enterprise_wallet_address

        deployer_address = (getattr(get_blockchain_client(), "deployer_address", "") or "").strip()
        if deployer_address:
            return deployer_address

        raise BadRequestException(
            "MINTER_ADDRESS_NOT_CONFIGURED: minter address is not configured in request, enterprise, or system settings."
        )

    async def get_mint_history(
        self,
        enterprise_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        base_stmt = (
            select(MintRecord, Asset)
            .join(Asset, Asset.id == MintRecord.asset_id)
            .where(Asset.enterprise_id == enterprise_id)
        )

        count_stmt = (
            select(func.count(MintRecord.id))
            .join(Asset, Asset.id == MintRecord.asset_id)
            .where(Asset.enterprise_id == enterprise_id)
        )
        if status_filter:
            normalized_filter = status_filter.upper()
            base_stmt = base_stmt.where(MintRecord.status == normalized_filter)
            count_stmt = count_stmt.where(MintRecord.status == normalized_filter)

        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_stmt
            .order_by(MintRecord.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await self.db.execute(stmt)).all()

        items = [
            {
                "mint_record_id": str(record.id),
                "asset_id": str(asset.id),
                "asset_name": asset.name,
                "asset_status": asset.status.value,
                "operation": record.operation,
                "stage": record.stage,
                "status": record.status,
                "signature_verified": record.signature_verified,
                "token_id": record.token_id,
                "tx_hash": record.tx_hash,
                "error_code": record.error_code,
                "error_message": record.error_message,
                "created_at": record.created_at.isoformat() if record.created_at else None,
                "completed_at": record.completed_at.isoformat() if record.completed_at else None,
            }
            for record, asset in rows
        ]

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        }

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
        primary_attachment = next((item for item in attachments if item.is_primary), None)
        if primary_attachment is None and attachments:
            primary_attachment = attachments[0]
        image_cid = primary_attachment.ipfs_cid if primary_attachment else ""
        extra_attachments = [
            att for att in attachments
            if primary_attachment is None or att.id != primary_attachment.id
        ]

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
                    "trait_type": "Inventors",
                    "value": ", ".join(asset.inventors),
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
                "rights_declaration": asset.rights_declaration,
            },
        }

        if extra_attachments:
            metadata["attachments"] = [
                {
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "ipfs_cid": att.ipfs_cid,
                }
                for att in extra_attachments
            ]

        return metadata

    async def _call_mint_contract(
        self,
        to_address: str,
        metadata_uri: str,
        royalty_receiver: Optional[str] = None,
        royalty_fee_bps: Optional[int] = None,
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
                royalty_receiver=royalty_receiver,
                royalty_fee_bps=royalty_fee_bps,
            )
            return token_id, tx_hash
        except Exception as e:
            raise BlockchainException(f"Failed to call mint contract: {str(e)}")

    def _verify_wallet_signature(
        self,
        wallet_address: str,
        signature: Optional[str],
        message: Optional[str],
    ) -> bool:
        if not signature and not message:
            return False
        if not signature or not message:
            return False
        try:
            message_hash = encode_defunct(text=message)
            recovered_address = Web3().eth.account.recover_message(message_hash, signature=signature)
            return recovered_address.lower() == wallet_address.lower()
        except Exception:
            return False

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
            asset.status = AssetStatus.APPROVED
        else:
            asset.status = AssetStatus.REJECTED

        self.db.add(asset)
        await self.db.flush()

        return asset
