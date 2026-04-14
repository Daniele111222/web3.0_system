from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.approval import Approval, ApprovalStatus, ApprovalType
from app.models.asset import Asset, AssetStatus, Attachment, AssetType, LegalStatus
from app.models.enterprise import Enterprise, EnterpriseMember, MemberRole
from app.models.user import User


def build_auth_headers(user_id: str) -> dict[str, str]:
    token = create_access_token({"sub": user_id})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_submit_asset_for_approval_api_returns_201(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    user = User(
        id=uuid4(),
        email="approval-api-submit@example.com",
        username="approval_api_submit",
        hashed_password="hashed_password",
    )
    enterprise = Enterprise(id=uuid4(), name="Approval API Enterprise")
    membership = EnterpriseMember(
        id=uuid4(),
        enterprise_id=enterprise.id,
        user_id=user.id,
        role=MemberRole.OWNER,
    )
    asset = Asset(
        id=uuid4(),
        enterprise_id=enterprise.id,
        creator_user_id=user.id,
        name="Approval API Asset",
        type=AssetType.TRADEMARK,
        description="Approval API Asset Description",
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
        ipfs_cid="QmApprovalApiSubmit123456789012345678901234567890123",
        is_primary=True,
    )
    db_session.add_all([user, enterprise, membership, asset, attachment])
    await db_session.commit()

    response = await client.post(
        f"/api/v1/assets/{asset.id}/submit",
        json={"remarks": "接口测试提交审批"},
        headers=build_auth_headers(str(user.id)),
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["code"] == "SUCCESS"
    assert payload["data"]["asset_id"] == str(asset.id)
    assert payload["data"]["status"] == AssetStatus.PENDING.value
    assert payload["data"]["approval_id"]


@pytest.mark.asyncio
async def test_get_approval_history_api_returns_processed_records(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    user = User(
        id=uuid4(),
        email="approval-api-history@example.com",
        username="approval_api_history",
        hashed_password="hashed_password",
    )
    approval = Approval(
        id=uuid4(),
        type=ApprovalType.ASSET_SUBMIT,
        target_id=uuid4(),
        target_type="asset",
        applicant_id=user.id,
        status=ApprovalStatus.APPROVED,
        current_step=1,
        total_steps=1,
        remarks="审批历史接口测试",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    db_session.add_all([user, approval])
    await db_session.commit()

    response = await client.get(
        "/api/v1/approvals/history",
        params={"page": 1, "page_size": 20},
        headers=build_auth_headers(str(user.id)),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == "SUCCESS"
    assert payload["data"]["total"] == 1
    assert payload["data"]["items"][0]["id"] == str(approval.id)
    assert payload["data"]["items"][0]["status"] == ApprovalStatus.APPROVED.value
