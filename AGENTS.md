# AGENTS.md

Guidelines for agentic coding assistants working on this Web3 IP-NFT Enterprise Asset Management System.

## Project Structure

- `frontend/` - React 19 + TypeScript + Vite with Web3 integration
- `backend/` - FastAPI (Python) REST API with PostgreSQL
- `contracts/` - Solidity smart contracts (Hardhat)

## Build, Lint, and Test Commands

### Frontend (React/TypeScript)

```bash
cd frontend
npm install
npm run dev                                      # Development server
npm run build                                    # Production build
npm run lint                                     # Run ESLint
npm run lint -- --fix                            # Auto-fix ESLint issues
tsc -b                                            # Type check
npm run preview                                  # Preview production build
```

### Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
pytest                                           # Run all tests
pytest tests/test_auth.py::test_login            # Run single test
pytest tests/test_auth.py -k "test_login"         # Run tests matching pattern
pytest --cov=app --cov-report=html               # Coverage report
pytest -v                                        # Verbose output
uvicorn app.main:app --reload                    # Dev server
```

### Contracts (Solidity/Hardhat)

```bash
cd contracts
npm install
npm run compile                                  # Compile contracts
npm run test                                     # Run all tests
npm run test -- --grep "Should mint"             # Run single test (regex match)
npx hardhat test test/IPNFT.test.ts              # Run specific test file
npm run test:coverage                            # Coverage report
npm run node                                     # Local node
npm run deploy:localhost                         # Deploy to localhost
```

## Code Style Guidelines

### TypeScript/React (Frontend)

**Imports**: External libraries first, then internal modules

```typescript
import { useState, useCallback } from "react";
import { Button, Form } from "antd";
import { useAuthStore } from "../store";
import { authService } from "../services";
import type { LoginRequest } from "../types";
```

**Naming**: Components `PascalCase`, functions `camelCase`, types `PascalCase`, constants `UPPER_SNAKE_CASE`, hooks `use` prefix

**Types**: Use `interface` for objects, `type` for unions

```typescript
interface UserProfile { id: string; email: string; }
type ApiResponse<T> = { data: T; success: boolean; };
```

**Error Handling**: Use `try-catch-finally`, type guards for errors

```typescript
try {
  const response = await authService.login(data);
  setAuth(response.data);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  setError(errorMessage);
}
```

**React Patterns**: Use `useCallback` for callbacks, custom hooks with `use` prefix

### Python/FastAPI (Backend)

**Imports**: Standard library first, third-party, then local

```python
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.auth import UserResponse
```

**Naming**: Functions/variables `snake_case`, Classes `PascalCase`, Constants `UPPER_SNAKE_CASE`

**Type Hints**: Use Python 3.12+ union syntax where possible

```python
def get_user(user_id: int) -> User | None: ...
async def create_item(item: Item, db: AsyncSession = Depends(get_db)) -> ItemResponse: ...
```

**Async**: Use `async/await` for I/O operations, prefer `AsyncSession` for SQLAlchemy

**Error Handling**: Use FastAPI's `HTTPException` for API errors, custom exceptions in `app/core/exceptions.py`

### Solidity (Contracts)

**Naming**: Contracts/Interfaces `PascalCase`, functions/variables `camelCase`, events `PascalCase` with `Event` suffix, constants `UPPER_SNAKE_CASE`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract IPNFT is ERC721URIStorage {
    event NFTMinted(address indexed owner, uint256 tokenId, string tokenURI);
    
    uint256 public constant MAX_SUPPLY = 10000;
    mapping(uint256 => string) private _tokenURIs;
}
```

**Functions**: External for gas optimization, events for state changes, custom errors for reverts

## Prettier Configuration (Frontend)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Environment Variables

**Frontend** (`.env`):
```
VITE_API_BASE_URL=http://localhost:8000
VITE_CONTRACT_ADDRESS=0x...
```

**Backend** (`.env`): Uses `pydantic-settings`, see `.env` file in backend root

Note: Vite requires `VITE_` prefix for client-exposed env variables.

## Testing Guidelines

- **Frontend**: React Testing Library (not yet configured), test user interactions
- **Backend**: pytest with pytest-asyncio, use fixtures from `conftest.py`
- **Contracts**: Hardhat tests with ethers.js, use mainnet forking for integration tests

---

Last updated: 2026-02-20
