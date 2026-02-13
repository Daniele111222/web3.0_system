---
description: 数据访问层 Repository 规范
triggers:
  - condition: file_path contains '/repositories/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'class.*Repository'
    weight: high
---

## Repository 层规范检查清单

### 1. Repository 定义

- [ ] 使用 `Repository` 后缀命名数据访问类
- [ ] 每个 Repository 对应一个数据模型
- [ ] 为 Repository 类添加详细的 docstring

### 2. 数据库会话

- [ ] 构造函数接收 `AsyncSession` 参数
- [ ] 不自行创建或关闭会话
- [ ] 使用会话的执行器方法（`execute`、`scalars` 等）

### 3. 查询方法

- [ ] 使用 `select` 函数构建查询
- [ ] 使用 `where` 添加过滤条件
- [ ] 使用 `order_by` 排序结果
- [ ] 使用 `limit` 和 `offset` 分页

### 4. 异步操作

- [ ] 所有数据库操作使用 `await`
- [ ] 使用 `async for` 处理流式结果
- [ ] 正确处理异步上下文中的异常

### 5. 事务管理

- [ ] 接受外部传入的会话，不自行提交
- [ ] 复杂操作由调用方管理事务
- [ ] 使用 `begin` 或 `begin_nested` 控制事务边界

### 6. 文档注释

- [ ] 为每个公共方法添加 docstring
- [ ] 说明参数、返回值和可能的异常
- [ ] 使用中文注释
