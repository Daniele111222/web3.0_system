# 样式规范指南

> CSS Modules + Tailwind CSS + Ant Design 最佳实践

## 1. CSS Modules

### 1.1 基本用法

```less
// UserCard/index.less
.card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.email {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
```

```typescript
// UserCard/index.tsx
import React from 'react';
import styles from './index.less';

interface UserCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img
          src={user.avatar}
          alt={user.name}
          className={styles.avatar}
        />
        <div>
          <h3 className={styles.username}>{user.name}</h3>
          <p className={styles.email}>{user.email}</p>
        </div>
      </div>
      <div className={styles.actions}>
        {onEdit && <button onClick={onEdit}>编辑</button>}
        {onDelete && <button onClick={onDelete}>删除</button>}
      </div>
    </div>
  );
};
```

### 1.2 组合类名

```typescript
import React from 'react';
import classNames from 'classnames';
import styles from './index.less';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className,
  onClick,
}) => {
  const buttonClass = classNames(
    styles.button,
    styles[variant],
    styles[size],
    {
      [styles.disabled]: disabled,
    },
    className
  );

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

```less
// index.less
.button {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    opacity: 0.9;
  }

  &:active:not(.disabled) {
    transform: scale(0.98);
  }
}

.primary {
  background: #1890ff;
  color: white;
}

.secondary {
  background: #f0f0f0;
  color: #333;
}

.danger {
  background: #ff4d4f;
  color: white;
}

.small {
  padding: 4px 8px;
  font-size: 12px;
}

.medium {
  padding: 8px 16px;
  font-size: 14px;
}

.large {
  padding: 12px 24px;
  font-size: 16px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## 2. Tailwind CSS

### 2.1 基础用法

```typescript
import React from 'react';

interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  imageUrl,
  onClick,
}) => {
  return (
    <div
      className="
        bg-white
        rounded-lg
        shadow-md
        overflow-hidden
        transition-shadow
        hover:shadow-lg
        cursor-pointer
      "
      onClick={onClick}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
};
```

### 2.2 响应式设计

```typescript
import React from 'react';

export const Grid: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      {/* 响应式网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500 p-4 text-white">Item 1</div>
        <div className="bg-blue-500 p-4 text-white">Item 2</div>
        <div className="bg-blue-500 p-4 text-white">Item 3</div>
        <div className="bg-blue-500 p-4 text-white">Item 4</div>
      </div>

      {/* 响应式布局 */}
      <div className="flex flex-col md:flex-row mt-8">
        <aside className="w-full md:w-64 bg-gray-100 p-4">
          Sidebar
        </aside>
        <main className="flex-1 p-4">
          Main Content
        </main>
      </div>

      {/* 响应式文字 */}
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mt-8">
        响应式标题
      </h1>

      {/* 响应式显示/隐藏 */}
      <div className="mt-8">
        <p className="hidden md:block">这行文字在 md 断点以上显示</p>
        <p className="md:hidden">这行文字在 md 断点以下显示</p>
      </div>
    </div>
  );
};
```

---

**相关文档**:
- [TypeScript 规范](./typescript-guide.md)
- [React 组件规范](./react-guide.md)
- [Hooks 使用指南](./hooks-guide.md)
