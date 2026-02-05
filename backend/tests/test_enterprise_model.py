"""Enterprise 和 EnterpriseMember 模型测试。"""
import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole


@pytest.mark.anyio
class TestEnterpriseModel:
    """Enterprise 模型测试类。"""

    async def test_create_enterprise(self, db_session: AsyncSession):
        """测试创建企业。"""
        enterprise = Enterprise(
            name="Test Enterprise",
            description="A test enterprise",
            website="https://example.com",
            contact_email="contact@example.com",
        )
        db_session.add(enterprise)
        await db_session.commit()
        await db_session.refresh(enterprise)

        assert enterprise.id is not None
        assert enterprise.name == "Test Enterprise"
        assert enterprise.description == "A test enterprise"
        assert enterprise.website == "https://example.com"
        assert enterprise.contact_email == "contact@example.com"
        assert enterprise.is_active is True
        assert enterprise.is_verified is False
        assert enterprise.created_at is not None
        assert enterprise.updated_at is not None

    async def test_enterprise_default_values(self, db_session: AsyncSession):
        """测试企业默认值。"""
        enterprise = Enterprise(
            name="Default Enterprise",
        )
        db_session.add(enterprise)
        await db_session.commit()

        assert enterprise.is_active is True
        assert enterprise.is_verified is False
        assert enterprise.description is None
        assert enterprise.logo_url is None
        assert enterprise.website is None
        assert enterprise.contact_email is None
        assert enterprise.wallet_address is None

    async def test_enterprise_with_wallet(self, db_session: AsyncSession):
        """测试带钱包地址的企业。"""
        wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        enterprise = Enterprise(
            name="Enterprise With Wallet",
            wallet_address=wallet,
        )
        db_session.add(enterprise)
        await db_session.commit()

        assert enterprise.wallet_address == wallet

    async def test_enterprise_unique_wallet(self, db_session: AsyncSession):
        """测试钱包地址唯一性约束。"""
        wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        enterprise1 = Enterprise(
            name="Enterprise 1",
            wallet_address=wallet,
        )
        db_session.add(enterprise1)
        await db_session.commit()

        enterprise2 = Enterprise(
            name="Enterprise 2",
            wallet_address=wallet,
        )
        db_session.add(enterprise2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_enterprise_members_relationship(self, db_session: AsyncSession):
        """测试企业与成员的关系。"""
        enterprise = Enterprise(name="Member Test Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user1 = User(
            email="member1@example.com",
            hashed_password="password",
            username="member1",
        )
        user2 = User(
            email="member2@example.com",
            hashed_password="password",
            username="member2",
        )
        db_session.add_all([user1, user2])
        await db_session.commit()

        member1 = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user1.id,
            role=MemberRole.OWNER,
        )
        member2 = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user2.id,
            role=MemberRole.MEMBER,
        )
        db_session.add_all([member1, member2])
        await db_session.commit()
        await db_session.refresh(enterprise)

        assert len(enterprise.members) == 2
        roles = [m.role for m in enterprise.members]
        assert MemberRole.OWNER in roles
        assert MemberRole.MEMBER in roles

    async def test_enterprise_repr(self, db_session: AsyncSession):
        """测试企业对象的字符串表示。"""
        enterprise = Enterprise(name="Repr Enterprise")
        db_session.add(enterprise)
        await db_session.commit()
        await db_session.refresh(enterprise)

        repr_str = repr(enterprise)
        assert "Enterprise" in repr_str
        assert str(enterprise.id) in repr_str
        assert enterprise.name in repr_str

    async def test_enterprise_cascade_delete_members(self, db_session: AsyncSession):
        """测试删除企业时级联删除成员。"""
        enterprise = Enterprise(name="Cascade Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="cascademember@example.com",
            hashed_password="password",
            username="cascademember",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.MEMBER,
        )
        db_session.add(member)
        await db_session.commit()

        # 删除企业
        await db_session.delete(enterprise)
        await db_session.commit()

        # 验证成员也被删除
        result = await db_session.execute(
            select(EnterpriseMember).where(EnterpriseMember.user_id == user.id)
        )
        assert result.scalar_one_or_none() is None


@pytest.mark.anyio
class TestEnterpriseMemberModel:
    """EnterpriseMember 模型测试类。"""

    async def test_create_enterprise_member(self, db_session: AsyncSession):
        """测试创建企业成员。"""
        enterprise = Enterprise(name="Member Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="memberuser@example.com",
            hashed_password="password",
            username="memberuser",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.ADMIN,
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)

        assert member.id is not None
        assert member.enterprise_id == enterprise.id
        assert member.user_id == user.id
        assert member.role == MemberRole.ADMIN
        assert member.joined_at is not None

    async def test_enterprise_member_default_role(self, db_session: AsyncSession):
        """测试企业成员默认角色。"""
        enterprise = Enterprise(name="Default Role Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="defaultrole@example.com",
            hashed_password="password",
            username="defaultroleuser",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
        )
        db_session.add(member)
        await db_session.commit()

        assert member.role == MemberRole.MEMBER

    async def test_enterprise_member_unique_constraint(self, db_session: AsyncSession):
        """测试企业-用户唯一性约束。"""
        enterprise = Enterprise(name="Unique Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="uniqueconstraint@example.com",
            hashed_password="password",
            username="uniqueconstraintuser",
        )
        db_session.add(user)
        await db_session.commit()

        member1 = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.MEMBER,
        )
        db_session.add(member1)
        await db_session.commit()

        member2 = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.ADMIN,
        )
        db_session.add(member2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_enterprise_member_enterprise_relationship(self, db_session: AsyncSession):
        """测试成员与企业的关系。"""
        enterprise = Enterprise(name="Relation Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="relationmember@example.com",
            hashed_password="password",
            username="relationmemberuser",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.VIEWER,
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)

        assert member.enterprise is not None
        assert member.enterprise.id == enterprise.id
        assert member.enterprise.name == enterprise.name

    async def test_enterprise_member_user_relationship(self, db_session: AsyncSession):
        """测试成员与用户的关系。"""
        enterprise = Enterprise(name="User Relation Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="userrelation@example.com",
            hashed_password="password",
            username="userrelationuser",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)

        assert member.user is not None
        assert member.user.id == user.id
        assert member.user.email == user.email

    async def test_enterprise_member_role_enum_values(self):
        """测试成员角色枚举值。"""
        assert MemberRole.OWNER == "owner"
        assert MemberRole.ADMIN == "admin"
        assert MemberRole.MEMBER == "member"
        assert MemberRole.VIEWER == "viewer"

    async def test_enterprise_member_repr(self, db_session: AsyncSession):
        """测试成员对象的字符串表示。"""
        enterprise = Enterprise(name="Repr Member Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="reprmember@example.com",
            hashed_password="password",
            username="reprmemberuser",
        )
        db_session.add(user)
        await db_session.commit()

        member = EnterpriseMember(
            enterprise_id=enterprise.id,
            user_id=user.id,
            role=MemberRole.ADMIN,
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)

        repr_str = repr(member)
        assert "EnterpriseMember" in repr_str
        assert str(member.id) in repr_str
        assert str(member.enterprise_id) in repr_str
        assert str(member.user_id) in repr_str
        # repr 中显示的是枚举对象本身，例如 "MemberRole.ADMIN"
        assert "MemberRole.ADMIN" in repr_str

    async def test_user_multiple_enterprises(self, db_session: AsyncSession):
        """测试用户加入多个企业。"""
        user = User(
            email="multi@example.com",
            hashed_password="password",
            username="multiuser",
        )
        db_session.add(user)
        await db_session.commit()

        enterprise1 = Enterprise(name="Enterprise 1")
        enterprise2 = Enterprise(name="Enterprise 2")
        db_session.add_all([enterprise1, enterprise2])
        await db_session.commit()

        member1 = EnterpriseMember(
            enterprise_id=enterprise1.id,
            user_id=user.id,
            role=MemberRole.OWNER,
        )
        member2 = EnterpriseMember(
            enterprise_id=enterprise2.id,
            user_id=user.id,
            role=MemberRole.MEMBER,
        )
        db_session.add_all([member1, member2])
        await db_session.commit()
        await db_session.refresh(user)

        assert len(user.enterprise_memberships) == 2
        enterprise_ids = [m.enterprise_id for m in user.enterprise_memberships]
        assert enterprise1.id in enterprise_ids
        assert enterprise2.id in enterprise_ids
