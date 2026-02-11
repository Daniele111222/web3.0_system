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
pytest --cov=app --cov-report=html               # Coverage report
uvicorn app.main:app --reload                    # Dev server
```

### Contracts (Solidity/Hardhat)

```bash
cd contracts
npm install
npm run compile
npm run test
hardhat test --grep "Should mint a new NFT"      # Single test
npm run test:coverage
npm run node                                     # Local node
npm run deploy:localhost
```

## Code Style Guidelines

### TypeScript/React (Frontend)

**Imports**: Organized by type - External libraries first, then internal modules

```typescript
// 1. External libraries
import { useState, useCallback } from "react";
import { Button, Form } from "antd";

// 2. Internal modules
import { useAuthStore } from "../store";
import { authService } from "../services";
import type { LoginRequest } from "../types";
```

**Naming**:

- `PascalCase` for components (e.g., `LoginForm.tsx`)
- `camelCase` for functions/variables (e.g., `handleSubmit`)
- `PascalCase` for types/interfaces (e.g., `UserData`)
- `UPPER_SNAKE_CASE` for constants (e.g., `API_BASE_URL`)
- `use` prefix for hooks (e.g., `useAuth.ts`)

**Types**: Explicit typing preferred, use `interface` for object shapes

```typescript
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

type ApiResponse<T> = {
  data: T;
  success: boolean;
};
```

**Error Handling**: Use `try-catch-finally`, type guard for error objects

```typescript
try {
  const response = await authService.login(data);
  setAuth(response.data);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  setError(errorMessage);
} finally {
  setIsLoading(false);
}
```

**React Patterns**:

- Use `useCallback` for functions passed to children/effects
- Custom hooks with `use` prefix

```typescript
const handleSubmit = useCallback(
  async (values: LoginRequest) => {
    // implementation
  },
  [setAuth],
);
```

**Formatting** (Prettier): Single quotes, semicolons, trailing commas ES5, print width 100, 2-space indent

### ESLint Configuration

```javascript
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-plugin-prettier";
```

### Prettier Configuration

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

Create `.env` file in frontend root:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_CONTRACT_ADDRESS=0x...
```

Note: Vite requires `VITE_` prefix for env variables to be exposed to client code.

## Testing

- React Testing Library (not yet configured)
- Test user interactions, not implementation details
- Mock API calls and Web3 providers

---

Last updated: 2026-02-11
