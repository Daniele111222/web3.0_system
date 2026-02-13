---
description: FastAPI API 路由规范
triggers:
  - condition: file_path contains '/api/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'APIRouter'
    weight: high
  - condition: file_content contains '@router.'
    weight: high
---

## API 路由规范检查清单

### 1. 路由定义

- [ ] 使用 `APIRouter` 创建路由模块
- [ ] 为路由设置合理的 `prefix` 和 `tags`
- [ ] 使用 `summary` 为每个端点添加中文描述

### 2. 依赖注入

- [ ] 使用 `Depends` 注入依赖项
- [ ] 数据库会话通过依赖注入获取
- [ ] 认证依赖放在参数首位

### 3. 错误处理

- [ ] 使用 `HTTPException` 抛出业务错误
- [ ] 为不同错误设置合适的 HTTP 状态码
- [ ] 错误消息使用中文描述

### 4. 请求验证

- [ ] 使用 Pydantic Schema 验证请求体
- [ ] 为字段添加 `Field` 描述
- [ ] 使用合适的验证器

### 5. 响应模型

- [ ] 使用 `response_model` 定义响应结构
- [ ] 避免在响应中返回敏感字段
- [ ] 使用分页响应大数据集

### 6. 异步处理

- [ ] 路由处理器使用 `async def`
- [ ] 避免在处理器中进行阻塞操作
- [ ] 正确处理异步数据库操作

### 7. 日志记录

- [ ] 为关键操作添加日志
- [ ] 记录请求参数和响应状态

### 8. 文档注释

- [ ] 为每个端点添加 docstring
- [ ] 说明请求参数和返回值含义
