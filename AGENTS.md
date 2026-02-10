# AGENTS.md

Guidelines for agentic coding assistants working on this Web3 IP-NFT Enterprise Asset Management System.

## Project Structure

- `backend/` - FastAPI (Python) REST API with PostgreSQL
- `frontend/` - React 19 + TypeScript + Vite with Web3 integration
- `contracts/` - Solidity smart contracts (Hardhat)

## Build, Lint, and Test Commands

### Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
pytest
pytest tests/test_auth.py::test_login          # single test
pytest --cov=app --cov-report=html             # coverage
uvicorn app.main:app --reload                    # dev server
```

### Frontend (React/TypeScript)

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
tsc -b                                            # type check
npm run preview
```

### Contracts (Solidity/Hardhat)

```bash
cd contracts
npm install
npm run compile
npm run test
hardhat test --grep "Should mint a new NFT"      # single test
npm run test:coverage
npm run node                                      # local node
npm run deploy:localhost
```

## Code Style Guidelines

### Python (Backend)

**Imports**: Standard library → Third-party → Local (blank line between sections)

**Naming**: `snake_case` functions/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, `_leading_underscore` private

**Type Hints**: Always use for parameters and returns

```python
async def get_user(user_id: UUID) -> Optional[User]: ...
```

**Docstrings**: Google-style for modules, classes, functions

**Error Handling**: Custom exceptions, specific catches, HTTPException with proper status codes

**Database**: SQLAlchemy 2.0 async with `Mapped`/`mapped_column`, all DB operations async

### TypeScript/React (Frontend)

**Imports**: External → Internal, organized by type

**Naming**: `PascalCase` components, `camelCase` functions/variables, `PascalCase` types, `UPPER_SNAKE_CASE` constants

**Types**: Explicit typing, use `interface` for object shapes

**Error Handling**: `try-catch-finally`, type guard for error objects

**React**: `useCallback` for functions passed to children, custom hooks with `use` prefix

**Formatting** (Prettier): Single quotes, semicolons, trailing commas ES5, print width 100, 2-space indent

### Solidity (Contracts)

**Naming**: `PascalCase` contracts, `camelCase` public/external functions, `_leadingUnderscore` internal/private, `PascalCase` events, `UPPER_SNAKE_CASE` constants

**Pragma**: `^0.8.20`, optimizer 200 runs

**Documentation**: NatSpec for all external/public functions

**Security**: OpenZeppelin Ownable/ReentrancyGuard, `require()` validation, `nonReentrant` for state-changing functions

## Testing Guidelines

### Backend

- `@pytest.mark.anyio` for async tests
- Use `conftest.py` fixtures
- Mock external services

### Frontend

- React Testing Library (not yet configured)
- Test user interactions
- Mock APIs/Web3 providers

### Contracts

- Fresh contract in `beforeEach()`
- Test all `require` reverts
- Verify event emissions
- Use `--grep` for single tests

## Environment Configuration

Create `.env` files in each directory:

- Backend: `DATABASE_URL`, `JWT_SECRET`, `WEB3_PROVIDER_URL`
- Frontend: `VITE_API_BASE_URL`, `VITE_CONTRACT_ADDRESS`
- Contracts: `PRIVATE_KEY`, RPC URLs, explorer API keys

Never commit `.env` files.
