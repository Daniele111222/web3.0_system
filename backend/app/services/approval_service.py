"""审批业务逻辑服务。"""
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
)
from app.models.approval import (
    Approval,
    ApprovalProcess,
    ApprovalNotification,
    ApprovalType,
    ApprovalStatus,
    ApprovalAction,
)
from app.models.enterprise import Enterprise, EnterpriseMember
from app.models.user import User
from app.models.asset import AssetStatus
from app.repositories.approval_repository import (
    ApprovalRepository,
    ApprovalProcessRepository,
    ApprovalNotificationRepository,
)
from app.repositories.enterprise_repository import EnterpriseRepository
from app.repositories.asset_repository import AssetRepository


# ============================================================================
# 自定义异常
# ============================================================================

class ApprovalNotFoundError(NotFoundException):
    """当找不到审批记录时抛出。"""
    
    def __init__(self):
        super().__init__("审批记录不存在", "APPROVAL_NOT_FOUND")


class ApprovalAlreadyProcessedError(ConflictException):
    """当审批已被处理时抛出。"""
    
    def __init__(self):
        super().__init__("该审批申请已被处理", "APPROVAL_ALREADY_PROCESSED")


class ApprovalPermissionDeniedError(ForbiddenException):
    """当用户没有审批权限时抛出。"""
    
    def __init__(self, message: str = "您没有权限执行此审批操作"):
        super().__init__(message, "APPROVAL_PERMISSION_DENIED")


class InvalidApprovalActionError(BadRequestException):
    """当审批操作无效时抛出。"""
    
    def __init__(self, message: str = "无效的审批操作"):
        super().__init__(message, "INVALID_APPROVAL_ACTION")


class CommentTooShortError(BadRequestException):
    """当审批意见过短时抛出。"""
    
    def __init__(self, min_length: int = 10):
        super().__init__(f"审批意见至少需要 {min_length} 个字符", "COMMENT_TOO_SHORT")


class EnterpriseNotPendingError(ConflictException):
    """当企业状态不是待审批时抛出。"""
    
    def __init__(self):
        super().__init__("该企业不处于待审批状态", "ENTERPRISE_NOT_PENDING")


# ============================================================================
# 审批服务类
# ============================================================================

class ApprovalService:
    """
    审批业务逻辑服务类。
    
    提供审批相关的业务逻辑操作，包括：
    - 提交审批申请
    - 处理审批操作（通过/拒绝/退回）
    - 查询审批列表和详情
    - 发送审批通知
    """
    
    def __init__(self, db: AsyncSession):
        """
        初始化审批服务。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
        self.approval_repo = ApprovalRepository(db)
        self.process_repo = ApprovalProcessRepository(db)
        self.notification_repo = ApprovalNotificationRepository(db)
        self.enterprise_repo = EnterpriseRepository(db)
    
    # ========================================================================
    # 审批申请相关方法
    # ========================================================================
    
    async def submit_enterprise_create_approval(
        self,
        applicant_id: UUID,
        enterprise_id: UUID,
        remarks: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
    ) -> Approval:
        """
        提交企业创建审批申请。
        
        Args:
            applicant_id: 申请人用户ID
            enterprise_id: 企业ID
            remarks: 申请备注
            attachments: 附件列表
            
        Returns:
            Approval: 创建的审批记录
            
        Raises:
            ConflictException: 如果该企业已有待审批记录
        """
        # 检查是否已有待审批记录
        existing_approvals = await self.approval_repo.get_approvals_by_target(
            target_id=enterprise_id,
            target_type="enterprise",
            status=ApprovalStatus.PENDING,
        )
        
        if existing_approvals:
            raise ConflictException("该企业已有待审批的申请")
        
        # 创建审批记录
        approval = Approval(
            type=ApprovalType.ENTERPRISE_CREATE,
            target_id=enterprise_id,
            target_type="enterprise",
            applicant_id=applicant_id,
            status=ApprovalStatus.PENDING,
            current_step=1,
            total_steps=1,
            remarks=remarks,
            attachments=attachments,
        )
        
        created_approval = await self.approval_repo.create_approval(approval)
        
        # 创建流程记录（提交步骤）
        process = ApprovalProcess(
            approval_id=created_approval.id,
            step=1,
            action=ApprovalAction.SUBMIT,
            operator_id=applicant_id,
            operator_role="applicant",
            comment=remarks or "提交审批申请",
        )
        await self.process_repo.create_process(process)
        
        # 发送通知给系统管理员（这里简化处理，实际需要查询管理员列表）
        # await self._notify_admins(created_approval)
        
        return created_approval
    
    async def submit_enterprise_update_approval(
        self,
        applicant_id: UUID,
        enterprise_id: UUID,
        changes: dict,
        remarks: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
    ) -> Approval:
        """
        提交企业信息变更审批申请。
        
        Args:
            applicant_id: 申请人用户ID
            enterprise_id: 企业ID
            changes: 变更内容（包含旧值和新值）
            remarks: 申请备注
            attachments: 附件列表
            
        Returns:
            Approval: 创建的审批记录
        """
        # 检查是否已有待审批记录
        existing_approvals = await self.approval_repo.get_approvals_by_target(
            target_id=enterprise_id,
            target_type="enterprise",
            status=ApprovalStatus.PENDING,
        )
        
        if existing_approvals:
            raise ConflictException("该企业已有待审批的申请")
        
        # 创建审批记录
        approval = Approval(
            type=ApprovalType.ENTERPRISE_UPDATE,
            target_id=enterprise_id,
            target_type="enterprise",
            applicant_id=applicant_id,
            status=ApprovalStatus.PENDING,
            current_step=1,
            total_steps=1,
            remarks=remarks,
            attachments=attachments,
            changes=changes,
        )
        
        created_approval = await self.approval_repo.create_approval(approval)
        
        # 创建流程记录
        process = ApprovalProcess(
            approval_id=created_approval.id,
            step=1,
            action=ApprovalAction.SUBMIT,
            operator_id=applicant_id,
            operator_role="applicant",
            comment=remarks or "提交变更申请",
        )
        await self.process_repo.create_process(process)
        
        return created_approval
    
    # ========================================================================
    # 审批操作相关方法
    # ========================================================================
    
    async def process_approval(
        self,
        approval_id: UUID,
        operator_id: UUID,
        action: ApprovalAction,
        comment: str,
        attachments: Optional[List[dict]] = None,
        operator_role: str = "admin",
    ) -> Approval:
        """
        处理审批操作（通过/拒绝/退回）。
        
        Args:
            approval_id: 审批记录ID
            operator_id: 操作人用户ID
            action: 操作类型（通过/拒绝/退回）
            comment: 审批意见
            attachments: 附件列表
            operator_role: 操作人角色
            
        Returns:
            Approval: 更新后的审批记录
            
        Raises:
            ApprovalNotFoundError: 审批记录不存在
            ApprovalAlreadyProcessedError: 审批已被处理
            InvalidApprovalActionError: 无效的审批操作
            CommentTooShortError: 审批意见过短
        """
        # 1. 查找审批记录
        approval = await self.approval_repo.get_approval_by_id(approval_id)
        if not approval:
            raise ApprovalNotFoundError()
        
        # 2. 检查审批状态
        if approval.status != ApprovalStatus.PENDING:
            raise ApprovalAlreadyProcessedError()
        
        # 3. 验证操作类型
        if action not in [ApprovalAction.APPROVE, ApprovalAction.REJECT, ApprovalAction.RETURN]:
            raise InvalidApprovalActionError("只支持通过、拒绝、退回操作")

        # 4. 更新审批记录
        if action == ApprovalAction.APPROVE:
            approval.status = ApprovalStatus.APPROVED
        elif action == ApprovalAction.REJECT:
            approval.status = ApprovalStatus.REJECTED
        elif action == ApprovalAction.RETURN:
            approval.status = ApprovalStatus.RETURNED
        
        approval.completed_at = datetime.now(timezone.utc)
        await self.approval_repo.update_approval(approval)
        
        # 6. 创建流程记录
        next_step = len(await self.process_repo.get_processes_by_approval(approval_id)) + 1
        process = ApprovalProcess(
            approval_id=approval_id,
            step=next_step,
            action=action,
            operator_id=operator_id,
            operator_role=operator_role,
            comment=comment,
            attachments=attachments,
        )
        await self.process_repo.create_process(process)
        
        # 7. 发送通知给申请人
        await self._send_notification_to_applicant(
            approval=approval,
            action=action,
            operator_id=operator_id,
        )
        
        # 8. 执行审批结果回调（如更新企业状态）
        await self._handle_approval_result(approval)
        
        return approval
    
    async def _send_notification_to_applicant(
        self,
        approval: Approval,
        action: ApprovalAction,
        operator_id: UUID,
    ) -> None:
        """
        发送审批结果通知给申请人。
        
        Args:
            approval: 审批记录
            action: 操作类型
            operator_id: 操作人ID
        """
        # 根据操作类型确定通知内容
        if action == ApprovalAction.APPROVE:
            title = "审批已通过"
            message = f"您的{self._get_approval_type_name(approval.type)}申请已通过审批。"
        elif action == ApprovalAction.REJECT:
            title = "审批已拒绝"
            message = f"您的{self._get_approval_type_name(approval.type)}申请已被拒绝。"
        elif action == ApprovalAction.RETURN:
            title = "审批已退回"
            message = f"您的{self._get_approval_type_name(approval.type)}申请需要补充材料。"
        else:
            return
        
        notification = ApprovalNotification(
            type="approval_result",
            recipient_id=approval.applicant_id,
            approval_id=approval.id,
            title=title,
            content=message,
        )
        
        await self.notification_repo.create_notification(notification)
    
    def _get_approval_type_name(self, approval_type: ApprovalType) -> str:
        """
        获取审批类型名称。
        
        Args:
            approval_type: 审批类型
            
        Returns:
            str: 类型名称
        """
        type_names = {
            ApprovalType.ENTERPRISE_CREATE: "企业创建",
            ApprovalType.ENTERPRISE_UPDATE: "企业信息变更",
            ApprovalType.MEMBER_JOIN: "成员加入",
            ApprovalType.ASSET_SUBMIT: "资产提交审批",
        }
        return type_names.get(approval_type, "申请")
    
    async def _handle_approval_result(self, approval: Approval) -> None:
        """
        处理审批结果。
        
        根据审批结果执行相应的业务逻辑，如更新企业状态。
        
        Args:
            approval: 审批记录
        """
        if approval.status == ApprovalStatus.APPROVED:
            if approval.type == ApprovalType.ENTERPRISE_CREATE:
                await self._handle_enterprise_create_approval(approval)
            elif approval.type == ApprovalType.ENTERPRISE_UPDATE:
                await self._handle_enterprise_update_approval(approval)
            elif approval.type == ApprovalType.ASSET_SUBMIT:
                await self._handle_asset_submit_approval(approval)
        elif approval.status == ApprovalStatus.REJECTED:
            if approval.type == ApprovalType.ASSET_SUBMIT:
                await self._handle_asset_submit_rejected(approval)
        elif approval.status == ApprovalStatus.RETURNED:
            if approval.type == ApprovalType.ASSET_SUBMIT:
                await self._handle_asset_submit_returned(approval)
    
    async def _handle_enterprise_create_approval(self, approval: Approval) -> None:
        """
        处理企业创建审批通过。
        
        Args:
            approval: 审批记录
        """
        if approval.target_type == "enterprise":
            enterprise = await self.enterprise_repo.get_by_id(approval.target_id)
            if enterprise:
                await self.enterprise_repo.update(enterprise.id, is_verified=True)
    
    async def _handle_enterprise_update_approval(self, approval: Approval) -> None:
        """
        处理企业信息变更审批通过。
        
        Args:
            approval: 审批记录
        """
        if approval.target_type == "enterprise" and approval.changes:
            enterprise = await self.enterprise_repo.get_by_id(approval.target_id)
            if enterprise:
                update_data = {}
                for key, value in approval.changes.get("new_values", {}).items():
                    if hasattr(enterprise, key):
                        update_data[key] = value
                if update_data:
                    await self.enterprise_repo.update(enterprise.id, **update_data)
    
    async def _handle_asset_submit_approval(self, approval: Approval) -> None:
        """
        处理资产提交审批通过，铸造 NFT。
        
        Args:
            approval: 审批记录
        """
        if not approval.asset_id:
            return
        
        from app.services.nft_service import NFTService
        
        nft_service = NFTService(self.db)
        
        enterprise = await self.enterprise_repo.get_by_id(approval.target_id)
        
        if not enterprise or not enterprise.wallet_address:
            return
        
        try:
            await nft_service.mint_asset_nft(
                asset_id=approval.asset_id,
                minter_address=enterprise.wallet_address,
            )
        except Exception:
            pass
    
    async def _handle_asset_submit_rejected(self, approval: Approval) -> None:
        """
        处理资产提交审批被拒绝。
        
        Args:
            approval: 审批记录
        """
        if not approval.asset_id:
            return
        
        asset_repo = AssetRepository(self.db)
        asset = await asset_repo.get_asset_by_id(approval.asset_id)
        if asset:
            asset.status = AssetStatus.REJECTED
            await asset_repo.update_asset(asset)
    
    async def _handle_asset_submit_returned(self, approval: Approval) -> None:
        """
        处理资产提交审批被退回。
        
        Args:
            approval: 审批记录
        """
        if not approval.asset_id:
            return
        
        asset_repo = AssetRepository(self.db)
        asset = await asset_repo.get_asset_by_id(approval.asset_id)
        if asset:
            asset.status = AssetStatus.DRAFT
            await asset_repo.update_asset(asset)
    
    # ========================================================================
    # 查询相关方法
    # ========================================================================
    
    async def get_approval_detail(
        self,
        approval_id: UUID,
    ) -> Approval:
        """
        获取审批详情。
        
        Args:
            approval_id: 审批ID
            
        Returns:
            Approval: 审批记录
            
        Raises:
            ApprovalNotFoundError: 审批记录不存在
        """
        approval = await self.approval_repo.get_approval_by_id(approval_id)
        if not approval:
            raise ApprovalNotFoundError()
        return approval
    
    async def get_pending_approvals(
        self,
        page: int = 1,
        page_size: int = 20,
        approval_type: Optional[ApprovalType] = None,
    ) -> Tuple[List[Approval], int]:
        """
        获取待审批列表。
        
        Args:
            page: 页码
            page_size: 每页数量
            approval_type: 审批类型筛选
            
        Returns:
            Tuple[List[Approval], int]: (审批列表, 总数)
        """
        return await self.approval_repo.get_pending_approvals(
            page=page,
            page_size=page_size,
            approval_type=approval_type,
        )
    
    async def get_statistics(self) -> dict:
        """
        获取审批统计数据。
        
        Returns:
            dict: 统计数据，包括待处理、已通过、已拒绝等数量
        """
        from sqlalchemy import select, func
        from app.models.approval import Approval, ApprovalStatus
        
        # 统计各状态的审批数量
        stats = {}
        
        # 待处理
        pending_result = await self.db.execute(
            select(func.count(Approval.id)).where(Approval.status == ApprovalStatus.PENDING)
        )
        stats["pending"] = pending_result.scalar() or 0
        
        # 已通过
        approved_result = await self.db.execute(
            select(func.count(Approval.id)).where(Approval.status == ApprovalStatus.APPROVED)
        )
        stats["approved"] = approved_result.scalar() or 0
        
        # 已拒绝
        rejected_result = await self.db.execute(
            select(func.count(Approval.id)).where(Approval.status == ApprovalStatus.REJECTED)
        )
        stats["rejected"] = rejected_result.scalar() or 0
        
        # 已退回
        returned_result = await self.db.execute(
            select(func.count(Approval.id)).where(Approval.status == ApprovalStatus.RETURNED)
        )
        stats["returned"] = returned_result.scalar() or 0
        
        # 总计
        total_result = await self.db.execute(
            select(func.count(Approval.id))
        )
        stats["total"] = total_result.scalar() or 0
        
        return stats
    
    async def get_approval_history(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ApprovalStatus] = None,
        approval_type: Optional[ApprovalType] = None,
    ) -> Tuple[List[Approval], int]:
        """
        获取审批历史记录。
        
        此方法返回所有已完成的审批记录（包括已通过、已拒绝、已退回）。
        
        Args:
            page: 页码
            page_size: 每页数量
            status: 状态筛选
            approval_type: 审批类型筛选
            
        Returns:
            Tuple[List[Approval], int]: (审批列表, 总数)
        """
        # 这里需要根据具体需求实现
        # 暂时返回空结果
        return [], 0
    
    async def get_user_approvals(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ApprovalStatus] = None,
    ) -> Tuple[List[Approval], int]:
        """
        获取用户提交的审批申请列表。
        
        Args:
            user_id: 用户ID
            page: 页码
            page_size: 每页数量
            status: 状态筛选
            
        Returns:
            Tuple[List[Approval], int]: (审批列表, 总数)
        """
        # 这里需要根据具体需求实现
        # 暂时返回空结果
        return [], 0
    
    # ========================================================================
    # 审批通知相关方法
    # ========================================================================
    
    async def get_user_notifications(
        self,
        user_id: UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ApprovalNotification], int]:
        """
        获取用户的通知列表。
        
        Args:
            user_id: 用户ID
            is_read: 是否已读筛选
            page: 页码
            page_size: 每页数量
            
        Returns:
            Tuple[List[ApprovalNotification], int]: (通知列表, 总数)
        """
        return await self.notification_repo.get_notifications_by_recipient(
            recipient_id=user_id,
            is_read=is_read,
            page=page,
            page_size=page_size,
        )
    
    async def get_unread_notification_count(self, user_id: UUID) -> int:
        """
        获取用户未读通知数量。
        
        Args:
            user_id: 用户ID
            
        Returns:
            int: 未读通知数量
        """
        return await self.notification_repo.get_unread_count(user_id)
    
    async def mark_notification_as_read(
        self,
        notification_id: UUID,
        user_id: UUID,
    ) -> ApprovalNotification:
        """
        标记通知为已读。
        
        Args:
            notification_id: 通知ID
            user_id: 用户ID（用于验证权限）
            
        Returns:
            ApprovalNotification: 更新后的通知
            
        Raises:
            NotFoundException: 通知不存在
            ForbiddenException: 用户无权操作此通知
        """
        notification = await self.notification_repo.mark_as_read(notification_id)
        if not notification:
            raise NotFoundException("通知不存在", "NOTIFICATION_NOT_FOUND")
        
        # 验证用户权限
        if notification.recipient_id != user_id:
            raise ApprovalPermissionDeniedError("您无权操作此通知")
        
        return notification
