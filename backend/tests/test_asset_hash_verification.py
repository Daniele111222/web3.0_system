import hashlib
from datetime import date
from uuid import uuid4
from unittest.mock import MagicMock, patch

import pytest
import requests
from fastapi import HTTPException

from app.models.asset import Asset, AssetStatus, AssetType, Attachment, LegalStatus
from app.models.enterprise import Enterprise
from app.services.asset_service import AssetService
from app.repositories.asset_repository import AssetRepository


@pytest.mark.asyncio
async def test_verify_attachment_hash_matched(db_session):
    enterprise = Enterprise(
        id=uuid4(),
        name="Hash Enterprise",
        description="Hash Enterprise Description",
        address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    )
    db_session.add(enterprise)

    asset = Asset(
        id=uuid4(),
        enterprise_id=enterprise.id,
        name="Code Asset",
        type=AssetType.DIGITAL_WORK,
        description="Code Asset Description",
        creator_name="Creator",
        inventors=["Creator"],
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        status=AssetStatus.DRAFT,
        asset_metadata={},
    )
    db_session.add(asset)
    await db_session.flush()

    attachment = Attachment(
        id=uuid4(),
        asset_id=asset.id,
        file_name="source.zip",
        file_type="application/zip",
        file_size=1024,
        ipfs_cid="QmHashVerify123456789012345678901234567890123456",
        is_primary=True,
    )
    db_session.add(attachment)
    await db_session.commit()

    content = b"hash-content"
    client_sha256 = hashlib.sha256(content).hexdigest()
    response = MagicMock()
    response.content = content
    response.raise_for_status.return_value = None

    service = AssetService(AssetRepository(db_session))
    with patch("app.services.asset_service.requests.get", return_value=response):
        result = await service.verify_attachment_hash(
            asset_id=asset.id,
            enterprise_id=enterprise.id,
            attachment_id=attachment.id,
            client_sha256=client_sha256,
        )

    assert result["matched"] is True
    await db_session.refresh(asset)
    verification = asset.asset_metadata["hash_verification"][str(attachment.id)]
    assert verification["matched"] is True
    assert verification["server_sha256"] == client_sha256


@pytest.mark.asyncio
async def test_verify_attachment_hash_gateway_error(db_session):
    enterprise = Enterprise(
        id=uuid4(),
        name="Hash Enterprise",
        description="Hash Enterprise Description",
        address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    )
    db_session.add(enterprise)

    asset = Asset(
        id=uuid4(),
        enterprise_id=enterprise.id,
        name="Code Asset",
        type=AssetType.DIGITAL_WORK,
        description="Code Asset Description",
        creator_name="Creator",
        inventors=["Creator"],
        creation_date=date(2024, 1, 1),
        legal_status=LegalStatus.PENDING,
        status=AssetStatus.DRAFT,
        asset_metadata={},
    )
    db_session.add(asset)
    await db_session.flush()

    attachment = Attachment(
        id=uuid4(),
        asset_id=asset.id,
        file_name="source.zip",
        file_type="application/zip",
        file_size=1024,
        ipfs_cid="QmHashVerify123456789012345678901234567890123457",
        is_primary=True,
    )
    db_session.add(attachment)
    await db_session.commit()

    service = AssetService(AssetRepository(db_session))
    with patch("app.services.asset_service.requests.get", side_effect=requests.RequestException("gateway error")):
        with pytest.raises(HTTPException) as exc_info:
            await service.verify_attachment_hash(
                asset_id=asset.id,
                enterprise_id=enterprise.id,
                attachment_id=attachment.id,
                client_sha256=hashlib.sha256(b"hash-content").hexdigest(),
            )
    assert exc_info.value.status_code == 502
