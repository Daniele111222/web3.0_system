"""企业管理业务逻辑服务。"""
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from eth_account.messages import encode_defunct
from web3 import Web3

from app.core.exceptions import (
    AppException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
)
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole
from app.repositories.enterprise_repository import (
    EnterpriseRepository,
    EnterpriseMemberRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.enterprise import (
    EnterpriseCreateRequest,
    EnterpriseUpdateRequest,
    EnterpriseResponse,
    EnterpriseDetailResponse,
    EnterpriseListResponse,
    MemberResponse,
    InviteMemberRequest,
    UpdateMemberRoleRequest,
)


class EnterpriseNotFoundError(NotFoundException):
    """当找不到企业时抛出。"""
    
    def __init__(self):
        super().__init__("未找到该企业", "ENTERPRISE_NOT_FOUND")


class PermissionDeniedError(ForbiddenException):
    """当用户没有权限时抛出。"""
    
    def __init__(self, message: str = "您没有执行此操作的权限"):
        super().__init__(message, "PERMISSION_DENIED")


class MemberExistsError(ConflictException):
    """当成员已存在时抛出。"""
    
    def __init__(self):
        super().__init__("该用户已是企业成员", "MEMBER_EXISTS")


class MemberNotFoundError(NotFoundException):
    """当找不到成员时抛出。"""
    
    def __init__(self):
        super().__init__("未找到该成员", "MEMBER_NOT_FOUND")


class UserNotFoundError(NotFoundException):
    """当找不到用户时抛出。"""
    
    def __init__(self):
        super().__init__("未找到该用户", "USER_NOT_FOUND")


class WalletBindError(BadRequestException):
    """当钱包绑定失败时抛出。"""
    
    def __init__(self, message: str):
        super().__init__(message, "WALLET_BIND_ERROR")


class CannotRemoveOwnerError(ForbiddenException):
    """当尝试移除所有者时抛出。"""
    
    def __init__(self):
        super().__init__("不能移除企业所有者", "CANNOT_REMOVE_OWNER")


class EnterpriseService:
    """
    企业管理服务类。
    
    提供企业相关的业务逻辑操作，包括企业 CRUD、成员管理等功能。
    """
    
    def __init__(self, db: AsyncSession):
        """
        初始化企业服务。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
        self.enterprise_repo = EnterpriseRepository(db)
        self.member_repo = EnterpriseMemberRepository(db)
        self.user_repo = UserRepository(db)
    
    async def create_enterprise(
        self,
        data: EnterpriseCreateRequest,
        owner_id: UUID,
    ) -> EnterpriseDetailResponse:
        """
        创建新企业。
        
        创建企业并将创建者设为所有者。
        
        Args:
            data (EnterpriseCreateRequest): 创建企业的请求数据。
            owner_id (UUID): 创建者（所有者）的用户 ID。
            
        Returns:
            EnterpriseDetailResponse: 创建后的企业详情。
            
        Raises:
            UserNotFoundError: 如果创建者用户不存在。
        """
        # 验证用户存在
        user = await self.user_repo.get_by_id(owner_id)
        if not user:
            raise UserNotFoundError()
        
        # 创建企业
        enterprise = Enterprise(
            name=data.name,
            description=data.description,
            logo_url=data.logo_url,
            website=data.website,
            contact_email=data.contact_email,
        )
        enterprise = await self.enterprise_repo.create(enterprise)
        
        # 添加创建者为所有者
        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=owner_id,
            role=MemberRole.OWNER,
        )
        await self.member_repo.create(member)
        
        # 刷新 session，确保能看到新创建的成员
        await self.db.refresh(enterprise)
        
        # 重新获取完整数据（需要新查询以加载 members 关系）
        enterprise = await self.enterprise_repo.get_by_id(enterprise.id)
        
        return self._enterprise_to_detail_response(enterprise)
    
    async def get_enterprise(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> EnterpriseDetailResponse:
        """
        获取企业详情。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 请求用户的 ID（用于权限验证）。
            
        Returns:
            EnterpriseDetailResponse: 企业详情。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果用户不是企业成员。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证用户是企业成员
        if not await self.member_repo.is_member(enterprise_id, user_id):
            raise PermissionDeniedError("您不是该企业的成员")
        
        return self._enterprise_to_detail_response(enterprise)
    
    async def get_user_enterprises(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> EnterpriseListResponse:
        """
        获取用户所属的企业列表。
        
        Args:
            user_id (UUID): 用户 ID。
            page (int): 页码，从 1 开始。
            page_size (int): 每页数量。
            
        Returns:
            EnterpriseListResponse: 企业列表响应。
        """
        enterprises, total = await self.enterprise_repo.get_user_enterprises(
            user_id, page, page_size
        )
        
        # 获取每个企业的成员数量
        items = []
        for enterprise in enterprises:
            member_count = await self.enterprise_repo.get_member_count(enterprise.id)
            items.append(self._enterprise_to_response(enterprise, member_count))
        
        pages = (total + page_size - 1) // page_size if total > 0 else 1
        
        return EnterpriseListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )
    
    async def update_enterprise(
        self,
        enterprise_id: UUID,
        data: EnterpriseUpdateRequest,
        user_id: UUID,
    ) -> EnterpriseDetailResponse:
        """
        更新企业信息。
        
        只有所有者和管理员可以更新企业信息。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            data (EnterpriseUpdateRequest): 更新请求数据。
            user_id (UUID): 请求用户的 ID。
            
        Returns:
            EnterpriseDetailResponse: 更新后的企业详情。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果用户没有更新权限。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证权限（只有 OWNER 和 ADMIN 可以更新）
        await self._check_admin_permission(enterprise_id, user_id)
        
        # 更新企业
        update_data = data.model_dump(exclude_unset=True)
        enterprise = await self.enterprise_repo.update(enterprise_id, **update_data)
        
        return self._enterprise_to_detail_response(enterprise)
    
    async def delete_enterprise(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        删除企业。
        
        只有所有者可以删除企业。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 请求用户的 ID。
            
        Returns:
            bool: 删除是否成功。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果用户不是所有者。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证权限（只有 OWNER 可以删除）
        await self._check_owner_permission(enterprise_id, user_id)
        
        return await self.enterprise_repo.delete(enterprise_id)

    async def invite_member(
        self,
        enterprise_id: UUID,
        data: InviteMemberRequest,
        inviter_id: UUID,
    ) -> MemberResponse:
        """
        邀请成员加入企业。
        
        只有所有者和管理员可以邀请成员。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            data (InviteMemberRequest): 邀请请求数据。
            inviter_id (UUID): 邀请者的用户 ID。
            
        Returns:
            MemberResponse: 新成员信息。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果邀请者没有权限。
            UserNotFoundError: 如果被邀请用户不存在。
            MemberExistsError: 如果用户已是成员。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证邀请者权限
        await self._check_admin_permission(enterprise_id, inviter_id)
        
        # 验证被邀请用户存在
        user_id = UUID(data.user_id)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        
        # 检查是否已是成员
        if await self.member_repo.is_member(enterprise_id, user_id):
            raise MemberExistsError()
        
        # 创建成员关系
        member = EnterpriseMember(
            enterprise_id=enterprise_id,
            user_id=user_id,
            role=data.role,
        )
        member = await self.member_repo.create(member)
        
        # 重新获取完整数据
        member = await self.member_repo.get_member(enterprise_id, user_id)
        
        return self._member_to_response(member)
    
    async def update_member_role(
        self,
        enterprise_id: UUID,
        target_user_id: UUID,
        data: UpdateMemberRoleRequest,
        operator_id: UUID,
    ) -> MemberResponse:
        """
        更新成员角色。
        
        只有所有者可以更新成员角色。不能更改所有者的角色。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            target_user_id (UUID): 目标成员的用户 ID。
            data (UpdateMemberRoleRequest): 角色更新请求数据。
            operator_id (UUID): 操作者的用户 ID。
            
        Returns:
            MemberResponse: 更新后的成员信息。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果操作者没有权限或尝试更改所有者角色。
            MemberNotFoundError: 如果目标成员不存在。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证操作者权限（只有 OWNER 可以更改角色）
        await self._check_owner_permission(enterprise_id, operator_id)
        
        # 获取目标成员
        member = await self.member_repo.get_member(enterprise_id, target_user_id)
        if not member:
            raise MemberNotFoundError()
        
        # 不能更改所有者的角色
        if member.role == MemberRole.OWNER:
            raise PermissionDeniedError("不能更改所有者的角色")
        
        # 更新角色
        member = await self.member_repo.update_role(
            enterprise_id, target_user_id, data.role
        )
        
        return self._member_to_response(member)
    
    async def remove_member(
        self,
        enterprise_id: UUID,
        target_user_id: UUID,
        operator_id: UUID,
    ) -> bool:
        """
        移除企业成员。
        
        所有者和管理员可以移除成员。不能移除所有者。
        成员可以自己退出企业。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            target_user_id (UUID): 目标成员的用户 ID。
            operator_id (UUID): 操作者的用户 ID。
            
        Returns:
            bool: 移除是否成功。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果操作者没有权限。
            MemberNotFoundError: 如果目标成员不存在。
            CannotRemoveOwnerError: 如果尝试移除所有者。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 获取目标成员
        member = await self.member_repo.get_member(enterprise_id, target_user_id)
        if not member:
            raise MemberNotFoundError()
        
        # 不能移除所有者
        if member.role == MemberRole.OWNER:
            raise CannotRemoveOwnerError()
        
        # 验证权限：自己退出或管理员移除
        if operator_id != target_user_id:
            await self._check_admin_permission(enterprise_id, operator_id)
        
        return await self.member_repo.delete(enterprise_id, target_user_id)
    
    async def get_enterprise_members(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> List[MemberResponse]:
        """
        获取企业成员列表。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 请求用户的 ID（用于权限验证）。
            
        Returns:
            List[MemberResponse]: 成员列表。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果用户不是企业成员。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证用户是企业成员
        if not await self.member_repo.is_member(enterprise_id, user_id):
            raise PermissionDeniedError("您不是该企业的成员")
        
        members = await self.member_repo.get_enterprise_members(enterprise_id)
        return [self._member_to_response(m) for m in members]
    
    async def bind_wallet(
        self,
        enterprise_id: UUID,
        wallet_address: str,
        signature: str,
        message: str,
        user_id: UUID,
    ) -> EnterpriseDetailResponse:
        """
        为企业绑定钱包地址。
        
        只有所有者可以绑定钱包。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            wallet_address (str): 钱包地址。
            signature (str): 钱包签名。
            message (str): 签名的原始消息。
            user_id (UUID): 操作者的用户 ID。
            
        Returns:
            EnterpriseDetailResponse: 更新后的企业详情。
            
        Raises:
            EnterpriseNotFoundError: 如果企业不存在。
            PermissionDeniedError: 如果操作者不是所有者。
            WalletBindError: 如果钱包已被绑定或签名无效。
        """
        enterprise = await self.enterprise_repo.get_by_id(enterprise_id)
        if not enterprise:
            raise EnterpriseNotFoundError()
        
        # 验证权限（只有 OWNER 可以绑定钱包）
        await self._check_owner_permission(enterprise_id, user_id)
        
        # 检查钱包是否已被其他企业绑定
        if await self.enterprise_repo.wallet_address_exists(wallet_address):
            existing = await self.enterprise_repo.get_by_wallet_address(wallet_address)
            if existing and existing.id != enterprise_id:
                raise WalletBindError("该钱包地址已绑定到其他企业")
        
        # 验证签名
        if not self._verify_wallet_signature(wallet_address, signature, message):
            raise WalletBindError("无效的钱包签名")
        
        # 更新钱包地址
        enterprise = await self.enterprise_repo.update_wallet_address(
            enterprise_id, wallet_address
        )
        
        return self._enterprise_to_detail_response(enterprise)

    async def _check_owner_permission(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> None:
        """
        检查用户是否是企业所有者。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Raises:
            PermissionDeniedError: 如果用户不是所有者。
        """
        role = await self.member_repo.get_user_role(enterprise_id, user_id)
        if role != MemberRole.OWNER:
            raise PermissionDeniedError("只有企业所有者可以执行此操作")
    
    async def _check_admin_permission(
        self,
        enterprise_id: UUID,
        user_id: UUID,
    ) -> None:
        """
        检查用户是否有管理权限（所有者或管理员）。
        
        Args:
            enterprise_id (UUID): 企业 ID。
            user_id (UUID): 用户 ID。
            
        Raises:
            PermissionDeniedError: 如果用户没有管理权限。
        """
        role = await self.member_repo.get_user_role(enterprise_id, user_id)
        if role not in (MemberRole.OWNER, MemberRole.ADMIN):
            raise PermissionDeniedError("只有企业所有者或管理员可以执行此操作")
    
    def _verify_wallet_signature(
        self,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> bool:
        """
        使用 Web3 验证钱包签名。
        
        Args:
            wallet_address (str): 钱包地址。
            signature (str): 钱包签名。
            message (str): 签名的原始消息。
            
        Returns:
            bool: 签名是否有效。
        """
        try:
            w3 = Web3()
            message_hash = encode_defunct(text=message)
            recovered_address = w3.eth.account.recover_message(
                message_hash, signature=signature
            )
            return recovered_address.lower() == wallet_address.lower()
        except Exception:
            return False
    
    def _enterprise_to_response(
        self,
        enterprise: Enterprise,
        member_count: int = 0,
    ) -> EnterpriseResponse:
        """
        将 Enterprise 模型转换为 EnterpriseResponse 架构。
        
        Args:
            enterprise (Enterprise): 企业模型实例。
            member_count (int): 成员数量。
            
        Returns:
            EnterpriseResponse: 企业响应数据。
        """
        return EnterpriseResponse(
            id=str(enterprise.id),
            name=enterprise.name,
            description=enterprise.description,
            logo_url=enterprise.logo_url,
            website=enterprise.website,
            contact_email=enterprise.contact_email,
            wallet_address=enterprise.wallet_address,
            is_active=enterprise.is_active,
            is_verified=enterprise.is_verified,
            created_at=enterprise.created_at,
            updated_at=enterprise.updated_at,
            member_count=member_count,
        )
    
    def _enterprise_to_detail_response(
        self,
        enterprise: Enterprise,
    ) -> EnterpriseDetailResponse:
        """
        将 Enterprise 模型转换为 EnterpriseDetailResponse 架构。
        
        Args:
            enterprise (Enterprise): 企业模型实例（需包含 members 关系）。
            
        Returns:
            EnterpriseDetailResponse: 企业详情响应数据。
        """
        members = [
            self._member_to_response(m) for m in enterprise.members
        ] if enterprise.members else []
        
        return EnterpriseDetailResponse(
            id=str(enterprise.id),
            name=enterprise.name,
            description=enterprise.description,
            logo_url=enterprise.logo_url,
            website=enterprise.website,
            contact_email=enterprise.contact_email,
            wallet_address=enterprise.wallet_address,
            is_active=enterprise.is_active,
            is_verified=enterprise.is_verified,
            created_at=enterprise.created_at,
            updated_at=enterprise.updated_at,
            member_count=len(members),
            members=members,
        )
    
    def _member_to_response(
        self,
        member: EnterpriseMember,
    ) -> MemberResponse:
        """
        将 EnterpriseMember 模型转换为 MemberResponse 架构。
        
        Args:
            member (EnterpriseMember): 成员关系模型实例（需包含 user 关系）。
            
        Returns:
            MemberResponse: 成员响应数据。
        """
        return MemberResponse(
            id=str(member.id),
            user_id=str(member.user_id),
            username=member.user.username,
            email=member.user.email,
            full_name=member.user.full_name,
            avatar_url=member.user.avatar_url,
            role=member.role,
            joined_at=member.joined_at,
        )
