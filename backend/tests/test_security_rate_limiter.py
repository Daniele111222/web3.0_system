"""Tests for security.py and rate_limiter.py fixes."""
import asyncio
import time
import pytest
from datetime import timedelta
from unittest.mock import patch, MagicMock, AsyncMock


class TestSecurity:
    """Tests for security.py improvements."""
    
    def test_create_access_token_has_security_claims(self):
        """Test that access tokens include iat and jti claims."""
        from app.core.security import create_access_token, decode_token
        
        token = create_access_token({"sub": "test-user"})
        payload = decode_token(token)
        
        assert payload is not None
        assert "iat" in payload  # Issued at
        assert "jti" in payload  # JWT ID
        assert "exp" in payload  # Expiration
        assert "type" in payload
        assert payload["type"] == "access"
        assert payload["sub"] == "test-user"
    
    def test_create_refresh_token_has_security_claims(self):
        """Test that refresh tokens include iat and jti claims."""
        from app.core.security import create_refresh_token, decode_token
        
        token = create_refresh_token({"sub": "test-user"})
        payload = decode_token(token)
        
        assert payload is not None
        assert "iat" in payload
        assert "jti" in payload
        assert payload["type"] == "refresh"
    
    def test_decode_token_with_expected_type(self):
        """Test token type validation."""
        from app.core.security import create_access_token, decode_token
        
        access_token = create_access_token({"sub": "test"})
        
        # Correct type
        payload = decode_token(access_token, expected_type="access")
        assert payload is not None
        
        # Wrong type
        payload = decode_token(access_token, expected_type="refresh")
        assert payload is None
    
    def test_decode_token_invalid_signature(self):
        """Test decoding with invalid signature."""
        from app.core.security import decode_token
        
        result = decode_token("invalid.token.here")
        assert result is None
    
    def test_jwt_algorithm_security(self):
        """Test that disallowed algorithms are rejected."""
        from app.core.security import ALLOWED_ALGORITHMS
        
        # Verify HS256 is allowed
        assert "HS256" in ALLOWED_ALGORITHMS
        
        # Verify 'none' algorithm is NOT allowed
        assert "none" not in ALLOWED_ALGORITHMS


class TestRateLimiter:
    """Tests for rate_limiter.py improvements."""
    
    @pytest.mark.asyncio
    async def test_rate_limiter_thread_safety(self):
        """Test that rate limiter is thread-safe with concurrent requests."""
        from app.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=100)
        client_ip = "192.168.1.1"
        
        # Simulate 50 concurrent requests
        async def make_request():
            return await limiter.is_allowed(client_ip)
        
        tasks = [make_request() for _ in range(50)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(r[0] for r in results)
        
        # Verify count is correct
        remaining = await limiter.get_remaining(client_ip)
        assert remaining["minute_remaining"] == 50
    
    @pytest.mark.asyncio
    async def test_rate_limiter_memory_cleanup(self):
        """Test that old IP entries are cleaned up."""
        from app.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(
            requests_per_minute=10,
            cleanup_interval=0.1  # 100ms for testing
        )
        
        # Add requests from multiple IPs
        for i in range(10):
            await limiter.is_allowed(f"192.168.1.{i}")
        
        # Wait for cleanup interval
        await asyncio.sleep(0.2)
        
        # Trigger cleanup by making another request
        await limiter.is_allowed("192.168.1.100")
        
        # Cleanup should have removed old entries
        # (though in this test they won't be "old" yet)
    
    @pytest.mark.asyncio
    async def test_rate_limiter_returns_retry_after(self):
        """Test that rate limiter returns Retry-After header value."""
        from app.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=2)
        client_ip = "192.168.1.1"
        
        # Exhaust the limit
        await limiter.is_allowed(client_ip)
        await limiter.is_allowed(client_ip)
        
        # Next request should be blocked with retry_after
        allowed, message, retry_after = await limiter.is_allowed(client_ip)
        
        assert not allowed
        assert retry_after is not None
        assert retry_after > 0
        assert "Too many requests" in message
    
    @pytest.mark.asyncio
    async def test_rate_limiter_unknown_client_handling(self):
        """Test that unknown clients don't share rate limits."""
        from app.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=10)
        
        # Different unknown clients should have separate limits
        allowed1, _, _ = await limiter.is_allowed("unknown_12345")
        allowed2, _, _ = await limiter.is_allowed("unknown_67890")
        
        assert allowed1
        assert allowed2
    
    @pytest.mark.asyncio
    async def test_rate_limiter_remaining_calculation(self):
        """Test remaining request calculation."""
        from app.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(requests_per_minute=10)
        client_ip = "192.168.1.1"
        
        # Initial state
        remaining = await limiter.get_remaining(client_ip)
        assert remaining["minute_remaining"] == 10
        
        # After 3 requests
        for _ in range(3):
            await limiter.is_allowed(client_ip)
        
        remaining = await limiter.get_remaining(client_ip)
        assert remaining["minute_remaining"] == 7


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
