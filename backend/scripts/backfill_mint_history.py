import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal, close_db
from app.services.nft_service import NFTService


async def main() -> None:
    async with SessionLocal() as db:
        service = NFTService(db)
        result = await service.backfill_missing_mint_history()
        await db.commit()
        print(result)

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
