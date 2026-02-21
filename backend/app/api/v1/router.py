from fastapi import APIRouter
from app.api.v1 import auth, users, enterprises, assets, nft, dashboard, approvals, ipfs, contracts, ownership
from app.api.v1.asset_with_attachments import router as asset_with_attachments_router

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(enterprises.router)
api_router.include_router(assets.router)
api_router.include_router(nft.router)
api_router.include_router(dashboard.router)
api_router.include_router(approvals.router)
api_router.include_router(ipfs.router)
api_router.include_router(contracts.router)
api_router.include_router(ownership.router)

# Include new IPFS auto-upload router
api_router.include_router(asset_with_attachments_router)
