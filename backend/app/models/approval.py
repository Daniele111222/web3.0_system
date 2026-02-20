"""审批流程数据库模型。"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Index, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.enterprise import Enterprise


class ApprovalType(str, Enum):
    """
    审批类型枚举。
    
    定义支持的审批类型：
    - ENTERPRISE_CREATE: 企业创建
    - ENTERPRISE_UPDATE: 企业信息变更
    - MEMBER_JOIN: 成员加入
    - ASSET_SUBMIT: 资产提交审批
    """
    ENTERPRISE_CREATE = "enterprise_create"
    ENTERPRISE_UPDATE = "enterprise_update"
    MEMBER_JOIN = "member_join" 
    ASSET_SUBMIT = "asset_submit"


class ApprovalStatus(str, Enum):
    """
    审批状态枚举。
    
    定义审批的状态流转：
    - PENDING: 待审批
    - APPROVED: 已通过
    - REJECTED: 已拒绝
    - RETURNED: 已退回
    """
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"


class ApprovalAction(str, Enum):
    """
    审批操作类型枚举。
    
    定义审批流程中的操作类型：
    - SUBMIT: 提交申请
    - APPROVE: 通过
    - REJECT: 拒绝
    - RETURN: 退回
    - TRANSFER: 转交
    """
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    RETURN = "return"
    TRANSFER = "transfer"


class Approval(Base):
    """
    审批记录模型。
    
    用于存储企业和成员的审批申请记录，包括审批类型、状态、申请人等信息。
    支持企业创建审批、企业信息变更审批和成员加入审批。
    """
    
    __tablename__ = "approvals"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="审批唯一标识符",
    )
    
    # 审批类型
    type: Mapped[ApprovalType] = mapped_column(
        SQLEnum(ApprovalType),
        nullable=False,
        index=True,
        comment="审批类型",
    )
    
    # 目标对象（企业或成员）
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="目标对象ID（企业ID或成员关系ID）",
    )
    target_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="目标类型: enterprise, member",
    )
    
    # 申请人
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="申请人用户ID",
    )
    
    # 审批状态
    status: Mapped[ApprovalStatus] = mapped_column(
        SQLEnum(ApprovalStatus),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True,
        comment="审批状态",
    )
    
    # 审批步骤
    current_step: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="当前步骤序号",
    )
    total_steps: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="总步骤数",
    )
    
    # 申请备注
    remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="申请备注/理由",
    )
    
    # 附件列表（JSON格式）
    attachments: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="附件列表（JSON格式）",
    )
    
    # 变更内容（用于企业信息变更审批）
    changes: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="变更内容（JSON格式，存储变更前后的值）",
    )
    
    # 关联资产ID（用于资产提交审批）
    asset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="关联资产ID",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="创建时间",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="更新时间",
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="审批完成时间",
    )
    
    # 关系
    applicant: Mapped["User"] = relationship(
        "User",
        foreign_keys=[applicant_id],
        lazy="selectin",
    )
    processes: Mapped[List["ApprovalProcess"]] = relationship(
        "ApprovalProcess",
        back_populates="approval",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ApprovalProcess.step",
    )
    notifications: Mapped[List["ApprovalNotification"]] = relationship(
        "ApprovalNotification",
        back_populates="approval",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_approvals_applicant_id", "applicant_id"),
        Index("ix_approvals_target_id", "target_id"),
        Index("ix_approvals_status", "status"),
        Index("ix_approvals_type", "type"),
        Index("ix_approvals_created_at", "created_at"),
        Index("ix_approvals_status_type", "status", "type"),
    )
    
    def __repr__(self) -> str:
        """
        返回审批对象的字符串表示形式。
        
        Returns:
            str: 包含审批 ID、类型和状态的格式化字符串。
        """
        return f"<Approval(id={self.id}, type={self.type}, status={self.status})>"


class ApprovalProcess(Base):
    """
    审批流程记录模型。
    
    用于存储审批流程中的每一步操作记录，包括操作人、操作类型、审批意见等。
    支持记录完整的审批历史时间线。
    """
    
    __tablename__ = "approval_processes"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="流程记录唯一标识符",
    )
    
    # 关联审批记录
    approval_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="关联审批ID",
    )
    
    # 步骤序号
    step: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="步骤序号",
    )
    
    # 操作类型
    action: Mapped[ApprovalAction] = mapped_column(
        SQLEnum(ApprovalAction),
        nullable=False,
        comment="操作类型",
    )
    
    # 操作人
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="操作人用户ID",
    )
    
    # 操作人角色
    operator_role: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True,
        comment="操作人角色",
    )
    
    # 审批意见
    comment: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="审批意见",
    )
    
    # 附件
    attachments: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="附件列表（JSON格式）",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="操作时间",
    )
    
    # 关系
    approval: Mapped["Approval"] = relationship(
        "Approval",
        back_populates="processes",
    )
    operator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[operator_id],
        lazy="selectin",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_approval_processes_approval_id", "approval_id"),
        Index("ix_approval_processes_operator_id", "operator_id"),
        Index("ix_approval_processes_created_at", "created_at"),
        Index("ix_approval_processes_step", "approval_id", "step"),
    )
    
    def __repr__(self) -> str:
        """
        返回流程记录对象的字符串表示形式。
        
        Returns:
            str: 包含流程记录 ID、审批 ID 和操作的格式化字符串。
        """
        return f"<ApprovalProcess(id={self.id}, approval_id={self.approval_id}, action={self.action})>"


class ApprovalNotification(Base):
    """
    审批通知模型。
    
    用于存储审批相关的通知记录，包括审批请求、审批结果等通知。
    支持通知的已读状态管理和阅读时间记录。
    """
    
    __tablename__ = "approval_notifications"
    
    # 主键
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="通知唯一标识符",
    )
    
    # 通知类型
    type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="通知类型: approval_request, approval_result, approval_reminder",
    )
    
    # 接收人
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="接收人用户ID",
    )
    
    # 关联审批记录
    approval_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approvals.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="关联审批ID",
    )
    
    # 通知内容
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="通知标题",
    )
    content: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="通知内容",
    )
    
    # 已读状态
    is_read: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        comment="是否已读",
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="阅读时间",
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="创建时间",
    )
    
    # 关系
    recipient: Mapped["User"] = relationship(
        "User",
        foreign_keys=[recipient_id],
        lazy="selectin",
    )
    approval: Mapped[Optional["Approval"]] = relationship(
        "Approval",
        back_populates="notifications",
    )
    
    # 索引
    __table_args__ = (
        Index("ix_approval_notifications_recipient_id", "recipient_id"),
        Index("ix_approval_notifications_approval_id", "approval_id"),
        Index("ix_approval_notifications_is_read", "is_read"),
        Index("ix_approval_notifications_created_at", "created_at"),
        Index("ix_approval_notifications_recipient_read", "recipient_id", "is_read"),
    )
    
    def __repr__(self) -> str:
        """
        返回通知对象的字符串表示形式。
        
        Returns:
            str: 包含通知 ID、接收人 ID 和类型的格式化字符串。
        """
        return f"<ApprovalNotification(id={self.id}, recipient_id={self.recipient_id}, type={self.type})>"
