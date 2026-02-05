"""Tests for config.py and database.py fixes."""
import pytest
from unittest.mock import patch, MagicMock
import sys


class TestConfig:
    """Tests for config.py improvements."""
    
    def test_secret_key_required(self):
        """Test that SECRET_KEY must be provided (no default)."""
        with patch.dict('os.environ', {}, clear=True):
            with patch.object(sys.modules['app.core.config'], 'settings', None):
                with pytest.raises(Exception):
                    from app.core.config import Settings
                    Settings()
    
    def test_cors_origins_type(self):
        """Test CORS_ORIGINS uses List type for Python 3.8+ compatibility."""
        from typing import List
        from app.core.config import Settings
        
        # Check that the model accepts list input
        settings = Settings(SECRET_KEY="test-secret")
        assert isinstance(settings.CORS_ORIGINS, list)
        assert all(isinstance(origin, str) for origin in settings.CORS_ORIGINS)
    
    def test_settings_cached(self):
        """Test that settings are cached with lru_cache."""
        from app.core.config import get_settings
        
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2  # Same instance due to caching


class TestDatabase:
    """Tests for database.py improvements."""
    
    def test_engine_has_pool_pre_ping(self):
        """Test engine is configured with pool_pre_ping."""
        from app.core.database import engine
        
        # pool_pre_ping 应该在 engine 的 kwargs 中
        assert engine.pool._pre_ping is True
    
    def test_base_has_timestamp_fields(self):
        """Test Base class has created_at and updated_at fields."""
        from app.core.database import Base
        from sqlalchemy import DateTime
        
        assert hasattr(Base, 'created_at')
        assert hasattr(Base, 'updated_at')
    
    def test_get_db_handles_exceptions(self):
        """Test get_db properly handles exceptions with rollback."""
        import asyncio
        from app.core.database import get_db
        from unittest.mock import AsyncMock, patch
        
        async def test_exception_handling():
            mock_session = AsyncMock()
            mock_session.rollback = AsyncMock()
            mock_session.close = AsyncMock()
            
            with patch('app.core.database.SessionLocal', return_value=mock_session):
                db_gen = get_db()
                db = await db_gen.asend(None)
                
                # Simulate an exception
                try:
                    await db_gen.athrow(Exception, "Test error")
                except StopAsyncIteration:
                    pass
                
                # Verify rollback was called
                mock_session.rollback.assert_called_once()
                mock_session.close.assert_called_once()
        
        asyncio.run(test_exception_handling())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
