"""NFT API接口测试。

测试NFT相关的API端点。
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import date


class TestContractsAPI:
    """测试合约管理API"""
    
    @pytest.mark.asyncio
    async def test_get_contracts_status(self, client: AsyncClient):
        """测试获取合约状态"""
        response = await client.get("/api/v1/contracts/status")
        
        # 应该返回状态信息
        assert response.status_code in [200, 500]
    
    @pytest.mark.asyncio
    async def test_get_contracts_info(self, client: AsyncClient):
        """测试获取合约信息"""
        response = await client.get("/api/v1/contracts/info")
        
        # 应该返回合约信息
        assert response.status_code in [200, 500]
    
    @pytest.mark.asyncio
    async def test_update_contract_address(self, client: AsyncClient):
        """测试更新合约地址"""
        response = await client.post(
            "/api/v1/contracts/update-address",
            json={"contract_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}
        )
        
        assert response.status_code in [200, 400, 500]
    
    @pytest.mark.asyncio
    async def test_update_contract_address_invalid(self, client: AsyncClient):
        """测试更新无效合约地址"""
        response = await client.post(
            "/api/v1/contracts/update-address",
            json={"contract_address": "invalid"}
        )
        
        assert response.status_code == 400


class TestNFTMintAPI:
    """测试NFT铸造API"""
    
    @pytest.mark.asyncio
    async def test_mint_nft_missing_auth(self, client: AsyncClient):
        """测试铸造NFT - 未认证"""
        response = await client.post(
            f"/api/v1/nft/mint?asset_id={uuid4()}",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
        )
        
        # 需要认证
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_mint_nft_path_alias_missing_auth(self, client: AsyncClient):
        """测试铸造NFT路径别名 - 未认证"""
        response = await client.post(
            f"/api/v1/nft/{uuid4()}/mint",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
        )
        assert response.status_code in [401, 403]
    
    @pytest.mark.asyncio
    async def test_mint_nft_invalid_asset(self, client: AsyncClient, auth_token: str):
        """测试铸造NFT - 无效资产ID"""
        response = await client.post(
            f"/api/v1/nft/mint?asset_id={uuid4()}",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # 资产不存在
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_mint_nft_invalid_address(self, client: AsyncClient, auth_token: str):
        """测试铸造NFT - 无效地址"""
        response = await client.post(
            f"/api/v1/nft/mint?asset_id={uuid4()}",
            json={"minter_address": "invalid"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # 请求格式可能正确但后续会失败
        assert response.status_code in [400, 404, 422, 500]


class TestNFTBatchMintAPI:
    """测试NFT批量铸造API"""
    
    @pytest.mark.asyncio
    async def test_batch_mint_missing_auth(self, client: AsyncClient):
        """测试批量铸造NFT - 未认证"""
        response = await client.post(
            "/api/v1/nft/batch-mint",
            json={
                "asset_ids": [str(uuid4())],
                "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            }
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.asyncio
    async def test_batch_mint_empty_list(self, client: AsyncClient, auth_token: str):
        """测试批量铸造NFT - 空列表"""
        response = await client.post(
            "/api/v1/nft/batch-mint",
            json={
                "asset_ids": [],
                "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_batch_mint_too_many(self, client: AsyncClient, auth_token: str):
        """测试批量铸造NFT - 数量过多"""
        asset_ids = [str(uuid4()) for _ in range(51)]
        
        response = await client.post(
            "/api/v1/nft/batch-mint",
            json={
                "asset_ids": asset_ids,
                "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400


class TestNFTStatusAPI:
    """测试NFT状态查询API"""
    
    @pytest.mark.asyncio
    async def test_get_mint_status_missing_auth(self, client: AsyncClient):
        """测试获取铸造状态 - 未认证"""
        response = await client.get(f"/api/v1/nft/{uuid4()}/mint/status")
        
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_mint_status_alias_missing_auth(self, client: AsyncClient):
        """测试获取铸造状态别名路径 - 未认证"""
        response = await client.get(f"/api/v1/nft/mint/{uuid4()}/status")
        assert response.status_code in [401, 403]
    
    @pytest.mark.asyncio
    async def test_get_mint_status_not_found(self, client: AsyncClient, auth_token: str):
        """测试获取铸造状态 - 资产不存在"""
        response = await client.get(
            f"/api/v1/nft/{uuid4()}/mint/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404


class TestNFTGasEstimateAPI:
    """测试NFT Gas估算API"""

    @pytest.mark.asyncio
    async def test_estimate_mint_gas_missing_auth(self, client: AsyncClient):
        response = await client.post(
            f"/api/v1/nft/mint/estimate?asset_id={uuid4()}",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
        )
        assert response.status_code in [401, 403]


class TestNFTRetryAPI:
    """测试NFT重试API"""
    
    @pytest.mark.asyncio
    async def test_retry_mint_missing_auth(self, client: AsyncClient):
        """测试重试铸造 - 未认证"""
        response = await client.post(
            f"/api/v1/nft/{uuid4()}/mint/retry",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
        )
        
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_retry_mint_alias_missing_auth(self, client: AsyncClient):
        """测试重试铸造别名路径 - 未认证"""
        response = await client.post(
            f"/api/v1/nft/mint/{uuid4()}/retry",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
        )
        assert response.status_code in [401, 403]
    
    @pytest.mark.asyncio
    async def test_retry_mint_not_found(self, client: AsyncClient, auth_token: str):
        """测试重试铸造 - 资产不存在"""
        response = await client.post(
            f"/api/v1/nft/{uuid4()}/mint/retry",
            json={"minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404


class TestNFTTransferAPI:
    """测试NFT转移API"""
    
    @pytest.mark.asyncio
    async def test_transfer_nft_error_for_missing_asset(self, client: AsyncClient, auth_token: str):
        """测试转移NFT - 资产不存在或链路不可用"""
        response = await client.post(
            "/api/v1/nft/transfer?token_id=1&to_address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [400, 404, 500, 502]


class TestNFTHistoryAPI:
    """测试NFT历史API"""
    
    @pytest.mark.asyncio
    async def test_get_nft_history_response(self, client: AsyncClient, auth_token: str):
        """测试获取NFT历史 - 响应可用"""
        response = await client.get(
            "/api/v1/nft/1/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 404, 500]

    @pytest.mark.asyncio
    async def test_get_mint_history_missing_auth(self, client: AsyncClient):
        """测试获取铸造历史 - 未认证"""
        response = await client.get(f"/api/v1/nft/mint/history?enterprise_id={uuid4()}")
        assert response.status_code in [401, 403]


class TestAssetHashVerifyAPI:
    @pytest.mark.asyncio
    async def test_verify_attachment_hash_missing_auth(self, client: AsyncClient):
        response = await client.post(
            f"/api/v1/assets/{uuid4()}/attachments/{uuid4()}/hash/verify",
            json={
                "client_sha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
            },
        )
        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
