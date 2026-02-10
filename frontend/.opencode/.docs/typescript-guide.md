# TypeScript 详细指南

> React + TypeScript 最佳实践示例

## 1. 类型定义最佳实践

### 1.1 接口 vs 类型别名

```typescript
// ✅ 对象结构使用 interface
interface User {
  id: number;
  name: string;
  email?: string;  // 可选属性
  readonly createdAt: Date;  // 只读属性
}

// ✅ 联合类型使用 type
type Status = 'idle' | 'loading' | 'success' | 'error';
type Theme = 'light' | 'dark';

// ✅ 交叉类型使用 type
type AdminUser = User & {
  role: 'admin';
  permissions: string[];
};
```

### 1.2 泛型使用规范

```typescript
// ✅ 使用有意义的泛型参数名
interface ApiResponse<TData> {
  data: TData;
  status: number;
  message: string;
}

// ✅ 添加约束条件
function sortById<T extends { id: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id - b.id);
}

// ✅ 默认泛型参数
interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 1.3 类型守卫

```typescript
// ✅ 使用自定义类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as User).id === 'number' &&
    typeof (value as User).name === 'string'
  );
}

// 使用类型守卫
function processUser(user: unknown) {
  if (isUser(user)) {
    // TypeScript 知道这里是 User 类型
    console.log(user.name);
  }
}

// ✅ 使用 in 操作符类型守卫
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow();
  } else {
    animal.bark();
  }
}
```

## 2. 类型导入导出

### 2.1 分离类型导入

```typescript
// ✅ 使用 import type 分离类型导入
import type { FC, ReactNode } from 'react';
import type { AxiosResponse, AxiosError } from 'axios';
import { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ 类型和值混合导入时分开
import type { User, ApiResponse } from './types';
import { fetchUser, updateUser } from './api';

// ✅ 命名空间导入
import type * as API from './api-types';

// 使用
const user: API.User = { ... };
```

### 2.2 类型导出

```typescript
// ✅ 使用 export type 导出类型
export type { User, UserRole } from './user';
export type { ApiResponse, ApiError } from './api';

// ✅ 重新导出并合并
export type { User } from './user';
export type { Product } from './product';
export type { Order } from './order';

// ✅ 导出接口
export interface UserService {
  getUser(id: number): Promise<User>;
  updateUser(user: User): Promise<void>;
}

// ✅ 导出类型别名
export type UserId = User['id'];
export type UserUpdatePayload = Partial<Omit<User, 'id' | 'createdAt'>>;
```

## 3. 工具类型实践

### 3.1 常用工具类型

```typescript
// ✅ Partial - 所有属性变为可选
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// 等价于 { id?: number; name?: string; email?: string; }

// ✅ Required - 所有属性变为必选
type RequiredUser = Required<PartialUser>;

// ✅ Pick - 选择部分属性
type UserPreview = Pick<User, 'id' | 'name'>;
// 等价于 { id: number; name: string; }

// ✅ Omit - 排除部分属性
type UserWithoutEmail = Omit<User, 'email'>;
// 等价于 { id: number; name: string; }

// ✅ Record - 创建键值对类型
type UserRoles = Record<number, User>;
// 等价于 { [key: number]: User; }

// ✅ Exclude - 从联合类型中排除
type Status = 'idle' | 'loading' | 'success' | 'error';
type NonIdleStatus = Exclude<Status, 'idle'>;
// 等价于 'loading' | 'success' | 'error'

// ✅ Extract - 从联合类型中提取
type LoadingStatus = Extract<Status, 'loading' | 'success'>;
// 等价于 'loading' | 'success'

// ✅ NonNullable - 排除 null 和 undefined
type MaybeUser = User | null | undefined;
type NonNullUser = NonNullable<MaybeUser>;
// 等价于 User

// ✅ ReturnType - 获取函数返回类型
function createUser(name: string): User {
  return { id: 1, name, email: '' };
}

type CreateUserReturn = ReturnType<typeof createUser>;
// 等价于 User

// ✅ Parameters - 获取函数参数类型
type CreateUserParams = Parameters<typeof createUser>;
// 等价于 [name: string]

// ✅ Awaited - 获取 Promise 解析类型
async function fetchUser(): Promise<User> {
  return { id: 1, name: 'John', email: '' };
}

type FetchUserReturn = Awaited<ReturnType<typeof fetchUser>>;
// 等价于 User
```

### 3.2 自定义工具类型

```typescript
// ✅ Nullable - 添加 null 类型
type Nullable<T> = T | null;

// ✅ DeepPartial - 深层 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ✅ DeepReadonly - 深层只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ✅ KeysOfType - 按值类型选择键
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

type StringKeys = KeysOfType<User, string>;
// 等价于 'name' | 'email'

// ✅ StrictOmit - 严格的 Omit
type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// ✅ WithDefaults - 添加默认值
type WithDefaults<T, D extends Partial<T>> = T & D;

// ✅ Mutable - 移除 readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ✅ PickByValue - 按值选择属性
type PickByValue<T, V> = Pick<T, KeysOfType<T, V>>;

// 使用示例
type UserStrings = PickByValue<User, string>;
// 等价于 { name: string; email: string; }
```

## 4. 类型安全实践

### 4.1 运行时类型检查

```typescript
// ✅ 使用 zod 进行运行时验证
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
});

type User = z.infer<typeof UserSchema>;

// 运行时验证
function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}

// 安全解析
function safeValidateUser(data: unknown): User | null {
  const result = UserSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('Validation error:', result.error);
  return null;
}
```

### 4.2 API 类型安全

```typescript
// ✅ 定义 API 响应类型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// ✅ 泛型 API 请求函数
async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new ApiException(error);
  }
  
  return response.json();
}

// 使用
interface User {
  id: number;
  name: string;
}

const user = await apiRequest<User>('/api/users/1');
```

### 4.3 类型安全的错误处理

```typescript
// ✅ 定义错误类型
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(message: string, public fields: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ✅ 类型守卫判断错误类型
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// ✅ 错误处理
function handleError(error: unknown): { message: string; code: string } {
  if (isValidationError(error)) {
    return {
      message: `Validation failed: ${Object.entries(error.fields)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ')}`,
      code: error.code,
    };
  }
  
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
    };
  }
  
  // 未知错误
  console.error('Unexpected error:', error);
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}
```

## 5. 最佳实践总结

### 5.1 类型设计原则

1. **从类型开始设计** - 先定义数据形状，再实现逻辑
2. **最小化类型范围** - 使用更精确的类型，而非宽泛的类型
3. **利用类型推导** - 让 TypeScript 推断类型，减少冗余注解
4. **使用严格模式** - 开启 `strict: true` 捕获更多错误

### 5.2 常见模式

```typescript
// ✅ 使用 satisfies 验证类型
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} satisfies {
  apiUrl: string;
  timeout: number;
  retries: number;
};

// ✅ 使用 const 断言
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];  // 'admin' | 'user' | 'guest'

// ✅ 使用 keyof 获取键
type UserKeys = keyof User;  // 'id' | 'name' | 'email' | ...

// ✅ 使用 typeof 推断类型
const user = {
  id: 1,
  name: 'John',
};
type User = typeof user;  // { id: number; name: string; }

// ✅ 使用索引访问类型
type UserId = User['id'];  // number
type UserNameOrEmail = User['name' | 'email'];  // string

// ✅ 使用条件类型
type NonNullable<T> = T extends null | undefined ? never : T;
type ExtractType<T, U> = T extends U ? T : never;

// ✅ 使用映射类型
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Nullable<T> = { [P in keyof T]: T[P] | null };
```

### 5.3 性能考虑

1. **避免过度使用泛型** - 过多的类型参数会降低类型检查性能
2. **使用具体类型** - 尽量使用具体类型而非宽泛的类型
3. **避免深层嵌套类型** - 深层嵌套的类型会降低编译性能
4. **使用类型缓存** - 对于复杂类型，考虑使用类型别名缓存

```typescript
// ✅ 使用类型别名缓存复杂类型
type DeepNestedType = {
  level1: {
    level2: {
      level3: {
        level4: {
          value: string;
        };
      };
    };
  };
};

// 使用类型别名
const data: DeepNestedType = { ... };

// ❌ 避免内联复杂类型
const badData: {
  level1: {
    level2: {
      level3: {
        level4: {
          value: string;
        };
      };
    };
  };
} = { ... };
```

---

**相关文档**:
- [React 组件规范](./react-guide.md)
- [Hooks 使用指南](./hooks-guide.md)
- [样式规范](./style-guide.md)
