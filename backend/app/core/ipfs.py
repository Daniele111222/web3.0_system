"""IPFS 客户端配置和工具函数。"""
import ipfshttpclient
from typing import Optional, BinaryIO
import hashlib
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class IPFSClient:
    """
    IPFS 客户端封装类。
    
    提供文件上传、下载和 CID 验证功能。
    """
    
    def __init__(self, ipfs_url: Optional[str] = None):
        """
        初始化 IPFS 客户端。
        
        Args:
            ipfs_url: IPFS 节点 URL，默认使用配置中的值
        """
        self.ipfs_url = ipfs_url or settings.IPFS_API_URL
        self._client: Optional[ipfshttpclient.Client] = None
    
    def _get_client(self) -> ipfshttpclient.Client:
        """
        获取或创建 IPFS 客户端实例。
        
        Returns:
            ipfshttpclient.Client: IPFS 客户端实例
            
        Raises:
            ConnectionError: 无法连接到 IPFS 节点
        """
        if self._client is None:
            try:
                self._client = ipfshttpclient.connect(self.ipfs_url)
                logger.info(f"Connected to IPFS node at {self.ipfs_url}")
            except Exception as e:
                logger.error(f"Failed to connect to IPFS node: {e}")
                raise ConnectionError(f"Cannot connect to IPFS node at {self.ipfs_url}") from e
        return self._client
    
    def upload_file(self, file_content: bytes, file_name: str) -> str:
        """
        上传文件到 IPFS。
        
        Args:
            file_content: 文件内容（字节）
            file_name: 文件名（用于日志）
            
        Returns:
            str: IPFS CID（内容标识符）
            
        Raises:
            Exception: 上传失败
        """
        try:
            client = self._get_client()
            result = client.add_bytes(file_content)
            cid = result
            logger.info(f"Uploaded file '{file_name}' to IPFS with CID: {cid}")
            return cid
        except Exception as e:
            logger.error(f"Failed to upload file '{file_name}' to IPFS: {e}")
            raise Exception(f"IPFS upload failed: {str(e)}") from e
    
    def upload_json(self, json_data: dict) -> str:
        """
        上传 JSON 数据到 IPFS。
        
        Args:
            json_data: JSON 数据（字典）
            
        Returns:
            str: IPFS CID（内容标识符）
            
        Raises:
            Exception: 上传失败
        """
        try:
            import json
            json_bytes = json.dumps(json_data, ensure_ascii=False).encode('utf-8')
            client = self._get_client()
            result = client.add_bytes(json_bytes)
            cid = result
            logger.info(f"Uploaded JSON data to IPFS with CID: {cid}")
            return cid
        except Exception as e:
            logger.error(f"Failed to upload JSON to IPFS: {e}")
            raise Exception(f"IPFS JSON upload failed: {str(e)}") from e
    
    def get_file(self, cid: str) -> bytes:
        """
        从 IPFS 下载文件。
        
        Args:
            cid: IPFS CID（内容标识符）
            
        Returns:
            bytes: 文件内容
            
        Raises:
            Exception: 下载失败
        """
        try:
            client = self._get_client()
            content = client.cat(cid)
            logger.info(f"Downloaded file from IPFS with CID: {cid}")
            return content
        except Exception as e:
            logger.error(f"Failed to download file from IPFS (CID: {cid}): {e}")
            raise Exception(f"IPFS download failed: {str(e)}") from e
    
    def verify_cid(self, cid: str, file_content: bytes) -> bool:
        """
        验证 CID 是否与文件内容匹配。
        
        通过重新上传文件并比较 CID 来验证。
        
        Args:
            cid: 待验证的 IPFS CID
            file_content: 文件内容（字节）
            
        Returns:
            bool: CID 是否有效
        """
        try:
            # 重新计算 CID
            client = self._get_client()
            result = client.add_bytes(file_content, only_hash=True)
            computed_cid = result
            
            is_valid = computed_cid == cid
            if is_valid:
                logger.info(f"CID verification successful: {cid}")
            else:
                logger.warning(f"CID verification failed: expected {cid}, got {computed_cid}")
            
            return is_valid
        except Exception as e:
            logger.error(f"Failed to verify CID {cid}: {e}")
            return False
    
    def pin_file(self, cid: str) -> bool:
        """
        固定文件到 IPFS 节点（防止垃圾回收）。
        
        Args:
            cid: IPFS CID
            
        Returns:
            bool: 是否成功固定
        """
        try:
            client = self._get_client()
            client.pin.add(cid)
            logger.info(f"Pinned file with CID: {cid}")
            return True
        except Exception as e:
            logger.error(f"Failed to pin file (CID: {cid}): {e}")
            return False
    
    def unpin_file(self, cid: str) -> bool:
        """
        取消固定文件。
        
        Args:
            cid: IPFS CID
            
        Returns:
            bool: 是否成功取消固定
        """
        try:
            client = self._get_client()
            client.pin.rm(cid)
            logger.info(f"Unpinned file with CID: {cid}")
            return True
        except Exception as e:
            logger.error(f"Failed to unpin file (CID: {cid}): {e}")
            return False
    
    def close(self):
        """关闭 IPFS 客户端连接。"""
        if self._client is not None:
            try:
                self._client.close()
                logger.info("Closed IPFS client connection")
            except Exception as e:
                logger.error(f"Error closing IPFS client: {e}")
            finally:
                self._client = None


# 全局 IPFS 客户端实例
_ipfs_client: Optional[IPFSClient] = None


def get_ipfs_client() -> IPFSClient:
    """
    获取全局 IPFS 客户端实例。
    
    Returns:
        IPFSClient: IPFS 客户端实例
    """
    global _ipfs_client
    if _ipfs_client is None:
        _ipfs_client = IPFSClient()
    return _ipfs_client


def close_ipfs_client():
    """关闭全局 IPFS 客户端。"""
    global _ipfs_client
    if _ipfs_client is not None:
        _ipfs_client.close()
        _ipfs_client = None
