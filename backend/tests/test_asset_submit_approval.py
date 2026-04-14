import pytest
import pytest_asyncio
from datetime import date
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.approval import Approval, ApprovalAction, ApprovalProcess, ApprovalStatus, ApprovalType
from app.models.asset import Asset, AssetStatus, AssetType, Attachment, LegalStatus
from app.models.enterprise import Enterprise
from app.models.user import User
from app.repositories.asset_repository import AssetRepository
from app.services.asset_service import AssetService


@pytest_asyncio.fixture(scope="function")
async def db_session():
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    session_local = async_sessionmaker(
        test_engine,
        autoflush=False,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with session_local() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_submit_for_approval_persists_approval_and_submit_process(db_session: AsyncSession):
    enterprise = Enterprise(id=uuid4(), name="Asset Approval Enterprise")
    user = User(
        id=uuid4(),
        email="asset-approval@example.com",
        username="asset_approval_user",
        hashed_password="hashed_password",
    )
    asset = Asset(
        id=uuid4(),
        enterprise_id=enterprise.id,
        creator_user_id=user.id,
        name="Approval Asset",
        type=AssetType.TRADEMARK,
        description="Approval Asset Description",
        creator_name="Creator",
        inventors=["Creator"],
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.GRANTED,
        asset_metadata={},
        status=AssetStatus.DRAFT,
    )
    attachment = Attachment(
        id=uuid4(),
        asset_id=asset.id,
        file_name="logo.png",
        file_type="image/png",
        file_size=1024,
        ipfs_cid="QmTestSubmitApproval1234567890123456789012345678901234",
        is_primary=True,
    )
    db_session.add_all([enterprise, user, asset, attachment])
    await db_session.commit()

    service = AssetService(AssetRepository(db_session))
    updated_asset, approval = await service.submit_for_approval(
        asset_id=asset.id,
        enterprise_id=enterprise.id,
        applicant_id=user.id,
        remarks="请审核该资产",
    )

    assert updated_asset.status == AssetStatus.PENDING
    assert approval.type == ApprovalType.ASSET_SUBMIT
    assert approval.target_id == asset.id
    assert approval.target_type == "asset"
    assert approval.status == ApprovalStatus.PENDING
    assert approval.asset_id == asset.id

    persisted_approval = (
        await db_session.execute(select(Approval).where(Approval.id == approval.id))
    ).scalar_one()
    assert persisted_approval.id == approval.id

    process_records = (
        await db_session.execute(
            select(ApprovalProcess).where(ApprovalProcess.approval_id == approval.id)
        )
    ).scalars().all()
    assert len(process_records) == 1
    assert process_records[0].action == ApprovalAction.SUBMIT
    assert process_records[0].operator_id == user.id
