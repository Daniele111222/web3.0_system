from sqlalchemy import create_engine, text

try:
    engine = create_engine("postgresql://postgres:postgres@localhost:5432/ipnft_db")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()
        print("Database connection successful!")
        print(f"PostgreSQL version: {version[0]}")
except Exception as e:
    print(f"Database connection failed: {e}")
