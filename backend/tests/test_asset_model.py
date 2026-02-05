"""Asset 和 Attachment 模型测试。"""
import pytest
from datetime import datetime, timezone, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.enterprise import Enterprise
from app.models.asset import Asset, Attachment, AssetType, LegalStatus, AssetStatus


@pytest.mark.anyio
class TestAssetModel:
    """Asset 模型测试类。"""

    async def test_create_asset(self, db_session: AsyncSession):
        """测试创建资产。"""
        enterprise = Enterprise(name="Asset Test Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="assetuser@example.com",
            hashed_password="password",
            username="assetuser",
        )
        db_session.add(user)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            creator_user_id=user.id,
            name="Test Patent",
            type=AssetType.PATENT,
            description="A test patent asset",
            creator_name="John Doe",
            creation_date=date(2024, 1, 15),
            legal_status=LegalStatus.PENDING,
            asset_metadata={"key": "value"},
        )
        db_session.add(asset)
        await db_session.commit()
        await db_session.refresh(asset)

        assert asset.id is not None
        assert asset.name == "Test Patent"
        assert asset.type == AssetType.PATENT
        assert asset.description == "A test patent asset"
        assert asset.creator_name == "John Doe"
        assert asset.creation_date == date(2024, 1, 15)
        assert asset.legal_status == LegalStatus.PENDING
        assert asset.asset_metadata == {"key": "value"}
        assert asset.status == AssetStatus.DRAFT
        assert asset.created_at is not None
        assert asset.updated_at is not None

    async def test_asset_default_values(self, db_session: AsyncSession):
        """测试资产默认值。"""
        enterprise = Enterprise(name="Default Asset Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Default Asset",
            type=AssetType.COPYRIGHT,
            description="Default description",
            creator_name="Jane Doe",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        assert asset.status == AssetStatus.DRAFT
        assert asset.creator_user_id is None
        assert asset.nft_token_id is None
        assert asset.nft_contract_address is None
        assert asset.nft_chain is None
        assert asset.metadata_uri is None
        assert asset.mint_tx_hash is None
        assert asset.application_number is None

    async def test_asset_with_nft(self, db_session: AsyncSession):
        """测试带 NFT 信息的资产。"""
        enterprise = Enterprise(name="NFT Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="NFT Asset",
            type=AssetType.DIGITAL_WORK,
            description="An NFT asset",
            creator_name="Artist",
            creation_date=date(2024, 2, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={"ipfs": "cid123"},
            status=AssetStatus.MINTED,
            nft_token_id="12345",
            nft_contract_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            nft_chain="ethereum",
            metadata_uri="ipfs://cid123",
            mint_tx_hash="0xabc123...",
        )
        db_session.add(asset)
        await db_session.commit()

        assert asset.status == AssetStatus.MINTED
        assert asset.nft_token_id == "12345"
        assert asset.nft_contract_address == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        assert asset.nft_chain == "ethereum"
        assert asset.metadata_uri == "ipfs://cid123"

    async def test_asset_enterprise_relationship(self, db_session: AsyncSession):
        """测试资产与企业的关系。"""
        enterprise = Enterprise(name="Relation Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Relation Asset",
            type=AssetType.TRADEMARK,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()
        await db_session.refresh(asset)

        assert asset.enterprise is not None
        assert asset.enterprise.id == enterprise.id
        assert asset.enterprise.name == enterprise.name

    async def test_asset_creator_relationship(self, db_session: AsyncSession):
        """测试资产与创建者的关系。"""
        enterprise = Enterprise(name="Creator Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        user = User(
            email="creator@example.com",
            hashed_password="password",
            username="creatoruser",
        )
        db_session.add(user)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            creator_user_id=user.id,
            name="Creator Asset",
            type=AssetType.TRADE_SECRET,
            description="Secret",
            creator_name="Secret Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()
        await db_session.refresh(asset)

        assert asset.creator is not None
        assert asset.creator.id == user.id
        assert asset.creator.email == user.email

    async def test_asset_attachments_relationship(self, db_session: AsyncSession):
        """测试资产与附件的关系。"""
        enterprise = Enterprise(name="Attachment Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset with Attachments",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment1 = Attachment(
            asset_id=asset.id,
            file_name="document.pdf",
            file_type="application/pdf",
            file_size=1024,
            ipfs_cid="QmHash1",
        )
        attachment2 = Attachment(
            asset_id=asset.id,
            file_name="image.png",
            file_type="image/png",
            file_size=2048,
            ipfs_cid="QmHash2",
        )
        db_session.add_all([attachment1, attachment2])
        await db_session.commit()
        await db_session.refresh(asset)

        assert len(asset.attachments) == 2
        file_names = [a.file_name for a in asset.attachments]
        assert "document.pdf" in file_names
        assert "image.png" in file_names

    async def test_asset_type_enum_values(self):
        """测试资产类型枚举值。"""
        assert AssetType.PATENT == "PATENT"
        assert AssetType.TRADEMARK == "TRADEMARK"
        assert AssetType.COPYRIGHT == "COPYRIGHT"
        assert AssetType.TRADE_SECRET == "TRADE_SECRET"
        assert AssetType.DIGITAL_WORK == "DIGITAL_WORK"

    async def test_legal_status_enum_values(self):
        """测试法律状态枚举值。"""
        assert LegalStatus.PENDING == "PENDING"
        assert LegalStatus.GRANTED == "GRANTED"
        assert LegalStatus.EXPIRED == "EXPIRED"

    async def test_asset_status_enum_values(self):
        """测试资产状态枚举值。"""
        assert AssetStatus.DRAFT == "DRAFT"
        assert AssetStatus.MINTED == "MINTED"
        assert AssetStatus.TRANSFERRED == "TRANSFERRED"
        assert AssetStatus.LICENSED == "LICENSED"
        assert AssetStatus.STAKED == "STAKED"

    async def test_asset_repr(self, db_session: AsyncSession):
        """测试资产对象的字符串表示。"""
        enterprise = Enterprise(name="Repr Asset Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Repr Asset",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()
        await db_session.refresh(asset)

        repr_str = repr(asset)
        assert "Asset" in repr_str
        assert str(asset.id) in repr_str
        assert asset.name in repr_str
        assert asset.type.value in repr_str

    async def test_asset_query_by_enterprise(self, db_session: AsyncSession):
        """测试通过企业查询资产。"""
        enterprise = Enterprise(name="Query Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset1 = Asset(
            enterprise_id=enterprise.id,
            name="Asset 1",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
            status=AssetStatus.DRAFT,
        )
        asset2 = Asset(
            enterprise_id=enterprise.id,
            name="Asset 2",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 2, 1),
            legal_status=LegalStatus.PENDING,
            asset_metadata={},
            status=AssetStatus.MINTED,
        )
        db_session.add_all([asset1, asset2])
        await db_session.commit()

        result = await db_session.execute(
            select(Asset).where(Asset.enterprise_id == enterprise.id)
        )
        assets = result.scalars().all()

        assert len(assets) == 2

    async def test_asset_query_by_status(self, db_session: AsyncSession):
        """测试通过状态查询资产。"""
        enterprise = Enterprise(name="Status Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset1 = Asset(
            enterprise_id=enterprise.id,
            name="Draft Asset",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
            status=AssetStatus.DRAFT,
        )
        asset2 = Asset(
            enterprise_id=enterprise.id,
            name="Minted Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 2, 1),
            legal_status=LegalStatus.PENDING,
            asset_metadata={},
            status=AssetStatus.MINTED,
        )
        db_session.add_all([asset1, asset2])
        await db_session.commit()

        result = await db_session.execute(
            select(Asset).where(
                Asset.enterprise_id == enterprise.id,
                Asset.status == AssetStatus.MINTED
            )
        )
        assets = result.scalars().all()

        assert len(assets) == 1
        assert assets[0].name == "Minted Asset"

    async def test_asset_cascade_delete_attachments(self, db_session: AsyncSession):
        """测试删除资产时级联删除附件。"""
        enterprise = Enterprise(name="Cascade Asset Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Cascade Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment = Attachment(
            asset_id=asset.id,
            file_name="test.pdf",
            file_type="application/pdf",
            file_size=1024,
            ipfs_cid="QmTest",
        )
        db_session.add(attachment)
        await db_session.commit()

        # 删除资产
        await db_session.delete(asset)
        await db_session.commit()

        # 验证附件也被删除
        result = await db_session.execute(
            select(Attachment).where(Attachment.ipfs_cid == "QmTest")
        )
        assert result.scalar_one_or_none() is None


@pytest.mark.anyio
class TestAttachmentModel:
    """Attachment 模型测试类。"""

    async def test_create_attachment(self, db_session: AsyncSession):
        """测试创建附件。"""
        enterprise = Enterprise(name="Attachment Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset with Attachment",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment = Attachment(
            asset_id=asset.id,
            file_name="document.pdf",
            file_type="application/pdf",
            file_size=1024567,
            ipfs_cid="QmUniqueHash123",
        )
        db_session.add(attachment)
        await db_session.commit()
        await db_session.refresh(attachment)

        assert attachment.id is not None
        assert attachment.asset_id == asset.id
        assert attachment.file_name == "document.pdf"
        assert attachment.file_type == "application/pdf"
        assert attachment.file_size == 1024567
        assert attachment.ipfs_cid == "QmUniqueHash123"
        assert attachment.uploaded_at is not None

    async def test_attachment_unique_cid(self, db_session: AsyncSession):
        """测试 IPFS CID 唯一性约束。"""
        enterprise = Enterprise(name="Unique CID Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset1 = Asset(
            enterprise_id=enterprise.id,
            name="Asset 1",
            type=AssetType.PATENT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        asset2 = Asset(
            enterprise_id=enterprise.id,
            name="Asset 2",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 2, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add_all([asset1, asset2])
        await db_session.commit()

        attachment1 = Attachment(
            asset_id=asset1.id,
            file_name="file1.pdf",
            file_type="application/pdf",
            file_size=1000,
            ipfs_cid="QmDuplicate",
        )
        db_session.add(attachment1)
        await db_session.commit()

        attachment2 = Attachment(
            asset_id=asset2.id,
            file_name="file2.pdf",
            file_type="image/png",
            file_size=2000,
            ipfs_cid="QmDuplicate",
        )
        db_session.add(attachment2)
        with pytest.raises(Exception):
            await db_session.commit()
        await db_session.rollback()

    async def test_attachment_asset_relationship(self, db_session: AsyncSession):
        """测试附件与资产的关系。"""
        enterprise = Enterprise(name="Relation Attachment Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment = Attachment(
            asset_id=asset.id,
            file_name="relation.pdf",
            file_type="application/pdf",
            file_size=5000,
            ipfs_cid="QmRelation",
        )
        db_session.add(attachment)
        await db_session.commit()
        await db_session.refresh(attachment)

        assert attachment.asset is not None
        assert attachment.asset.id == asset.id
        assert attachment.asset.name == asset.name

    async def test_attachment_repr(self, db_session: AsyncSession):
        """测试附件对象的字符串表示。"""
        enterprise = Enterprise(name="Repr Attachment Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment = Attachment(
            asset_id=asset.id,
            file_name="repr.pdf",
            file_type="application/pdf",
            file_size=3000,
            ipfs_cid="QmRepr",
        )
        db_session.add(attachment)
        await db_session.commit()
        await db_session.refresh(attachment)

        repr_str = repr(attachment)
        assert "Attachment" in repr_str
        assert str(attachment.id) in repr_str
        assert attachment.file_name in repr_str
        assert attachment.ipfs_cid in repr_str

    async def test_attachment_query_by_cid(self, db_session: AsyncSession):
        """测试通过 CID 查询附件。"""
        enterprise = Enterprise(name="CID Query Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        attachment = Attachment(
            asset_id=asset.id,
            file_name="query.pdf",
            file_type="application/pdf",
            file_size=4000,
            ipfs_cid="QmQuery123",
        )
        db_session.add(attachment)
        await db_session.commit()

        result = await db_session.execute(
            select(Attachment).where(Attachment.ipfs_cid == "QmQuery123")
        )
        found_attachment = result.scalar_one_or_none()

        assert found_attachment is not None
        assert found_attachment.ipfs_cid == "QmQuery123"

    async def test_attachment_large_file(self, db_session: AsyncSession):
        """测试大文件附件。"""
        enterprise = Enterprise(name="Large File Enterprise")
        db_session.add(enterprise)
        await db_session.commit()

        asset = Asset(
            enterprise_id=enterprise.id,
            name="Asset",
            type=AssetType.COPYRIGHT,
            description="Test",
            creator_name="Creator",
            creation_date=date(2024, 1, 1),
            legal_status=LegalStatus.GRANTED,
            asset_metadata={},
        )
        db_session.add(asset)
        await db_session.commit()

        large_size = 10 * 1024 * 1024 * 1024  # 10 GB
        attachment = Attachment(
            asset_id=asset.id,
            file_name="large.bin",
            file_type="application/octet-stream",
            file_size=large_size,
            ipfs_cid="QmLargeFile",
        )
        db_session.add(attachment)
        await db_session.commit()
        await db_session.refresh(attachment)

        assert attachment.file_size == large_size
