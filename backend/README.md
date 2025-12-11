# IP-NFT Management Backend

FastAPI backend for the IP-NFT Management DApp.

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Node.js 18+ (for smart contract development)

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy the example environment file and update with your settings:

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

Update the following variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (generate a secure random string)
- `WEB3_PROVIDER_URL`: Blockchain RPC endpoint

### 4. Setup Database

Create the PostgreSQL database:

```sql
CREATE DATABASE ipnft_db;
```

Run migrations:

```bash
alembic upgrade head
```

### 5. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/           # API routes
│   │   ├── v1/        # API version 1
│   │   └── deps.py    # Dependencies
│   ├── core/          # Core configuration
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   ├── repositories/  # Data access layer
│   └── utils/         # Utilities
├── alembic/           # Database migrations
├── tests/             # Test files
└── scripts/           # Utility scripts
```

## Testing

```bash
pytest
```

## Database Migrations

Create a new migration:

```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:

```bash
alembic upgrade head
```

Rollback migration:

```bash
alembic downgrade -1
```
