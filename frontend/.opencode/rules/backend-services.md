---
description: 业务逻辑服务层规范
triggers:
  - condition: file_path contains '/services/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'class.*Service'
    weight: high
---

## 服务层规范检查清单

### 1. 服务类定义

- [ ] 使用 `Service` 后缀命名服务类
- [ ] 单一职责，每个服务类只处理一个业务领域
- [ ] 为服务类添加详细的 docstring

### 2. 错误处理

- [ ] 定义自定义异常类（继承自 `Exception` 或 `HTTPException`）
- [ ] 异常包含错误消息和错误代码
- [ ] 在服务层抛出业务逻辑错误，不在 API 层处理业务错误

### 3. 依赖注入

- [ ] 接收数据库会话作为参数
- [ ] 使用 Repository 进行数据访问
- [ ] 依赖其他服务时通过参数注入

### 4. 事务管理

- [ ] 服务方法内不自行管理事务提交/回滚
- [ ] 复杂操作使用 repository 的事务方法
- [ ] 确保数据库会话正确关闭

### 5. 异步处理

- [ ] 服务方法使用 `async def`
- [ ] 正确处理异步数据库操作
- [ ] 避免在服务层进行阻塞操作

### 6. 日志记录

- [ ] 为关键操作添加日志
- [ ] 记录输入参数（注意不要记录敏感信息）
- [ ] 记录业务异常

### 7. 文档注释

- [ ] 为每个公共方法添加 docstring
- [ ] 说明参数、返回值和可能抛出的异常
- [ ] 使用中文注释
