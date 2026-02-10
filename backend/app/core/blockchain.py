"""用于 Web3 交互的区块链客户端。"""
import logging
from typing import Optional
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.exceptions import InvalidAddress, Web3ValidationError
from app.core.config import settings

logger = logging.getLogger(__name__)


class BlockchainConnectionError(Exception):
    """当区块链连接失败时抛出。"""
    pass


class BlockchainClient:
    """带有错误处理和重试逻辑的区块链交互客户端。"""
    
    def __init__(self, provider_url: Optional[str] = None, timeout: int = 30):
        """
        初始化区块链客户端。
        
        参数：
            provider_url: Web3 提供者 URL
            timeout: 请求超时时间（秒）
        """
        self.provider_url = provider_url or settings.WEB3_PROVIDER_URL
        self.timeout = timeout
        self.w3: Optional[Web3] = None
        self._connect()
    
    def _connect(self) -> None:
        """建立与区块链节点的连接。"""
        try:
            self.w3 = Web3(
                Web3.HTTPProvider(
                    self.provider_url,
                    request_kwargs={"timeout": self.timeout}
                )
            )
            
            if not self.is_connected():
                raise BlockchainConnectionError(
                    f"无法连接到区块链：{self.provider_url}"
                )
            
            logger.info(f"已连接到区块链：{self.provider_url}")
        except Exception as e:
            logger.error(f"区块链连接错误：{e}")
            raise BlockchainConnectionError(
                f"无法连接到区块链：{str(e)}"
            ) from e
    
    def is_connected(self) -> bool:
        """检查是否已连接到区块链。"""
        if self.w3 is None:
            return False
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.error(f"检查区块链连接时出错：{e}")
            return False
    
    def get_balance(self, address: str) -> int:
        """
        获取地址的余额（以 wei 为单位）。
        
        参数：
            address: 以太坊地址
            
        返回：
            int: 余额（wei）
            
        抛出：
            InvalidAddress: 如果地址无效
            BlockchainConnectionError: 如果连接失败
        """
        if not self.is_valid_address(address):
            raise InvalidAddress(f"无效地址：{address}")
        
        try:
            checksum_address = self.w3.to_checksum_address(address)
            return self.w3.eth.get_balance(checksum_address)
        except InvalidAddress as e:
            logger.error(f"提供的地址无效：{address}")
            raise
        except Exception as e:
            logger.error(f"获取 {address} 的余额失败：{e}")
            raise BlockchainConnectionError(
                f"获取余额失败：{str(e)}"
            ) from e
    
    def verify_signature(
        self,
        message: str,
        signature: str,
        expected_address: str
    ) -> bool:
        """
        验证消息是否由预期地址签名。
        
        使用 EIP-191 personal_sign 消息格式。
        
        参数：
            message: 被签名的消息
            signature: 签名（十六进制字符串）
            expected_address: 预期的签名者地址
            
        返回：
            bool: 如果签名有效则为 True
        """
        if not self.is_valid_address(expected_address):
            logger.warning(f"预期地址无效：{expected_address}")
            return False
        
        try:
            # 根据 EIP-191 编码消息
            message_encoded = encode_defunct(text=message)
            
            # 从签名恢复地址
            recovered_address = self.w3.eth.account.recover_message(
                message_encoded,
                signature=signature
            )
            
            # 比较地址（不区分大小写）
            is_valid = recovered_address.lower() == expected_address.lower()
            
            if is_valid:
                logger.debug(f"地址签名验证成功：{expected_address}")
            else:
                logger.warning(
                    f"签名不匹配：预期 {expected_address}，"
                    f"实际得到 {recovered_address}"
                )
            
            return is_valid
            
        except Web3ValidationError as e:
            logger.error(f"签名格式无效：{e}")
            return False
        except Exception as e:
            logger.error(f"签名验证失败：{e}")
            return False
    
    def is_valid_address(self, address: str) -> bool:
        """
        检查地址是否为有效的以太坊地址。
        
        参数：
            address: 要验证的地址
            
        返回：
            bool: 如果有效则为 True
        """
        if not address or not isinstance(address, str):
            return False
        
        try:
            # 检查基本格式
            if not Web3.is_address(address):
                return False
            
            # 如果地址是混合大小写，则检查校验和
            if address != address.lower() and address != address.upper():
                return Web3.is_checksum_address(address)
            
            return True
        except Exception as e:
            logger.error(f"地址验证错误：{e}")
            return False
    
    def to_checksum_address(self, address: str) -> str:
        """
        将地址转换为校验和格式。
        
        参数：
            address: 以太坊地址
            
        返回：
            str: 校验和地址
            
        抛出：
            InvalidAddress: 如果地址无效
        """
        if not self.is_valid_address(address):
            raise InvalidAddress(f"无效地址：{address}")
        
        return self.w3.to_checksum_address(address)
    
    def get_block_number(self) -> int:
        """
        获取当前区块号。
        
        返回：
            int: 当前区块号
            
        抛出：
            BlockchainConnectionError: 如果连接失败
        """
        try:
            return self.w3.eth.block_number
        except Exception as e:
            logger.error(f"获取区块号失败：{e}")
            raise BlockchainConnectionError(
                f"获取区块号失败：{str(e)}"
            ) from e
    
    def close(self) -> None:
        """关闭区块链连接并清理资源。"""
        if self.w3 is not None:
            try:
                # Web3 没有显式的关闭方法，但我们可以清理提供者
                if hasattr(self.w3.provider, 'session'):
                    self.w3.provider.session.close()
                logger.info("区块链连接已关闭")
            except Exception as e:
                logger.error(f"关闭区块链连接时出错：{e}")
            finally:
                self.w3 = None


# 全局区块链客户端实例
_blockchain_client: Optional[BlockchainClient] = None


def get_blockchain_client() -> BlockchainClient:
    """
    获取全局区块链客户端实例。
    
    返回：
        BlockchainClient: 区块链客户端实例
    """
    global _blockchain_client
    if _blockchain_client is None:
        _blockchain_client = BlockchainClient()
    return _blockchain_client


def close_blockchain_client() -> None:
    """关闭全局区块链客户端。"""
    global _blockchain_client
    if _blockchain_client is not None:
        _blockchain_client.close()
        _blockchain_client = None
