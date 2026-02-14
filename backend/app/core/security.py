import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Optional, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 允许的 JWT 算法，防止算法混淆攻击
ALLOWED_ALGORITHMS = ["HS256", "HS384", "HS512"]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证明文密码与哈希密码是否匹配。"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError as e:
        logger = logging.getLogger(__name__)
        logger.warning(f"密码验证失败: {str(e)}")
        return False


def get_password_hash(password: str) -> str:
    """使用 bcrypt 对密码进行哈希处理。"""
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """创建带有增强安全声明的 JWT 访问令牌。"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 添加安全声明
    to_encode.update({
        "exp": expire,
        "iat": now,  # 签发时间
        "jti": str(uuid.uuid4()),  # JWT ID，用于令牌撤销
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """创建带有增强安全声明的 JWT 刷新令牌。"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # 添加安全声明
    to_encode.update({
        "exp": expire,
        "iat": now,  # 签发时间
        "jti": str(uuid.uuid4()),  # JWT ID，用于令牌撤销
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(
    token: str,
    expected_type: Optional[str] = None,
    require_claims: Iterable[str] = ("exp", "sub", "type"),
) -> Optional[Dict[str, Any]]:
    """使用增强的安全检查解码和验证 JWT 令牌。"""
    try:
        # 验证算法以防止算法混淆攻击
        if settings.ALGORITHM not in ALLOWED_ALGORITHMS:
            return None
            
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": list(require_claims)},
        )
    except JWTError:
        return None
    except Exception:
        # 捕获解码过程中的任何意外错误
        return None
        
    if expected_type and payload.get("type") != expected_type:
        return None
        
    return payload
