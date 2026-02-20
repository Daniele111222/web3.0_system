"""合约部署服务模块。

提供智能合约的部署和管理功能。
"""
import logging
from typing import Dict, Any, Optional

from app.core.blockchain import get_blockchain_client, BlockchainConnectionError
from app.core.config import settings

logger = logging.getLogger(__name__)


class ContractDeploymentService:
    """合约部署服务类。"""
    
    @staticmethod
    def deploy_contract() -> Dict[str, Any]:
        """
        部署 IP-NFT 智能合约。

        返回：
            包含部署结果的字典

        Raises:
            BlockchainConnectionError: 部署失败
        """
        try:
            client = get_blockchain_client()
            result = client.deploy_contract()
            
            logger.info(
                f"Contract deployed successfully: {result.get('contract_address')}"
            )
            
            return {
                "success": True,
                "message": "Contract deployed successfully",
                "data": result,
            }
            
        except BlockchainConnectionError as e:
            logger.error(f"Contract deployment failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during deployment: {e}")
            raise BlockchainConnectionError(f"部署失败: {str(e)}")
    
    @staticmethod
    def get_contract_info() -> Dict[str, Any]:
        """
        获取合约信息。

        返回：
            包含合约信息的字典
        """
        try:
            client = get_blockchain_client()
            info = client.get_contract_info()
            
            return {
                "success": True,
                "message": "Contract info retrieved",
                "data": info,
            }
            
        except Exception as e:
            logger.error(f"Failed to get contract info: {e}")
            return {
                "success": False,
                "message": f"Failed to get contract info: {str(e)}",
                "data": None,
            }
    
    @staticmethod
    def update_contract_address(contract_address: str) -> Dict[str, Any]:
        """
        更新合约地址配置。

        Args:
            contract_address: 新的合约地址

        Returns：
            更新结果
        """
        try:
            client = get_blockchain_client()
            
            if not client.is_valid_address(contract_address):
                raise ValueError(f"Invalid contract address: {contract_address}")
            
            client.contract_address = contract_address
            
            logger.info(f"Contract address updated to: {contract_address}")
            
            return {
                "success": True,
                "message": "Contract address updated",
                "data": {
                    "contract_address": contract_address,
                },
            }
            
        except Exception as e:
            logger.error(f"Failed to update contract address: {e}")
            return {
                "success": False,
                "message": str(e),
                "data": None,
            }
    
    @staticmethod
    def check_deployment_ready() -> Dict[str, Any]:
        """
        检查是否可以进行合约部署。

        返回：
            检查结果
        """
        issues = []
        warnings = []
        
        if not settings.DEPLOYER_PRIVATE_KEY:
            issues.append("DEPLOYER_PRIVATE_KEY is not configured")
        else:
            warnings.append("DEPLOYER_PRIVATE_KEY is configured")
        
        if not settings.DEPLOYER_ADDRESS:
            warnings.append("DEPLOYER_ADDRESS is not configured (will be derived from private key)")
        
        client = get_blockchain_client()
        if not client.is_connected():
            issues.append("Blockchain node is not connected")
        
        if not client._contract_abi or not client._contract_bytecode:
            issues.append("Contract artifacts not loaded (ABI or bytecode missing)")
        
        return {
            "ready": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "can_mint": bool(client.contract_address and client._contract_abi),
        }
