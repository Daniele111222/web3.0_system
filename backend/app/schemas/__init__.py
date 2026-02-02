"""Pydantic 请求/响应架构。"""
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    AuthResponse,
    WalletBindRequest,
    MessageResponse,
)
from app.schemas.enterprise import (
    EnterpriseCreateRequest,
    EnterpriseUpdateRequest,
    EnterpriseResponse,
    EnterpriseDetailResponse,
    EnterpriseListResponse,
    MemberResponse,
    InviteMemberRequest,
    UpdateMemberRoleRequest,
    BindWalletRequest,
)
from app.schemas.asset import (
    AssetCreateRequest,
    AssetUpdateRequest,
    AssetResponse,
    AssetListResponse,
    AssetFilterParams,
    AttachmentResponse,
    AttachmentUploadRequest,
)

__all__ = [
    # 认证相关
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserResponse",
    "AuthResponse",
    "WalletBindRequest",
    "MessageResponse",
    # 企业相关
    "EnterpriseCreateRequest",
    "EnterpriseUpdateRequest",
    "EnterpriseResponse",
    "EnterpriseDetailResponse",
    "EnterpriseListResponse",
    "MemberResponse",
    "InviteMemberRequest",
    "UpdateMemberRoleRequest",
    "BindWalletRequest",
    # 资产相关
    "AssetCreateRequest",
    "AssetUpdateRequest",
    "AssetResponse",
    "AssetListResponse",
    "AssetFilterParams",
    "AttachmentResponse",
    "AttachmentUploadRequest",
]
