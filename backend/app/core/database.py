from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

SessionLocal = async_sessionmaker(
    engine,
    autocommit=False,
    autoflush=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db():
    """Dependency to get database session."""
    async with SessionLocal() as db:
        yield db


async def init_db():
    """Initialize database tables."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except UnicodeDecodeError as e:
        import sys
        print("\n" + "="*80, file=sys.stderr)
        print("ERROR: Database connection failed with UnicodeDecodeError.", file=sys.stderr)
        print("This usually happens on Windows when the database password is wrong or the database does not exist.", file=sys.stderr)
        print("PostgreSQL is returning a localized error message (e.g. in Chinese) that cannot be decoded.", file=sys.stderr)
        print("Please check your database password and ensure the database 'ipnft_db' exists.", file=sys.stderr)
        print("You can configure the connection URL in the .env file.", file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        raise RuntimeError("Database connection failed. Please check your password and database name in .env") from e
    except Exception as e:
        import sys
        print(f"Database initialization failed: {e}", file=sys.stderr)
        raise
