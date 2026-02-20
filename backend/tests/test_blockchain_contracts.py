"""区块链和合约相关测试。

测试智能合约部署、区块链客户端功能。
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

# 不需要数据库的测试
class TestBlockchainClient:
    """测试区块链客户端"""
    
    def test_client_initialization(self):
        """测试区块链客户端初始化"""
        from app.core.config import settings
        from app.core.blockchain import BlockchainClient
        
        client = BlockchainClient(
            provider_url=settings.WEB3_PROVIDER_URL,
            timeout=30
        )
        
        assert client.provider_url == settings.WEB3_PROVIDER_URL
        assert client.timeout == 30
    
    def test_is_connected(self):
        """测试连接检查"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            client.w3.is_connected = MagicMock(return_value=True)
            
            assert client.is_connected() is True
    
    def test_is_valid_address(self):
        """测试地址验证"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            
            # 有效地址
            assert client.is_valid_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb") is True
            assert client.is_valid_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") is True
            
            # 无效地址
            assert client.is_valid_address("") is False
            assert client.is_valid_address("invalid") is False
            assert client.is_valid_address("0x123") is False
            assert client.is_valid_address(None) is False
    
    def test_to_checksum_address(self):
        """测试地址转换为校验和格式"""
        from app.core.blockchain import BlockchainClient
        from web3.exceptions import InvalidAddress
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            client.w3.to_checksum_address = MagicMock(return_value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
            
            result = client.to_checksum_address("0x742d35cc6634c0532925a3b844bc9e7595f0beb")
            
            assert result == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    
    def test_to_checksum_address_invalid(self):
        """测试无效地址转换"""
        from app.core.blockchain import BlockchainClient
        from web3.exceptions import InvalidAddress
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            
            with pytest.raises(InvalidAddress):
                client.to_checksum_address("invalid")
    
    def test_get_block_number(self):
        """测试获取区块号"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            client.w3.eth.chain_id = 31337
            client.w3.eth.block_number = 100
            
            assert client.get_block_number() == 100
    
    def test_get_contract_info(self):
        """测试获取合约信息"""
        from app.core.blockchain import BlockchainClient
        
        client = BlockchainClient.__new__(BlockchainClient)
        client.contract_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        client.deployer_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        client.chain_id = 31337
        client._contract_abi = [{"type": "function"}]
        
        info = client.get_contract_info()
        
        assert info["contract_address"] == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        assert info["deployer_address"] == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        assert info["has_contract"] is True
        assert info["has_abi"] is True
    
    def test_get_contract_info_no_contract(self):
        """测试获取合约信息 - 无合约"""
        from app.core.blockchain import BlockchainClient
        
        client = BlockchainClient.__new__(BlockchainClient)
        client.contract_address = ""
        client._contract_abi = None
        
        info = client.get_contract_info()
        
        assert info["has_contract"] is False
        assert info["has_abi"] is False


class TestContractDeploymentService:
    """测试合约部署服务"""
    
    def test_check_deployment_ready(self):
        """测试部署就绪检查"""
        from app.services.contract_deployment_service import ContractDeploymentService
        
        result = ContractDeploymentService.check_deployment_ready()
        
        assert "ready" in result
        assert "issues" in result
        assert "warnings" in result
        assert "can_mint" in result
    
    def test_get_contract_info(self):
        """测试获取合约信息"""
        from app.services.contract_deployment_service import ContractDeploymentService
        
        result = ContractDeploymentService.get_contract_info()
        
        assert "success" in result
        assert "data" in result
    
    def test_update_contract_address_valid(self):
        """测试更新合约地址 - 有效地址"""
        from app.services.contract_deployment_service import ContractDeploymentService
        
        result = ContractDeploymentService.update_contract_address(
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        )
        
        assert result["success"] is True
    
    def test_update_contract_address_invalid(self):
        """测试更新合约地址 - 无效地址"""
        from app.services.contract_deployment_service import ContractDeploymentService
        
        result = ContractDeploymentService.update_contract_address("invalid")
        
        assert result["success"] is False


class TestBlockchainSignature:
    """测试区块链签名功能"""
    
    def test_verify_signature_valid(self):
        """测试签名验证 - 有效签名"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            
            mock_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            client.w3.eth.account.recover_message = MagicMock(return_value=mock_address)
            
            result = client.verify_signature(
                "test message",
                "0xsignature",
                mock_address
            )
            
            assert result is True
    
    def test_verify_signature_invalid(self):
        """测试签名验证 - 无效签名"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            
            client.w3.eth.account.recover_message = MagicMock(
                return_value="0xDifferentAddress"
            )
            
            result = client.verify_signature(
                "test message",
                "0xsignature",
                "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            )
            
            assert result is False
    
    def test_verify_signature_invalid_address(self):
        """测试签名验证 - 无效地址格式"""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            
            result = client.verify_signature(
                "test message",
                "0xsignature",
                "invalid_address"
            )
            
            assert result is False


class TestBlockchainConfig:
    """测试区块链配置"""
    
    def test_config_values(self):
        """测试配置值"""
        from app.core.config import settings
        
        assert settings.WEB3_PROVIDER_URL is not None
        assert "8545" in settings.WEB3_PROVIDER_URL
    
    def test_deployer_config(self):
        """测试部署者配置"""
        from app.core.config import settings
        
        # 私钥和地址应该已配置
        assert settings.DEPLOYER_PRIVATE_KEY != ""
        assert settings.DEPLOYER_ADDRESS != ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
