# 权属看板 - 后端开发方案

## 1. 功能概述

后端需要提供以下API接口：
1. **权属资产查询** - 获取企业名下的NFT资产列表及统计
2. **NFT转移** - 处理NFT所有权转移请求
3. **历史溯源** - 查询NFT的完整流转历史

---

## 2. 数据模型设计

### 2.1 新增模型文件 `backend/app/models/ownership.py`

```python
"""
权属管理数据模型
"""
from datetime import datetime
from enum import Enum
from uuid import UUID
from typing import Optional, List

from sqlalchemy import Column, String, Integer, BigInteger, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.core.database import Base


class OwnershipStatus(str, Enum):
    """NFT资产归属状态"""
    ACTIVE = "ACTIVE"           # 有效
    LICENSED = "LICENSED"       # 许可中
    STAKED = "STAKED"           # 质押中
    TRANSFERRED = "TRANSFERRED"  # 已转移


class TransferType(str, Enum):
    """权属变更类型"""
    MINT = "MINT"               # 铸造
    TRANSFER = "TRANSFER"       # 转移
    LICENSE = "LICENSE"         # 许可
    STAKE = "STAKE"             # 质押
    UNSTAKE = "UNSTAKE"         # 解除质押
    BURN = "BURN"               # 销毁


class TransferStatus(str, Enum):
    """转移状态"""
    PENDING = "PENDING"         # 待确认
    CONFIRMED = "CONFIRMED"     # 已确认
    FAILED = "FAILED"           # 失败
    CANCELLED = "CANCELLED"     # 已取消


class NFTTransfer(Base):
    """NFT转移记录表"""
    __tablename__ = "nft_transfers"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 关联
    token_id = Column(BigInteger, nullable=False, index=True)
    contract_address = Column(String(42), nullable=False, index=True)
    
    # 转移类型
    transfer_type = Column(SQLEnum(TransferType), nullable=False, default=TransferType.TRANSFER)
    
    # 转移双方
    from_address = Column(String(42), nullable=False)
    from_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
    from_enterprise_name = Column(String(200), nullable=True)
    
    to_address = Column(String(42), nullable=False)
    to_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
    to_enterprise_name = Column(String(200), nullable=True)
    
    # 触发者（操作者）
    operator_user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # 链上信息
    tx_hash = Column(String(66), nullable=True, unique=True)
    block_number = Column(BigInteger, nullable=True)
    block_timestamp = Column(DateTime, nullable=True)
    
    # 状态
    status = Column(SQLEnum(TransferStatus), nullable=False, default=TransferStatus.PENDING)
    
    # 备注
    remarks = Column(Text, nullable=True)
    
    # 拒绝原因
    rejection_reason = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # 关系
    from_enterprise = relationship("Enterprise", foreign_keys=[from_enterprise_id])
    to_enterprise = relationship("Enterprise", foreign_keys=[to_enterprise_id])
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_transfers_token_status', 'token_id', 'status'),
        Index('ix_transfers_from_enterprise', 'from_enterprise_id'),
        Index('ix_transfers_to_enterprise', 'to_enterprise_id'),
        Index('ix_transfers_created', 'created_at'),
    )


class NFTLicense(Base):
    """NFT许可记录表"""
    __tablename__ = "nft_licenses"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    token_id = Column(BigInteger, nullable=False, index=True)
    contract_address = Column(String(42), nullable=False)
    
    # 许可方
    licensor_address = Column(String(42), nullable=False)
    licensor_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
    
    # 被许可方
    licensee_address = Column(String(42), nullable=False)
    licensee_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
    
    # 许可信息
    license_type = Column(String(50), nullable=False)  # exclusive, non-exclusive
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    territory = Column(String(100), nullable=True)  # 地域限制
    restrictions = Column(Text, nullable=True)  # 使用限制
    
    # 状态
    status = Column(String(20), default="ACTIVE")  # ACTIVE, EXPIRED, REVOKED
    
    # 链上信息
    tx_hash = Column(String(66), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NFTStake(Base):
    """NFT质押记录表"""
    __tablename__ = "nft_stakes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    token_id = Column(BigInteger, nullable=False, index=True)
    contract_address = Column(String(42), nullable=False)
    
    # 质押者
    staker_address = Column(String(42), nullable=False)
    staker_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
    
    # 质押平台/目的
    platform = Column(String(100), nullable=True)
    purpose = Column(String(200), nullable=True)
    
    # 状态
    status = Column(String(20), default="STAKED")  # STAKED, UNSTAKED
    
    # 链上信息
    stake_tx_hash = Column(String(66), nullable=True)
    unstake_tx_hash = Column(String(66), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    unstaked_at = Column(DateTime, nullable=True)
```

### 2.2 更新现有模型

在 `Asset` 模型中添加权属相关字段：

```python
# Asset 模型新增字段
owner_address = Column(String(42), nullable=True)
owner_enterprise_id = Column(PGUUID(as_uuid=True), ForeignKey("enterprises.id"), nullable=True)
ownership_status = Column(SQLEnum(OwnershipStatus), default=OwnershipStatus.ACTIVE)
licensed_count = Column(Integer, default=0)
is_staked = Column(Boolean, default=False)
```

---

## 3. API接口设计

### 3.1 路由文件 `backend/app/api/v1/ownership.py`

```python
"""
权属管理API路由
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.ownership import OwnershipStatus, TransferType, TransferStatus
from app.schemas.response import ApiResponse, PageResult
from app.services.ownership_service import OwnershipService

router = APIRouter(prefix="/ownership", tags=["Ownership"])


# ==================== Schema 定义 ====================

class OwnershipAssetResponse(BaseModel):
    """权属资产响应"""
    asset_id: UUID
    asset_name: str
    asset_type: str
    token_id: int
    contract_address: str
    owner_address: str
    owner_enterprise_id: Optional[UUID]
    owner_enterprise_name: Optional[str]
    status: str
    metadata_uri: str
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime


class OwnershipStatsResponse(BaseModel):
    """权属统计响应"""
    total_count: int
    active_count: int
    licensed_count: int
    staked_count: int
    transferred_count: int


class TransferRecordResponse(BaseModel):
    """转移记录响应"""
    id: UUID
    token_id: int
    contract_address: str
    transfer_type: str
    from_address: str
    from_enterprise_id: Optional[UUID]
    from_enterprise_name: Optional[str]
    to_address: str
    to_enterprise_id: Optional[UUID]
    to_enterprise_name: Optional[str]
    tx_hash: Optional[str]
    block_number: Optional[int]
    timestamp: datetime
    status: str
    remarks: Optional[str]


class TransferRequest(BaseModel):
    """转移请求"""
    token_id: int = Field(..., description="NFT Token ID")
    to_address: str = Field(..., description="接收方钱包地址")
    to_enterprise_id: Optional[UUID] = Field(None, description="接收方企业ID")
    remarks: Optional[str] = Field(None, description="备注")


class TransferConfirmRequest(BaseModel):
    """确认转移请求"""
    signature: str = Field(..., description="钱包签名")


class TransferResponse(BaseModel):
    """转移响应"""
    success: bool
    transfer_id: UUID
    tx_hash: Optional[str]
    estimated_confirmation: Optional[str]


# ==================== API 端点 ====================

@router.get(
    "/{enterprise_id}/assets",
    response_model=ApiResponse[PageResult[OwnershipAssetResponse]],
    summary="获取企业权属资产列表",
    description="获取指定企业的NFT资产列表，支持筛选和分页"
)
async def get_enterprise_ownership_assets(
    enterprise_id: UUID,
    asset_type: Optional[str] = Query(None, description="资产类型筛选"),
    status: Optional[OwnershipStatus] = Query(None, description="状态筛选"),
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[PageResult[OwnershipAssetResponse]]:
    """获取企业权属资产列表"""
    service = OwnershipService(db)
    
    # 验证用户属于该企业
    if not await service.verify_enterprise_member(enterprise_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该企业成员"
        )
    
    assets, total = await service.get_enterprise_assets(
        enterprise_id=enterprise_id,
        asset_type=asset_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        search=search,
        page=page,
        page_size=page_size,
    )
    
    return ApiResponse(
        code="SUCCESS",
        message="获取成功",
        data=PageResult(
            items=[OwnershipAssetResponse(**a) for a in assets],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )
    )


@router.get(
    "/{enterprise_id}/stats",
    response_model=ApiResponse[OwnershipStatsResponse],
    summary="获取企业权属统计",
    description="获取企业NFT资产的统计信息"
)
async def get_enterprise_ownership_stats(
    enterprise_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[OwnershipStatsResponse]:
    """获取企业权属统计"""
    service = OwnershipService(db)
    
    if not await service.verify_enterprise_member(enterprise_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该企业成员"
        )
    
    stats = await service.get_enterprise_stats(enterprise_id)
    
    return ApiResponse(
        code="SUCCESS",
        message="获取成功",
        data=OwnershipStatsResponse(**stats)
    )


@router.get(
    "/assets/{token_id}",
    response_model=ApiResponse[OwnershipAssetResponse],
    summary="获取单个NFT资产详情",
    description="获取指定Token ID的NFT资产详情"
)
async def get_ownership_asset_detail(
    token_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[OwnershipAssetResponse]:
    """获取单个NFT资产详情"""
    service = OwnershipService(db)
    
    asset = await service.get_asset_by_token_id(token_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="资产不存在"
        )
    
    return ApiResponse(
        code="SUCCESS",
        message="获取成功",
        data=OwnershipAssetResponse(**asset)
    )


@router.get(
    "/assets/{token_id}/history",
    response_model=ApiResponse[PageResult[TransferRecordResponse]],
    summary="获取NFT历史记录",
    description="获取NFT的完整流转历史"
)
async def get_nft_transfer_history(
    token_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[PageResult[TransferRecordResponse]]:
    """获取NFT历史记录"""
    service = OwnershipService(db)
    
    records, total = await service.get_transfer_history(
        token_id=token_id,
        page=page,
        page_size=page_size,
    )
    
    return ApiResponse(
        code="SUCCESS",
        message="获取成功",
        data=PageResult(
            items=[TransferRecordResponse(**r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )
    )


@router.post(
    "/transfer",
    response_model=ApiResponse[TransferResponse],
    status_code=status.HTTP_201_CREATED,
    summary="发起NFT转移",
    description="发起NFT所有权转移请求"
)
async def initiate_transfer(
    request: TransferRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[TransferResponse]:
    """发起NFT转移"""
    service = OwnershipService(db)
    
    try:
        # 验证资产所有权
        asset = await service.get_asset_by_token_id(request.token_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NFT资产不存在"
            )
        
        # 验证用户有权限转移
        if not await service.verify_transfer_permission(asset, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限转移此NFT"
            )
        
        # 创建转移记录
        transfer = await service.create_transfer_request(
            asset=asset,
            to_address=request.to_address,
            to_enterprise_id=request.to_enterprise_id,
            operator_id=current_user.id,
            remarks=request.remarks,
        )
        
        # TODO: 发送通知给相关方
        
        return ApiResponse(
            code="SUCCESS",
            message="转移请求已创建",
            data=TransferResponse(
                success=True,
                transfer_id=transfer.id,
                tx_hash=None,
                estimated_confirmation=None
            )
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/transfer/{transfer_id}/confirm",
    response_model=ApiResponse[dict],
    summary="确认NFT转移",
    description="确认并执行NFT转移（需要链上交易）"
)
async def confirm_transfer(
    transfer_id: UUID,
    request: TransferConfirmRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """确认NFT转移"""
    service = OwnershipService(db)
    
    try:
        result = await service.confirm_transfer(
            transfer_id=transfer_id,
            signature=request.signature,
            operator_id=current_user.id,
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="NFT转移成功",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/transfer/{transfer_id}/cancel",
    response_model=ApiResponse[dict],
    summary="取消NFT转移",
    description="取消待确认的NFT转移"
)
async def cancel_transfer(
    transfer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """取消NFT转移"""
    service = OwnershipService(db)
    
    result = await service.cancel_transfer(
        transfer_id=transfer_id,
        user_id=current_user.id,
    )
    
    return ApiResponse(
        code="SUCCESS",
        message="转移已取消",
        data=result
    )
```

---

## 4. 服务层实现

### 4.1 新增服务文件 `backend/app/services/ownership_service.py`

```python
"""
权属管理服务层
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.models.asset import Asset
from app.models.enterprise import Enterprise, EnterpriseMember
from app.models.user import User
from app.models.ownership import NFTTransfer, OwnershipStatus, TransferType, TransferStatus
from app.core.blockchain import get_blockchain_client
from app.core.exceptions import NotFoundException, BadRequestException


class OwnershipService:
    """权属管理服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def verify_enterprise_member(
        self,
        enterprise_id: UUID,
        user_id: UUID
    ) -> bool:
        """验证用户是否为企业成员"""
        stmt = select(EnterpriseMember).where(
            and_(
                EnterpriseMember.enterprise_id == enterprise_id,
                EnterpriseMember.user_id == user_id,
                EnterpriseMember.status == "ACTIVE"
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    async def get_enterprise_stats(
        self,
        enterprise_id: UUID
    ) -> Dict[str, int]:
        """获取企业权属统计"""
        # 统计各状态的资产数量
        stmt = select(
            func.count(Asset.id).label('total'),
            func.sum(case((Asset.ownership_status == OwnershipStatus.ACTIVE, 1), else_=0)).label('active'),
            func.sum(case((Asset.ownership_status == OwnershipStatus.LICENSED, 1), else_=0)).label('licensed'),
            func.sum(case((Asset.ownership_status == OwnershipStatus.STAKED, 1), else_=0)).label('staked'),
            func.sum(case((Asset.ownership_status == OwnershipStatus.TRANSFERRED, 1), else_=0)).label('transferred'),
        ).where(
            Asset.owner_enterprise_id == enterprise_id,
            Asset.nft_token_id.isnot(None)  # 只统计已铸造的
        )
        
        result = await self.db.execute(stmt)
        row = result.one()
        
        return {
            "total_count": row.total or 0,
            "active_count": row.active or 0,
            "licensed_count": row.licensed or 0,
            "staked_count": row.staked or 0,
            "transferred_count": row.transferred or 0,
        }
    
    async def get_enterprise_assets(
        self,
        enterprise_id: UUID,
        asset_type: Optional[str] = None,
        status: Optional[OwnershipStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Dict], int]:
        """获取企业资产列表"""
        # 构建查询条件
        conditions = [
            Asset.owner_enterprise_id == enterprise_id,
            Asset.nft_token_id.isnot(None),
        ]
        
        if asset_type:
            conditions.append(Asset.type == asset_type)
        if status:
            conditions.append(Asset.ownership_status == status)
        if start_date:
            conditions.append(Asset.created_at >= start_date)
        if end_date:
            conditions.append(Asset.created_at <= end_date)
        if search:
            conditions.append(Asset.name.ilike(f"%{search}%"))
        
        # 查询总数
        count_stmt = select(func.count(Asset.id)).where(and_(*conditions))
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar()
        
        # 查询列表
        offset = (page - 1) * page_size
        stmt = select(Asset).where(
            and_(*conditions)
        ).order_by(
            Asset.created_at.desc()
        ).offset(offset).limit(page_size)
        
        result = await self.db.execute(stmt)
        assets = result.scalars().all()
        
        # 转换为响应格式
        items = []
        for asset in assets:
            # 获取企业名称
            enterprise_name = None
            if asset.owner_enterprise_id:
                ent_stmt = select(Enterprise.name).where(Enterprise.id == asset.owner_enterprise_id)
                ent_result = await self.db.execute(ent_stmt)
                enterprise_name = ent_result.scalar_one_or_none()
            
            items.append({
                "asset_id": str(asset.id),
                "asset_name": asset.name,
                "asset_type": asset.type.value,
                "token_id": int(asset.nft_token_id),
                "contract_address": asset.nft_contract_address,
                "owner_address": asset.owner_address,
                "owner_enterprise_id": str(asset.owner_enterprise_id) if asset.owner_enterprise_id else None,
                "owner_enterprise_name": enterprise_name,
                "status": asset.ownership_status.value if asset.ownership_status else OwnershipStatus.ACTIVE.value,
                "metadata_uri": asset.metadata_uri,
                "image_url": None,  # TODO: 从metadata获取
                "created_at": asset.created_at,
                "updated_at": asset.updated_at,
            })
        
        return items, total
    
    async def get_asset_by_token_id(
        self,
        token_id: int
    ) -> Optional[Dict]:
        """根据Token ID获取资产"""
        stmt = select(Asset).where(Asset.nft_token_id == str(token_id))
        result = await self.db.execute(stmt)
        asset = result.scalar_one_or_none()
        
        if not asset:
            return None
        
        return {
            "asset_id": str(asset.id),
            "asset_name": asset.name,
            "asset_type": asset.type.value,
            "token_id": int(asset.nft_token_id),
            "contract_address": asset.nft_contract_address,
            "owner_address": asset.owner_address,
            "owner_enterprise_id": str(asset.owner_enterprise_id) if asset.owner_enterprise_id else None,
            "owner_enterprise_name": None,
            "status": asset.ownership_status.value if asset.ownership_status else OwnershipStatus.ACTIVE.value,
            "metadata_uri": asset.metadata_uri,
            "image_url": None,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at,
        }
    
    async def verify_transfer_permission(
        self,
        asset: Dict,
        user_id: UUID
    ) -> bool:
        """验证用户是否有权限转移资产"""
        # 检查用户是否为资产所属企业的Owner或Admin
        if asset.get("owner_enterprise_id"):
            stmt = select(EnterpriseMember).where(
                and_(
                    EnterpriseMember.enterprise_id == asset["owner_enterprise_id"],
                    EnterpriseMember.user_id == user_id,
                    EnterpriseMember.role.in_(["OWNER", "ADMIN"]),
                    EnterpriseMember.status == "ACTIVE"
                )
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none() is not None
        
        return False
    
    async def create_transfer_request(
        self,
        asset: Dict,
        to_address: str,
        to_enterprise_id: Optional[UUID],
        operator_id: UUID,
        remarks: Optional[str] = None,
    ) -> NFTTransfer:
        """创建转移请求"""
        # 获取转出方企业名称
        from_enterprise_name = None
        if asset.get("owner_enterprise_id"):
            stmt = select(Enterprise.name).where(Enterprise.id == asset["owner_enterprise_id"])
            result = await self.db.execute(stmt)
            from_enterprise_name = result.scalar_one_or_none()
        
        # 获取转入方企业名称
        to_enterprise_name = None
        if to_enterprise_id:
            stmt = select(Enterprise.name).where(Enterprise.id == to_enterprise_id)
            result = await self.db.execute(stmt)
            to_enterprise_name = result.scalar_one_or_none()
        
        # 创建转移记录
        transfer = NFTTransfer(
            token_id=asset["token_id"],
            contract_address=asset["contract_address"],
            transfer_type=TransferType.TRANSFER,
            from_address=asset["owner_address"],
            from_enterprise_id=asset.get("owner_enterprise_id"),
            from_enterprise_name=from_enterprise_name,
            to_address=to_address,
            to_enterprise_id=to_enterprise_id,
            to_enterprise_name=to_enterprise_name,
            operator_user_id=operator_id,
            status=TransferStatus.PENDING,
            remarks=remarks,
        )
        
        self.db.add(transfer)
        await self.db.flush()
        
        return transfer
    
    async def confirm_transfer(
        self,
        transfer_id: UUID,
        signature: str,
        operator_id: UUID,
    ) -> Dict[str, Any]:
        """确认并执行转移"""
        # 获取转移记录
        transfer = await self.db.get(NFTTransfer, transfer_id)
        if not transfer:
            raise NotFoundException("转移记录不存在")
        
        if transfer.status != TransferStatus.PENDING:
            raise BadRequestException("该转移已被处理")
        
        # 调用区块链合约执行转移
        blockchain = get_blockchain_client()
        
        try:
            tx_hash = await blockchain.transfer_nft(
                from_address=transfer.from_address,
                to_address=transfer.to_address,
                token_id=transfer.token_id,
            )
            
            # 更新转移记录
            transfer.tx_hash = tx_hash
            transfer.status = TransferStatus.CONFIRMED
            transfer.confirmed_at = datetime.now(timezone.utc)
            
            # 更新资产归属
            stmt = select(Asset).where(Asset.nft_token_id == str(transfer.token_id))
            result = await self.db.execute(stmt)
            asset = result.scalar_one_or_none()
            
            if asset:
                asset.owner_address = transfer.to_address
                asset.owner_enterprise_id = transfer.to_enterprise_id
                asset.ownership_status = OwnershipStatus.TRANSFERRED
            
            await self.db.flush()
            
            return {
                "success": True,
                "tx_hash": tx_hash,
            }
            
        except Exception as e:
            transfer.status = TransferStatus.FAILED
            await self.db.flush()
            raise BadRequestException(f"链上转移失败: {str(e)}")
    
    async def cancel_transfer(
        self,
        transfer_id: UUID,
        user_id: UUID,
    ) -> Dict[str, Any]:
        """取消转移"""
        transfer = await self.db.get(NFTTransfer, transfer_id)
        if not transfer:
            raise NotFoundException("转移记录不存在")
        
        if transfer.status != TransferStatus.PENDING:
            raise BadRequestException("只能取消待确认的转移")
        
        # 验证权限
        if transfer.operator_user_id != user_id:
            raise BadRequestException("您无权取消此转移")
        
        transfer.status = TransferStatus.CANCELLED
        transfer.cancelled_at = datetime.now(timezone.utc)
        
        await self.db.flush()
        
        return {"success": True}
    
    async def get_transfer_history(
        self,
        token_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Dict], int]:
        """获取NFT转移历史"""
        # 查询总数
        count_stmt = select(func.count(NFTTransfer.id)).where(
            NFTTransfer.token_id == token_id
        )
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar()
        
        # 查询列表
        offset = (page - 1) * page_size
        stmt = select(NFTTransfer).where(
            NFTTransfer.token_id == token_id
        ).order_by(
            NFTTransfer.created_at.desc()
        ).offset(offset).limit(page_size)
        
        result = await self.db.execute(stmt)
        records = result.scalars().all()
        
        items = []
        for record in records:
            items.append({
                "id": str(record.id),
                "token_id": record.token_id,
                "contract_address": record.contract_address,
                "transfer_type": record.transfer_type.value,
                "from_address": record.from_address,
                "from_enterprise_id": str(record.from_enterprise_id) if record.from_enterprise_id else None,
                "from_enterprise_name": record.from_enterprise_name,
                "to_address": record.to_address,
                "to_enterprise_id": str(record.to_enterprise_id) if record.to_enterprise_id else None,
                "to_enterprise_name": record.to_enterprise_name,
                "tx_hash": record.tx_hash,
                "block_number": record.block_number,
                "timestamp": record.created_at,
                "status": record.status.value,
                "remarks": record.remarks,
            })
        
        return items, total
```

---

## 5. 区块链交互

### 5.1 更新区块链客户端 `backend/app/core/blockchain.py`

添加转移方法：

```python
async def transfer_nft(
    self,
    from_address: str,
    to_address: str,
    token_id: int,
) -> str:
    """转移NFT
    
    Args:
        from_address: 转出方地址
        to_address: 接收方地址
        token_id: NFT Token ID
        
    Returns:
        交易哈希
    """
    if not self.contract:
        raise BlockchainException("Contract not initialized")
    
    try:
        # 构建交易
        tx = self.contract.functions.transferFrom(
            from_address,
            to_address,
            token_id
        ).build_transaction({
            'from': self.deployer_address,
            'nonce': await self._get_nonce(),
            'gas': 200000,
            'gasPrice': self.w3.eth.gas_price,
        })
        
        # 签名交易
        signed_tx = self.w3.eth.account.sign_transaction(
            tx,
            private_key=self.private_key
        )
        
        # 发送交易
        tx_hash = await self._send_raw_transaction(signed_tx)
        
        # 等待确认
        await self._wait_for_transaction_receipt(tx_hash)
        
        return tx_hash
        
    except Exception as e:
        raise BlockchainException(f"Failed to transfer NFT: {str(e)}")
```

---

## 6. 开发清单

### Phase 1: 数据模型
- [ ] 创建 `backend/app/models/ownership.py`
- [ ] 在 Asset 模型中添加权属字段
- [ ] 创建数据库迁移

### Phase 2: API接口
- [ ] 创建 `backend/app/api/v1/ownership.py`
- [ ] 实现权属资产查询接口
- [ ] 实现统计接口
- [ ] 实现转移相关接口

### Phase 3: 服务层
- [ ] 创建 `backend/app/services/ownership_service.py`
- [ ] 实现业务逻辑
- [ ] 集成区块链转移功能

### Phase 4: 集成测试
- [ ] 测试完整转移流程
- [ ] 测试历史查询
- [ ] 性能优化
