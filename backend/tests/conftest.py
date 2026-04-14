"""测试配置和夹具。"""
import asyncio
import sys
import types
from uuid import uuid4
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

if "jinja2" not in sys.modules:
    jinja2_stub = types.ModuleType("jinja2")

    class _DummyTemplateEnv:
        def __init__(self, *args, **kwargs):
            pass

    jinja2_stub.Environment = _DummyTemplateEnv
    jinja2_stub.FileSystemLoader = _DummyTemplateEnv
    jinja2_stub.select_autoescape = lambda *args, **kwargs: None
    sys.modules["jinja2"] = jinja2_stub

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环。"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def anyio_backend():
    """配置anyio后端。"""
    return "asyncio"


# 只在需要时创建数据库表
@pytest_asyncio.fixture(scope="function")
async def db_session():
    """创建数据库会话。"""
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    session_local = async_sessionmaker(
        test_engine,
        autoflush=False,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with session_local() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    """创建异步测试客户端。"""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_token() -> str:
    return create_access_token({"sub": str(uuid4())})
