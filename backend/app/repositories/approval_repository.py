"""审批数据访问层。"""
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import (
    Approval, 
    ApprovalProcess, 
    ApprovalNotification,
    ApprovalType,
    ApprovalStatus,
)


class ApprovalRepository:
    """审批记录数据访问类。"""
    
    def __init__(self, session: AsyncSession):
        """
        初始化审批仓库。
        
        Args:
            session: 数据库会话
        """
        self.session = session
    
    async def create_approval(self, approval: Approval) -> Approval:
        """
        创建审批记录。
        
        Args:
            approval: 审批对象
            
        Returns:
            Approval: 创建的审批对象
        """
        self.session.add(approval)
        await self.session.flush()
        await self.session.refresh(approval)
        return approval
    
    async def get_approval_by_id(self, approval_id: UUID) -> Optional[Approval]:
        """
        根据ID获取审批记录。
        
        Args:
            approval_id: 审批ID
            
        Returns:
            Optional[Approval]: 审批对象或None
        """
        result = await self.session.execute(
            select(Approval).where(Approval.id == approval_id)
        )
        return result.scalar_one_or_none()
    
    async def update_approval(self, approval: Approval) -> Approval:
        """
        更新审批记录。
        
        Args:
            approval: 审批对象
            
        Returns:
            Approval: 更新后的审批对象
        """
        await self.session.flush()
        await self.session.refresh(approval)
        return approval
    
    async def get_approvals_by_target(
        self,
        target_id: UUID,
        target_type: str,
        status: Optional[ApprovalStatus] = None,
    ) -> List[Approval]:
        """
        根据目标获取审批列表。
        
        Args:
            target_id: 目标对象ID
            target_type: 目标类型
            status: 审批状态筛选
            
        Returns:
            List[Approval]: 审批列表
        """
        query = select(Approval).where(
            and_(
                Approval.target_id == target_id,
                Approval.target_type == target_type,
            )
        )
        
        if status:
            query = query.where(Approval.status == status)
        
        query = query.order_by(desc(Approval.created_at))
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_pending_approvals(
        self,
        approval_type: Optional[ApprovalType] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Approval], int]:
        """
        获取待审批列表。
        
        Args:
            approval_type: 审批类型筛选
            page: 页码
            page_size: 每页数量
            
        Returns:
            Tuple[List[Approval], int]: (审批列表, 总数)
        """
        # 构建查询
        query = select(Approval).where(Approval.status == ApprovalStatus.PENDING)
        
        if approval_type:
            query = query.where(Approval.type == approval_type)
        
        # 排序
        query = query.order_by(desc(Approval.created_at))
        
        # 计算总数
        count_result = await self.session.execute(
            select(Approval).where(Approval.status == ApprovalStatus.PENDING)
        )
        total = len(count_result.scalars().all())
        
        # 分页
        skip = (page - 1) * page_size
        query = query.offset(skip).limit(page_size)
        
        result = await self.session.execute(query)
        return list(result.scalars().all()), total


class ApprovalProcessRepository:
    """审批流程记录数据访问类。"""
    
    def __init__(self, session: AsyncSession):
        """
        初始化审批流程仓库。
        
        Args:
            session: 数据库会话
        """
        self.session = session
    
    async def create_process(self, process: ApprovalProcess) -> ApprovalProcess:
        """
        创建审批流程记录。
        
        Args:
            process: 流程记录对象
            
        Returns:
            ApprovalProcess: 创建的流程记录对象
        """
        self.session.add(process)
        await self.session.flush()
        await self.session.refresh(process)
        return process
    
    async def get_processes_by_approval(
        self, 
        approval_id: UUID,
    ) -> List[ApprovalProcess]:
        """
        获取审批的所有流程记录。
        
        Args:
            approval_id: 审批ID
            
        Returns:
            List[ApprovalProcess]: 流程记录列表
        """
        result = await self.session.execute(
            select(ApprovalProcess)
            .where(ApprovalProcess.approval_id == approval_id)
            .order_by(ApprovalProcess.step)
        )
        return list(result.scalars().all())


class ApprovalNotificationRepository:
    """审批通知数据访问类。"""
    
    def __init__(self, session: AsyncSession):
        """
        初始化审批通知仓库。
        
        Args:
            session: 数据库会话
        """
        self.session = session
    
    async def create_notification(
        self, 
        notification: ApprovalNotification,
    ) -> ApprovalNotification:
        """
        创建审批通知。
        
        Args:
            notification: 通知对象
            
        Returns:
            ApprovalNotification: 创建的通知对象
        """
        self.session.add(notification)
        await self.session.flush()
        await self.session.refresh(notification)
        return notification
    
    async def get_notifications_by_recipient(
        self,
        recipient_id: UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ApprovalNotification], int]:
        """
        获取用户的通知列表。
        
        Args:
            recipient_id: 接收人ID
            is_read: 是否已读筛选
            page: 页码
            page_size: 每页数量
            
        Returns:
            Tuple[List[ApprovalNotification], int]: (通知列表, 总数)
        """
        query = select(ApprovalNotification).where(
            ApprovalNotification.recipient_id == recipient_id
        )
        
        if is_read is not None:
            query = query.where(ApprovalNotification.is_read == is_read)
        
        # 计算总数
        count_result = await self.session.execute(query)
        total = len(count_result.scalars().all())
        
        # 排序和分页
        query = query.order_by(desc(ApprovalNotification.created_at))
        skip = (page - 1) * page_size
        query = query.offset(skip).limit(page_size)
        
        result = await self.session.execute(query)
        return list(result.scalars().all()), total
    
    async def mark_as_read(
        self, 
        notification_id: UUID,
    ) -> Optional[ApprovalNotification]:
        """
        标记通知为已读。
        
        Args:
            notification_id: 通知ID
            
        Returns:
            Optional[ApprovalNotification]: 更新后的通知对象或None
        """
        notification = await self.session.get(ApprovalNotification, notification_id)
        if notification:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            await self.session.flush()
            await self.session.refresh(notification)
        return notification
    
    async def get_unread_count(self, recipient_id: UUID) -> int:
        """
        获取用户未读通知数量。
        
        Args:
            recipient_id: 接收人ID
            
        Returns:
            int: 未读通知数量
        """
        result = await self.session.execute(
            select(ApprovalNotification).where(
                and_(
                    ApprovalNotification.recipient_id == recipient_id,
                    ApprovalNotification.is_read == False,
                )
            )
        )
        return len(result.scalars().all())
