"""用于业务逻辑的身份验证服务。"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID
import hashlib
import secrets

from sqlalchemy.ext.asyncio import AsyncSession
from eth_account.messages import encode_defunct
from web3 import Web3

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.repositories.user_repository import UserRepository
from app.repositories.token_repository import TokenRepository
from app.repositories.password_reset_token_repository import PasswordResetTokenRepository
from app.repositories.email_verification_token_repository import EmailVerificationTokenRepository
from app.models.password_reset_token import PasswordResetToken
from app.models.email_verification_token import EmailVerificationToken
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    AuthResponse,
)
from app.services.email_service import email_service


class InvalidCredentialsError(UnauthorizedException):
    """当凭据无效时抛出。"""
    
    def __init__(self, message: str = "邮箱或密码错误"):
        super().__init__(message, "INVALID_CREDENTIALS")


class UserExistsError(BadRequestException):
    """当用户已存在时抛出。"""
    
    def __init__(self, field: str):
        super().__init__(f"{field} 已被注册", "USER_EXISTS")


class UserNotFoundError(NotFoundException):
    """当找不到用户时抛出。"""
    
    def __init__(self):
        super().__init__("未找到该用户", "USER_NOT_FOUND")


class AccountDisabledError(ForbiddenException):
    """当账户被禁用时抛出。"""
    
    def __init__(self):
        super().__init__("该账户已被禁用", "ACCOUNT_DISABLED")


class InvalidTokenError(UnauthorizedException):
    """当令牌无效时抛出。"""
    
    def __init__(self, message: str = "无效或已过期的令牌"):
        super().__init__(message, "INVALID_TOKEN")


class WalletBindError(BadRequestException):
    """当钱包绑定失败时抛出。"""
    
    def __init__(self, message: str):
        super().__init__(message, "WALLET_BIND_ERROR")


class EmailNotVerifiedError(ForbiddenException):
    """当邮箱未验证时抛出。"""
    
    def __init__(self):
        super().__init__("请先验证您的邮箱", "EMAIL_NOT_VERIFIED")


class ResetTokenError(BadRequestException):
    """当重置令牌无效时抛出。"""
    
    def __init__(self, message: str = "重置令牌无效或已过期"):
        super().__init__(message, "RESET_TOKEN_ERROR")


class VerificationTokenError(BadRequestException):
    """当验证令牌无效时抛出。"""
    
    def __init__(self, message: str = "验证令牌无效或已过期"):
        super().__init__(message, "VERIFICATION_TOKEN_ERROR")


class TooManyRequestsError(BadRequestException):
    """当请求过于频繁时抛出。"""
    
    def __init__(self, message: str = "请求过于频繁，请稍后再试"):
        super().__init__(message, "TOO_MANY_REQUESTS")


class AuthService:
    """身份验证操作的服务类。"""
    
    # 每个用户允许的最大活跃会话数
    MAX_ACTIVE_SESSIONS = 5
    
    def __init__(self, db: AsyncSession):
        """
        初始化认证服务。
        
        Args:
            db (AsyncSession): 数据库异步会话。
        """
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)
    
    async def register(
        self,
        data: UserRegisterRequest,
        ip_address: Optional[str] = None,
        device_info: Optional[str] = None,
    ) -> AuthResponse:
        """
        注册新用户并返回令牌。
        
        Args:
            data (UserRegisterRequest): 注册请求数据。
            ip_address (Optional[str]): 注册时的 IP 地址。
            device_info (Optional[str]): 注册时的设备信息。
            
        Returns:
            AuthResponse: 包含用户信息和认证令牌的响应。
            
        Raises:
            UserExistsError: 如果邮箱或用户名已存在。
        """
        # 检查邮箱是否存在
        if await self.user_repo.email_exists(data.email):
            raise UserExistsError("邮箱")
        
        # 检查用户名是否存在
        if await self.user_repo.username_exists(data.username):
            raise UserExistsError("用户名")
        
        # 创建用户
        user = User(
            email=data.email.lower(),
            username=data.username.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
        )
        user = await self.user_repo.create(user)
        
        # 生成令牌
        tokens = await self._create_tokens(user, ip_address, device_info)
        
        return AuthResponse(
            user=self._user_to_response(user),
            tokens=tokens,
        )
    
    async def login(
        self,
        data: UserLoginRequest,
        ip_address: Optional[str] = None,
        device_info: Optional[str] = None,
        remember_me: bool = False,
    ) -> AuthResponse:
        """
        认证用户并返回令牌。
        
        Args:
            data (UserLoginRequest): 登录请求数据。
            ip_address (Optional[str]): 登录时的 IP 地址。
            device_info (Optional[str]): 登录时的设备信息。
            remember_me (bool): 是否记住登录状态。
            
        Returns:
            AuthResponse: 包含用户信息和认证令牌的响应。
            
        Raises:
            InvalidCredentialsError: 如果凭据无效。
            AccountDisabledError: 如果账户被禁用。
        """
        # 根据邮箱获取用户
        user = await self.user_repo.get_by_email(data.email)
        
        if not user:
            raise InvalidCredentialsError()
        
        # 检查账户是否活跃
        if not user.is_active:
            raise AccountDisabledError()
        
        # 验证密码
        if not verify_password(data.password, user.hashed_password):
            raise InvalidCredentialsError()
        
        # 更新最后登录时间
        await self.user_repo.update_last_login(user.id)
        
        # 生成令牌（传递remember_me参数）
        tokens = await self._create_tokens(user, ip_address, device_info, remember_me)
        
        # 刷新用户数据
        user = await self.user_repo.get_by_id(user.id)
        
        return AuthResponse(
            user=self._user_to_response(user),
            tokens=tokens,
        )

    async def refresh_tokens(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        device_info: Optional[str] = None,
    ) -> TokenResponse:
        """
        使用刷新令牌刷新访问令牌（带令牌轮换）。
        
        Args:
            refresh_token (str): 刷新令牌。
            ip_address (Optional[str]): 刷新时的 IP 地址。
            device_info (Optional[str]): 刷新时的设备信息。
            
        Returns:
            TokenResponse: 新的访问令牌和刷新令牌。
            
        Raises:
            InvalidTokenError: 如果令牌无效、已过期或已被撤销。
        """
        # 解码并验证令牌
        payload = decode_token(refresh_token, expected_type="refresh")
        if not payload:
            raise InvalidTokenError()
        
        # 获取令牌哈希
        token_hash = self._hash_token(refresh_token)
        
        # 在数据库中验证令牌
        stored_token = await self.token_repo.get_valid_token(token_hash)
        if not stored_token:
            raise InvalidTokenError("令牌已被撤销或已过期")
        
        # 获取用户
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise InvalidTokenError("用户未找到或已被禁用")
        
        # 撤销旧令牌（令牌轮换）
        await self.token_repo.revoke_token(token_hash)
        
        # 生成新令牌
        return await self._create_tokens(user, ip_address, device_info)
    
    async def logout(self, refresh_token: str) -> bool:
        """
        通过撤销刷新令牌注销登录。
        
        Args:
            refresh_token (str): 刷新令牌。
            
        Returns:
            bool: 注销是否成功。
        """
        token_hash = self._hash_token(refresh_token)
        return await self.token_repo.revoke_token(token_hash)
    
    async def logout_all(self, user_id: UUID) -> int:
        """
        通过撤销所有刷新令牌从所有设备注销。
        
        Args:
            user_id (UUID): 用户 ID。
            
        Returns:
            int: 被撤销的令牌数量。
        """
        return await self.token_repo.revoke_all_user_tokens(user_id)
    
    async def bind_wallet(
        self,
        user_id: UUID,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> UserResponse:
        """
        将钱包地址绑定到用户账户。
        
        Args:
            user_id (UUID): 用户 ID。
            wallet_address (str): 钱包地址。
            signature (str): 钱包签名。
            message (str): 签名的原始消息。
            
        Returns:
            UserResponse: 更新后的用户信息。
            
        Raises:
            UserNotFoundError: 如果找不到用户。
            WalletBindError: 如果钱包已绑定或签名无效。
        """
        # 获取用户
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        
        # 检查钱包是否已绑定到另一个用户
        if await self.user_repo.wallet_address_exists(wallet_address):
            existing_user = await self.user_repo.get_by_wallet_address(wallet_address)
            if existing_user and existing_user.id != user_id:
                raise WalletBindError("该钱包地址已绑定到另一个账户")
        
        # 验证签名
        if not self._verify_wallet_signature(wallet_address, signature, message):
            raise WalletBindError("无效的钱包签名")
        
        # 更新钱包地址
        user = await self.user_repo.update_wallet_address(user_id, wallet_address)
        
        return self._user_to_response(user)
    
    async def get_current_user(self, user_id: UUID) -> UserResponse:
        """
        根据 ID 获取当前用户。
        
        Args:
            user_id (UUID): 用户 ID。
            
        Returns:
            UserResponse: 用户信息。
            
        Raises:
            UserNotFoundError: 如果找不到用户。
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return self._user_to_response(user)
    
    async def _create_tokens(
        self,
        user: User,
        ip_address: Optional[str] = None,
        device_info: Optional[str] = None,
        remember_me: bool = False,
    ) -> TokenResponse:
        """
        创建访问令牌和刷新令牌。
        
        Args:
            user (User): 用户模型实例。
            ip_address (Optional[str]): 客户端 IP 地址。
            device_info (Optional[str]): 客户端设备信息。
            remember_me (bool): 是否记住登录状态，True则延长Refresh Token有效期到30天
            
        Returns:
            TokenResponse: 包含新生成的令牌的响应。
        """
        # 检查会话限制
        active_count = await self.token_repo.count_active_tokens(user.id)
        if active_count >= self.MAX_ACTIVE_SESSIONS:
            # 如果超过限制，撤销该用户的所有旧令牌
            await self.token_repo.revoke_all_user_tokens(user.id)
        
        # 创建访问令牌
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        # 创建刷新令牌
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # 存储刷新令牌哈希
        token_hash = self._hash_token(refresh_token)
        
        # 根据remember_me设置不同的过期时间
        if remember_me:
            # 记住我：30天
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            # 不记住：7天（默认值）
            expires_at = datetime.now(timezone.utc) + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        
        stored_token = RefreshToken(
            token_hash=token_hash,
            user_id=user.id,
            ip_address=ip_address,
            device_info=device_info,
            expires_at=expires_at,
        )
        await self.token_repo.create(stored_token)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    def _hash_token(self, token: str) -> str:
        """
        对令牌进行哈希处理以进行安全存储。
        
        Args:
            token (str): 原始令牌字符串。
            
        Returns:
            str: SHA-256 哈希值。
        """
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _verify_wallet_signature(
        self,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> bool:
        """
        使用 Web3 验证钱包签名。
        
        Args:
            wallet_address (str): 钱包地址。
            signature (str): 钱包签名。
            message (str): 签名的原始消息。
            
        Returns:
            bool: 签名是否有效。
        """
        try:
            w3 = Web3()
            message_hash = encode_defunct(text=message)
            recovered_address = w3.eth.account.recover_message(
                message_hash, signature=signature
            )
            return recovered_address.lower() == wallet_address.lower()
        except Exception:
            return False
    
    def _user_to_response(self, user: User) -> UserResponse:
        """
        将 User 模型转换为 UserResponse 架构。
        
        Args:
            user (User): 用户模型实例。
            
        Returns:
            UserResponse: 用户响应数据。
        """
        return UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            wallet_address=user.wallet_address,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )
    
    # ==================== 密码重置方法 ====================
    
    async def request_password_reset(self, email: str) -> bool:
        """
        请求密码重置，发送重置邮件。
        
        Args:
            email: 用户邮箱地址
            
        Returns:
            bool: 是否成功发送邮件
            
        Raises:
            UserNotFoundError: 如果用户不存在
            TooManyRequestsError: 如果请求过于频繁
        """
        # 查找用户
        user = await self.user_repo.get_by_email(email)
        if not user:
            # 为了安全，即使用户不存在也返回True，防止枚举攻击
            return True
        
        # 初始化密码重置令牌仓库
        reset_token_repo = PasswordResetTokenRepository(self.db)
        
        # 检查是否最近已经发送过（5分钟内）
        if await reset_token_repo.has_recent_request(user.id, minutes=5):
            raise TooManyRequestsError("请稍后再试，邮件发送过于频繁")
        
        # 撤销该用户所有未使用的旧令牌
        await reset_token_repo.revoke_user_tokens(user.id)
        
        # 生成新的重置令牌
        import secrets
        import hashlib
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # 创建令牌记录（30分钟过期）
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        reset_token = PasswordResetToken(
            token_hash=token_hash,
            user_id=user.id,
            expires_at=expires_at,
        )
        await reset_token_repo.create(reset_token)
        
        # 发送重置邮件
        await email_service.send_password_reset_email(
            to_email=user.email,
            reset_token=raw_token,
            user_name=user.full_name or user.username,
        )
        
        return True
    
    async def verify_reset_token(self, token: str) -> bool:
        """
        验证密码重置令牌是否有效。
        
        Args:
            token: 原始重置令牌
            
        Returns:
            bool: 令牌是否有效
        """
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        reset_token_repo = PasswordResetTokenRepository(self.db)
        reset_token = await reset_token_repo.get_valid_token(token_hash)
        
        return reset_token is not None
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """
        使用重置令牌重置密码。
        
        Args:
            token: 原始重置令牌
            new_password: 新密码
            
        Returns:
            bool: 是否成功重置
            
        Raises:
            ResetTokenError: 如果令牌无效或已过期
        """
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        reset_token_repo = PasswordResetTokenRepository(self.db)
        reset_token = await reset_token_repo.get_valid_token(token_hash)
        
        if not reset_token:
            raise ResetTokenError("重置令牌无效或已过期")
        
        # 更新用户密码
        from app.core.security import get_password_hash
        user = await self.user_repo.get_by_id(reset_token.user_id)
        if not user:
            raise ResetTokenError("用户不存在")
        
        user.hashed_password = get_password_hash(new_password)
        await self.db.flush()
        
        # 标记令牌为已使用
        await reset_token_repo.mark_as_used(token_hash)
        
        # 撤销该用户的所有刷新令牌（强制重新登录）
        await self.token_repo.revoke_all_user_tokens(user.id)
        
        return True
    
    # ==================== 邮箱验证方法 ====================
    
    async def send_verification_email(self, user_id: UUID) -> bool:
        """
        发送邮箱验证邮件。
        
        Args:
            user_id: 用户ID
            
        Returns:
            bool: 是否成功发送
            
        Raises:
            UserNotFoundError: 如果用户不存在
            TooManyRequestsError: 如果请求过于频繁
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        
        # 如果已经验证过，直接返回
        if user.is_verified:
            return True
        
        # 初始化验证令牌仓库
        verification_repo = EmailVerificationTokenRepository(self.db)
        
        # 检查是否最近已经发送过（60秒内）
        if await verification_repo.has_recent_request(user.id, seconds=60):
            raise TooManyRequestsError("请稍后再试，邮件发送过于频繁")
        
        # 撤销该用户所有未使用的旧令牌
        await verification_repo.revoke_user_tokens(user.id)
        
        # 生成新的验证令牌
        import secrets
        import hashlib
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # 创建令牌记录（24小时过期）
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        verification_token = EmailVerificationToken(
            token_hash=token_hash,
            user_id=user.id,
            expires_at=expires_at,
        )
        await verification_repo.create(verification_token)
        
        # 发送验证邮件
        await email_service.send_verification_email(
            to_email=user.email,
            verification_token=raw_token,
            user_name=user.full_name or user.username,
        )
        
        return True
    
    async def verify_email(self, token: str) -> bool:
        """
        验证邮箱。
        
        Args:
            token: 原始验证令牌
            
        Returns:
            bool: 是否验证成功
            
        Raises:
            VerificationTokenError: 如果令牌无效或已过期
        """
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        verification_repo = EmailVerificationTokenRepository(self.db)
        verification_token = await verification_repo.get_valid_token(token_hash)
        
        if not verification_token:
            raise VerificationTokenError("验证令牌无效或已过期")
        
        # 更新用户的验证状态
        user = await self.user_repo.get_by_id(verification_token.user_id)
        if not user:
            raise VerificationTokenError("用户不存在")
        
        user.is_verified = True
        await self.db.flush()
        
        # 标记令牌为已使用
        await verification_repo.mark_as_used(token_hash)
        
        return True
    
    async def get_verification_status(self, user_id: UUID) -> dict:
        """
        获取用户的邮箱验证状态。
        
        Args:
            user_id: 用户ID
            
        Returns:
            dict: 包含验证状态和待处理令牌信息的字典
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        
        verification_repo = EmailVerificationTokenRepository(self.db)
        pending_tokens = await verification_repo.get_user_valid_tokens(user_id)
        
        return {
            "is_verified": user.is_verified,
            "email": user.email,
            "has_pending_token": len(pending_tokens) > 0,
            "pending_tokens_count": len(pending_tokens),
        }
