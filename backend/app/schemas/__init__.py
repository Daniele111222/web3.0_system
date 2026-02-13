"""Pydantic 请求/响应架构。"""
from app.schemas.response import (
    ApiResponse,
    ApiError,
    PageResult,
    MessageResponse,
)
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    AuthResponse,
    WalletBindRequest,
    MessageResponse as AuthMessageResponse,
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
    # 通用响应
    "ApiResponse",
    "ApiError",
    "PageResult",
    "MessageResponse",
    # 认证相关
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserResponse",
    "AuthResponse",
    "WalletBindRequest",
    "AuthMessageResponse",
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
