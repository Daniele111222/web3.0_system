# React 组件详细指南

> React 18 + TypeScript 组件开发最佳实践

## 1. 组件定义模式

### 1.1 基础组件模板

```typescript
import React from 'react';
import styles from './index.less';

// Props 接口定义
interface ComponentProps {
  /** 组件标题 */
  title: string;
  /** 子元素 */
  children?: React.ReactNode;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

// 组件定义
export const Component: React.FC<ComponentProps> = ({
  title,
  children,
  onClick,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>{children}</div>
      {onClick && (
        <button className={styles.button} onClick={onClick}>
          点击
        </button>
      )}
    </div>
  );
};

// 设置 displayName 便于调试
Component.displayName = 'Component';
```

### 1.2 带泛型的组件

```typescript
import React from 'react';

// 泛型组件 Props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyText?: string;
}

// 泛型组件定义
export function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyText = '暂无数据',
}: ListProps<T>) {
  if (items.length === 0) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <ul className="list">
      {items.map((item, index) => (
        <li key={keyExtractor(item)} className="list-item">
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// 使用示例
interface User {
  id: number;
  name: string;
}

function UserList() {
  const users: User[] = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
  ];

  return (
    <List
      items={users}
      renderItem={(user) => <span>{user.name}</span>}
      keyExtractor={(user) => user.id}
    />
  );
}
```

## 2. Props 设计模式

### 2.1 组合模式

```typescript
import React from 'react';
import styles from './index.less';

// 组合模式组件
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`${styles.card} ${className || ''}`}>{children}</div>
  );
};

// Card 子组件
Card.Header = function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.header} ${className || ''}`}>{children}</div>
  );
};

Card.Body = function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.body} ${className || ''}`}>{children}</div>
  );
};

Card.Footer = function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.footer} ${className || ''}`}>{children}</div>
  );
};

// 使用示例
function App() {
  return (
    <Card>
      <Card.Header>
        <h3>卡片标题</h3>
      </Card.Header>
      <Card.Body>
        <p>卡片内容</p>
      </Card.Body>
      <Card.Footer>
        <button>确认</button>
      </Card.Footer>
    </Card>
  );
}
```

### 2.2 Render Props 模式

```typescript
import React, { useState } from 'react';

// Render Props 组件
interface ToggleProps {
  children: (props: {
    on: boolean;
    toggle: () => void;
    setOn: (value: boolean) => void;
  }) => React.ReactNode;
  defaultOn?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  children,
  defaultOn = false,
}) => {
  const [on, setOn] = useState(defaultOn);

  const toggle = () => setOn(!on);

  return <>{children({ on, toggle, setOn })}</>;
};

// 使用示例
function App() {
  return (
    <Toggle>
      {({ on, toggle }) => (
        <div>
          <p>开关状态: {on ? '开' : '关'}</p>
          <button onClick={toggle}>切换</button>
        </div>
      )}
    </Toggle>
  );
}
```

### 2.3 HOC 高阶组件

```typescript
import React from 'react';

// 注入 props 类型
interface WithUserProps {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// HOC 函数
function withUser<P extends object>(
  WrappedComponent: React.ComponentType<P & WithUserProps>
) {
  return function WithUserComponent(
    props: Omit<P, keyof WithUserProps>
  ) {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
      fetchUser()
        .then(setUser)
        .catch(setError)
        .finally(() => setLoading(false));
    }, []);

    return (
      <WrappedComponent
        {...(props as P)}
        user={user}
        loading={loading}
        error={error}
      />
    );
  };
}

// 使用
interface UserProfileProps {
  title: string;
}

function UserProfile({ user, loading, error, title }: UserProfileProps & WithUserProps) {
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!user) return <div>未找到用户</div>;
  
  return (
    <div>
      <h2>{title}</h2>
      <p>姓名: {user.name}</p>
    </div>
  );
}

export default withUser(UserProfile);
```

## 5. 条件渲染最佳实践

### 5.1 提前返回模式

```typescript
interface UserProfileProps {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  loading,
  error,
}) => {
  // 提前返回：加载状态
  if (loading) {
    return <Spin size="large" />;
  }

  // 提前返回：错误状态
  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  // 提前返回：无数据
  if (!user) {
    return <Empty description="用户不存在" />;
  }

  // 提前返回：特殊状态
  if (user.isBanned) {
    return (
      <Alert
        message="该用户已被封禁"
        type="warning"
        showIcon
      />
    );
  }

  // 正常渲染
  return (
    <div className={styles.profile}>
      <Avatar src={user.avatar} size={64} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
};
```

### 5.2 条件渲染变量提取

```typescript
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onFollow,
  isFollowing,
}) => {
  // 提取条件渲染逻辑到变量
  const followButton = onFollow && (
    <Button
      type={isFollowing ? 'default' : 'primary'}
      onClick={() => onFollow(user.id)}
    >
      {isFollowing ? '已关注' : '关注'}
    </Button>
  );

  const statusBadge = user.isOnline ? (
    <Badge status="success" text="在线" />
  ) : (
    <Badge status="default" text="离线" />
  );

  const adminTag = user.isAdmin && (
    <Tag color="red">管理员</Tag>
  );

  return (
    <Card>
      <div className={styles.header}>
        <Avatar src={user.avatar} />
        <div>
          <h3>{user.name}</h3>
          {statusBadge}
        </div>
      </div>
      <div className={styles.tags}>
        {adminTag}
      </div>
      <div className={styles.actions}>
        {followButton}
      </div>
    </Card>
  );
};
```

## 6. 列表渲染最佳实践

### 6.1 列表组件封装

```typescript
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  containerHeight: number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
  containerHeight,
  overscan = 5,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item)} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 使用示例
function UserList({ users }: { users: User[] }) {
  return (
    <VirtualList
      items={users}
      itemHeight={64}
      containerHeight={400}
      keyExtractor={(user) => user.id}
      renderItem={(user) => (
        <div className={styles.userItem}>
          <Avatar src={user.avatar} />
          <span>{user.name}</span>
        </div>
      )}
    />
  );
}
```

## 7. 组件性能优化

### 7.1 React.memo 使用

```typescript
import React, { memo } from 'react';

// ✅ 使用 memo 包裹纯展示组件
interface UserAvatarProps {
  src?: string;
  name: string;
  size?: 'small' | 'medium' | 'large';
}

export const UserAvatar: React.FC<UserAvatarProps> = memo(({
  src,
  name,
  size = 'medium',
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const pixelSize = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={pixelSize}
        height={pixelSize}
        className={styles.avatar}
      />
    );
  }

  // 生成头像占位符
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={styles.avatarPlaceholder}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {initials}
    </div>
  );
});

// 自定义比较函数
UserAvatar.displayName = 'UserAvatar';
```

### 7.2 useMemo 和 useCallback 优化

```typescript
import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    render?: (value: unknown, record: T) => React.ReactNode;
  }>;
  rowHeight?: number;
  onRowClick?: (record: T) => void;
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  onRowClick,
}: DataTableProps<T>) {
  // ✅ 使用 useMemo 缓存计算结果
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      _index: index,
      _key: `row-${index}`,
    }));
  }, [data]);

  // ✅ 使用 useMemo 缓存列配置
  const columnWidths = useMemo(() => {
    return columns.map((col) => col.width || 150);
  }, [columns]);

  // ✅ 使用 useCallback 缓存回调函数
  const handleRowClick = useCallback(
    (index: number) => {
      if (onRowClick) {
        onRowClick(data[index]);
      }
    },
    [data, onRowClick]
  );

  // ✅ 使用 useCallback 缓存行渲染函数
  const renderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const record = processedData[index];

      return (
        <div
          style={style}
          className={styles.row}
          onClick={() => handleRowClick(index)}
        >
          {columns.map((column, colIndex) => {
            const value = record[column.key];
            const content = column.render
              ? column.render(value, record as T)
              : String(value);

            return (
              <div
                key={column.key}
                className={styles.cell}
                style={{ width: columnWidths[colIndex] }}
              >
                {content}
              </div>
            );
          })}
        </div>
      );
    },
    [processedData, columns, columnWidths, handleRowClick]
  );

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={styles.headerCell}
            style={{ width: columnWidths[index] }}
          >
            {column.title}
          </div>
        ))}
      </div>
      <List
        height={400}
        itemCount={processedData.length}
        itemSize={rowHeight}
      >
        {renderRow}
      </List>
    </div>
  );
}

// 使用 useMemo 优化整个表格组件
export default memo(DataTable) as typeof DataTable;
```

## 8. 错误边界

### 8.1 错误边界组件

```typescript
import React, { ErrorInfo } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 上报错误到监控服务
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 可以在这里集成 Sentry 等错误监控
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <Result
          status="error"
          title="页面出错了"
          subTitle={
            this.state.error?.message || '请刷新页面重试，或联系技术支持'
          }
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>
              重试
            </Button>,
            <Button key="back" onClick={() => window.history.back()}>
              返回上一页
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}

// 使用方式
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 上报到监控系统
        console.log('Reporting error:', error, errorInfo);
      }}
    >
      <Router />
    </ErrorBoundary>
  );
}
```

## 9. 受控与非受控组件

### 9.1 受控组件

```typescript
import React, { useState } from 'react';
import { Input, Button, Form, message } from 'antd';

interface FormData {
  username: string;
  email: string;
  password: string;
}

export const UserForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitUserForm(formData);
      message.success('提交成功');
      // 重置表单
      setFormData({ username: '', email: '', password: '' });
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>用户名</label>
        <Input
          value={formData.username}
          onChange={handleChange('username')}
          placeholder="请输入用户名"
        />
        {errors.username && <span className={styles.error}>{errors.username}</span>}
      </div>

      <div>
        <label>邮箱</label>
        <Input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder="请输入邮箱"
        />
        {errors.email && <span className={styles.error}>{errors.email}</span>}
      </div>

      <div>
        <label>密码</label>
        <Input.Password
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="请输入密码"
        />
        {errors.password && <span className={styles.error}>{errors.password}</span>}
      </div>

      <Button type="primary" htmlType="submit" loading={isSubmitting}>
        提交
      </Button>
    </form>
  );
};
```

---

**相关文档**:
- [TypeScript 规范](./typescript-guide.md)
- [Hooks 使用指南](./hooks-guide.md)
- [样式规范](./style-guide.md)
