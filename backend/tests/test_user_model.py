"""User 模型测试。"""
import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole


@pytest.mark.anyio
class TestUserModel:
    """User 模型测试类。"""

    async def test_create_user(self, db_session: AsyncSession):
        """测试创建用户。"""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password_123",
            username="testuser",
            full_name="Test User",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.full_name == "Test User"
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_superuser is False
        assert user.created_at is not None
        assert user.updated_at is not None

    async def test_user_default_values(self, db_session: AsyncSession):
        """测试用户默认值。"""
        user = User(
            email="default@example.com",
            hashed_password="password",
            username="defaultuser",
        )
        db_session.add(user)
        await db_session.commit()

        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_superuser is False
        assert user.wallet_address is None
        assert user.avatar_url is None
        assert user.last_login_at is None

    async def test_user_with_wallet(self, db_session: AsyncSession):
        """测试带钱包地址的用户。"""
        wallet_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        user = User(
            email="wallet@example.com",
            hashed_password="password",
            username="walletuser",
            wallet_address=wallet_address,
        )
        db_session.add(user)
        await db_session.commit()

        assert user.wallet_address == wallet_address

    async def test_user_unique_email(self, db_session: AsyncSession):
        """测试邮箱唯一性约束。"""
        user1 = User(
            email="unique@example.com",
            hashed_password="password1",
            username="user1",
        )
        db_session.add(user1)
        await db_session.commit()

        user2 = User(
            email="unique@example.com",
            hashed_password="password2",
            username="user2",
        )
        db_session.add(user2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_user_unique_username(self, db_session: AsyncSession):
        """测试用户名唯一性约束。"""
        user1 = User(
            email="user1@example.com",
            hashed_password="password1",
            username="uniqueuser",
        )
        db_session.add(user1)
        await db_session.commit()

        user2 = User(
            email="user2@example.com",
            hashed_password="password2",
            username="uniqueuser",
        )
        db_session.add(user2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_user_timestamps(self, db_session: AsyncSession):
        """测试时间戳字段。"""
        from datetime import datetime as dt
        before_create = dt.utcnow()
        user = User(
            email="timestamp@example.com",
            hashed_password="password",
            username="timestampuser",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.created_at is not None
        assert user.updated_at is not None
        # SQLite 返回 offset-naive datetime
        created_at = user.created_at.replace(tzinfo=None) if user.created_at.tzinfo else user.created_at
        updated_at = user.updated_at.replace(tzinfo=None) if user.updated_at.tzinfo else user.updated_at
        assert created_at >= before_create
        assert updated_at >= before_create

    async def test_user_repr(self, db_session: AsyncSession):
        """测试用户对象的字符串表示。"""
        user = User(
            email="repr@example.com",
            hashed_password="password",
            username="repruser",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        repr_str = repr(user)
        assert "User" in repr_str
        assert str(user.id) in repr_str
        assert user.email in repr_str
        assert user.username in repr_str

    async def test_user_refresh_tokens_relationship(self, db_session: AsyncSession):
        """测试用户与刷新令牌的关系。"""
        user = User(
            email="tokens@example.com",
            hashed_password="password",
            username="tokensuser",
        )
        db_session.add(user)
        await db_session.commit()

        token = RefreshToken(
            token_hash="hash123",
            user_id=user.id,
            expires_at=datetime.now(timezone.utc),
        )
        db_session.add(token)
        await db_session.commit()
        await db_session.refresh(user)

        # 检查关系
        assert len(user.refresh_tokens) == 1
        assert user.refresh_tokens[0].token_hash == "hash123"

    async def test_user_enterprise_memberships(self, db_session: AsyncSession):
        """测试用户与企业成员关系。"""
        user = User(
            email="enterprise@example.com",
            hashed_password="password",
            username="enterpriseuser",
        )
        db_session.add(user)
        await db_session.commit()

        enterprise = Enterprise(
            name="Test Enterprise",
            description="Test Description",
        )
        db_session.add(enterprise)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.MEMBER,
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(user)

        assert len(user.enterprise_memberships) == 1
        assert user.enterprise_memberships[0].role == MemberRole.MEMBER

    async def test_user_cascade_delete_refresh_tokens(self, db_session: AsyncSession):
        """测试删除用户时级联删除刷新令牌。"""
        user = User(
            email="cascade@example.com",
            hashed_password="password",
            username="cascadeuser",
        )
        db_session.add(user)
        await db_session.commit()

        token = RefreshToken(
            token_hash="cascade_hash",
            user_id=user.id,
            expires_at=datetime.now(timezone.utc),
        )
        db_session.add(token)
        await db_session.commit()

        # 删除用户
        await db_session.delete(user)
        await db_session.commit()

        # 验证令牌也被删除
        result = await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == "cascade_hash")
        )
        assert result.scalar_one_or_none() is None

    async def test_user_query_by_email(self, db_session: AsyncSession):
        """测试通过邮箱查询用户。"""
        user = User(
            email="query@example.com",
            hashed_password="password",
            username="queryuser",
        )
        db_session.add(user)
        await db_session.commit()

        result = await db_session.execute(
            select(User).where(User.email == "query@example.com")
        )
        found_user = result.scalar_one_or_none()

        assert found_user is not None
        assert found_user.email == "query@example.com"

    async def test_user_query_by_wallet(self, db_session: AsyncSession):
        """测试通过钱包地址查询用户。"""
        wallet = "0x1234567890123456789012345678901234567890"
        user = User(
            email="walletquery@example.com",
            hashed_password="password",
            username="walletqueryuser",
            wallet_address=wallet,
        )
        db_session.add(user)
        await db_session.commit()

        result = await db_session.execute(
            select(User).where(User.wallet_address == wallet)
        )
        found_user = result.scalar_one_or_none()

        assert found_user is not None
        assert found_user.wallet_address == wallet
