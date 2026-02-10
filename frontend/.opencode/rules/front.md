---
description: 小型项目前端规范 - React + TypeScript 快速开发指南
triggers:
  - condition: file_extension in ['.ts', '.tsx', '.js', '.jsx']
    weight: high
  - condition: file_content contains 'React\|Component\|useState\|useEffect'
    weight: high
---

## 小型项目前端规范

### 1. 基础规范

- [ ] 使用函数组件 + Hooks，不使用 Class 组件
- [ ] 组件名使用 PascalCase（如 `UserCard`）
- [ ] Props 必须定义 interface，简单组件可省略
- [ ] 单个组件文件不超过 200 行

### 2. 文件规范

- [ ] 页面组件放在 `pages/` 目录，默认导出
- [ ] 通用组件放在 `components/` 目录，命名导出
- [ ] 自定义 Hooks 放在 `hooks/` 目录，以 `use` 开头
- [ ] 工具函数放在 `utils/` 目录

### 3. Hooks 规范

- [ ] Hooks 只在顶层调用，不在循环/条件中调用
- [ ] useEffect 依赖数组必须完整
- [ ] 异步操作放在 useEffect 中，返回清理函数

### 4. 命名规范

- [ ] 组件: PascalCase（`UserProfile`）
- [ ] Hooks: camelCase 以 use 开头（`useAuth`）
- [ ] 工具函数: camelCase（`formatDate`）
- [ ] 常量: UPPER_SNAKE_CASE（`MAX_RETRY`）

### 5. 快速示例

```typescript
// 组件示例
import React, { useState, useEffect } from 'react';

interface UserCardProps {
  userId: number;
  onClick?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ userId, onClick }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return null;

  return (
    <div onClick={onClick}>
      <h3>{user.name}</h3>
    </div>
  );
};

// Hook 示例
import { useState, useCallback } from 'react';

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return { value, toggle, setValue };
}
```