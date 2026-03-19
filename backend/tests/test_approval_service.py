import pytest
import pytest_asyncio
from datetime import date
from types import SimpleNamespace
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.asset import Asset, AssetStatus, AssetType, LegalStatus
from app.models.enterprise import Enterprise
from app.models.user import User
from app.services.approval_service import ApprovalService


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    echo=False,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    autoflush=False,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_asset_submit_approval_sets_asset_to_approved(db_session: AsyncSession):
    enterprise = Enterprise(id=uuid4(), name="Approval Enterprise")
    user = User(
        id=uuid4(),
        email="approval@example.com",
        username="approval_user",
        hashed_password="hashed_password",
    )
    asset = Asset(
        id=uuid4(),
        enterprise_id=enterprise.id,
        creator_user_id=user.id,
        name="Approval Asset",
        type=AssetType.PATENT,
        description="Approval Asset Description",
        creator_name="Creator",
        inventors=["Creator"],
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        status=AssetStatus.PENDING,
    )
    db_session.add_all([enterprise, user, asset])
    await db_session.commit()

    service = ApprovalService(db_session)
    approval = SimpleNamespace(asset_id=asset.id)
    await service._handle_asset_submit_approval(approval)

    await db_session.refresh(asset)
    assert asset.status == AssetStatus.APPROVED


@pytest.mark.asyncio
async def test_asset_submit_approval_no_asset_id_noop(db_session: AsyncSession):
    service = ApprovalService(db_session)
    approval = SimpleNamespace(asset_id=None)
    await service._handle_asset_submit_approval(approval)
