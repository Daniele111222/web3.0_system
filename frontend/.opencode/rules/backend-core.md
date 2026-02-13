---
description: 核心模块（Core）规范
triggers:
  - condition: file_path contains '/core/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'from app.core'
    weight: medium
---

## 核心模块规范检查清单

### 1. 配置管理

- [ ] 使用 Pydantic `BaseSettings` 管理配置
- [ ] 配置类添加环境变量前缀
- [ ] 敏感配置从环境变量读取

### 2. 数据库连接

- [ ] 使用 `create_async_engine` 创建异步引擎
- [ ] 使用 `AsyncSession` 进行数据库操作
- [ ] 正确配置连接池参数

### 3. 安全模块

- [ ] 密码使用强哈希算法（如 bcrypt）
- [ ] JWT 配置合理的过期时间
- [ ] 实现 token 刷新机制

### 4. 外部服务集成

- [ ] Web3/IPFS 等外部服务错误处理
- [ ] 使用超时和重试机制
- [ ] 记录外部服务调用日志

### 5. 依赖注入

- [ ] 使用 `asyncgenerator` 创建依赖提供者
- [ ] 正确管理资源生命周期
- [ ] 避免创建全局状态

### 6. 文档注释

- [ ] 为核心功能添加详细 docstring
- [ ] 说明配置项的用途和默认值
- [ ] 使用中文注释
