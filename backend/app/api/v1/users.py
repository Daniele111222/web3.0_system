from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user():
    """Get current user profile."""
    # TODO: Implement
    return {"message": "Get current user endpoint - to be implemented"}


@router.put("/me")
async def update_current_user():
    """Update current user profile."""
    # TODO: Implement
    return {"message": "Update current user endpoint - to be implemented"}
