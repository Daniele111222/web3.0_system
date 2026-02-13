"""通用的 API 响应模型。"""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """
    统一的 API 响应格式。
    
    所有接口都应返回此格式的响应，以便前端统一处理。
    """
    
    success: bool = Field(default=True, description="请求是否成功")
    message: str = Field(default="操作成功", description="响应消息")
    code: str = Field(default="SUCCESS", description="业务状态码")
    data: Optional[T] = Field(default=None, description="响应数据")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "操作成功",
                "code": "SUCCESS",
                "data": {}
            }
        }


class ApiError(BaseModel):
    """
    统一的 API 错误响应格式。
    """
    
    success: bool = Field(default=False, description="请求是否成功")
    message: str = Field(..., description="错误消息")
    code: str = Field(..., description="错误代码")
    data: Optional[Any] = Field(default=None, description="数据")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "用户名或密码错误",
                "code": "INVALID_CREDENTIALS",
                "data": None
            }
        }


class PageResult(BaseModel, Generic[T]):
    """
    分页响应结果。
    """
    
    items: List[T] = Field(default_factory=list, description="数据列表")
    total: int = Field(default=0, description="总记录数")
    page: int = Field(default=1, description="当前页码")
    page_size: int = Field(default=20, description="每页数量")
    total_pages: int = Field(default=0, description="总页数")
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """简化的消息响应（用于兼容旧代码）。"""
    
    message: str = Field(..., description="响应消息")
    success: bool = Field(default=True, description="操作成功状态")
