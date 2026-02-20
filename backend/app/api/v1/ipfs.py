from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
import logging
from typing import Optional

from app.services.pinata_service import get_pinata_service, PinataUploadError, PinataFileTooLargeError

router = APIRouter(prefix="/ipfs", tags=["IPFS"])

logger = logging.getLogger(__name__)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".pdf",
    ".txt",
    ".json",
    ".mp4",
    ".mp3",
}

# 最大文件大小 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024


def get_file_extension(filename: str) -> str:
    """获取文件扩展名。"""
    return "." + filename.split(".")[-1].lower() if "." in filename else ""


@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    name: Optional[str] = None,
):
    """
    上传文件到 IPFS (Pinata)。
    
    参数：
        file: 要上传的文件
        name: 可选的自定义文件名
        
    返回：
        包含 CID、网关 URL 等信息的字典
    """
    try:
        # 读取文件内容
        content = await file.read()
        
        # 检查文件大小
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"文件大小超过限制（最大 {MAX_FILE_SIZE // 1024 // 1024}MB）"
            )
        
        # 检查文件扩展名
        filename = file.filename or "unnamed"
        ext = get_file_extension(filename)
        
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"不支持的文件类型: {ext}。支持的类型: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # 确定文件名
        file_name = name or filename
        
        # 准备元数据
        metadata = {
            "name": file_name,
            "originalName": filename,
            "contentType": file.content_type or "application/octet-stream"
        }
        
        # 上传到 Pinata
        pinata_service = get_pinata_service()
        result = pinata_service.upload_file(content, file_name, metadata)
        
        return {
            "success": True,
            "data": result,
            "message": "文件上传成功"
        }
        
    except PinataFileTooLargeError as e:
        logger.error(f"文件过大: {e}")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(e)
        )
    except PinataUploadError as e:
        logger.error(f"上传到 Pinata 失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传失败: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传文件时发生错误: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传失败: {str(e)}"
        )


@router.post("/upload/json", response_model=dict)
async def upload_json(
    data: dict,
    name: str = "data.json"
):
    """
    上传 JSON 数据到 IPFS。
    
    参数：
        data: JSON 数据对象
        name: 文件名（默认为 data.json）
        
    返回：
        包含 CID、网关 URL 等信息的字典
    """
    try:
        pinata_service = get_pinata_service()
        result = pinata_service.upload_json(data, name)
        
        return {
            "success": True,
            "data": result,
            "message": "JSON 上传成功"
        }
        
    except PinataUploadError as e:
        logger.error(f"上传 JSON 到 Pinata 失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传失败: {str(e)}"
        )
    except Exception as e:
        logger.error(f"上传 JSON 时发生错误: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传失败: {str(e)}"
        )


@router.delete("/delete/{cid}", response_model=dict)
async def delete_file(cid: str):
    """
    从 Pinata 删除文件（取消固定）。
    
    参数：
        cid: 要删除的 CID
        
    返回：
        删除结果
    """
    try:
        pinata_service = get_pinata_service()
        success = pinata_service.delete_file(cid)
        
        if success:
            return {
                "success": True,
                "message": f"CID {cid} 已成功删除"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="删除失败"
            )
            
    except Exception as e:
        logger.error(f"删除 CID {cid} 时发生错误: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除失败: {str(e)}"
        )


@router.get("/gateway/{cid}")
async def get_gateway_url(cid: str):
    """
    获取文件的网关访问 URL。
    
    参数：
        cid: IPFS CID
        
    返回：
        网关 URL
    """
    try:
        pinata_service = get_pinata_service()
        url = pinata_service.get_gateway_url(cid)
        
        return {
            "success": True,
            "data": {
                "cid": cid,
                "gateway_url": url
            }
        }
        
    except Exception as e:
        logger.error(f"获取网关 URL 时发生错误: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取失败: {str(e)}"
        )
