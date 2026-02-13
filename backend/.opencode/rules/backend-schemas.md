---
description: Pydantic Schema 规范
triggers:
  - condition: file_path contains '/schemas/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'class.*\\(BaseModel\\)'
    weight: high
  - condition: file_content contains 'from pydantic import'
    weight: high
---

## Pydantic Schema 规范检查清单

### 1. Schema 定义

- [ ] 继承 `BaseModel` 创建 Schema
- [ ] 使用 `class Config` 或 `model_config` 配置模型
- [ ] 为请求/响应分离 Schema

### 2. 字段定义

- [ ] 使用 `Field` 为字段添加描述和验证
- [ ] 必填字段使用 `...` 作为默认值
- [ ] 可选字段使用 `Optional` 并设置默认值为 `None`
- [ ] 字符串字段设置 `max_length` 限制

### 3. 验证器

- [ ] 使用 `@field_validator` 定义字段验证器
- [ ] 验证器使用类方法 `@classmethod`
- [ ] 返回值前进行数据清洗（如 `lower()`）

### 4. 类型提示

- [ ] 使用 Pydantic 内置类型（`EmailStr`, `HttpUrl` 等）
- [ ] 使用 `Optional` 处理可选字段
- [ ] 嵌套 Schema 使用正确的类型注解

### 5. 响应模型

- [ ] 响应 Schema 避免包含敏感字段（如密码哈希）
- [ ] 使用 `response_model` 指定响应类型
- [ ] 列表响应使用泛型定义类型

### 6. 文档注释

- [ ] 为每个 Schema 类添加 docstring
- [ ] 为字段添加中文 `description`
- [ ] 说明字段的验证规则
