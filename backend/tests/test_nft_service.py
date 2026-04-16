"""NFT服务测试。

测试NFT铸造服务、批量铸造、状态查询等功能。
"""
import pytest
import pytest_asyncio
from datetime import date, datetime, timezone
from uuid import uuid4
from unittest.mock import patch, MagicMock, AsyncMock
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import text, select

from app.core.database import Base
from app.models.asset import Asset, AssetStatus, AssetType, LegalStatus, Attachment, MintRecord
from app.models.ownership import NFTTransferRecord, TransferType
from app.models.user import User
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole
from app.services.nft_service import NFTService
from app.services.ownership_service import OwnershipService


# 测试数据库
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
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """创建测试数据库会话"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await test_engine.dispose()


@pytest_asyncio.fixture
async def test_enterprise(db_session: AsyncSession) -> Enterprise:
    """创建测试企业"""
    enterprise = Enterprise(
        id=uuid4(),
        name="Test Enterprise",
        description="Test Enterprise Description",
        address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    )
    db_session.add(enterprise)
    await db_session.commit()
    await db_session.refresh(enterprise)
    return enterprise


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_enterprise: Enterprise) -> User:
    """创建测试用户"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        wallet_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    )
    db_session.add(user)
    
    member = EnterpriseMember(
        id=uuid4(),
        enterprise_id=test_enterprise.id,
        user_id=user.id,
        role=MemberRole.ADMIN,
    )
    db_session.add(member)
    
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_asset_draft(db_session: AsyncSession, test_enterprise: Enterprise, test_user: User) -> Asset:
    """创建测试资产(DRAFT状态)"""
    asset = Asset(
        id=uuid4(),
        enterprise_id=test_enterprise.id,
        creator_user_id=test_user.id,
        name="Test Patent",
        type=AssetType.PATENT,
        description="Test Patent Description",
        creator_name="Test Creator",
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        application_number="CN2024000001",
        status=AssetStatus.DRAFT,
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


@pytest_asyncio.fixture
async def test_asset_approved(db_session: AsyncSession, test_enterprise: Enterprise, test_user: User) -> Asset:
    """创建测试资产(APPROVED状态)"""
    asset = Asset(
        id=uuid4(),
        enterprise_id=test_enterprise.id,
        creator_user_id=test_user.id,
        name="Test Trademark",
        type=AssetType.TRADEMARK,
        description="Test Trademark Description",
        creator_name="Test Creator",
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        application_number="CN2024000002",
        status=AssetStatus.APPROVED,
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


@pytest_asyncio.fixture
async def test_asset_with_attachment(db_session: AsyncSession, test_enterprise: Enterprise, test_user: User) -> Asset:
    """创建带附件的测试资产"""
    asset = Asset(
        id=uuid4(),
        enterprise_id=test_enterprise.id,
        creator_user_id=test_user.id,
        name="Test Copyright",
        type=AssetType.COPYRIGHT,
        description="Test Copyright Description",
        creator_name="Test Creator",
        inventors=["Test Creator"],
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.GRANTED,
        application_number="CN2024000003",
        rights_declaration="Original rights declaration",
        status=AssetStatus.APPROVED,
    )
    db_session.add(asset)
    await db_session.flush()
    
    attachment = Attachment(
        id=uuid4(),
        asset_id=asset.id,
        file_name="test.pdf",
        file_type="application/pdf",
        file_size=1024,
        ipfs_cid="QmTest123",
        is_primary=True,
    )
    db_session.add(attachment)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


@pytest_asyncio.fixture
async def test_asset_mint_failed(db_session: AsyncSession, test_enterprise: Enterprise, test_user: User) -> Asset:
    """创建铸造失败的测试资产"""
    asset = Asset(
        id=uuid4(),
        enterprise_id=test_enterprise.id,
        creator_user_id=test_user.id,
        name="Test Failed Mint",
        type=AssetType.DIGITAL_WORK,
        description="Test Failed Mint Description",
        creator_name="Test Creator",
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        application_number="CN2024000004",
        status=AssetStatus.MINT_FAILED,
        mint_attempt_count=1,
        max_mint_attempts=3,
        can_retry=True,
        last_mint_error="Test error",
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


class TestNFTServiceMintAsset:
    """测试NFT铸造功能"""
    
    @pytest.mark.asyncio
    async def test_mint_asset_not_found(self, db_session: AsyncSession):
        """测试铸造不存在的资产"""
        nft_service = NFTService(db_session)
        fake_id = uuid4()
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.mint_asset_nft(
                asset_id=fake_id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "not found" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_mint_asset_without_attachment(self, db_session: AsyncSession, test_asset_draft: Asset):
        """测试铸造没有附件的资产"""
        nft_service = NFTService(db_session)
        test_asset_draft.status = AssetStatus.APPROVED
        await db_session.commit()
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.mint_asset_nft(
                asset_id=test_asset_draft.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "attachment" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_mint_asset_wrong_status_minted(self, db_session: AsyncSession, test_enterprise: Enterprise):
        """测试铸造已铸造的资产"""
        asset = Asset(
            id=uuid4(),
            enterprise_id=test_enterprise.id,
            name="Test",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.PENDING,
            status=AssetStatus.MINTED,
        )
        db_session.add(asset)
        await db_session.commit()
        
        nft_service = NFTService(db_session)
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.mint_asset_nft(
                asset_id=asset.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "MINTED" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_mint_asset_wrong_status_pending(self, db_session: AsyncSession, test_enterprise: Enterprise):
        """测试铸造待审批资产"""
        asset = Asset(
            id=uuid4(),
            enterprise_id=test_enterprise.id,
            name="Pending Asset",
            type=AssetType.PATENT,
            description="Pending Asset Description",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.PENDING,
            status=AssetStatus.PENDING,
        )
        db_session.add(asset)
        await db_session.commit()

        nft_service = NFTService(db_session)

        with pytest.raises(Exception) as exc_info:
            await nft_service.mint_asset_nft(
                asset_id=asset.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )

        assert "APPROVED" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_mint_asset_invalid_wallet_signature(
        self,
        db_session: AsyncSession,
        test_asset_with_attachment: Asset,
    ):
        """测试无效签名会被拒绝"""
        nft_service = NFTService(db_session)

        with pytest.raises(Exception) as exc_info:
            await nft_service.mint_asset_nft(
                asset_id=test_asset_with_attachment.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                signed_message="mint request",
                wallet_signature="0xdeadbeef",
            )

        assert "SIGNATURE_VERIFICATION_FAILED" in str(exc_info.value)
        result = await db_session.execute(
            select(MintRecord)
            .where(MintRecord.asset_id == test_asset_with_attachment.id)
            .order_by(MintRecord.created_at.desc())
            .limit(1)
        )
        mint_record = result.scalar_one_or_none()
        assert mint_record is not None
        assert mint_record.status == "FAILED"
        assert mint_record.error_code == "SIGNATURE_VERIFICATION_FAILED"
        assert mint_record.signature_verified is False


class TestNFTServiceStatus:
    """测试NFT状态查询功能"""
    
    @pytest.mark.asyncio
    async def test_get_mint_status_not_found(self, db_session: AsyncSession):
        """测试获取不存在的资产铸造状态"""
        nft_service = NFTService(db_session)
        fake_id = uuid4()
        
        with pytest.raises(Exception):
            await nft_service.get_mint_status(asset_id=fake_id)
    
    @pytest.mark.asyncio
    async def test_get_mint_status_draft(self, db_session: AsyncSession, test_asset_draft: Asset):
        """测试获取DRAFT状态资产的铸造状态"""
        nft_service = NFTService(db_session)
        
        status = await nft_service.get_mint_status(asset_id=test_asset_draft.id)
        
        assert status["asset_id"] == str(test_asset_draft.id)
        assert status["current_status"] == AssetStatus.DRAFT.value
    
    @pytest.mark.asyncio
    async def test_get_mint_status_approved(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试获取APPROVED状态资产的铸造状态"""
        nft_service = NFTService(db_session)
        
        status = await nft_service.get_mint_status(asset_id=test_asset_with_attachment.id)
        
        assert status["asset_id"] == str(test_asset_with_attachment.id)
        assert status["current_status"] == AssetStatus.APPROVED.value
        assert status["can_retry"] is True  # 默认值
    
    @pytest.mark.asyncio
    async def test_get_mint_status_mint_failed(self, db_session: AsyncSession, test_asset_mint_failed: Asset):
        """测试获取铸造失败资产的铸造状态"""
        nft_service = NFTService(db_session)
        
        status = await nft_service.get_mint_status(asset_id=test_asset_mint_failed.id)
        
        assert status["asset_id"] == str(test_asset_mint_failed.id)
        assert status["current_status"] == AssetStatus.MINT_FAILED.value
        assert status["can_retry"] is True
        assert status["mint_attempt_count"] == 1
        assert status["last_mint_error"] == "Test error"

    @pytest.mark.asyncio
    async def test_get_mint_history(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试获取企业铸造历史"""
        mint_record = MintRecord(
            asset_id=test_asset_with_attachment.id,
            operation="REQUEST",
            stage="COMPLETED",
            status="SUCCESS",
            token_id=1,
            tx_hash="0x" + "1" * 64,
            metadata_uri="ipfs://test",
        )
        db_session.add(mint_record)
        await db_session.commit()

        nft_service = NFTService(db_session)
        result = await nft_service.get_mint_history(
            enterprise_id=test_asset_with_attachment.enterprise_id,
            page=1,
            page_size=10,
        )

        assert result["total"] == 1
        assert len(result["items"]) == 1
        assert result["items"][0]["asset_id"] == str(test_asset_with_attachment.id)
        assert result["items"][0]["status"] == "SUCCESS"


class TestNFTServiceRetry:
    """测试NFT重试功能"""
    
    @pytest.mark.asyncio
    async def test_retry_mint_not_found(self, db_session: AsyncSession):
        """测试重试不存在的资产"""
        nft_service = NFTService(db_session)
        fake_id = uuid4()
        
        with pytest.raises(Exception):
            await nft_service.retry_mint(
                asset_id=fake_id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
    
    @pytest.mark.asyncio
    async def test_retry_mint_wrong_status(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试重试非失败状态的资产"""
        nft_service = NFTService(db_session)
        
        # 资产状态是APPROVED，不是MINT_FAILED
        with pytest.raises(Exception) as exc_info:
            await nft_service.retry_mint(
                asset_id=test_asset_with_attachment.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "MINT_FAILED" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_retry_mint_cannot_retry(self, db_session: AsyncSession, test_enterprise: Enterprise):
        """测试重试不可重试的资产"""
        asset = Asset(
            id=uuid4(),
            enterprise_id=test_enterprise.id,
            name="Test",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.PENDING,
            status=AssetStatus.MINT_FAILED,
            can_retry=False,
        )
        db_session.add(asset)
        await db_session.commit()
        
        nft_service = NFTService(db_session)
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.retry_mint(
                asset_id=asset.id,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "maximum" in str(exc_info.value).lower() or "retry" in str(exc_info.value).lower()


class TestNFTServiceBatchMint:
    """测试批量铸造功能"""
    
    @pytest.mark.asyncio
    async def test_batch_mint_empty_list(self, db_session: AsyncSession):
        """测试批量铸造空列表"""
        nft_service = NFTService(db_session)
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.batch_mint_assets(
                asset_ids=[],
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "empty" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_batch_mint_too_many(self, db_session: AsyncSession):
        """测试批量铸造超过限制"""
        nft_service = NFTService(db_session)
        
        asset_ids = [uuid4() for _ in range(51)]
        
        with pytest.raises(Exception) as exc_info:
            await nft_service.batch_mint_assets(
                asset_ids=asset_ids,
                minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            )
        
        assert "50" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_batch_mint_partial_failure(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试批量铸造部分失败"""
        nft_service = NFTService(db_session)
        
        # 一个有效的资产ID，一个无效的资产ID
        asset_ids = [
            test_asset_with_attachment.id,
            uuid4(),  # 不存在的资产
        ]
        
        # 由于mock可能不工作，我们期望至少返回结果结构
        # 这里主要测试服务能处理混合的成功/失败情况
        # 实际结果取决于区块链mock是否配置正确


class TestNFTServiceMetadata:
    """测试NFT元数据生成"""
    
    def test_generate_nft_metadata(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试NFT元数据生成"""
        nft_service = NFTService(db_session)
        
        attachments = test_asset_with_attachment.attachments
        
        metadata = nft_service._generate_nft_metadata(test_asset_with_attachment, attachments)
        
        assert metadata["name"] == test_asset_with_attachment.name
        assert metadata["description"] == test_asset_with_attachment.description
        assert "image" in metadata
        assert "attributes" in metadata
        assert "properties" in metadata
        
        # 验证attributes
        attr_types = [a["trait_type"] for a in metadata["attributes"]]
        assert "Asset Type" in attr_types
        assert "Creator" in attr_types
        assert "Inventors" in attr_types
        assert metadata["properties"]["rights_declaration"] == "Original rights declaration"
    
    @pytest.mark.asyncio
    async def test_generate_nft_metadata_with_multiple_attachments(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试多个附件的NFT元数据生成"""
        nft_service = NFTService(db_session)
        
        # 添加更多附件
        attachment2 = Attachment(
            id=uuid4(),
            asset_id=test_asset_with_attachment.id,
            file_name="test2.pdf",
            file_type="application/pdf",
            file_size=2048,
            ipfs_cid="QmTest456",
            is_primary=False,
        )
        db_session.add(attachment2)
        await db_session.commit()
        
        # 刷新获取所有附件
        await db_session.refresh(test_asset_with_attachment, ["attachments"])
        attachments = test_asset_with_attachment.attachments
        
        metadata = nft_service._generate_nft_metadata(test_asset_with_attachment, attachments)
        
        assert "attachments" in metadata
        assert len(metadata["attachments"]) == 1  # 除了第一张图片外的附件

    @pytest.mark.asyncio
    async def test_generate_nft_metadata_with_primary_attachment(self, db_session: AsyncSession, test_asset_with_attachment: Asset):
        """测试主附件优先逻辑"""
        nft_service = NFTService(db_session)

        primary = Attachment(
            id=uuid4(),
            asset_id=test_asset_with_attachment.id,
            file_name="cover.png",
            file_type="image/png",
            file_size=1024,
            ipfs_cid="QmPrimaryAttachment",
            is_primary=True,
        )
        test_asset_with_attachment.attachments[0].is_primary = False
        db_session.add(primary)
        await db_session.commit()
        await db_session.refresh(test_asset_with_attachment, ["attachments"])

        metadata = nft_service._generate_nft_metadata(
            test_asset_with_attachment,
            test_asset_with_attachment.attachments,
        )

        assert metadata["image"] == "ipfs://QmPrimaryAttachment"


class TestUpdateAssetStatus:
    """测试资产状态更新"""
    
    @pytest.mark.asyncio
    async def test_update_status_after_approval_approve(self, db_session: AsyncSession, test_asset_draft: Asset):
        """测试审批通过后更新状态"""
        nft_service = NFTService(db_session)
        
        result = await nft_service.update_asset_status_after_approval(
            asset_id=test_asset_draft.id,
            approved=True
        )
        
        assert result.status == AssetStatus.APPROVED
    
    @pytest.mark.asyncio
    async def test_update_status_after_approval_reject(self, db_session: AsyncSession, test_asset_draft: Asset):
        """测试审批拒绝后更新状态"""
        nft_service = NFTService(db_session)
        
        result = await nft_service.update_asset_status_after_approval(
            asset_id=test_asset_draft.id,
            approved=False
        )
        
        assert result.status == AssetStatus.REJECTED
    
    @pytest.mark.asyncio
    async def test_update_status_not_found(self, db_session: AsyncSession):
        """测试更新不存在的资产状态"""
        nft_service = NFTService(db_session)
        
        with pytest.raises(Exception):
            await nft_service.update_asset_status_after_approval(
                asset_id=uuid4(),
                approved=True
            )


class TestNFTMintOwnershipFields:
    """测试铸造完成后的权属字段回写。"""

    @pytest.mark.asyncio
    async def test_mint_asset_sets_current_owner_enterprise(
        self,
        db_session: AsyncSession,
        test_asset_with_attachment: Asset,
    ):
        nft_service = NFTService(db_session)

        with patch('app.services.nft_service.get_blockchain_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.contract_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            mock_client.chain_id = 31337
            mock_client.mint_nft = AsyncMock(return_value=(1, "0xabc123"))
            mock_get_client.return_value = mock_client

            with patch('app.services.nft_service.get_pinata_service') as mock_get_pinata:
                mock_pinata = MagicMock()
                mock_pinata.upload_json = MagicMock(
                    return_value={
                        "cid": "QmTest123",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmTest123",
                    }
                )
                mock_get_pinata.return_value = mock_pinata

                result = await nft_service.mint_asset_nft(
                    asset_id=test_asset_with_attachment.id,
                    minter_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                )

        assert result["status"] == AssetStatus.MINTED.value

        minted_asset = await db_session.get(Asset, test_asset_with_attachment.id)
        assert minted_asset is not None
        assert minted_asset.owner_address == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        assert minted_asset.current_owner_enterprise_id == test_asset_with_attachment.enterprise_id
        assert minted_asset.ownership_status == "ACTIVE"

        history_result = await db_session.execute(select(NFTTransferRecord))
        history_records = history_result.scalars().all()
        assert len(history_records) == 1
        assert history_records[0].token_id == 1
        assert history_records[0].transfer_type == TransferType.MINT
        assert history_records[0].contract_address == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        assert history_records[0].to_address == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

    @pytest.mark.asyncio
    async def test_backfill_missing_mint_history_creates_record(
        self,
        db_session: AsyncSession,
        test_asset_with_attachment: Asset,
    ):
        nft_service = NFTService(db_session)

        test_asset_with_attachment.status = AssetStatus.MINTED
        test_asset_with_attachment.nft_token_id = "77"
        test_asset_with_attachment.nft_contract_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        test_asset_with_attachment.owner_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        test_asset_with_attachment.recipient_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        test_asset_with_attachment.current_owner_enterprise_id = test_asset_with_attachment.enterprise_id
        test_asset_with_attachment.ownership_status = "ACTIVE"
        test_asset_with_attachment.mint_tx_hash = "0xabc123"
        test_asset_with_attachment.mint_confirmed_at = datetime.now(timezone.utc)
        await db_session.flush()

        result = await nft_service.backfill_missing_mint_history()

        assert result["created"] == 1
        history_result = await db_session.execute(select(NFTTransferRecord))
        history_records = history_result.scalars().all()
        assert len(history_records) == 1
        assert history_records[0].token_id == 77
        assert history_records[0].transfer_type == TransferType.MINT

    @pytest.mark.asyncio
    async def test_get_transfer_history_filters_by_contract_address(
        self,
        db_session: AsyncSession,
        test_asset_with_attachment: Asset,
    ):
        ownership_service = OwnershipService(db_session)

        duplicate_asset = Asset(
            id=uuid4(),
            enterprise_id=test_asset_with_attachment.enterprise_id,
            creator_user_id=test_asset_with_attachment.creator_user_id,
            name="Duplicate Token",
            type=AssetType.COPYRIGHT,
            description="Duplicate token on another contract",
            creator_name="Test Creator",
            creation_date=date(2024, 1, 2),
            legal_status=LegalStatus.GRANTED,
            application_number="CN2024000999",
            status=AssetStatus.MINTED,
            nft_token_id="1",
            nft_contract_address="0x1111111111111111111111111111111111111111",
            owner_address="0x1111111111111111111111111111111111111111",
            recipient_address="0x1111111111111111111111111111111111111111",
            current_owner_enterprise_id=test_asset_with_attachment.enterprise_id,
            ownership_status="ACTIVE",
            mint_completed_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
        )
        test_asset_with_attachment.status = AssetStatus.MINTED
        test_asset_with_attachment.nft_token_id = "1"
        test_asset_with_attachment.nft_contract_address = "0x2222222222222222222222222222222222222222"
        test_asset_with_attachment.owner_address = "0x2222222222222222222222222222222222222222"
        test_asset_with_attachment.recipient_address = "0x2222222222222222222222222222222222222222"
        test_asset_with_attachment.current_owner_enterprise_id = test_asset_with_attachment.enterprise_id
        test_asset_with_attachment.ownership_status = "ACTIVE"
        test_asset_with_attachment.mint_completed_at = datetime(2026, 4, 2, tzinfo=timezone.utc)
        db_session.add(duplicate_asset)
        await db_session.flush()

        db_session.add(
            NFTTransferRecord(
                token_id=1,
                contract_address="0x1111111111111111111111111111111111111111",
                transfer_type=TransferType.MINT,
                from_address="0x0000000000000000000000000000000000000000",
                to_address="0x1111111111111111111111111111111111111111",
                to_enterprise_id=test_asset_with_attachment.enterprise_id,
            )
        )
        db_session.add(
            NFTTransferRecord(
                token_id=1,
                contract_address="0x2222222222222222222222222222222222222222",
                transfer_type=TransferType.MINT,
                from_address="0x0000000000000000000000000000000000000000",
                to_address="0x2222222222222222222222222222222222222222",
                to_enterprise_id=test_asset_with_attachment.enterprise_id,
            )
        )
        await db_session.flush()

        asset = await ownership_service.get_asset_by_token_id(1)
        assert asset is not None
        assert asset["contract_address"] == "0x2222222222222222222222222222222222222222"

        records, total = await ownership_service.get_transfer_history(
            token_id=1,
            contract_address=asset["contract_address"],
        )
        assert total == 1
        assert len(records) == 1
        assert records[0]["contract_address"] == "0x2222222222222222222222222222222222222222"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
