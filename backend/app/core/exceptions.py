"""自定义异常类。"""
from typing import Any, Optional


class AppException(Exception):
    """应用基础异常类。"""
    
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Any] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class BadRequestException(AppException):
    """400 - 请求参数错误。"""
    
    def __init__(self, message: str = "请求参数错误", code: str = "BAD_REQUEST", details: Optional[Any] = None):
        super().__init__(message, code, 400, details)


class UnauthorizedException(AppException):
    """401 - 未授权（认证失败）。"""
    
    def __init__(self, message: str = "认证失败", code: str = "UNAUTHORIZED", details: Optional[Any] = None):
        super().__init__(message, code, 401, details)


class ForbiddenException(AppException):
    """403 - 禁止访问（权限不足）。"""
    
    def __init__(self, message: str = "权限不足", code: str = "FORBIDDEN", details: Optional[Any] = None):
        super().__init__(message, code, 403, details)


class NotFoundException(AppException):
    """404 - 资源不存在。"""
    
    def __init__(self, message: str = "资源不存在", code: str = "NOT_FOUND", details: Optional[Any] = None):
        super().__init__(message, code, 404, details)


class ConflictException(AppException):
    """409 - 资源冲突。"""
    
    def __init__(self, message: str = "资源冲突", code: str = "CONFLICT", details: Optional[Any] = None):
        super().__init__(message, code, 409, details)


class ValidationException(AppException):
    """422 - 验证失败。"""
    
    def __init__(self, message: str = "验证失败", code: str = "VALIDATION_ERROR", details: Optional[Any] = None):
        super().__init__(message, code, 422, details)


class BlockchainException(AppException):
    """500 - 区块链交互错误。"""
    
    def __init__(self, message: str = "区块链交互失败", code: str = "BLOCKCHAIN_ERROR", details: Optional[Any] = None):
        super().__init__(message, code, 500, details)
