"""审批相关数据模型。"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AttachmentRequest(BaseModel):
    """附件请求模型。"""
    
    file_name: str = Field(..., description="文件名")
    file_url: str = Field(..., description="文件URL")
    file_type: Optional[str] = Field(None, description="文件类型")
    file_size: Optional[int] = Field(None, description="文件大小（字节）")


class AttachmentResponse(BaseModel):
    """附件响应模型。"""
    
    model_config = ConfigDict(from_attributes=True)
    
    file_name: str = Field(..., description="文件名")
    file_url: str = Field(..., description="文件URL")
    file_type: Optional[str] = Field(None, description="文件类型")
    file_size: Optional[int] = Field(None, description="文件大小（字节）")


class ApprovalCreateRequest(BaseModel):
    """审批申请请求模型。"""
    
    target_id: UUID = Field(..., description="目标对象ID（企业ID或成员关系ID）")
    target_type: str = Field(..., description="目标类型: enterprise, member")
    type: str = Field(..., description="审批类型: enterprise_create, enterprise_update, member_join")
    remarks: Optional[str] = Field(None, description="申请备注")
    attachments: Optional[List[AttachmentRequest]] = Field(None, description="附件列表")
    changes: Optional[Dict[str, Any]] = Field(None, description="变更内容（JSON格式）")


class ApprovalProcessRequest(BaseModel):
    """审批处理请求模型。"""
    
    action: str = Field(..., description="操作类型: approve, reject, return")
    comment: Optional[str] = Field(None, description="审批意见")
    attachments: Optional[List[AttachmentRequest]] = Field(None, description="附件列表")


class ApprovalResponse(BaseModel):
    """审批响应模型。"""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(..., description="审批ID")
    type: str = Field(..., description="审批类型")
    target_id: UUID = Field(..., description="目标对象ID")
    target_type: str = Field(..., description="目标类型")
    applicant_id: UUID = Field(..., description="申请人ID")
    status: str = Field(..., description="审批状态")
    current_step: int = Field(..., description="当前步骤")
    total_steps: int = Field(..., description="总步骤数")
    remarks: Optional[str] = Field(None, description="申请备注")
    attachments: Optional[List[Dict[str, Any]]] = Field(None, description="附件列表")
    changes: Optional[Dict[str, Any]] = Field(None, description="变更内容")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")


class ApprovalProcessHistoryResponse(BaseModel):
    """审批流程历史响应模型。"""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(..., description="流程记录ID")
    step: int = Field(..., description="步骤序号")
    action: str = Field(..., description="操作类型")
    operator_id: UUID = Field(..., description="操作人ID")
    operator_role: Optional[str] = Field(None, description="操作人角色")
    comment: Optional[str] = Field(None, description="审批意见")
    attachments: Optional[List[Dict[str, Any]]] = Field(None, description="附件列表")
    created_at: datetime = Field(..., description="操作时间")


class ApprovalDetailResponse(BaseModel):
    """审批详情响应模型。"""
    
    id: UUID = Field(..., description="审批ID")
    type: str = Field(..., description="审批类型")
    target_id: UUID = Field(..., description="目标对象ID")
    target_type: str = Field(..., description="目标类型")
    applicant_id: UUID = Field(..., description="申请人ID")
    status: str = Field(..., description="审批状态")
    current_step: int = Field(..., description="当前步骤")
    total_steps: int = Field(..., description="总步骤数")
    remarks: Optional[str] = Field(None, description="申请备注")
    attachments: Optional[List[Dict[str, Any]]] = Field(None, description="附件列表")
    changes: Optional[Dict[str, Any]] = Field(None, description="变更内容")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    process_history: List[ApprovalProcessHistoryResponse] = Field(default_factory=list, description="流程历史")


class NotificationResponse(BaseModel):
    """通知响应模型。"""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(..., description="通知ID")
    type: str = Field(..., description="通知类型")
    recipient_id: UUID = Field(..., description="接收人ID")
    approval_id: Optional[UUID] = Field(None, description="关联审批ID")
    title: str = Field(..., description="通知标题")
    content: Optional[str] = Field(None, description="通知内容")
    is_read: bool = Field(..., description="是否已读")
    read_at: Optional[datetime] = Field(None, description="阅读时间")
    created_at: datetime = Field(..., description="创建时间")


class NotificationListResponse(BaseModel):
    """通知列表响应模型。"""
    
    items: List[NotificationResponse] = Field(default_factory=list, description="通知列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")
    unread_count: int = Field(default=0, description="未读数量")
