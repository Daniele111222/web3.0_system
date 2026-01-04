"""Authentication schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRegisterRequest(BaseModel):
    """Schema for user registration request."""
    
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Username (3-50 characters, alphanumeric and underscore)",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8-128 characters)",
    )
    full_name: Optional[str] = Field(
        None,
        max_length=100,
        description="User's full name",
    )
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", v):
            raise ValueError(
                "Username must start with a letter and contain only letters, numbers, and underscores"
            )
        return v.lower()
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLoginRequest(BaseModel):
    """Schema for user login request."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Schema for token response."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""
    
    refresh_token: str = Field(..., description="Refresh token")


class UserResponse(BaseModel):
    """Schema for user response."""
    
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    username: str = Field(..., description="Username")
    full_name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    wallet_address: Optional[str] = Field(None, description="Bound wallet address")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Email verified status")
    created_at: datetime = Field(..., description="Account creation time")
    last_login_at: Optional[datetime] = Field(None, description="Last login time")
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Schema for authentication response with user info."""
    
    user: UserResponse = Field(..., description="User information")
    tokens: TokenResponse = Field(..., description="Authentication tokens")


class WalletBindRequest(BaseModel):
    """Schema for wallet binding request."""
    
    wallet_address: str = Field(
        ...,
        min_length=42,
        max_length=42,
        description="Ethereum wallet address",
    )
    signature: str = Field(..., description="Signed message for verification")
    message: str = Field(..., description="Original message that was signed")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_wallet_address(cls, v: str) -> str:
        if not re.match(r"^0x[a-fA-F0-9]{40}$", v):
            raise ValueError("Invalid Ethereum wallet address format")
        return v.lower()


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str = Field(..., description="Response message")
    success: bool = Field(default=True, description="Operation success status")
