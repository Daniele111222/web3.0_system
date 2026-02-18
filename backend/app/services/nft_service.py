"""NFT服务模块。

提供NFT铸造、元数据生成和区块链交互功能。
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.asset import Asset, AssetStatus, Attachment
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

        # 2. 验证资产状态 - 必须是PENDING状态才能铸造
        if asset.status != AssetStatus.PENDING:
            raise BadRequestException(
                f"Cannot mint NFT for asset with status '{asset.status.value}'. "
                f"Asset must be in PENDING status."
            )

        # 3. 获取资产附件
        stmt = select(Attachment).where(Attachment.asset_id == asset_id)
        result = await self.db.execute(stmt)
        attachments = result.scalars().all()

        if not attachments:
            raise BadRequestException(
                "Cannot mint NFT for asset without attachments. "
                "Please upload at least one attachment."
            )

        # 4. 生成NFT元数据
        metadata = self._generate_nft_metadata(asset, attachments)

        # 5. 上传元数据到IPFS
        try:
            metadata_cid = await get_ipfs_client().upload_json(metadata)
            metadata_uri = f"ipfs://{metadata_cid}"
        except Exception as e:
            raise BadRequestException(f"Failed to upload metadata to IPFS: {str(e)}")

        # 6. 调用智能合约铸造NFT
        try:
            token_id, tx_hash = await self._call_mint_contract(
                to_address=minter_address,
                metadata_uri=metadata_uri,
            )
        except Exception as e:
            raise BlockchainException(f"Failed to mint NFT: {str(e)}")

        # 7. 更新资产状态和信息
        asset.status = AssetStatus.MINTED
        asset.nft_token_id = str(token_id)
        asset.nft_contract_address = get_blockchain_client().contract_address
        asset.nft_chain = str(get_blockchain_client().chain_id) if get_blockchain_client().chain_id else None
        asset.metadata_uri = metadata_uri
        asset.mint_tx_hash = tx_hash

        self.db.add(asset)
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
        # 使用第一个附件作为NFT图片
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

        # 如果有多个附件，添加到metadata中
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
            # 审批通过，等待铸造
            asset.status = AssetStatus.PENDING
        else:
            # 审批拒绝，返回DRAFT状态
            asset.status = AssetStatus.REJECTED

        self.db.add(asset)
        await self.db.flush()

        return asset