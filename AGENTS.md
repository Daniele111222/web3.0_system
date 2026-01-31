# AGENTS.md

This file contains information for agentic coding assistants working on this Web3 IP-NFT Enterprise Asset Management System.

## Project Structure

This is a full-stack Web3 application with three main components:
- `backend/` - FastAPI (Python) REST API with PostgreSQL
- `frontend/` - React 19 + TypeScript + Vite with Web3 integration
- `contracts/` - Solidity smart contracts (Hardhat)

---

## Build, Lint, and Test Commands

### Backend (Python/FastAPI)
```bash
# Install dependencies
cd backend && pip install -r requirements.txt

# Run tests
pytest

# Run single test
pytest tests/test_auth.py::test_login

# Run with coverage
pytest --cov=app --cov-report=html

# Run development server
uvicorn app.main:app --reload
```

### Frontend (React/TypeScript)
```bash
# Install dependencies
cd frontend && npm install

# Development server
npm run dev

# Production build
npm run build

# Type checking
tsc -b

# Linting
npm run lint

# Preview production build
npm run preview
```

### Contracts (Solidity/Hardhat)
```bash
# Install dependencies
cd contracts && npm install

# Compile contracts
npm run compile

# Run all tests
npm run test

# Run single test
hardhat test --grep "Should mint a new NFT"

# Test coverage
npm run test:coverage

# Local development node
npm run node

# Deploy to networks
npm run deploy:localhost
npm run deploy:sepolia
npm run deploy:mumbai
npm run deploy:bscTestnet
```

---

## Code Style Guidelines

### Python (Backend)

**Imports**: Standard library → Third-party → Local modules, each section separated by blank line
```python
from typing import Optional
from fastapi import APIRouter
from app.core.config import settings
```

**Naming**: 
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_leading_underscore`

**Type Hints**: Always use type hints for function parameters and return values
```python
async def get_user(user_id: UUID) -> Optional[User]:
    pass
```

**Docstrings**: Use Google-style docstrings for modules, classes, and functions
```python
def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and device info from request."""
```

**Error Handling**: Define custom exceptions, catch specific exceptions, raise HTTPException with proper status codes
```python
except UserExistsError as e:
    raise HTTPException(status_code=409, detail={"message": e.message, "code": e.code})
```

**Database Models**: Use SQLAlchemy 2.0 async with `Mapped` and `mapped_column`, explicit column types
```python
id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

**Async/Await**: All DB operations must be async, use `AsyncSession`, `@pytest.mark.anyio` for async tests

---

### TypeScript/React (Frontend)

**Imports**: External libraries → Internal modules, organized by type
```typescript
import { useState } from 'react';
import { useAuthStore } from '../store';
```

**Naming**:
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

**Type Definitions**: Explicit typing for all function parameters, use `interface` for object shapes
```typescript
interface UseAuthReturn {
  login: (data: LoginRequest) => Promise<boolean>;
}
```

**Error Handling**: Always use `try-catch-finally` with proper error messages, type guard for error objects
```typescript
try {
  const response = await authService.login(data);
} catch (err: unknown) {
  const errorMessage = extractErrorMessage(err);
  setError(errorMessage);
} finally {
  setIsLoading(false);
}
```

**React Hooks**: Use `useCallback` for functions passed to children/effects, custom hooks prefix with `use`
```typescript
const login = useCallback(async (data: LoginRequest): Promise<boolean> => {
  // implementation
}, [setAuth]);
```

**Formatting** (enforced by Prettier):
- Single quotes
- Semicolons required
- Trailing commas (ES5)
- Print width: 100
- 2-space indentation
- No tabs

**API Calls**: Use centralized axios instance with interceptors for auth tokens and error handling

---

### Solidity (Contracts)

**Naming**:
- Contracts: `PascalCase`
- Functions: `camelCase` for public/external, `_leadingUnderscore` for internal/private
- Events: `PascalCase` with `Event` suffix optional
- State variables: `camelCase` (private) or `PascalCase` (public)
- Constants: `UPPER_SNAKE_CASE`

**Pragma**: Use `pragma solidity ^0.8.20;`, enable optimizer with 200 runs

**Imports**: OpenZeppelin contracts from npm
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
```

**Documentation**: Use NatSpec format for all external/public functions
```solidity
/**
 * @dev Mint a new IP-NFT
 * @param to Address to mint the NFT to
 * @param metadataURI IPFS URI pointing to the metadata JSON
 * @return tokenId The ID of the newly minted token
 */
```

**Security**: Use OpenZeppelin's `Ownable`, `ReentrancyGuard`, validate inputs with `require()`, use `nonReentrant` modifier for state-changing functions

**Testing**: Use Chai with `expect()` assertions, test structure: `describe()` → `beforeEach()` → `it()`, test both success and failure cases

---

## Testing Guidelines

### Backend Tests
- Use `@pytest.mark.anyio` for async tests
- Use fixtures from `conftest.py` (async client, DB session)
- Test both success paths and error cases
- Mock external services (blockchain, IPFS) when appropriate

### Frontend Tests
- Use React Testing Library (not yet configured)
- Test user interactions, not implementation details
- Mock API calls and Web3 providers

### Contract Tests
- Always deploy fresh contract in `beforeEach()`
- Test all require statements revert with correct messages
- Verify event emissions with correct parameters
- Use `hardhat test --grep "description"` for single test

---

## Environment Configuration

Create `.env` files in each directory:
- Backend: `DATABASE_URL`, `JWT_SECRET`, `WEB3_PROVIDER_URL`
- Frontend: `VITE_API_BASE_URL`, `VITE_CONTRACT_ADDRESS`
- Contracts: `PRIVATE_KEY`, network RPC URLs, block explorer API keys

Never commit `.env` files to version control.
