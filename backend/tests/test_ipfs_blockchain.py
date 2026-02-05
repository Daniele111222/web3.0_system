"""Tests for ipfs.py and blockchain.py fixes."""
import pytest
import threading
import time
from unittest.mock import patch, MagicMock, Mock
from io import BytesIO


class TestBlockchainClient:
    """Tests for blockchain.py improvements."""
    
    def test_python38_compatibility(self):
        """Test that Optional is used instead of | syntax."""
        from app.core.blockchain import BlockchainClient
        import inspect
        
        sig = inspect.signature(BlockchainClient.__init__)
        provider_url_param = sig.parameters.get('provider_url')
        assert provider_url_param is not None
        # Check annotation uses Optional
        assert 'Optional' in str(provider_url_param.annotation)
    
    def test_connection_validation_on_init(self):
        """Test that connection is validated on initialization."""
        from app.core.blockchain import BlockchainClient, BlockchainConnectionError
        
        with patch('web3.Web3.HTTPProvider') as mock_provider:
            with patch('web3.Web3.is_connected', return_value=False):
                with pytest.raises(BlockchainConnectionError):
                    BlockchainClient()
    
    def test_get_balance_validates_address(self):
        """Test that get_balance validates address before querying."""
        from app.core.blockchain import BlockchainClient, BlockchainConnectionError
        from web3.exceptions import InvalidAddress
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            client.w3.is_connected = MagicMock(return_value=True)
            
            # Should raise InvalidAddress for invalid address
            with pytest.raises(InvalidAddress):
                client.get_balance("invalid_address")
    
    def test_address_validation_comprehensive(self):
        """Test comprehensive address validation including checksum."""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            
            # Valid addresses
            assert client.is_valid_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb") is True
            assert client.is_valid_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbD") is True
            
            # Invalid addresses
            assert client.is_valid_address("") is False
            assert client.is_valid_address(None) is False
            assert client.is_valid_address("not_an_address") is False
            assert client.is_valid_address("0x123") is False
    
    def test_signature_verification_eip191(self):
        """Test EIP-191 signature verification."""
        from app.core.blockchain import BlockchainClient
        from eth_account.messages import encode_defunct
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            client.w3 = MagicMock()
            
            # Test with valid signature
            mock_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbD"
            client.w3.eth.account.recover_message = MagicMock(return_value=mock_address)
            
            result = client.verify_signature(
                "test message",
                "0xsignature",
                mock_address
            )
            assert result is True
            
            # Test with invalid address format
            result = client.verify_signature(
                "test",
                "0xsignature",
                "invalid_address"
            )
            assert result is False
    
    def test_close_connection(self):
        """Test connection cleanup."""
        from app.core.blockchain import BlockchainClient
        
        with patch.object(BlockchainClient, '_connect'):
            client = BlockchainClient.__new__(BlockchainClient)
            mock_provider = MagicMock()
            mock_provider.session = MagicMock()
            client.w3 = MagicMock()
            client.w3.provider = mock_provider
            
            client.close()
            assert client.w3 is None


class TestIPFSClient:
    """Tests for ipfs.py improvements."""
    
    def test_file_size_limit(self):
        """Test that files exceeding size limit are rejected."""
        from app.core.ipfs import IPFSClient, IPFSFileTooLargeError
        
        with patch.object(IPFSClient, '_get_client'):
            client = IPFSClient(max_file_size=100)  # 100 bytes limit
            
            large_content = b"x" * 101
            with pytest.raises(IPFSFileTooLargeError):
                client._check_file_size(large_content)
            
            # Should not raise for valid size
            small_content = b"x" * 50
            client._check_file_size(small_content)  # Should not raise
    
    def test_thread_safety(self):
        """Test that IPFS client is thread-safe."""
        from app.core.ipfs import IPFSClient
        
        client = IPFSClient()
        results = []
        
        def access_client():
            try:
                # Try to access the lock
                with client._lock:
                    results.append(True)
                    time.sleep(0.01)
            except Exception as e:
                results.append(False)
        
        # Start multiple threads
        threads = [threading.Thread(target=access_client) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        assert all(results)
    
    def test_retry_decorator(self):
        """Test retry mechanism."""
        from app.core.ipfs import retry_on_error
        
        call_count = [0]
        
        @retry_on_error(max_retries=3, delay=0.01)
        def failing_function():
            call_count[0] += 1
            raise ConnectionError("Test error")
        
        with pytest.raises(ConnectionError):
            failing_function()
        
        # Should have been called 3 times (initial + 2 retries)
        assert call_count[0] == 3
    
    def test_singleton_thread_safety(self):
        """Test that get_ipfs_client is thread-safe."""
        from app.core.ipfs import get_ipfs_client, _ipfs_lock
        
        clients = []
        
        def get_client():
            try:
                client = get_ipfs_client()
                clients.append(id(client))
            except Exception:
                clients.append(None)
        
        # Clear any existing client
        import app.core.ipfs as ipfs_module
        ipfs_module._ipfs_client = None
        
        # Start multiple threads simultaneously
        threads = [threading.Thread(target=get_client) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # All should get the same client instance
        valid_clients = [c for c in clients if c is not None]
        if valid_clients:
            assert len(set(valid_clients)) == 1
    
    def test_upload_json_uses_upload_file(self):
        """Test that upload_json properly delegates to upload_file."""
        from app.core.ipfs import IPFSClient
        
        with patch.object(IPFSClient, '_get_client'):
            client = IPFSClient.__new__(IPFSClient)
            client.max_file_size = 50 * 1024 * 1024
            
            with patch.object(client, 'upload_file') as mock_upload:
                mock_upload.return_value = "test-cid"
                
                result = client.upload_json({"key": "value"})
                
                assert result == "test-cid"
                mock_upload.assert_called_once()
                # Verify file_name is "json_data"
                call_args = mock_upload.call_args
                assert call_args[0][1] == "json_data"
    
    def test_empty_cid_validation(self):
        """Test that empty CIDs are handled properly."""
        from app.core.ipfs import IPFSClient
        
        with patch.object(IPFSClient, '_get_client'):
            client = IPFSClient.__new__(IPFSClient)
            
            # pin_file should return False for empty CID
            assert client.pin_file("") is False
            assert client.pin_file(None) is False
            
            # unpin_file should return False for empty CID
            assert client.unpin_file("") is False
            assert client.unpin_file(None) is False
            
            # verify_cid should return False for empty inputs
            assert client.verify_cid("", b"content") is False
            assert client.verify_cid("cid", b"") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
