---
description: Python 异步编程规范
triggers:
  - condition: file_extension == '.py' and file_content contains 'async def'
    weight: high
  - condition: file_content contains 'await '
    weight: high
  - condition: file_content contains 'asyncio'
    weight: medium
---

## 异步编程规范检查清单

### 1. 异步函数定义

- [ ] 使用 `async def` 定义异步函数
- [ ] 避免在异步函数中使用同步阻塞操作
- [ ] 正确使用 `await` 等待异步操作

### 2. 并发处理

- [ ] 使用 `asyncio.gather` 并发执行多个异步任务
- [ ] 使用 `asyncio.create_task` 创建后台任务
- [ ] 合理控制并发数量，避免资源耗尽

### 3. 错误处理

- [ ] 使用 `try-except` 捕获异步异常
- [ ] 使用 `asyncio.timeout` 设置超时
- [ ] 正确处理任务取消异常

### 4. 资源管理

- [ ] 使用 `async with` 管理异步上下文
- [ ] 确保资源正确释放
- [ ] 避免异步函数中的内存泄漏

### 5. 性能优化

- [ ] 避免频繁的 `await`，使用批量操作
- [ ] 使用连接池复用数据库连接
- [ ] 合理使用缓存减少异步调用

### 6. 调试和日志

- [ ] 使用 `logging` 记录异步操作
- [ ] 为异步任务添加上下文信息
- [ ] 记录异步操作的执行时间

### 7. 文档注释

- [ ] 为异步函数添加 docstring
- [ ] 说明函数是否会产生副作用
- [ ] 说明异步操作的并发行为
