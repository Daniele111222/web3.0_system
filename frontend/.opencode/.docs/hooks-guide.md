# Hooks 使用指南

> React Hooks 最佳实践

## 1. 基础 Hook 使用

### 1.1 useState 最佳实践

```typescript
import { useState } from 'react';

// ✅ 基本用法
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// ✅ 惰性初始化（避免每次渲染都计算初始值）
function ExpensiveComponent() {
  // 如果初始计算很昂贵，使用函数形式
  const [data, setData] = useState(() => {
    // 这个函数只在初始渲染时执行
    return computeExpensiveData();
  });

  return <div>{/* 渲染数据 */}</div>;
}

// ✅ 函数式更新（基于前状态更新）
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (text: string) => {
    // 使用函数式更新确保基于最新状态
    setTodos((prevTodos) => [
      ...prevTodos,
      { id: Date.now(), text, completed: false },
    ]);
  };

  const toggleTodo = (id: number) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return <div>{/* 渲染待办列表 */}</div>;
}

// ✅ 多个相关状态可合并为对象
function Form() {
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form>
      <input
        value={formState.username}
        onChange={(e) => updateField('username', e.target.value)}
      />
      <input
        type="email"
        value={formState.email}
        onChange={(e) => updateField('email', e.target.value)}
      />
      <input
        type="password"
        value={formState.password}
        onChange={(e) => updateField('password', e.target.value)}
      />
    </form>
  );
}
```

### 1.2 useEffect 最佳实践

```typescript
import { useEffect, useRef, useState } from 'react';

// ✅ 基本数据获取
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const userData = await response.json();

        if (!cancelled) {
          setUser(userData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // 清理函数
    return () => {
      cancelled = true;
    };
  }, [userId]); // 依赖数组中包含所有响应式值

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}

// ✅ 使用 AbortController 取消请求
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // 请求被取消，不需要处理错误
          return;
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [url]);

  return { data, loading, error };
}

// ✅ 监听 DOM 事件
function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element: HTMLElement | Window = window
) {
  const savedHandler = useRef<(event: Event) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event: Event) => {
      savedHandler.current?.(event);
    };

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

// 使用示例
function Example() {
  const [scrollY, setScrollY] = useState(0);

  useEventListener('scroll', () => {
    setScrollY(window.scrollY);
  });

  return <div>Scroll Y: {scrollY}</div>;
}
```

## 2. 自定义 Hooks

### 2.1 useToggle

```typescript
import { useState, useCallback } from 'react';

interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  };
}

// 使用示例
function Example() {
  const { value, toggle, setTrue, setFalse } = useToggle(false);

  return (
    <div>
      <p>当前状态: {value ? '开' : '关'}</p>
      <button onClick={toggle}>切换</button>
      <button onClick={setTrue}>设为开</button>
      <button onClick={setFalse}>设为关</button>
    </div>
  );
}
```

### 2.2 useDebounce

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用示例
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // 使用防抖后的值进行搜索
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### 2.3 useLocalStorage

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // 获取初始值
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 设置值到 localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // 允许值是一个函数
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // 保存到 state
        setStoredValue(valueToStore);
        
        // 保存到 localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 移除值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // 监听其他标签页的存储变化
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// 使用示例
function UserSettings() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [username, setUsername] = useLocalStorage<string>('username', '');

  return (
    <div>
      <h2>用户设置</h2>
      <div>
        <label>主题:</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
      <div>
        <label>用户名:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
    </div>
  );
}
```

---

**相关文档**:
- [TypeScript 规范](./typescript-guide.md)
- [React 组件规范](./react-guide.md)
- [样式规范](./style-guide.md)
