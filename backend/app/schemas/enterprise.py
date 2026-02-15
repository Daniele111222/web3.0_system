"""企业管理相关的请求/响应架构。"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re

from app.models.enterprise import MemberRole


class EnterpriseCreateRequest(BaseModel):
    """
    创建企业请求的架构。
    
    用于验证创建新企业时的请求数据。
    """
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="企业名称（2-100 个字符）",
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="企业描述（最多 1000 个字符）",
    )
    logo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="企业 Logo URL",
    )
    website: Optional[str] = Field(
        None,
        max_length=255,
        description="企业官网",
    )
    contact_email: Optional[str] = Field(
        None,
        max_length=255,
        description="联系邮箱",
    )
    address: Optional[str] = Field(
        None,
        max_length=500,
        description="企业地址",
    )
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """
        验证企业名称格式。
        
        Args:
            v (str): 待验证的企业名称。
            
        Returns:
            str: 验证通过并去除首尾空格的企业名称。
            
        Raises:
            ValueError: 如果企业名称为空或仅包含空格。
        """
        v = v.strip()
        if not v:
            raise ValueError("企业名称不能为空")
        return v
    
    @field_validator("website")
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        """
        验证企业官网 URL 格式。
        
        Args:
            v (Optional[str]): 待验证的官网 URL。
            
        Returns:
            Optional[str]: 验证通过的官网 URL。
            
        Raises:
            ValueError: 如果 URL 格式无效。
        """
        if v is None:
            return v
        if not re.match(r"^https?://", v):
            raise ValueError("官网 URL 必须以 http:// 或 https:// 开头")
        return v
    
    @field_validator("contact_email")
    @classmethod
    def validate_contact_email(cls, v: Optional[str]) -> Optional[str]:
        """
        验证联系邮箱格式。
        
        Args:
            v (Optional[str]): 待验证的邮箱地址。
            
        Returns:
            Optional[str]: 验证通过并转为小写的邮箱地址。
            
        Raises:
            ValueError: 如果邮箱格式无效。
        """
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
            raise ValueError("无效的邮箱格式")
        return v.lower()


class EnterpriseUpdateRequest(BaseModel):
    """
    更新企业请求的架构。
    
    用于验证更新企业信息时的请求数据。
    所有字段均为可选，仅更新提供的字段。
    """
    
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="企业名称",
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="企业描述",
    )
    logo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="企业 Logo URL",
    )
    website: Optional[str] = Field(
        None,
        max_length=255,
        description="企业官网",
    )
    contact_email: Optional[str] = Field(
        None,
        max_length=255,
        description="联系邮箱",
    )
    address: Optional[str] = Field(
        None,
        max_length=500,
        description="企业地址",
    )
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """
        验证企业名称格式。
        
        Args:
            v (Optional[str]): 待验证的企业名称。
            
        Returns:
            Optional[str]: 验证通过并去除首尾空格的企业名称。
            
        Raises:
            ValueError: 如果企业名称为空或仅包含空格。
        """
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("企业名称不能为空")
        return v
    
    @field_validator("website")
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        """
        验证企业官网 URL 格式。
        
        Args:
            v (Optional[str]): 待验证的官网 URL。
            
        Returns:
            Optional[str]: 验证通过的官网 URL。
            
        Raises:
            ValueError: 如果 URL 格式无效。
        """
        if v is None:
            return v
        if not re.match(r"^https?://", v):
            raise ValueError("官网 URL 必须以 http:// 或 https:// 开头")
        return v


class MemberResponse(BaseModel):
    """
    企业成员响应的架构。
    
    用于返回企业成员的详细信息。
    """
    
    id: str = Field(..., description="成员关系 ID")
    user_id: str = Field(..., description="用户 ID")
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="用户邮箱")
    full_name: Optional[str] = Field(None, description="用户全名")
    avatar_url: Optional[str] = Field(None, description="用户头像 URL")
    role: MemberRole = Field(..., description="成员角色")
    joined_at: datetime = Field(..., description="加入时间")
    
    class Config:
        from_attributes = True


class EnterpriseResponse(BaseModel):
    """
    企业响应的架构。
    
    用于返回企业的详细信息。
    """
    
    id: str = Field(..., description="企业 ID")
    name: str = Field(..., description="企业名称")
    description: Optional[str] = Field(None, description="企业描述")
    logo_url: Optional[str] = Field(None, description="企业 Logo URL")
    website: Optional[str] = Field(None, description="企业官网")
    contact_email: Optional[str] = Field(None, description="联系邮箱")
    address: Optional[str] = Field(None, description="企业地址")
    wallet_address: Optional[str] = Field(None, description="企业钱包地址")
    is_active: bool = Field(..., description="企业是否激活")
    is_verified: bool = Field(..., description="企业是否已认证")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    member_count: int = Field(default=0, description="成员数量")
    
    class Config:
        from_attributes = True


class EnterpriseDetailResponse(EnterpriseResponse):
    """
    企业详情响应的架构。
    
    继承自 EnterpriseResponse，额外包含成员列表。
    """
    
    members: List[MemberResponse] = Field(default=[], description="成员列表")


class EnterpriseListResponse(BaseModel):
    """
    企业列表响应的架构。
    
    用于分页返回企业列表。
    """
    
    items: List[EnterpriseResponse] = Field(..., description="企业列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    pages: int = Field(..., description="总页数")


class InviteMemberRequest(BaseModel):
    """
    邀请成员请求的架构。
    
    用于验证邀请新成员加入企业时的请求数据。
    """
    
    user_id: str = Field(..., description="被邀请用户的 ID")
    role: MemberRole = Field(
        default=MemberRole.MEMBER,
        description="成员角色",
    )
    
    @field_validator("role")
    @classmethod
    def validate_role(cls, v: MemberRole) -> MemberRole:
        """
        验证成员角色。
        
        Args:
            v (MemberRole): 待验证的角色。
            
        Returns:
            MemberRole: 验证通过的角色。
            
        Raises:
            ValueError: 如果尝试直接分配 OWNER 角色。
        """
        if v == MemberRole.OWNER:
            raise ValueError("不能直接邀请成员为所有者角色")
        return v


class UpdateMemberRoleRequest(BaseModel):
    """
    更新成员角色请求的架构。
    
    用于验证更新成员角色时的请求数据。
    """
    
    role: MemberRole = Field(..., description="新的成员角色")
    
    @field_validator("role")
    @classmethod
    def validate_role(cls, v: MemberRole) -> MemberRole:
        """
        验证成员角色。
        
        Args:
            v (MemberRole): 待验证的角色。
            
        Returns:
            MemberRole: 验证通过的角色。
            
        Raises:
            ValueError: 如果尝试将角色更改为 OWNER。
        """
        if v == MemberRole.OWNER:
            raise ValueError("不能将成员角色更改为所有者")
        return v


class BindWalletRequest(BaseModel):
    """
    企业绑定钱包请求的架构。
    
    用于验证企业绑定区块链钱包时的请求数据。
    """
    
    wallet_address: str = Field(
        ...,
        min_length=42,
        max_length=42,
        description="以太坊钱包地址",
    )
    signature: str = Field(..., description="用于验证的签名消息")
    message: str = Field(..., description="被签名的原始消息")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_wallet_address(cls, v: str) -> str:
        """
        验证以太坊钱包地址格式。
        
        Args:
            v (str): 待验证的钱包地址。
            
        Returns:
            str: 验证通过并转为小写的钱包地址。
            
        Raises:
            ValueError: 如果钱包地址格式无效。
        """
        if not re.match(r"^0x[a-fA-F0-9]{40}$", v):
            raise ValueError("无效的以太坊钱包地址格式")
        return v.lower()
