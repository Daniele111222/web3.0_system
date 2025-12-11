from web3 import Web3
from app.core.config import settings


class BlockchainClient:
    """Client for interacting with blockchain."""
    
    def __init__(self, provider_url: str | None = None):
        self.provider_url = provider_url or settings.WEB3_PROVIDER_URL
        self.w3 = Web3(Web3.HTTPProvider(self.provider_url))
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain."""
        return self.w3.is_connected()
    
    def get_balance(self, address: str) -> int:
        """Get balance of an address in wei."""
        return self.w3.eth.get_balance(address)
    
    def verify_signature(self, message: str, signature: str, expected_address: str) -> bool:
        """Verify that a message was signed by the expected address."""
        try:
            message_hash = Web3.keccak(text=message)
            recovered_address = self.w3.eth.account.recover_message(
                message_hash,
                signature=signature
            )
            return recovered_address.lower() == expected_address.lower()
        except Exception:
            return False
    
    def is_valid_address(self, address: str) -> bool:
        """Check if an address is valid."""
        return Web3.is_address(address)


# Global blockchain client instance
blockchain_client = BlockchainClient()
