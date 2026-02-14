"""审批API路由。"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import AppException
from app.models.user import User
from app.schemas.approval import (
    ApprovalCreateRequest,
    ApprovalProcessRequest,
    ApprovalResponse,
    ApprovalDetailResponse,
    ApprovalListResponse,
    ApprovalProcessHistoryResponse,
    NotificationResponse,
    NotificationListResponse,
)
from app.schemas.response import ApiResponse, PageResult
from app.services.approval_service import ApprovalService

router = APIRouter()


@router.post(
    "/enterprise-create",
    response_model=ApiResponse[ApprovalResponse],
    status_code=status.HTTP_201_CREATED,
    summary="提交企业创建审批申请",
    description="提交企业创建审批申请，等待系统管理员审批。",
)
async def submit_enterprise_create_approval(
    request: ApprovalCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[ApprovalResponse]:
    """
    提交企业创建审批申请。
    
    Args:
        request: 审批申请请求数据
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[ApprovalResponse]: 审批申请结果
    """
    try:
        service = ApprovalService(db)
        approval = await service.submit_enterprise_create_approval(
            applicant_id=current_user.id,
            enterprise_id=request.target_id,
            remarks=request.remarks,
            attachments=[att.dict() for att in request.attachments] if request.attachments else None,
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="审批申请提交成功",
            data=ApprovalResponse.from_orm(approval),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.post(
    "/enterprise-update",
    response_model=ApiResponse[ApprovalResponse],
    status_code=status.HTTP_201_CREATED,
    summary="提交企业信息变更审批申请",
    description="提交企业信息变更审批申请。",
)
async def submit_enterprise_update_approval(
    request: ApprovalCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[ApprovalResponse]:
    """
    提交企业信息变更审批申请。
    
    Args:
        request: 审批申请请求数据
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[ApprovalResponse]: 审批申请结果
    """
    try:
        service = ApprovalService(db)
        approval = await service.submit_enterprise_update_approval(
            applicant_id=current_user.id,
            enterprise_id=request.target_id,
            changes=request.changes or {},
            remarks=request.remarks,
            attachments=[att.dict() for att in request.attachments] if request.attachments else None,
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="变更申请提交成功",
            data=ApprovalResponse.from_orm(approval),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.post(
    "/{approval_id}/process",
    response_model=ApiResponse[ApprovalResponse],
    status_code=status.HTTP_200_OK,
    summary="处理审批申请",
    description="管理员处理审批申请，支持通过、拒绝、退回操作。",
)
async def process_approval(
    approval_id: UUID,
    request: ApprovalProcessRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[ApprovalResponse]:
    """
    处理审批申请。
    
    Args:
        approval_id: 审批记录ID
        request: 审批处理请求数据
        db: 数据库会话
        current_user: 当前登录用户（必须是管理员）
        
    Returns:
        ApiResponse[ApprovalResponse]: 审批处理结果
    """
    try:
        service = ApprovalService(db)
        
        # 将字符串操作转换为枚举
        action_map = {
            "approve": ApprovalAction.APPROVE,
            "reject": ApprovalAction.REJECT,
            "return": ApprovalAction.RETURN,
        }
        action = action_map.get(request.action)
        
        if not action:
            return ApiResponse(
                code="INVALID_ACTION",
                message="无效的审批操作，只支持: approve, reject, return",
                data=None,
            )
        
        approval = await service.process_approval(
            approval_id=approval_id,
            operator_id=current_user.id,
            action=action,
            comment=request.comment,
            attachments=[att.dict() for att in request.attachments] if request.attachments else None,
            operator_role="admin",  # 假设当前用户是管理员
        )
        
        action_messages = {
            ApprovalAction.APPROVE: "审批通过",
            ApprovalAction.REJECT: "审批已拒绝",
            ApprovalAction.RETURN: "审批已退回",
        }
        
        return ApiResponse(
            code="SUCCESS",
            message=action_messages.get(action, "审批处理成功"),
            data=ApprovalResponse.from_orm(approval),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.get(
    "/pending",
    response_model=ApiResponse[PageResult[ApprovalResponse]],
    status_code=status.HTTP_200_OK,
    summary="获取待审批列表",
    description="获取所有待审批的申请列表，支持分页和类型筛选。",
)
async def get_pending_approvals(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    approval_type: Optional[str] = Query(None, description="审批类型筛选"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[PageResult[ApprovalResponse]]:
    """
    获取待审批列表。
    
    Args:
        page: 页码
        page_size: 每页数量
        approval_type: 审批类型筛选
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[PageResult[ApprovalResponse]]: 待审批列表
    """
    try:
        service = ApprovalService(db)
        
        # 转换类型
        type_enum = None
        if approval_type:
            try:
                type_enum = ApprovalType(approval_type)
            except ValueError:
                return ApiResponse(
                    code="INVALID_TYPE",
                    message=f"无效的审批类型: {approval_type}",
                    data=None,
                )
        
        approvals, total = await service.get_pending_approvals(
            page=page,
            page_size=page_size,
            approval_type=type_enum,
        )
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return ApiResponse(
            code="SUCCESS",
            message="获取待审批列表成功",
            data=PageResult(
                items=[ApprovalResponse.from_orm(a) for a in approvals],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.get(
    "/{approval_id}",
    response_model=ApiResponse[ApprovalDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="获取审批详情",
    description="获取单个审批的详细信息，包括流程历史。",
)
async def get_approval_detail(
    approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[ApprovalDetailResponse]:
    """
    获取审批详情。
    
    Args:
        approval_id: 审批ID
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[ApprovalDetailResponse]: 审批详情
    """
    try:
        service = ApprovalService(db)
        
        # 获取审批详情
        approval = await service.get_approval_detail(approval_id)
        
        # 获取流程历史
        processes = await service.process_repo.get_processes_by_approval(approval_id)
        
        # 构建响应
        response_data = ApprovalDetailResponse(
            id=approval.id,
            type=approval.type.value,
            target_id=approval.target_id,
            target_type=approval.target_type,
            applicant_id=approval.applicant_id,
            status=approval.status.value,
            current_step=approval.current_step,
            total_steps=approval.total_steps,
            remarks=approval.remarks,
            attachments=approval.attachments,
            changes=approval.changes,
            created_at=approval.created_at,
            updated_at=approval.updated_at,
            completed_at=approval.completed_at,
            process_history=[
                ApprovalProcessHistoryResponse(
                    id=p.id,
                    step=p.step,
                    action=p.action.value,
                    operator_id=p.operator_id,
                    operator_role=p.operator_role,
                    comment=p.comment,
                    attachments=p.attachments,
                    created_at=p.created_at,
                )
                for p in processes
            ],
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="获取审批详情成功",
            data=response_data,
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.get(
    "/notifications/my",
    response_model=ApiResponse[PageResult[NotificationResponse]],
    status_code=status.HTTP_200_OK,
    summary="获取我的通知列表",
    description="获取当前登录用户的通知列表，支持分页和已读状态筛选。",
)
async def get_my_notifications(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    is_read: Optional[bool] = Query(None, description="是否已读筛选"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[PageResult[NotificationResponse]]:
    """
    获取当前用户的通知列表。
    
    Args:
        page: 页码
        page_size: 每页数量
        is_read: 是否已读筛选
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[PageResult[NotificationResponse]]: 通知列表
    """
    try:
        service = ApprovalService(db)
        
        notifications, total = await service.get_user_notifications(
            user_id=current_user.id,
            is_read=is_read,
            page=page,
            page_size=page_size,
        )
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return ApiResponse(
            code="SUCCESS",
            message="获取通知列表成功",
            data=PageResult(
                items=[NotificationResponse.from_orm(n) for n in notifications],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.put(
    "/notifications/{notification_id}/read",
    response_model=ApiResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="标记通知为已读",
    description="将指定通知标记为已读状态。",
)
async def mark_notification_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[NotificationResponse]:
    """
    标记通知为已读。
    
    Args:
        notification_id: 通知ID
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[NotificationResponse]: 更新后的通知
    """
    try:
        service = ApprovalService(db)
        
        notification = await service.mark_notification_as_read(
            notification_id=notification_id,
            user_id=current_user.id,
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="标记已读成功",
            data=NotificationResponse.from_orm(notification),
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )


@router.get(
    "/notifications/unread-count",
    response_model=ApiResponse[int],
    status_code=status.HTTP_200_OK,
    summary="获取未读通知数量",
    description="获取当前登录用户的未读通知数量。",
)
async def get_unread_notification_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[int]:
    """
    获取未读通知数量。
    
    Args:
        db: 数据库会话
        current_user: 当前登录用户
        
    Returns:
        ApiResponse[int]: 未读通知数量
    """
    try:
        service = ApprovalService(db)
        
        count = await service.get_unread_notification_count(
            user_id=current_user.id,
        )
        
        return ApiResponse(
            code="SUCCESS",
            message="获取未读数量成功",
            data=count,
        )
    except AppException as e:
        return ApiResponse(
            code=e.code,
            message=e.message,
            data=None,
        )
