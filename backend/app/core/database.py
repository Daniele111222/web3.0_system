import importlib
import sys
from typing import AsyncGenerator
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

ERROR_DIVIDER = "=" * 80

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

SessionLocal = async_sessionmaker(
    engine,
    autoflush=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with SessionLocal() as db:
        yield db


def _print_db_unicode_error() -> None:
    """Print a helpful message when database connection decoding fails on Windows."""
    print("\n" + ERROR_DIVIDER, file=sys.stderr)
    print("ERROR: Database connection failed with UnicodeDecodeError.", file=sys.stderr)
    print("This usually happens on Windows when the database password is wrong or the database does not exist.", file=sys.stderr)
    print("PostgreSQL is returning a localized error message (e.g. in Chinese) that cannot be decoded.", file=sys.stderr)
    print("Please check your database password and ensure the database exists.", file=sys.stderr)
    print("You can configure the connection URL in the .env file.", file=sys.stderr)
    print(ERROR_DIVIDER + "\n", file=sys.stderr)


async def init_db() -> None:
    """Initialize database tables."""
    try:
        importlib.import_module("app.models")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except UnicodeDecodeError as e:
        _print_db_unicode_error()
        raise RuntimeError("Database connection failed. Please check your password and database name in .env") from e
    except Exception as e:
        print(f"Database initialization failed: {e}", file=sys.stderr)
        raise
