"""全局异常处理器。"""
import logging
from typing import Union
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.core.exceptions import AppException
from app.schemas.response import ApiError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """注册全局异常处理器。"""
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """处理自定义应用异常。"""
        logger.warning(f"业务异常: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiError(
                success=False,
                message=exc.message,
                code=exc.code,
                data=exc.details,
            ).model_dump(),
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """处理请求验证错误。"""
        errors = exc.errors()
        error_messages = []
        for error in errors:
            field = ".".join(str(loc) for loc in error["loc"])
            error_messages.append(f"{field}: {error['msg']}")
        
        logger.warning(f"验证错误: {error_messages}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ApiError(
                success=False,
                message="请求参数验证失败",
                code="VALIDATION_ERROR",
                data=errors,
            ).model_dump(),
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        """处理数据库异常。"""
        logger.error(f"数据库异常: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiError(
                success=False,
                message="数据库操作失败，请稍后重试",
                code="DATABASE_ERROR",
                data=None,
            ).model_dump(),
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """处理所有未捕获的异常。"""
        exc_type = type(exc).__name__
        error_msg = str(exc)
        
        logger.error(f"未处理的异常: {exc_type} - {error_msg}")
        
        user_message = "服务器内部错误，请稍后重试"
        error_code = "INTERNAL_ERROR"
        
        if isinstance(exc, (NameError, TypeError, AttributeError, SyntaxError, IndentationError)):
            user_message = "服务器处理请求时发生错误，请联系管理员"
            error_code = f"SERVER_ERROR_{exc_type}"
        elif isinstance(exc, ValueError):
            user_message = "请求数据格式不正确"
            error_code = "VALUE_ERROR"
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiError(
                success=False,
                message=user_message,
                code=error_code,
                data=None,
            ).model_dump(),
        )
