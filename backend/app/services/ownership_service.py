"""权属管理服务层。"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.models.asset import Asset, AssetStatus
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole
from app.models.ownership import NFTTransferRecord, OwnershipStatus, TransferType, TransferStatus
from app.core.blockchain import get_blockchain_client
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException, BlockchainException


class OwnershipService:
    """权属管理服务。

    负责：
    - 企业 NFT 资产列表与统计查询
    - NFT 转移（链上执行 + 数据库同步）
    - 权属变更历史查询
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _is_enterprise_owned_asset(self, enterprise_id: UUID):
        """兼容历史数据：老数据可能缺少 current_owner_enterprise_id。"""
        return and_(
            Asset.nft_token_id.isnot(None),
            Asset.nft_token_id != "",
            (
                (Asset.current_owner_enterprise_id == enterprise_id) |
                (
                    Asset.current_owner_enterprise_id.is_(None) &
                    (Asset.enterprise_id == enterprise_id) &
                    (Asset.status == AssetStatus.MINTED) &
                    (
                        Asset.ownership_status.is_(None) |
                        (Asset.ownership_status != OwnershipStatus.TRANSFERRED)
                    )
                )
            ),
        )

    def _resolve_owner_enterprise_id(self, asset: Asset) -> Optional[UUID]:
        if asset.current_owner_enterprise_id:
            return asset.current_owner_enterprise_id
        if (
            asset.status == AssetStatus.MINTED and
            (asset.ownership_status is None or asset.ownership_status != OwnershipStatus.TRANSFERRED)
        ):
            return asset.enterprise_id
        return None

    def _parse_token_id(self, asset: Asset) -> Optional[int]:
        raw_token_id = (asset.nft_token_id or "").strip()
        if not raw_token_id:
            return None
        try:
            token_id = int(raw_token_id)
        except (TypeError, ValueError):
            return None
        return token_id if token_id > 0 else None

    # ------------------------------------------------------------------ #
    # 查询                                                                  #
    # ------------------------------------------------------------------ #

    async def _get_owned_assets_for_enterprise(self, enterprise_id: UUID) -> List[Asset]:
        stmt = (
            select(Asset)
            .where(self._is_enterprise_owned_asset(enterprise_id))
            .order_by(Asset.created_at.desc())
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def get_enterprise_stats(self, enterprise_id: UUID) -> Dict[str, int]:
        """获取企业 NFT 资产权属统计。"""
        assets = [
            asset
            for asset in await self._get_owned_assets_for_enterprise(enterprise_id)
            if self._parse_token_id(asset) is not None
        ]
        return {
            "total_count": len(assets),
            "active_count": sum(
                1 for asset in assets
                if (asset.ownership_status or OwnershipStatus.ACTIVE) == OwnershipStatus.ACTIVE
            ),
            "licensed_count": sum(
                1 for asset in assets
                if asset.ownership_status == OwnershipStatus.LICENSED
            ),
            "staked_count": sum(
                1 for asset in assets
                if asset.ownership_status == OwnershipStatus.STAKED
            ),
            "transferred_count": sum(
                1 for asset in assets
                if asset.ownership_status == OwnershipStatus.TRANSFERRED
            ),
        }

    async def get_enterprise_assets(
        self,
        enterprise_id: UUID,
        asset_type: Optional[str] = None,
        ownership_status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """获取企业名下 NFT 资产列表（已铸造且当前归属该企业）。"""
        conditions = [
            self._is_enterprise_owned_asset(enterprise_id),
        ]
        if asset_type:
            conditions.append(Asset.type == asset_type)
        if ownership_status:
            conditions.append(Asset.ownership_status == ownership_status)
        if search:
            conditions.append(Asset.name.ilike(f"%{search}%"))

        # 总数
        count_stmt = select(func.count(Asset.id)).where(and_(*conditions))
        total = (await self.db.execute(count_stmt)).scalar() or 0

        # 列表（JOIN Enterprise 一次性取企业名，避免 N+1）
        offset = (page - 1) * page_size
        stmt = (
            select(Asset, Enterprise.name.label("enterprise_name"))
            .outerjoin(Enterprise, Asset.current_owner_enterprise_id == Enterprise.id)
            .where(and_(*conditions))
            .order_by(Asset.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = (await self.db.execute(stmt)).all()

        items = []
        for asset, enterprise_name in rows:
            token_id = self._parse_token_id(asset)
            if token_id is None:
                continue

            items.append(
                {
                    "asset_id": str(asset.id),
                    "asset_name": asset.name,
                    "asset_type": asset.type.value,
                    "token_id": token_id,
                    "contract_address": asset.nft_contract_address or "",
                    "owner_address": asset.owner_address or "",
                    "owner_enterprise_id": str(self._resolve_owner_enterprise_id(asset)) if self._resolve_owner_enterprise_id(asset) else None,
                    "owner_enterprise_name": enterprise_name,
                    "ownership_status": asset.ownership_status or OwnershipStatus.ACTIVE,
                    "metadata_uri": asset.metadata_uri or "",
                    "created_at": asset.created_at.isoformat(),
                    "updated_at": asset.updated_at.isoformat(),
                }
            )
        return items, len(items)

    async def get_asset_by_token_id(self, token_id: int) -> Optional[Dict]:
        """根据 Token ID 获取资产详情。"""
        stmt = select(Asset).where(Asset.nft_token_id == str(token_id))
        asset = (await self.db.execute(stmt)).scalar_one_or_none()
        if not asset:
            return None

        parsed_token_id = self._parse_token_id(asset)
        if parsed_token_id is None:
            return None

        effective_owner_enterprise_id = self._resolve_owner_enterprise_id(asset)

        enterprise_name: Optional[str] = None
        if effective_owner_enterprise_id:
            ent_stmt = select(Enterprise.name).where(Enterprise.id == effective_owner_enterprise_id)
            enterprise_name = (await self.db.execute(ent_stmt)).scalar_one_or_none()

        return {
            "asset_id": str(asset.id),
            "asset_name": asset.name,
            "asset_type": asset.type.value,
            "token_id": parsed_token_id,
            "contract_address": asset.nft_contract_address or "",
            "owner_address": asset.owner_address or "",
            "owner_enterprise_id": str(effective_owner_enterprise_id) if effective_owner_enterprise_id else None,
            "owner_enterprise_name": enterprise_name,
            "ownership_status": asset.ownership_status or OwnershipStatus.ACTIVE,
            "metadata_uri": asset.metadata_uri or "",
            "created_at": asset.created_at.isoformat(),
            "updated_at": asset.updated_at.isoformat(),
        }

    async def get_transfer_history(
        self,
        token_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """获取 NFT 完整权属变更历史。"""
        count_stmt = select(func.count(NFTTransferRecord.id)).where(
            NFTTransferRecord.token_id == token_id
        )
        total = (await self.db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        stmt = (
            select(NFTTransferRecord)
            .where(NFTTransferRecord.token_id == token_id)
            .order_by(NFTTransferRecord.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        records = (await self.db.execute(stmt)).scalars().all()

        items = [
            {
                "id": str(r.id),
                "token_id": r.token_id,
                "contract_address": r.contract_address,
                "transfer_type": r.transfer_type.value if hasattr(r.transfer_type, "value") else r.transfer_type,
                "from_address": r.from_address,
                "from_enterprise_id": str(r.from_enterprise_id) if r.from_enterprise_id else None,
                "from_enterprise_name": r.from_enterprise_name,
                "to_address": r.to_address,
                "to_enterprise_id": str(r.to_enterprise_id) if r.to_enterprise_id else None,
                "to_enterprise_name": r.to_enterprise_name,
                "tx_hash": r.tx_hash,
                "block_number": r.block_number,
                "timestamp": r.confirmed_at.isoformat() if r.confirmed_at else r.created_at.isoformat(),
                "status": r.status.value if hasattr(r.status, "value") else r.status,
                "remarks": r.remarks,
            }
            for r in records
        ]
        return items, total

    # ------------------------------------------------------------------ #
    # 权限校验                                                              #
    # ------------------------------------------------------------------ #

    async def verify_enterprise_member(self, enterprise_id: UUID, user_id: UUID) -> bool:
        """校验用户是否为企业成员（任意角色）。"""
        stmt = select(EnterpriseMember).where(
            and_(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none() is not None

    async def verify_transfer_permission(self, asset_dict: Dict, user_id: UUID) -> bool:
        """校验用户是否有权限转移该资产（需要 OWNER 或 ADMIN 角色）。"""
        owner_enterprise_id = asset_dict.get("owner_enterprise_id")
        if not owner_enterprise_id:
            return False
        stmt = select(EnterpriseMember).where(
            and_(
                EnterpriseMember.enterprise_id == UUID(owner_enterprise_id),
                EnterpriseMember.user_id == user_id,
                EnterpriseMember.role.in_([MemberRole.OWNER, MemberRole.ADMIN]),
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none() is not None

    # ------------------------------------------------------------------ #
    # 转移                                                                  #
    # ------------------------------------------------------------------ #

    async def transfer_nft(
        self,
        token_id: int,
        to_address: str,
        to_enterprise_id: Optional[UUID],
        operator_id: UUID,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        """执行 NFT 转移：链上调用 + 数据库同步。

        流程：
        1. 校验资产存在且已铸造
        2. 校验操作者权限
        3. 调用合约 transferNFT
        4. 写入 NFTTransferRecord
        5. 更新 Asset 权属字段

        Returns:
            包含 tx_hash 和 transfer_record_id 的字典
        """
        # 1. 获取资产
        stmt = select(Asset).where(Asset.nft_token_id == str(token_id))
        asset = (await self.db.execute(stmt)).scalar_one_or_none()
        if not asset:
            raise NotFoundException(f"Token ID {token_id} 对应的资产不存在")
        if asset.status != AssetStatus.MINTED:
            raise BadRequestException("只有已铸造（MINTED）的资产才能转移")
        if not asset.owner_address:
            raise BadRequestException("资产缺少 owner_address，无法执行转移")

        # 2. 权限校验
        if not await self.verify_transfer_permission(
            {"owner_enterprise_id": str(asset.current_owner_enterprise_id) if asset.current_owner_enterprise_id else None},
            operator_id,
        ):
            raise ForbiddenException("您没有权限转移此 NFT，需要 OWNER 或 ADMIN 角色")

        from_address = asset.owner_address
        contract_address = asset.nft_contract_address or ""

        # 获取企业名称（冗余存储）
        from_enterprise_name: Optional[str] = None
        if asset.current_owner_enterprise_id:
            ent_stmt = select(Enterprise.name).where(Enterprise.id == asset.current_owner_enterprise_id)
            from_enterprise_name = (await self.db.execute(ent_stmt)).scalar_one_or_none()

        to_enterprise_name: Optional[str] = None
        if to_enterprise_id:
            ent_stmt = select(Enterprise.name).where(Enterprise.id == to_enterprise_id)
            to_enterprise_name = (await self.db.execute(ent_stmt)).scalar_one_or_none()

        # 3. 链上转移
        try:
            blockchain = get_blockchain_client()
            tx_hash = await blockchain.transfer_nft(
                from_address=from_address,
                to_address=to_address,
                token_id=token_id,
                reason=remarks or "",
            )
        except Exception as e:
            raise BlockchainException(f"链上转移失败: {str(e)}")

        now = datetime.now(timezone.utc)

        # 4. 写入转移记录
        record = NFTTransferRecord(
            token_id=token_id,
            contract_address=contract_address,
            transfer_type=TransferType.TRANSFER,
            from_address=from_address,
            from_enterprise_id=asset.current_owner_enterprise_id,
            from_enterprise_name=from_enterprise_name,
            to_address=to_address,
            to_enterprise_id=to_enterprise_id,
            to_enterprise_name=to_enterprise_name,
            operator_user_id=operator_id,
            tx_hash=tx_hash,
            status=TransferStatus.CONFIRMED,
            remarks=remarks,
            confirmed_at=now,
        )
        self.db.add(record)

        # 5. 更新资产权属
        asset.owner_address = to_address
        asset.current_owner_enterprise_id = to_enterprise_id
        asset.ownership_status = OwnershipStatus.TRANSFERRED if not to_enterprise_id else OwnershipStatus.ACTIVE
        asset.status = AssetStatus.TRANSFERRED

        await self.db.flush()

        return {
            "success": True,
            "tx_hash": tx_hash,
            "transfer_record_id": str(record.id),
            "token_id": token_id,
            "from_address": from_address,
            "to_address": to_address,
        }

    async def update_ownership_status(
        self,
        token_id: int,
        new_status: str,
        operator_id: UUID,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        """更新资产权属状态（许可/质押等链下状态变更）。

        不涉及链上转移，仅更新数据库状态并写入历史记录。
        """
        stmt = select(Asset).where(Asset.nft_token_id == str(token_id))
        asset = (await self.db.execute(stmt)).scalar_one_or_none()
        if not asset:
            raise NotFoundException(f"Token ID {token_id} 对应的资产不存在")

        if not await self.verify_transfer_permission(
            {"owner_enterprise_id": str(asset.current_owner_enterprise_id) if asset.current_owner_enterprise_id else None},
            operator_id,
        ):
            raise ForbiddenException("权限不足")

        # 状态映射到 TransferType
        type_map = {
            OwnershipStatus.LICENSED: TransferType.LICENSE,
            OwnershipStatus.STAKED: TransferType.STAKE,
            OwnershipStatus.ACTIVE: TransferType.UNSTAKE,
        }
        transfer_type = type_map.get(OwnershipStatus(new_status), TransferType.TRANSFER)

        record = NFTTransferRecord(
            token_id=token_id,
            contract_address=asset.nft_contract_address or "",
            transfer_type=transfer_type,
            from_address=asset.owner_address or "",
            from_enterprise_id=asset.current_owner_enterprise_id,
            to_address=asset.owner_address or "",
            to_enterprise_id=asset.current_owner_enterprise_id,
            operator_user_id=operator_id,
            status=TransferStatus.CONFIRMED,
            remarks=remarks,
            confirmed_at=datetime.now(timezone.utc),
        )
        self.db.add(record)

        asset.ownership_status = new_status
        await self.db.flush()

        return {"success": True, "token_id": token_id, "new_status": new_status}
