"""带有重试和线程安全功能的 IPFS 客户端配置和工具。"""
import json
import threading
import time
from functools import wraps
from typing import Optional, Callable, Any

import ipfshttpclient
from ipfshttpclient.exceptions import Error as IPFSError

from app.core.config import settings


# 配置日志
import logging
logger = logging.getLogger(__name__)


# 常量
MAX_FILE_SIZE = 50 * 1024 * 1024  # 最大文件大小 50MB
DEFAULT_TIMEOUT = 60  # 默认超时时间 60 秒
MAX_RETRIES = 3
RETRY_DELAY = 1  # 秒


class IPFSConnectionError(Exception):
    """当 IPFS 连接失败时抛出。"""
    pass


class IPFSUploadError(Exception):
    """当 IPFS 上传失败时抛出。"""
    pass


class IPFSDownloadError(Exception):
    """当 IPFS 下载失败时抛出。"""
    pass


class IPFSFileTooLargeError(Exception):
    """当文件超过大小限制时抛出。"""
    pass


def retry_on_error(
    max_retries: int = MAX_RETRIES,
    delay: float = RETRY_DELAY,
    exceptions: tuple = (Exception,)
) -> Callable:
    """在指定异常时重试函数的装饰器。"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        wait_time = delay * (2 ** attempt)  # 指数退避
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


class IPFSClient:
    """带有重试逻辑和大小限制的线程安全 IPFS 客户端包装器。"""
    
    def __init__(
        self,
        ipfs_url: Optional[str] = None,
        max_file_size: int = MAX_FILE_SIZE,
        timeout: int = DEFAULT_TIMEOUT
    ):
        """
        初始化 IPFS 客户端。
        
        参数：
            ipfs_url: IPFS 节点 URL，默认为配置值
            max_file_size: 最大文件大小（字节），默认 50MB
            timeout: 连接超时时间（秒）
        """
        self.ipfs_url = ipfs_url or settings.IPFS_API_URL
        self.max_file_size = max_file_size
        self.timeout = timeout
        self._client: Optional[ipfshttpclient.Client] = None
        self._lock = threading.Lock()
        self._connection_attempts = 0
        self._max_connection_attempts = 3
    
    def _get_client(self) -> ipfshttpclient.Client:
        """
        获取或创建线程安全的 IPFS 客户端实例。
        
        返回：
            ipfshttpclient.Client: IPFS 客户端实例
            
        抛出：
            IPFSConnectionError: 如果连接在重试后失败
        """
        with self._lock:
            if self._client is None:
                try:
                    self._client = ipfshttpclient.connect(
                        self.ipfs_url,
                        timeout=self.timeout
                    )
                    self._connection_attempts = 0
                    logger.info(f"已连接到 IPFS 节点：{self.ipfs_url}")
                except Exception as e:
                    self._connection_attempts += 1
                    logger.error(
                        f"连接 IPFS 节点失败"
                        f"（第 {self._connection_attempts} 次尝试）：{e}"
                    )
                    if self._connection_attempts >= self._max_connection_attempts:
                        raise IPFSConnectionError(
                            f"在 {self._max_connection_attempts} 次尝试后仍无法连接到 IPFS 节点："
                            f"{self.ipfs_url}"
                        ) from e
                    raise IPFSConnectionError(
                        f"无法连接到 IPFS 节点：{str(e)}"
                    ) from e
            return self._client
    
    def _check_file_size(self, file_content: bytes) -> None:
        """
        检查文件大小是否在限制范围内。
        
        参数：
            file_content: 文件内容字节
            
        抛出：
            IPFSFileTooLargeError: 如果文件超过最大大小
        """
        file_size = len(file_content)
        if file_size > self.max_file_size:
            raise IPFSFileTooLargeError(
                f"文件大小（{file_size} 字节）超过最大"
                f"允许大小（{self.max_file_size} 字节）"
            )
    
    @retry_on_error(
        max_retries=MAX_RETRIES,
        exceptions=(IPFSConnectionError, IPFSError, ConnectionError)
    )
    def upload_file(self, file_content: bytes, file_name: str) -> str:
        """
        使用重试逻辑和大小验证上传文件到 IPFS。
        
        参数：
            file_content: 文件内容字节
            file_name: 用于日志记录的文件名
            
        返回：
            str: IPFS CID
            
        抛出：
            IPFSFileTooLargeError: 如果文件超过大小限制
            IPFSUploadError: 如果上传失败
        """
        # 验证文件大小
        self._check_file_size(file_content)
        
        try:
            client = self._get_client()
            result = client.add_bytes(file_content)
            cid: str = result
            logger.info(
                f"已上传文件 '{file_name}'（{len(file_content)} 字节）"
                f"到 IPFS，CID：{cid}"
            )
            return cid
        except IPFSFileTooLargeError:
            raise
        except Exception as e:
            logger.error(f"上传文件 '{file_name}' 到 IPFS 失败：{e}")
            # 出错时重置客户端以强制重新连接
            self._client = None
            raise IPFSUploadError(f"IPFS 上传失败：{str(e)}") from e
    
    @retry_on_error(
        max_retries=MAX_RETRIES,
        exceptions=(IPFSConnectionError, IPFSError, ConnectionError)
    )
    def upload_json(self, json_data: dict) -> str:
        """
        上传 JSON 数据到 IPFS。
        
        参数：
            json_data: JSON 数据字典
            
        返回：
            str: IPFS CID
            
        抛出：
            IPFSUploadError: 如果上传失败
        """
        try:
            json_bytes = json.dumps(json_data, ensure_ascii=False).encode('utf-8')
            return self.upload_file(json_bytes, "json_data")
        except IPFSUploadError:
            raise
        except Exception as e:
            logger.error(f"序列化或上传 JSON 到 IPFS 失败：{e}")
            raise IPFSUploadError(f"IPFS JSON 上传失败：{str(e)}") from e
    
    @retry_on_error(
        max_retries=MAX_RETRIES,
        exceptions=(IPFSConnectionError, IPFSError, ConnectionError)
    )
    def get_file(self, cid: str) -> bytes:
        """
        从 IPFS 下载文件。
        
        参数：
            cid: IPFS CID
            
        返回：
            bytes: 文件内容
            
        抛出：
            IPFSDownloadError: 如果下载失败
        """
        if not cid or not isinstance(cid, str):
            raise ValueError("提供的 CID 无效")
        
        try:
            client = self._get_client()
            content: bytes = client.cat(cid)
            logger.info(f"已从 IPFS 下载 {len(content)} 字节（CID：{cid}）")
            return content
        except Exception as e:
            logger.error(f"从 IPFS 下载文件失败（CID：{cid}）：{e}")
            # 出错时重置客户端
            self._client = None
            raise IPFSDownloadError(f"IPFS 下载失败：{str(e)}") from e
    
    def verify_cid(self, cid: str, file_content: bytes) -> bool:
        """
        验证 CID 是否与文件内容匹配。
        
        参数：
            cid: 要验证的 IPFS CID
            file_content: 文件内容字节
            
        返回：
            bool: 如果 CID 有效则为 True
        """
        if not cid or not file_content:
            return False
        
        try:
            client = self._get_client()
            result = client.add_bytes(file_content, only_hash=True)
            computed_cid: str = result
            
            is_valid = computed_cid == cid
            if is_valid:
                logger.info(f"CID 验证成功：{cid}")
            else:
                logger.warning(
                    f"CID 验证失败：预期 {cid}，实际得到 {computed_cid}"
                )
            
            return is_valid
        except Exception as e:
            logger.error(f"验证 CID {cid} 失败：{e}")
            return False
    
    @retry_on_error(
        max_retries=MAX_RETRIES,
        exceptions=(IPFSConnectionError, IPFSError)
    )
    def pin_file(self, cid: str) -> bool:
        """
        固定文件以防止垃圾回收。
        
        参数：
            cid: IPFS CID
            
        返回：
            bool: 如果成功则为 True
        """
        if not cid:
            logger.warning("无法固定空的 CID")
            return False
        
        try:
            client = self._get_client()
            client.pin.add(cid)
            logger.info(f"已固定文件，CID：{cid}")
            return True
        except Exception as e:
            logger.error(f"固定文件失败（CID：{cid}）：{e}")
            return False
    
    @retry_on_error(
        max_retries=MAX_RETRIES,
        exceptions=(IPFSConnectionError, IPFSError)
    )
    def unpin_file(self, cid: str) -> bool:
        """
        取消固定文件。
        
        参数：
            cid: IPFS CID
            
        返回：
            bool: 如果成功则为 True
        """
        if not cid:
            logger.warning("无法取消固定空的 CID")
            return False
        
        try:
            client = self._get_client()
            client.pin.rm(cid)
            logger.info(f"已取消固定文件，CID：{cid}")
            return True
        except Exception as e:
            logger.error(f"取消固定文件失败（CID：{cid}）：{e}")
            return False
    
    def close(self) -> None:
        """以线程安全的方式关闭 IPFS 客户端连接。"""
        with self._lock:
            if self._client is not None:
                try:
                    self._client.close()
                    logger.info("IPFS 客户端连接已关闭")
                except Exception as e:
                    logger.error(f"关闭 IPFS 客户端时出错：{e}")
                finally:
                    self._client = None


# 带有线程安全单例模式的全局 IPFS 客户端实例
_ipfs_client: Optional[IPFSClient] = None
_ipfs_lock = threading.Lock()


def get_ipfs_client(
    max_file_size: int = MAX_FILE_SIZE,
    timeout: int = DEFAULT_TIMEOUT
) -> IPFSClient:
    """
    获取全局线程安全的 IPFS 客户端实例。
    
    参数：
        max_file_size: 最大文件大小（字节）
        timeout: 连接超时时间（秒）
        
    返回：
        IPFSClient: IPFS 客户端实例
    """
    global _ipfs_client
    with _ipfs_lock:
        if _ipfs_client is None:
            _ipfs_client = IPFSClient(
                max_file_size=max_file_size,
                timeout=timeout
            )
        return _ipfs_client


def close_ipfs_client() -> None:
    """以线程安全的方式关闭全局 IPFS 客户端。"""
    global _ipfs_client
    with _ipfs_lock:
        if _ipfs_client is not None:
            _ipfs_client.close()
            _ipfs_client = None
            logger.info("全局 IPFS 客户端已关闭")
