"""企业管理 API 路由。"""
from uuid import UUID
from fastapi import APIRouter, Query

from app.api.deps import DBSession, CurrentUserId
from app.services.enterprise_service import (
    EnterpriseService,
)
from app.schemas.enterprise import (
    EnterpriseCreateRequest,
    EnterpriseUpdateRequest,
    EnterpriseDetailResponse,
    EnterpriseListResponse,
    MemberResponse,
    InviteMemberRequest,
    UpdateMemberRoleRequest,
    BindWalletRequest,
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/enterprises", tags=["Enterprises"])


@router.post(
    "",
    response_model=EnterpriseDetailResponse,
    summary="创建企业",
    description="创建一个新企业，创建者自动成为企业所有者",
)
async def create_enterprise(
    data: EnterpriseCreateRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """创建新企业。"""
    service = EnterpriseService(db)
    result = await service.create_enterprise(data, UUID(current_user_id))
    await db.commit()
    return result


@router.get(
    "",
    response_model=EnterpriseListResponse,
    summary="获取我的企业列表",
    description="获取当前用户所属的所有企业列表，支持分页",
)
async def get_my_enterprises(
    db: DBSession,
    current_user_id: CurrentUserId,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
) -> EnterpriseListResponse:
    """获取当前用户所属的企业列表。"""
    service = EnterpriseService(db)
    return await service.get_user_enterprises(
        UUID(current_user_id), page, page_size
    )


@router.get(
    "/{enterprise_id}",
    response_model=EnterpriseDetailResponse,
    summary="获取企业详情",
    description="获取指定企业的详细信息，包括成员列表",
)
async def get_enterprise(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """获取企业详情。"""
    service = EnterpriseService(db)
    return await service.get_enterprise(
        UUID(enterprise_id), UUID(current_user_id)
    )


@router.put(
    "/{enterprise_id}",
    response_model=EnterpriseDetailResponse,
    summary="更新企业信息",
    description="更新企业基本信息（仅企业所有者和管理员可操作）",
)
async def update_enterprise(
    enterprise_id: str,
    data: EnterpriseUpdateRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """更新企业信息。"""
    service = EnterpriseService(db)
    result = await service.update_enterprise(
        UUID(enterprise_id), data, UUID(current_user_id)
    )
    await db.commit()
    return result


@router.delete(
    "/{enterprise_id}",
    response_model=MessageResponse,
    summary="删除企业",
    description="删除企业（仅企业所有者可操作，将同时删除所有成员关系）",
)
async def delete_enterprise(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MessageResponse:
    """删除企业。"""
    service = EnterpriseService(db)
    await service.delete_enterprise(UUID(enterprise_id), UUID(current_user_id))
    await db.commit()
    return MessageResponse(message="企业已成功删除")


@router.get(
    "/{enterprise_id}/members",
    response_model=list[MemberResponse],
    summary="获取企业成员列表",
    description="获取指定企业的所有成员列表",
)
async def get_enterprise_members(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> list[MemberResponse]:
    """获取企业成员列表。"""
    service = EnterpriseService(db)
    return await service.get_enterprise_members(
        UUID(enterprise_id), UUID(current_user_id)
    )


@router.post(
    "/{enterprise_id}/members",
    response_model=MemberResponse,
    summary="邀请成员加入企业",
    description="邀请用户加入企业，可指定成员角色",
)
async def invite_member(
    enterprise_id: str,
    data: InviteMemberRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MemberResponse:
    """邀请成员加入企业。"""
    service = EnterpriseService(db)
    result = await service.invite_member(
        UUID(enterprise_id), data, UUID(current_user_id)
    )
    await db.commit()
    return result


@router.put(
    "/{enterprise_id}/members/{user_id}",
    response_model=MemberResponse,
    summary="更新成员角色",
    description="更新企业成员的的角色（仅企业所有者和管理员可操作）",
)
async def update_member_role(
    enterprise_id: str,
    user_id: str,
    data: UpdateMemberRoleRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MemberResponse:
    """更新成员角色。"""
    service = EnterpriseService(db)
    result = await service.update_member_role(
        UUID(enterprise_id), UUID(user_id), data, UUID(current_user_id)
    )
    await db.commit()
    return result


@router.delete(
    "/{enterprise_id}/members/{user_id}",
    response_model=MessageResponse,
    summary="移除企业成员",
    description="从企业中移除指定成员（企业所有者不能被移除）",
)
async def remove_member(
    enterprise_id: str,
    user_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MessageResponse:
    """移除企业成员。"""
    service = EnterpriseService(db)
    await service.remove_member(
        UUID(enterprise_id), UUID(user_id), UUID(current_user_id)
    )
    await db.commit()
    return MessageResponse(message="成员已成功移除")


@router.post(
    "/{enterprise_id}/wallet",
    response_model=EnterpriseDetailResponse,
    summary="绑定企业钱包",
    description="将区块链钱包地址绑定到企业（仅企业所有者和管理员可操作）",
)
async def bind_enterprise_wallet(
    enterprise_id: str,
    data: BindWalletRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """为企业绑定钱包地址。"""
    service = EnterpriseService(db)
    result = await service.bind_wallet(
        UUID(enterprise_id),
        data.wallet_address,
        data.signature,
        data.message,
        UUID(current_user_id),
    )
    await db.commit()
    return result
