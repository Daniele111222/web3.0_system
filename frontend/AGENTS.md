# AGENTS.md

Guidelines for agentic coding assistants working on this React 19 + TypeScript frontend.

## Project Structure

- `src/components/` - React components (PascalCase files)
- `src/hooks/` - Custom React hooks (use prefix)
- `src/store/` - Zustand stores
- `src/services/` - API services (axios instance)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `public/` - Static assets

## Build, Lint, and Test Commands

```bash
# Install dependencies (uses pnpm)
npm install

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

## Code Style Guidelines

### Naming Conventions

- **Components**: `PascalCase` (e.g., `LoginForm.tsx`)
- **Functions/variables**: `camelCase` (e.g., `handleSubmit`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserData`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Hooks**: `use` prefix (e.g., `useAuth.ts`)

### Imports (organized by type)

```typescript
// 1. External libraries
import { useState, useCallback } from 'react';
import { Button, Form } from 'antd';

// 2. Internal modules
import { useAuthStore } from '../store';
import { authService } from '../services';
import type { LoginRequest } from '../types';
```

### Type Definitions

```typescript
// Use interface for object shapes
interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

// Use type for unions or complex types
type ApiResponse<T> = {
  data: T;
  success: boolean;
};
```

### Error Handling

```typescript
try {
  const response = await authService.login(data);
  setAuth(response.data);
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  setError(errorMessage);
} finally {
  setIsLoading(false);
}
```

### React Patterns

```typescript
// Use useCallback for functions passed to children/effects
const handleSubmit = useCallback(
  async (values: LoginRequest) => {
    // implementation
  },
  [setAuth]
);

// Custom hooks with 'use' prefix
function useAuth() {
  // implementation
}
```

### ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
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
