"""Authentication service for business logic."""
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
    """Base exception for auth service errors."""
    
    def __init__(self, message: str, code: str = "AUTH_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class InvalidCredentialsError(AuthServiceError):
    """Raised when credentials are invalid."""
    
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message, "INVALID_CREDENTIALS")


class UserExistsError(AuthServiceError):
    """Raised when user already exists."""
    
    def __init__(self, field: str):
        super().__init__(f"{field} already registered", "USER_EXISTS")


class UserNotFoundError(AuthServiceError):
    """Raised when user is not found."""
    
    def __init__(self):
        super().__init__("User not found", "USER_NOT_FOUND")


class AccountDisabledError(AuthServiceError):
    """Raised when account is disabled."""
    
    def __init__(self):
        super().__init__("Account is disabled", "ACCOUNT_DISABLED")


class InvalidTokenError(AuthServiceError):
    """Raised when token is invalid."""
    
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(message, "INVALID_TOKEN")


class WalletBindError(AuthServiceError):
    """Raised when wallet binding fails."""
    
    def __init__(self, message: str):
        super().__init__(message, "WALLET_BIND_ERROR")


class AuthService:
    """Service for authentication operations."""
    
    # Maximum active sessions per user
    MAX_ACTIVE_SESSIONS = 5
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)
    
    async def register(
        self,
        data: UserRegisterRequest,
        ip_address: Optional[str] = None,
        device_info: Optional[str] = None,
    ) -> AuthResponse:
        """Register a new user and return tokens."""
        # Check if email exists
        if await self.user_repo.email_exists(data.email):
            raise UserExistsError("Email")
        
        # Check if username exists
        if await self.user_repo.username_exists(data.username):
            raise UserExistsError("Username")
        
        # Create user
        user = User(
            email=data.email.lower(),
            username=data.username.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
        )
        user = await self.user_repo.create(user)
        
        # Generate tokens
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
        """Authenticate user and return tokens."""
        # Get user by email
        user = await self.user_repo.get_by_email(data.email)
        
        if not user:
            raise InvalidCredentialsError()
        
        # Check if account is active
        if not user.is_active:
            raise AccountDisabledError()
        
        # Verify password
        if not verify_password(data.password, user.hashed_password):
            raise InvalidCredentialsError()
        
        # Update last login
        await self.user_repo.update_last_login(user.id)
        
        # Generate tokens
        tokens = await self._create_tokens(user, ip_address, device_info)
        
        # Refresh user data
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
        """Refresh access token using refresh token (with rotation)."""
        # Decode and validate token
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise InvalidTokenError()
        
        # Get token hash
        token_hash = self._hash_token(refresh_token)
        
        # Validate token in database
        stored_token = await self.token_repo.get_valid_token(token_hash)
        if not stored_token:
            raise InvalidTokenError("Token has been revoked or expired")
        
        # Get user
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise InvalidTokenError("User not found or disabled")
        
        # Revoke old token (token rotation)
        await self.token_repo.revoke_token(token_hash)
        
        # Generate new tokens
        return await self._create_tokens(user, ip_address, device_info)
    
    async def logout(self, refresh_token: str) -> bool:
        """Logout by revoking refresh token."""
        token_hash = self._hash_token(refresh_token)
        return await self.token_repo.revoke_token(token_hash)
    
    async def logout_all(self, user_id: UUID) -> int:
        """Logout from all devices by revoking all refresh tokens."""
        return await self.token_repo.revoke_all_user_tokens(user_id)
    
    async def bind_wallet(
        self,
        user_id: UUID,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> UserResponse:
        """Bind a wallet address to user account."""
        # Get user
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        
        # Check if wallet already bound to another user
        if await self.user_repo.wallet_address_exists(wallet_address):
            existing_user = await self.user_repo.get_by_wallet_address(wallet_address)
            if existing_user and existing_user.id != user_id:
                raise WalletBindError("Wallet address already bound to another account")
        
        # Verify signature
        if not self._verify_wallet_signature(wallet_address, signature, message):
            raise WalletBindError("Invalid wallet signature")
        
        # Update wallet address
        user = await self.user_repo.update_wallet_address(user_id, wallet_address)
        
        return self._user_to_response(user)
    
    async def get_current_user(self, user_id: UUID) -> UserResponse:
        """Get current user by ID."""
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
        """Create access and refresh tokens."""
        # Check session limit
        active_count = await self.token_repo.count_active_tokens(user.id)
        if active_count >= self.MAX_ACTIVE_SESSIONS:
            # Revoke oldest tokens if limit exceeded
            await self.token_repo.revoke_all_user_tokens(user.id)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        # Create refresh token
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Store refresh token hash
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
        """Hash a token for secure storage."""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _verify_wallet_signature(
        self,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> bool:
        """Verify wallet signature using Web3."""
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
        """Convert User model to UserResponse schema."""
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
