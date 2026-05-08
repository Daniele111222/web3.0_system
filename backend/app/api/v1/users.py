from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CurrentUserId, DBSession
from app.schemas.auth import UserProfileUpdateRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: CurrentUserId,
    db: DBSession,
) -> UserResponse:
    """Get current user profile."""
    auth_service = AuthService(db)
    return await auth_service.get_current_user(UUID(user_id))


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    data: UserProfileUpdateRequest,
    user_id: CurrentUserId,
    db: DBSession,
) -> UserResponse:
    """Update current user profile."""
    auth_service = AuthService(db)
    result = await auth_service.update_current_user(UUID(user_id), data)
    await db.commit()
    return result
