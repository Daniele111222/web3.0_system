---
description: React Hooks 规范
triggers:
  - condition: file_content contains 'useState\|useEffect\|useCallback\|useMemo'
    weight: high
  - condition: file_content contains 'function use'
    weight: high
  - condition: file_path contains '/hooks/'
    weight: high
---

## Hooks 规范检查清单

### 1. Hooks 命名
- [ ] 必须以 `use` 开头
- [ ] 使用 camelCase 命名
- [ ] 命名需体现功能含义

### 2. 调用规则
- [ ] 只在组件顶层调用
- [ ] 不在循环、条件、嵌套函数中调用
- [ ] 调用顺序必须一致

### 3. 自定义 Hook
- [ ] 返回值统一格式：数组 `[state, actions]` 或对象 `{ data, loading, error }`
- [ ] 必须有输入参数说明
- [ ] 必须编写单元测试

### 4. useEffect 规范
- [ ] 副作用必须放在 useEffect 中
- [ ] 清理副作用必须返回清理函数
- [ ] 依赖数组必须包含所有响应式值

### 5. useCallback 使用
- [ ] 仅在函数作为 props 传递给子组件时使用
- [ ] 仅在函数作为其他 Hooks 依赖项时使用
- [ ] 避免在简单计算函数上使用

### 6. useMemo 使用
- [ ] 仅在昂贵计算时使用
- [ ] 仅在保持引用相等性时使用
- [ ] 避免在简单计算上使用

### 7. useRef 使用
- [ ] 获取 DOM 元素引用
- [ ] 保存可变值但不触发重渲染
- [ ] 保存上一次的值

### 8. useState 初始化
- [ ] 简单值直接初始化
- [ ] 昂贵计算使用惰性初始化函数

### 9. useReducer 使用
- [ ] 复杂状态逻辑使用 useReducer
- [ ] 多个子值状态使用 useReducer

### 10. Context 使用
- [ ] 仅在真正需要共享状态时创建
- [ ] 避免频繁更新导致重渲染
- [ ] 拆分为多个小 Context

---
**引用文档**: 详细示例和最佳实践参见 `.opencode/.docs/hooks-guide.md`
