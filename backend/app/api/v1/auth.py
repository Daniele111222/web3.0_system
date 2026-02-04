"""Authentication API endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DBSession, CurrentUserId
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    WalletBindRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
    MessageResponse,
)
from app.services.auth_service import (
    AuthService,
    AuthServiceError,
    InvalidCredentialsError,
    UserExistsError,
    AccountDisabledError,
    InvalidTokenError,
    WalletBindError,
    UserNotFoundError,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and device info from request."""
    # Get real IP (considering proxy headers)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None
    
    # Get device info from User-Agent
    device_info = request.headers.get("User-Agent", "")[:255]
    
    return ip_address, device_info


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="用户注册",
    description="注册新用户账号，返回用户信息和认证令牌",
)
async def register(
    data: UserRegisterRequest,
    request: Request,
    db: DBSession,
) -> AuthResponse:
    """Register a new user."""
    ip_address, device_info = get_client_info(request)
    
    try:
        auth_service = AuthService(db)
        result = await auth_service.register(data, ip_address, device_info)
        await db.commit()
        return result
    except UserExistsError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": e.message, "code": e.code},
        )
    except AuthServiceError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="用户登录",
    description="使用邮箱和密码登录，返回用户信息和认证令牌",
)
async def login(
    data: UserLoginRequest,
    request: Request,
    db: DBSession,
) -> AuthResponse:
    """Login with email and password."""
    ip_address, device_info = get_client_info(request)
    
    try:
        auth_service = AuthService(db)
        result = await auth_service.login(data, ip_address, device_info)
        await db.commit()
        return result
    except InvalidCredentialsError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": e.message, "code": e.code},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except AccountDisabledError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": e.message, "code": e.code},
        )
    except AuthServiceError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="刷新令牌",
    description="使用刷新令牌获取新的访问令牌（令牌轮换机制）",
)
async def refresh_token(
    data: RefreshTokenRequest,
    request: Request,
    db: DBSession,
) -> TokenResponse:
    """Refresh access token using refresh token."""
    ip_address, device_info = get_client_info(request)
    
    try:
        auth_service = AuthService(db)
        result = await auth_service.refresh_tokens(
            data.refresh_token, ip_address, device_info
        )
        await db.commit()
        return result
    except InvalidTokenError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": e.message, "code": e.code},
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="用户登出",
    description="撤销当前刷新令牌",
)
async def logout(
    data: RefreshTokenRequest,
    db: DBSession,
) -> MessageResponse:
    """Logout by revoking refresh token."""
    try:
        auth_service = AuthService(db)
        success = await auth_service.logout(data.refresh_token)
        await db.commit()
        return MessageResponse(
            message="Logged out successfully" if success else "Token not found",
            success=success,
        )
    except AuthServiceError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="登出所有设备",
    description="撤销当前用户的所有刷新令牌",
)
async def logout_all(
    user_id: CurrentUserId,
    db: DBSession,
) -> MessageResponse:
    """Logout from all devices."""
    from uuid import UUID
    
    try:
        auth_service = AuthService(db)
        count = await auth_service.logout_all(UUID(user_id))
        await db.commit()
        return MessageResponse(
            message=f"Logged out from {count} device(s)",
            success=True,
        )
    except AuthServiceError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post(
    "/bind-wallet",
    response_model=UserResponse,
    summary="绑定钱包",
    description="将区块链钱包地址绑定到用户账号",
)
async def bind_wallet(
    data: WalletBindRequest,
    user_id: CurrentUserId,
    db: DBSession,
) -> UserResponse:
    """Bind a blockchain wallet to user account."""
    from uuid import UUID
    
    try:
        auth_service = AuthService(db)
        result = await auth_service.bind_wallet(
            UUID(user_id),
            data.wallet_address,
            data.signature,
            data.message,
        )
        await db.commit()
        return result
    except WalletBindError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )
    except UserNotFoundError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="获取当前用户",
    description="获取当前登录用户的信息",
)
async def get_current_user(
    user_id: CurrentUserId,
    db: DBSession,
) -> UserResponse:
    """Get current user profile."""
    from uuid import UUID
    
    try:
        auth_service = AuthService(db)
        return await auth_service.get_current_user(UUID(user_id))
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )
