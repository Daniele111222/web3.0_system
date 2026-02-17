"""Authentication API endpoints."""
from typing import Optional
from fastapi import APIRouter, status, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DBSession, CurrentUserId
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    WalletBindRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
    MessageResponse,
    VerificationStatusResponse,
)
from app.services.auth_service import (
    AuthService,
    InvalidCredentialsError,
    UserExistsError,
    AccountDisabledError,
    InvalidTokenError,
    WalletBindError,
    UserNotFoundError,
    ResetTokenError,
    VerificationTokenError,
    TooManyRequestsError,
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
    except UserExistsError:
        await db.rollback()
        raise


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="用户登录",
    description="使用邮箱和密码登录，返回用户信息和认证令牌。支持记住我功能，勾选后Refresh Token有效期延长至30天",
)
async def login(
    data: UserLoginRequest,
    request: Request,
    db: DBSession,
) -> AuthResponse:
    """Login with email and password."""
    ip_address, device_info = get_client_info(request)
    
    auth_service = AuthService(db)
    result = await auth_service.login(
        data, ip_address, device_info, data.remember_me
    )
    await db.commit()
    return result


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
    
    auth_service = AuthService(db)
    result = await auth_service.refresh_tokens(
        data.refresh_token, ip_address, device_info
    )
    await db.commit()
    return result


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
    auth_service = AuthService(db)
    success = await auth_service.logout(data.refresh_token)
    await db.commit()
    return MessageResponse(
        message="Logged out successfully" if success else "Token not found",
        success=success,
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
    
    auth_service = AuthService(db)
    count = await auth_service.logout_all(UUID(user_id))
    await db.commit()
    return MessageResponse(
        message=f"Logged out from {count} device(s)",
        success=True,
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
    
    auth_service = AuthService(db)
    result = await auth_service.bind_wallet(
        UUID(user_id),
        data.wallet_address,
        data.signature,
        data.message,
    )
    await db.commit()
    return result


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
    
    auth_service = AuthService(db)
    return await auth_service.get_current_user(UUID(user_id))


# ==================== 密码重置端点 ====================

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="请求密码重置",
    description="发送密码重置邮件到用户邮箱",
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: DBSession,
) -> MessageResponse:
    """Request password reset email."""
    auth_service = AuthService(db)
    
    try:
        await auth_service.request_password_reset(data.email)
        return MessageResponse(
            message="如果该邮箱已注册，您将收到密码重置邮件",
            success=True,
        )
    except TooManyRequestsError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"message": str(e), "code": e.code},
        )


@router.get(
    "/verify-reset-token",
    response_model=MessageResponse,
    summary="验证重置令牌",
    description="验证密码重置令牌是否有效",
)
async def verify_reset_token_endpoint(
    token: str,
    db: DBSession,
) -> MessageResponse:
    """Verify password reset token validity."""
    auth_service = AuthService(db)
    
    is_valid = await auth_service.verify_reset_token(token)
    
    if is_valid:
        return MessageResponse(
            message="令牌有效",
            success=True,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "重置令牌无效或已过期", "code": "RESET_TOKEN_ERROR"},
        )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="重置密码",
    description="使用重置令牌设置新密码",
)
async def reset_password(
    data: ResetPasswordRequest,
    db: DBSession,
) -> MessageResponse:
    """Reset password using reset token."""
    auth_service = AuthService(db)
    
    try:
        await auth_service.reset_password(data.token, data.new_password)
        return MessageResponse(
            message="密码重置成功，请使用新密码登录",
            success=True,
        )
    except ResetTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e), "code": e.code},
        )


# ==================== 邮箱验证端点 ====================

@router.post(
    "/send-verification",
    response_model=MessageResponse,
    summary="发送验证邮件",
    description="发送邮箱验证邮件到当前用户邮箱",
)
async def send_verification_email(
    user_id: CurrentUserId,
    db: DBSession,
) -> MessageResponse:
    """Send verification email to current user."""
    from uuid import UUID
    
    auth_service = AuthService(db)
    
    try:
        await auth_service.send_verification_email(UUID(user_id))
        return MessageResponse(
            message="验证邮件已发送，请查收",
            success=True,
        )
    except TooManyRequestsError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"message": str(e), "code": e.code},
        )


@router.get(
    "/verify-email",
    response_model=MessageResponse,
    summary="验证邮箱",
    description="验证邮箱验证令牌并完成邮箱验证",
)
async def verify_email(
    token: str,
    db: DBSession,
) -> MessageResponse:
    """Verify email using verification token."""
    auth_service = AuthService(db)
    
    try:
        await auth_service.verify_email(token)
        return MessageResponse(
            message="邮箱验证成功",
            success=True,
        )
    except VerificationTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e), "code": e.code},
        )


@router.get(
    "/verification-status",
    response_model=VerificationStatusResponse,
    summary="获取验证状态",
    description="获取当前用户的邮箱验证状态",
)
async def get_verification_status(
    user_id: CurrentUserId,
    db: DBSession,
) -> VerificationStatusResponse:
    """Get current user's email verification status."""
    from uuid import UUID
    
    auth_service = AuthService(db)
    status = await auth_service.get_verification_status(UUID(user_id))
    
    return VerificationStatusResponse(
        is_verified=status["is_verified"],
        email=status["email"],
        has_pending_token=status["has_pending_token"],
        pending_tokens_count=status["pending_tokens_count"],
    )
