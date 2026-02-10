---
description: React 组件规范
triggers:
  - condition: file_extension in ['.tsx']
    weight: high
  - condition: file_path contains '/components/'
    weight: high
  - condition: file_path contains '/pages/'
    weight: medium
---

## React 组件规范检查清单

### 1. 组件定义
- [ ] 使用 `const Component: React.FC<Props>` 模式
- [ ] 组件名使用 PascalCase
- [ ] 语义化命名，避免缩写

### 2. Props 定义
- [ ] 必须定义 Props 接口
- [ ] 使用 JSDoc 注释说明每个属性
- [ ] 可选属性使用 `?` 标记

### 3. 组件拆分
- [ ] 遵循单一职责原则
- [ ] 每个组件≤300行代码
- [ ] 复杂逻辑提取为自定义 Hook

### 4. 列表渲染
- [ ] 使用稳定的唯一 ID 作为 key
- [ ] 禁止使用数组索引作为 key

### 5. 性能优化
- [ ] 纯展示组件使用 `React.memo` 包裹
- [ ] 避免不必要的重渲染

### 6. 组件组合
- [ ] 优先使用 props.children
- [ ] 使用组合模式而非组件继承

### 7. 条件渲染
- [ ] 使用三元运算符或逻辑与
- [ ] 复杂条件提取为变量

### 8. 错误处理
- [ ] 关键页面使用错误边界
- [ ] 子组件错误需要被捕获

### 9. 受控组件
- [ ] 优先使用受控组件
- [ ] 非受控组件使用 defaultValue 和 ref

### 10. 导入顺序
- [ ] React → 第三方库 → @/ → 相对路径 → 样式

---
**引用文档**: 详细示例和最佳实践参见 `.opencode/.docs/react-guide.md`
