"""用于 Web3 交互的区块链客户端。"""
import logging
import json
from typing import Optional, Dict, Any
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.contract import Contract
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
        self.contract_address = settings.CONTRACT_ADDRESS
        self.chain_id: Optional[int] = None
        self.deployer_address = settings.DEPLOYER_ADDRESS
        self._deployer_account: Optional[Account] = None
        self._contract_abi: Optional[list] = None
        self._contract_bytecode: Optional[str] = None
        self._connect()
        self._load_contract_info()
    
    def _load_contract_info(self) -> None:
        """加载合约ABI和字节码"""
        try:
            import os
            
            # Get project root (parent of backend directory)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # From app/core go up to backend, then to project root
            project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
            
            # Path: project_root/contracts/artifacts/contracts/IPNFT.sol/IPNFT.json
            artifacts_path = os.path.join(
                project_root, "contracts", "artifacts", 
                "contracts", "IPNFT.sol", "IPNFT.json"
            )
            
            if os.path.exists(artifacts_path):
                with open(artifacts_path, 'r') as f:
                    artifact = json.load(f)
                    self._contract_abi = artifact.get('abi')
                    self._contract_bytecode = artifact.get('bytecode')
                    logger.info(f"Contract ABI and bytecode loaded from {artifacts_path}")
            else:
                logger.warning(f"Contract artifact not found at {artifacts_path}")
        except Exception as e:
            logger.warning(f"Failed to load contract info: {e}")
    
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
            self.chain_id = self.w3.eth.chain_id
            return self.w3.eth.block_number
        except Exception as e:
            logger.error(f"获取区块号失败：{e}")
            raise BlockchainConnectionError(
                f"获取区块号失败：{str(e)}"
            ) from e
    
    async def mint_nft(self, to_address: str, metadata_uri: str) -> tuple:
        """
        铸造 NFT。
        
        参数：
            to_address: 接收 NFT 的地址
            metadata_uri: NFT 元数据 URI
            
        返回：
            tuple: (token_id, tx_hash)
            
        抛出：
            BlockchainConnectionError: 如果连接失败或合约未部署
        """
        if not self.contract_address:
            raise BlockchainConnectionError(
                "NFT 合约未部署。请先部署合约并设置 CONTRACT_ADDRESS"
            )
        
        try:
            checksum_to = self.w3.to_checksum_address(to_address)
            logger.info(f"Minting NFT to {checksum_to} with metadata {metadata_uri}")
            
            contract = self._get_contract()
            
            tx_hash = contract.functions.mint(checksum_to, metadata_uri).transact({
                'from': self.deployer_address
            })
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            token_id = 0
            if receipt.get('logs'):
                for log in receipt['logs']:
                    if len(log.get('topics', [])) > 0:
                        try:
                            token_id = int(log['topics'][3].hex(), 16)
                            break
                        except:
                            pass
            
            return token_id, tx_hash.hex()
        except Exception as e:
            logger.error(f"NFT 铸造失败：{e}")
            raise BlockchainConnectionError(f"NFT 铸造失败：{str(e)}")
    
    def _get_deployer_account(self) -> Account:
        """获取部署者账户"""
        if self._deployer_account is not None:
            return self._deployer_account
        
        if not settings.DEPLOYER_PRIVATE_KEY:
            raise BlockchainConnectionError(
                "DEPLOYER_PRIVATE_KEY 未配置。请设置私钥后再进行部署。"
            )
        
        try:
            self._deployer_account = Account.from_key(settings.DEPLOYER_PRIVATE_KEY)
            return self._deployer_account
        except Exception as e:
            raise BlockchainConnectionError(f"无效的私钥：{str(e)}")
    
    def _get_contract(self) -> Contract:
        """获取合约实例"""
        if not self.contract_address:
            raise BlockchainConnectionError(
                "NFT 合约未部署。请先部署合约并设置 CONTRACT_ADDRESS"
            )
        
        if not self._contract_abi:
            raise BlockchainConnectionError("合约ABI未加载")
        
        return self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.contract_address),
            abi=self._contract_abi
        )
    
    async def transfer_nft(
        self,
        from_address: str,
        to_address: str,
        token_id: int,
        reason: str = "",
    ) -> str:
        """调用合约 transferNFT 执行链上转移。

        使用合约自定义的 transferNFT 函数（带 reason 参数），
        由 deployer 账户作为 operator 发送交易。

        Args:
            from_address: 当前持有者地址
            to_address: 接收方地址
            token_id: NFT Token ID
            reason: 转移原因（写入链上事件日志）

        Returns:
            交易哈希字符串

        Raises:
            BlockchainConnectionError: 合约调用失败
        """
        if not self.contract_address:
            raise BlockchainConnectionError("NFT 合约未部署，请先设置 CONTRACT_ADDRESS")

        try:
            checksum_from = self.w3.to_checksum_address(from_address)
            checksum_to = self.w3.to_checksum_address(to_address)
            contract = self._get_contract()

            tx_hash = contract.functions.transferNFT(
                checksum_from,
                checksum_to,
                token_id,
                reason,
            ).transact({'from': self.deployer_address})

            self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(
                f"NFT #{token_id} transferred: {from_address} -> {to_address}, tx={tx_hash.hex()}"
            )
            return tx_hash.hex()

        except Exception as e:
            logger.error(f"NFT 转移失败: {e}")
            raise BlockchainConnectionError(f"NFT 转移失败: {str(e)}")

    def deploy_contract(self) -> Dict[str, Any]:
        """
        部署 NFT 智能合约。
        
        返回：
            dict: 包含合约地址、交易哈希等信息的字典
            
        抛出：
            BlockchainConnectionError: 如果部署失败
        """
        if not self._contract_abi or not self._contract_bytecode:
            raise BlockchainConnectionError(
                "合约ABI或字节码未加载。请确保contracts目录存在且已编译。"
            )
        
        try:
            account = self._get_deployer_account()
            logger.info(f"Deploying contract from address: {account.address}")
            
            contract = self.w3.eth.contract(
                abi=self._contract_abi,
                bytecode=self._contract_bytecode
            )
            
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            tx = contract.constructor().build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 3000000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id,
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            logger.info(f"Transaction sent: {tx_hash.hex()}")
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                deployed_address = receipt.get('contractAddress') or receipt.get('contract_address')
                self.contract_address = deployed_address
                logger.info(f"Contract deployed successfully at: {self.contract_address}")
                
                return {
                    "success": True,
                    "contract_address": deployed_address,
                    "transaction_hash": tx_hash.hex(),
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                }
            else:
                raise BlockchainConnectionError("合约部署交易失败")
                
        except Exception as e:
            logger.error(f"合约部署失败：{e}")
            raise BlockchainConnectionError(f"合约部署失败：{str(e)}")
    
    def get_contract_info(self) -> Dict[str, Any]:
        """
        获取合约信息。
        
        返回：
            dict: 包含合约地址、部署者地址等信息的字典
        """
        return {
            "contract_address": self.contract_address,
            "deployer_address": self.deployer_address,
            "chain_id": self.chain_id,
            "is_connected": self.is_connected(),
            "has_contract": bool(self.contract_address),
            "has_abi": bool(self._contract_abi),
        }
    
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
