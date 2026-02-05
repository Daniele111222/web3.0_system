"""RefreshToken 模型测试。"""
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.refresh_token import RefreshToken


@pytest.mark.anyio
class TestRefreshTokenModel:
    """RefreshToken 模型测试类。"""

    async def test_create_refresh_token(self, db_session: AsyncSession):
        """测试创建刷新令牌。"""
        user = User(
            email="tokenuser@example.com",
            hashed_password="password",
            username="tokenuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="token_hash_123",
            user_id=user.id,
            expires_at=expires,
            device_info="Chrome on Windows",
            ip_address="192.168.1.1",
        )
        db_session.add(token)
        await db_session.commit()
        await db_session.refresh(token)

        assert token.id is not None
        assert token.token_hash == "token_hash_123"
        assert token.user_id == user.id
        # SQLite 返回 offset-naive datetime，需要比较时间值
        expires_at = token.expires_at.replace(tzinfo=None) if token.expires_at.tzinfo else token.expires_at
        expected_expires = expires.replace(tzinfo=None) if expires.tzinfo else expires
        assert expires_at == expected_expires
        assert token.device_info == "Chrome on Windows"
        assert token.ip_address == "192.168.1.1"
        assert token.is_revoked is False
        assert token.created_at is not None

    async def test_refresh_token_default_values(self, db_session: AsyncSession):
        """测试刷新令牌默认值。"""
        user = User(
            email="tokendefault@example.com",
            hashed_password="password",
            username="tokendefaultuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="default_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()

        assert token.is_revoked is False
        assert token.device_info is None
        assert token.ip_address is None
        assert token.revoked_at is None

    async def test_refresh_token_unique_constraint(self, db_session: AsyncSession):
        """测试令牌哈希唯一性约束。"""
        user1 = User(
            email="user1@example.com",
            hashed_password="password1",
            username="user1token",
        )
        user2 = User(
            email="user2@example.com",
            hashed_password="password2",
            username="user2token",
        )
        db_session.add_all([user1, user2])
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token1 = RefreshToken(
            token_hash="unique_hash",
            user_id=user1.id,
            expires_at=expires,
        )
        db_session.add(token1)
        await db_session.commit()

        token2 = RefreshToken(
            token_hash="unique_hash",
            user_id=user2.id,
            expires_at=expires,
        )
        db_session.add(token2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_refresh_token_revoke(self, db_session: AsyncSession):
        """测试撤销令牌。"""
        user = User(
            email="revoke@example.com",
            hashed_password="password",
            username="revokeuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="revoke_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()

        # 撤销令牌
        token.is_revoked = True
        token.revoked_at = datetime.now(timezone.utc)
        await db_session.commit()
        await db_session.refresh(token)

        assert token.is_revoked is True
        assert token.revoked_at is not None

    async def test_refresh_token_user_relationship(self, db_session: AsyncSession):
        """测试刷新令牌与用户的关系。"""
        user = User(
            email="relation@example.com",
            hashed_password="password",
            username="relationuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="relation_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()
        await db_session.refresh(token)

        # 检查关系
        assert token.user is not None
        assert token.user.id == user.id
        assert token.user.email == user.email

    async def test_refresh_token_timestamps(self, db_session: AsyncSession):
        """测试时间戳字段。"""
        from datetime import datetime as dt
        before_create = dt.utcnow()
        user = User(
            email="timestamptoken@example.com",
            hashed_password="password",
            username="timestamptokenuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="timestamp_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()
        await db_session.refresh(token)

        assert token.created_at is not None
        # SQLite 返回 offset-naive datetime
        created_at = token.created_at.replace(tzinfo=None) if token.created_at.tzinfo else token.created_at
        assert created_at >= before_create

    async def test_refresh_token_repr(self, db_session: AsyncSession):
        """测试刷新令牌对象的字符串表示。"""
        user = User(
            email="reprtoken@example.com",
            hashed_password="password",
            username="reprtokenuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="repr_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()
        await db_session.refresh(token)

        repr_str = repr(token)
        assert "RefreshToken" in repr_str
        assert str(token.id) in repr_str
        assert str(token.user_id) in repr_str
        assert str(token.is_revoked) in repr_str

    async def test_refresh_token_query_by_hash(self, db_session: AsyncSession):
        """测试通过哈希查询令牌。"""
        user = User(
            email="querytoken@example.com",
            hashed_password="password",
            username="querytokenuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="query_hash_123",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()

        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == "query_hash_123")
        )
        found_token = result.scalar_one_or_none()

        assert found_token is not None
        assert found_token.token_hash == "query_hash_123"

    async def test_refresh_token_query_active_by_user(self, db_session: AsyncSession):
        """测试查询用户的活跃令牌。"""
        user = User(
            email="active@example.com",
            hashed_password="password",
            username="activeuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token1 = RefreshToken(
            token_hash="active_hash_1",
            user_id=user.id,
            expires_at=expires,
            is_revoked=False,
        )
        token2 = RefreshToken(
            token_hash="active_hash_2",
            user_id=user.id,
            expires_at=expires,
            is_revoked=True,
        )
        db_session.add_all([token1, token2])
        await db_session.commit()

        result = await db_session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.is_revoked == False
            )
        )
        active_tokens = result.scalars().all()

        assert len(active_tokens) == 1
        assert active_tokens[0].token_hash == "active_hash_1"

    async def test_refresh_token_cascade_delete_with_user(self, db_session: AsyncSession):
        """测试删除用户时级联删除刷新令牌。"""
        user = User(
            email="cascadetoken@example.com",
            hashed_password="password",
            username="cascadetokenuser",
        )
        db_session.add(user)
        await db_session.commit()

        expires = datetime.now(timezone.utc) + timedelta(days=7)
        token = RefreshToken(
            token_hash="cascade_token_hash",
            user_id=user.id,
            expires_at=expires,
        )
        db_session.add(token)
        await db_session.commit()

        # 删除用户
        await db_session.delete(user)
        await db_session.commit()

        # 验证令牌也被删除
        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == "cascade_token_hash")
        )
        assert result.scalar_one_or_none() is None
