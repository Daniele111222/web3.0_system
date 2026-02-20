"""Pinata IPFS 服务封装类。"""
import json
import logging
import time
from typing import Optional, Union
from functools import wraps

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


# 常量
MAX_FILE_SIZE = 50 * 1024 * 1024  # 最大文件大小 50MB
DEFAULT_TIMEOUT = 60  # 默认超时时间 60 秒
MAX_RETRIES = 3
RETRY_DELAY = 1  # 秒

PINATA_API_URL = "https://api.pinata.cloud"
PINATA_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"


class PinataError(Exception):
    """Pinata API 错误基类。"""
    pass


class PinataUploadError(PinataError):
    """上传文件到 Pinata 失败。"""
    pass


class PinataDeleteError(PinataError):
    """从 Pinata 删除文件失败。"""
    pass


class PinataFileTooLargeError(PinataError):
    """文件超过最大大小限制。"""
    pass


def retry_on_error(max_retries: int = MAX_RETRIES, delay: float = RETRY_DELAY):
    """在指定异常时重试函数的装饰器。"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (requests.RequestException, PinataError) as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        wait_time = delay * (2 ** attempt)
                        logger.warning(
                            f"{func.__name__} 失败（第 {attempt + 1}/{max_retries} 次尝试），"
                            f"{wait_time}秒后重试：{e}"
                        )
                        time.sleep(wait_time)
                    else:
                        logger.error(
                            f"{func.__name__} 在 {max_retries} 次尝试后失败：{e}"
                        )
            raise last_exception
        return wrapper
    return decorator


class PinataService:
    """Pinata IPFS 服务类。"""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        jwt_token: Optional[str] = None,
        max_file_size: int = MAX_FILE_SIZE,
        timeout: int = DEFAULT_TIMEOUT
    ):
        """
        初始化 Pinata 服务。
        
        参数：
            api_key: Pinata API Key
            api_secret: Pinata API Secret (旧版 API Key)
            jwt_token: Pinata JWT Token (新版推荐)
            max_file_size: 最大文件大小（字节）
            timeout: 请求超时时间（秒）
        """
        self.api_key = api_key or settings.PINATA_API_KEY or None
        self.api_secret = api_secret or settings.PINATA_API_SECRET or None
        self.jwt_token = jwt_token or settings.PINATA_JWT_TOKEN or None
        self.max_file_size = max_file_size
        self.timeout = timeout
        
        if not self.jwt_token and not (self.api_key and self.api_secret):
            logger.warning("未配置 Pinata 凭证，部分功能可能无法使用")
    
    def _get_headers(self) -> dict:
        """获取请求头。"""
        if self.jwt_token:
            return {
                "Authorization": f"Bearer {self.jwt_token}",
                "Accept": "application/json"
            }
        elif self.api_key and self.api_secret:
            return {
                "pinata_api_key": self.api_key,
                "pinata_secret_api_key": self.api_secret,
                "Accept": "application/json"
            }
        else:
            raise PinataError("未配置 Pinata 凭证")
    
    def _check_file_size(self, file_content: bytes) -> None:
        """检查文件大小是否超过限制。"""
        file_size = len(file_content)
        if file_size > self.max_file_size:
            raise PinataFileTooLargeError(
                f"文件大小（{file_size} 字节）超过最大允许大小（{self.max_file_size} 字节）"
            )
    
    def _build_url(self, endpoint: str) -> str:
        """构建完整 URL。"""
        return f"{PINATA_API_URL}{endpoint}"
    
    @retry_on_error()
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        上传文件到 Pinata。
        
        参数：
            file_content: 文件内容字节
            file_name: 文件名
            metadata: 可选的元数据
            
        返回：
            dict: 上传结果，包含 CID 等信息
            
        抛出：
            PinataFileTooLargeError: 文件过大
            PinataUploadError: 上传失败
        """
        self._check_file_size(file_content)
        
        try:
            url = self._build_url("/pinning/pinFileToIPFS")
            
            files = {
                "file": (file_name, file_content)
            }
            
            data = {}
            if metadata:
                data["pinataMetadata"] = json.dumps(metadata)
            
            response = requests.post(
                url,
                headers=self._get_headers(),
                files=files,
                data=data,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(
                f"已上传文件 '{file_name}'（{len(file_content)} 字节）到 Pinata，"
                f"CID：{result.get('IpfsHash')}"
            )
            
            return {
                "cid": result.get("IpfsHash"),
                "size": result.get("PinSize"),
                "timestamp": result.get("Timestamp"),
                "gateway_url": f"{PINATA_IPFS_GATEWAY}/{result.get('IpfsHash')}",
                "name": file_name
            }
            
        except PinataFileTooLargeError:
            raise
        except requests.RequestException as e:
            logger.error(f"上传文件到 Pinata 失败：{e}")
            raise PinataUploadError(f"上传失败：{str(e)}") from e
        except Exception as e:
            logger.error(f"上传文件到 Pinata 时发生错误：{e}")
            raise PinataUploadError(f"上传失败：{str(e)}") from e
    
    @retry_on_error()
    def upload_json(
        self,
        json_data: dict,
        name: str = "data.json",
        metadata: Optional[dict] = None
    ) -> dict:
        """
        上传 JSON 数据到 Pinata。
        
        参数：
            json_data: JSON 数据字典
            name: 文件名
            metadata: 可选的元数据
            
        返回：
            dict: 上传结果
        """
        try:
            json_bytes = json.dumps(json_data, ensure_ascii=False).encode("utf-8")
            return self.upload_file(json_bytes, name, metadata)
        except PinataUploadError:
            raise
        except Exception as e:
            logger.error(f"上传 JSON 到 Pinata 失败：{e}")
            raise PinataUploadError(f"JSON 上传失败：{str(e)}") from e
    
    @retry_on_error()
    def delete_file(self, cid: str) -> bool:
        """
        从 Pinata 删除文件（取消固定）。
        
        参数：
            cid: 要删除的 CID
            
        返回：
            bool: 是否成功删除
        """
        if not cid:
            logger.warning("无法删除空的 CID")
            return False
        
        try:
            url = self._build_url(f"/pinning/unpin/{cid}")
            
            response = requests.delete(
                url,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            if response.status_code == 200 or response.status_code == 404:
                # 404 表示文件已经不存在（或未固定）
                logger.info(f"已从 Pinata 删除 CID：{cid}")
                return True
            else:
                response.raise_for_status()
                
        except requests.RequestException as e:
            logger.error(f"从 Pinata 删除 CID 失败：{e}")
            raise PinataDeleteError(f"删除失败：{str(e)}") from e
        
        return False
    
    def get_gateway_url(self, cid: str) -> str:
        """
        获取文件的网关访问 URL。
        
        参数：
            cid: IPFS CID
            
        返回：
            str: 网关 URL
        """
        return f"{PINATA_IPFS_GATEWAY}/{cid}"


# 全局 Pinata 服务实例
_pinata_service: Optional[PinataService] = None


def get_pinata_service() -> PinataService:
    """
    获取全局 Pinata 服务实例。
    
    返回：
        PinataService: Pinata 服务实例
    """
    global _pinata_service
    if _pinata_service is None:
        _pinata_service = PinataService()
    return _pinata_service
