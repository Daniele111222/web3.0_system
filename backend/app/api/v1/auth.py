from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register():
    """Register a new user."""
    # TODO: Implement in Task 2.5
    return {"message": "Registration endpoint - to be implemented"}


@router.post("/login")
async def login():
    """Login with email and password."""
    # TODO: Implement in Task 2.7
    return {"message": "Login endpoint - to be implemented"}


@router.post("/bind-wallet")
async def bind_wallet():
    """Bind a blockchain wallet to user account."""
    # TODO: Implement in Task 2.8
    return {"message": "Bind wallet endpoint - to be implemented"}


@router.post("/refresh")
async def refresh_token():
    """Refresh access token."""
    # TODO: Implement in Task 2.2
    return {"message": "Refresh token endpoint - to be implemented"}
