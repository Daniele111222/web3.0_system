"""用于请求/响应验证的身份验证架构。"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
import re
import string


class UserRegisterRequest(BaseModel):
    """用户注册请求的架构。"""
    
    email: EmailStr = Field(..., description="用户电子邮箱地址")
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="用户名（3-50 个字符，字母数字和下划线）",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="密码（8-128 个字符）",
    )
    full_name: Optional[str] = Field(
        None,
        max_length=100,
        description="用户全名",
    )
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """
        验证用户名格式。
        
        Args:
            v (str): 待验证的用户名。
            
        Returns:
            str: 验证通过并转为小写的用户名。
            
        Raises:
            ValueError: 如果用户名格式不正确。
        """
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", v):
            raise ValueError(
                "用户名必须以字母开头，且只能包含字母、数字和下划线"
            )
        return v.lower()
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        验证密码强度。
        
        Args:
            v (str): 待验证的密码。
            
        Returns:
            str: 验证通过的密码。
            
        Raises:
            ValueError: 如果密码强度不足。
        """
        if not re.search(r"[A-Z]", v):
            raise ValueError("密码必须包含至少一个大写字母")
        if not re.search(r"[a-z]", v):
            raise ValueError("密码必须包含至少一个小写字母")
        if not re.search(r"\d", v):
            raise ValueError("密码必须包含至少一个数字")
        
        # 使用 string.punctuation 支持所有标准特殊字符
        if not any(char in string.punctuation for char in v):
            raise ValueError("密码必须包含至少一个特殊字符")
            
        if len(v.encode("utf-8")) > 72:
            raise ValueError("密码长度不能超过 72 字节")
        return v


class UserLoginRequest(BaseModel):
    """用户登录请求的架构。"""
    
    email: EmailStr = Field(..., description="用户电子邮箱地址")
    password: str = Field(..., description="用户密码")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        验证密码长度。
        
        Args:
            v (str): 待验证的密码。
            
        Returns:
            str: 验证通过的密码。
            
        Raises:
            ValueError: 如果密码长度超过限制。
        """
        if len(v.encode("utf-8")) > 72:
            raise ValueError("密码长度不能超过 72 字节")
        return v


class TokenResponse(BaseModel):
    """令牌响应的架构。"""
    
    access_token: str = Field(..., description="JWT 访问令牌")
    refresh_token: str = Field(..., description="JWT 刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="访问令牌有效期（秒）")


class RefreshTokenRequest(BaseModel):
    """令牌刷新请求的架构。"""
    
    refresh_token: str = Field(..., description="刷新令牌")


class UserResponse(BaseModel):
    """用户响应的架构。"""
    
    id: str = Field(..., description="用户 ID")
    email: str = Field(..., description="用户邮箱")
    username: str = Field(..., description="用户名")
    full_name: Optional[str] = Field(None, description="全名")
    avatar_url: Optional[str] = Field(None, description="头像 URL")
    wallet_address: Optional[str] = Field(None, description="绑定的钱包地址")
    is_active: bool = Field(..., description="账户激活状态")
    is_verified: bool = Field(..., description="邮箱验证状态")
    created_at: datetime = Field(..., description="账户创建时间")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    
    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    """包含用户信息和令牌的认证响应架构。"""
    
    user: UserResponse = Field(..., description="用户信息")
    tokens: TokenResponse = Field(..., description="认证令牌")


class WalletBindRequest(BaseModel):
    """钱包绑定请求的架构。"""
    
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


class MessageResponse(BaseModel):
    """通用的消息响应架构。"""
    
    message: str = Field(..., description="响应消息")
    success: bool = Field(default=True, description="操作成功状态")
