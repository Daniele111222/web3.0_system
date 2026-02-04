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
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    AuthResponse,
)


class AuthServiceError(Exception):
    """身份验证服务错误的基类。"""
    
    def __init__(self, message: str, code: str = "AUTH_ERROR"):
        """
        初始化认证服务错误。
        
        Args:
            message (str): 错误消息。
            code (str): 错误代码。
        """
        self.message = message
        self.code = code
        super().__init__(message)


class InvalidCredentialsError(AuthServiceError):
    """当凭据无效时抛出。"""
    
    def __init__(self, message: str = "邮箱或密码错误"):
        super().__init__(message, "INVALID_CREDENTIALS")


class UserExistsError(AuthServiceError):
    """当用户已存在时抛出。"""
    
    def __init__(self, field: str):
        super().__init__(f"{field} 已被注册", "USER_EXISTS")


class UserNotFoundError(AuthServiceError):
    """当找不到用户时抛出。"""
    
    def __init__(self):
        super().__init__("未找到该用户", "USER_NOT_FOUND")


class AccountDisabledError(AuthServiceError):
    """当账户被禁用时抛出。"""
    
    def __init__(self):
        super().__init__("该账户已被禁用", "ACCOUNT_DISABLED")


class InvalidTokenError(AuthServiceError):
    """当令牌无效时抛出。"""
    
    def __init__(self, message: str = "无效或已过期的令牌"):
        super().__init__(message, "INVALID_TOKEN")


class WalletBindError(AuthServiceError):
    """当钱包绑定失败时抛出。"""
    
    def __init__(self, message: str):
        super().__init__(message, "WALLET_BIND_ERROR")


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
    ) -> AuthResponse:
        """
        认证用户并返回令牌。
        
        Args:
            data (UserLoginRequest): 登录请求数据。
            ip_address (Optional[str]): 登录时的 IP 地址。
            device_info (Optional[str]): 登录时的设备信息。
            
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
        
        # 生成令牌
        tokens = await self._create_tokens(user, ip_address, device_info)
        
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
    ) -> TokenResponse:
        """
        创建访问令牌和刷新令牌。
        
        Args:
            user (User): 用户模型实例。
            ip_address (Optional[str]): 客户端 IP 地址。
            device_info (Optional[str]): 客户端设备信息。
            
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
