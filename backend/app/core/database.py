import importlib
import logging
import sys
from datetime import datetime
from typing import AsyncGenerator, Any
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# 配置日志记录器
logger = logging.getLogger(__name__)

ERROR_DIVIDER = "=" * 80

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # 验证连接有效性，防止使用已断开连接
)

SessionLocal = async_sessionmaker(
    engine,
    autoflush=False,
    class_=AsyncSession,
    expire_on_commit=False,  # 提交后对象不会过期，便于后续使用
)


class Base(DeclarativeBase):
    """所有数据库模型的基类，包含时间戳字段。"""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的依赖函数。"""
    async with SessionLocal() as db:
        try:
            yield db
        except Exception:
            await db.rollback()
            raise
        finally:
            await db.close()


def _print_db_unicode_error() -> None:
    """当 Windows 上数据库连接解码失败时打印帮助信息。"""
    logger.error("\n" + ERROR_DIVIDER)
    logger.error("错误：数据库连接失败，出现 UnicodeDecodeError。")
    logger.error("这通常在 Windows 上发生，当数据库密码错误或数据库不存在时。")
    logger.error("PostgreSQL 返回了本地化的错误消息（例如中文），无法解码。")
    logger.error("请检查您的数据库密码并确保数据库存在。")
    logger.error("您可以在 .env 文件中配置连接 URL。")
    logger.error(ERROR_DIVIDER + "\n")


async def init_db() -> None:
    """初始化数据库表。"""
    try:
        importlib.import_module("app.models")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("数据库表初始化成功")
    except UnicodeDecodeError as e:
        _print_db_unicode_error()
        raise RuntimeError("数据库连接失败。请检查 .env 文件中的密码和数据库名称") from e
    except Exception as e:
        logger.error(f"数据库初始化失败：{e}")
        raise


async def close_db() -> None:
    """关闭数据库引擎连接。"""
    await engine.dispose()
    logger.info("数据库连接已关闭")
