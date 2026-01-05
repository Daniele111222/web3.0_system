"""企业管理 API 路由。"""
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Query

from app.api.deps import DBSession, CurrentUserId
from app.services.enterprise_service import (
    EnterpriseService,
    EnterpriseServiceError,
    EnterpriseNotFoundError,
    PermissionDeniedError,
    MemberExistsError,
    MemberNotFoundError,
    UserNotFoundError,
    WalletBindError,
    CannotRemoveOwnerError,
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


def _handle_service_error(error: EnterpriseServiceError) -> HTTPException:
    """
    将服务层错误转换为 HTTP 异常。
    
    Args:
        error (EnterpriseServiceError): 服务层错误实例。
        
    Returns:
        HTTPException: 对应的 HTTP 异常。
    """
    status_map = {
        "ENTERPRISE_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "PERMISSION_DENIED": status.HTTP_403_FORBIDDEN,
        "MEMBER_EXISTS": status.HTTP_409_CONFLICT,
        "MEMBER_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "USER_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "WALLET_BIND_ERROR": status.HTTP_400_BAD_REQUEST,
        "CANNOT_REMOVE_OWNER": status.HTTP_400_BAD_REQUEST,
    }
    return HTTPException(
        status_code=status_map.get(error.code, status.HTTP_400_BAD_REQUEST),
        detail=error.message,
    )


@router.post("", response_model=EnterpriseDetailResponse)
async def create_enterprise(
    data: EnterpriseCreateRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """
    创建新企业。
    
    创建一个新的企业组织，当前用户将成为企业所有者。
    
    Args:
        data (EnterpriseCreateRequest): 创建企业的请求数据。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        EnterpriseDetailResponse: 创建后的企业详情。
        
    Raises:
        HTTPException: 如果创建失败。
    """
    try:
        service = EnterpriseService(db)
        result = await service.create_enterprise(data, UUID(current_user_id))
        await db.commit()
        return result
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.get("", response_model=EnterpriseListResponse)
async def get_my_enterprises(
    db: DBSession,
    current_user_id: CurrentUserId,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
) -> EnterpriseListResponse:
    """
    获取当前用户所属的企业列表。
    
    返回当前登录用户作为成员的所有企业，支持分页。
    
    Args:
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        page (int): 页码，从 1 开始。
        page_size (int): 每页数量，最大 100。
        
    Returns:
        EnterpriseListResponse: 企业列表响应。
    """
    service = EnterpriseService(db)
    return await service.get_user_enterprises(
        UUID(current_user_id), page, page_size
    )


@router.get("/{enterprise_id}", response_model=EnterpriseDetailResponse)
async def get_enterprise(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """
    获取企业详情。
    
    返回指定企业的详细信息，包括成员列表。
    只有企业成员可以查看。
    
    Args:
        enterprise_id (str): 企业 ID。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        EnterpriseDetailResponse: 企业详情。
        
    Raises:
        HTTPException: 如果企业不存在或用户无权访问。
    """
    try:
        service = EnterpriseService(db)
        return await service.get_enterprise(
            UUID(enterprise_id), UUID(current_user_id)
        )
    except EnterpriseServiceError as e:
        raise _handle_service_error(e)


@router.put("/{enterprise_id}", response_model=EnterpriseDetailResponse)
async def update_enterprise(
    enterprise_id: str,
    data: EnterpriseUpdateRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """
    更新企业信息。
    
    更新指定企业的基本信息。
    只有企业所有者和管理员可以更新。
    
    Args:
        enterprise_id (str): 企业 ID。
        data (EnterpriseUpdateRequest): 更新请求数据。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        EnterpriseDetailResponse: 更新后的企业详情。
        
    Raises:
        HTTPException: 如果企业不存在或用户无权更新。
    """
    try:
        service = EnterpriseService(db)
        result = await service.update_enterprise(
            UUID(enterprise_id), data, UUID(current_user_id)
        )
        await db.commit()
        return result
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.delete("/{enterprise_id}", response_model=MessageResponse)
async def delete_enterprise(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MessageResponse:
    """
    删除企业。
    
    删除指定企业及其所有关联数据。
    只有企业所有者可以删除。
    
    Args:
        enterprise_id (str): 企业 ID。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        MessageResponse: 删除结果消息。
        
    Raises:
        HTTPException: 如果企业不存在或用户无权删除。
    """
    try:
        service = EnterpriseService(db)
        await service.delete_enterprise(UUID(enterprise_id), UUID(current_user_id))
        await db.commit()
        return MessageResponse(message="企业已成功删除")
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.get("/{enterprise_id}/members", response_model=list[MemberResponse])
async def get_enterprise_members(
    enterprise_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> list[MemberResponse]:
    """
    获取企业成员列表。
    
    返回指定企业的所有成员信息。
    只有企业成员可以查看。
    
    Args:
        enterprise_id (str): 企业 ID。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        list[MemberResponse]: 成员列表。
        
    Raises:
        HTTPException: 如果企业不存在或用户无权访问。
    """
    try:
        service = EnterpriseService(db)
        return await service.get_enterprise_members(
            UUID(enterprise_id), UUID(current_user_id)
        )
    except EnterpriseServiceError as e:
        raise _handle_service_error(e)


@router.post("/{enterprise_id}/members", response_model=MemberResponse)
async def invite_member(
    enterprise_id: str,
    data: InviteMemberRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MemberResponse:
    """
    邀请成员加入企业。
    
    邀请指定用户加入企业并分配角色。
    只有企业所有者和管理员可以邀请成员。
    
    Args:
        enterprise_id (str): 企业 ID。
        data (InviteMemberRequest): 邀请请求数据。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        MemberResponse: 新成员信息。
        
    Raises:
        HTTPException: 如果邀请失败。
    """
    try:
        service = EnterpriseService(db)
        result = await service.invite_member(
            UUID(enterprise_id), data, UUID(current_user_id)
        )
        await db.commit()
        return result
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.put("/{enterprise_id}/members/{user_id}", response_model=MemberResponse)
async def update_member_role(
    enterprise_id: str,
    user_id: str,
    data: UpdateMemberRoleRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MemberResponse:
    """
    更新成员角色。
    
    更新指定成员在企业中的角色。
    只有企业所有者可以更新成员角色。
    不能更改所有者的角色。
    
    Args:
        enterprise_id (str): 企业 ID。
        user_id (str): 目标成员的用户 ID。
        data (UpdateMemberRoleRequest): 角色更新请求数据。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        MemberResponse: 更新后的成员信息。
        
    Raises:
        HTTPException: 如果更新失败。
    """
    try:
        service = EnterpriseService(db)
        result = await service.update_member_role(
            UUID(enterprise_id), UUID(user_id), data, UUID(current_user_id)
        )
        await db.commit()
        return result
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.delete("/{enterprise_id}/members/{user_id}", response_model=MessageResponse)
async def remove_member(
    enterprise_id: str,
    user_id: str,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> MessageResponse:
    """
    移除企业成员。
    
    从企业中移除指定成员。
    所有者和管理员可以移除成员，成员也可以自己退出。
    不能移除企业所有者。
    
    Args:
        enterprise_id (str): 企业 ID。
        user_id (str): 目标成员的用户 ID。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        MessageResponse: 移除结果消息。
        
    Raises:
        HTTPException: 如果移除失败。
    """
    try:
        service = EnterpriseService(db)
        await service.remove_member(
            UUID(enterprise_id), UUID(user_id), UUID(current_user_id)
        )
        await db.commit()
        return MessageResponse(message="成员已成功移除")
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)


@router.post("/{enterprise_id}/wallet", response_model=EnterpriseDetailResponse)
async def bind_enterprise_wallet(
    enterprise_id: str,
    data: BindWalletRequest,
    db: DBSession,
    current_user_id: CurrentUserId,
) -> EnterpriseDetailResponse:
    """
    为企业绑定钱包地址。
    
    将区块链钱包地址绑定到企业，用于 NFT 铸造和转移。
    只有企业所有者可以绑定钱包。
    
    Args:
        enterprise_id (str): 企业 ID。
        data (BindWalletRequest): 钱包绑定请求数据。
        db (DBSession): 数据库会话。
        current_user_id (CurrentUserId): 当前登录用户的 ID。
        
    Returns:
        EnterpriseDetailResponse: 更新后的企业详情。
        
    Raises:
        HTTPException: 如果绑定失败。
    """
    try:
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
    except EnterpriseServiceError as e:
        await db.rollback()
        raise _handle_service_error(e)
