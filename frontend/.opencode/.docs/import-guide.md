# 导入导出规范

> 模块导入导出最佳实践

## 1. 导入顺序

```typescript
// ✅ 推荐的导入顺序

// 1. React 和 React DOM
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// 2. 第三方库（按字母顺序）
import axios from 'axios';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useHistory } from 'react-router-dom';

// 3. 绝对路径导入（@/ 别名）
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/date';

// 4. 相对路径导入
import { UserCard } from './components/UserCard';
import styles from './index.less';

// 5. 类型导入（放在最后或分组）
import type { User, UserRole } from '@/types/user';
import type { FC } from 'react';
```

## 2. 类型导入

```typescript
// ✅ 使用 import type 分离类型导入
import type { FC, ReactNode, MouseEvent } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
import type { AxiosResponse, AxiosError } from 'axios';

// ✅ 从本地类型文件导入
import type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
  UserQueryParams,
} from '@/types/user';

import type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
} from '@/types/api';

// ✅ 使用命名空间导入
import type * as API from '@/types/api';

// 使用
function fetchUsers(): Promise<API.PaginatedResponse<API.User>> {
  // ...
}
```

## 3. 导出规范

### 3.1 命名导出

```typescript
// ✅ 命名导出用于工具函数和可复用组件

// utils/date.ts
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function parseDate(dateString: string): Date {
  return dayjs(dateString).toDate();
}

export function isValidDate(date: unknown): date is Date {
  return dayjs(date).isValid();
}

// components/Button/index.tsx
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// hooks/useAuth.ts
export function useAuth() {
  // ...
}

export type { AuthState, AuthActions } from './types';
```

### 3.2 默认导出

```typescript
// ✅ 默认导出用于页面组件和主要组件

// pages/UserList/index.tsx
import React from 'react';
import { UserTable } from './components/UserTable';
import { useUsers } from './hooks/useUsers';

const UserListPage: React.FC = () => {
  const { users, loading } = useUsers();

  return (
    <div>
      <h1>用户列表</h1>
      <UserTable data={users} loading={loading} />
    </div>
  );
};

export default UserListPage;

// components/Modal/index.tsx
import { Modal as AntModal } from 'antd';
import type { ModalProps } from './types';

export { ModalProps };
export default AntModal;
```

### 3.3 Barrel 导出

```typescript
// ✅ 使用 index.ts 统一导出

// components/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Table } from './Table';
export type { TableProps, Column } from './Table';

// hooks/index.ts
export { useAuth } from './useAuth';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useToggle } from './useToggle';
export { useRequest } from './useRequest';

// utils/index.ts
export { formatDate, parseDate } from './date';
export { formatMoney } from './money';
export { validateEmail, validatePhone } from './validate';
export { copyToClipboard } from './clipboard';

// types/index.ts
export type { User, UserRole, UserStatus } from './user';
export type { ApiResponse, ApiError, PaginatedResponse } from './api';
export type { RouteConfig, MenuItem } from './route';
```

## 4. 动态导入

```typescript
// ✅ 动态导入用于代码分割

// 路由懒加载
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const UserList = lazy(() => import('./pages/UserList'));
const UserDetail = lazy(() => import('./pages/UserDetail'));

function App() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <Routes>
        <Route path="/users" element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </Suspense>
  );
}

// 条件动态导入
async function loadLocale(locale: string) {
  const messages = await import(`./locales/${locale}.json`);
  return messages.default;
}

// 动态导入组件库
function useIcon(iconName: string) {
  const [Icon, setIcon] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@ant-design/icons').then((icons) => {
      const IconComponent = (icons as Record<string, React.ComponentType>)[iconName];
      if (IconComponent) {
        setIcon(() => IconComponent);
      }
    });
  }, [iconName]);

  return Icon;
}
```

---

**相关文档**:
- [TypeScript 规范](./typescript-guide.md)
- [React 组件规范](./react-guide.md)
- [Hooks 使用指南](./hooks-guide.md)
