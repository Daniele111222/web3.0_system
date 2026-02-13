---
description: SQLAlchemy 数据模型规范
triggers:
  - condition: file_path contains '/models/' and file_extension == '.py'
    weight: high
  - condition: file_content contains 'class.*Base'
    weight: high
  - condition: file_content contains 'Mapped\\[.*\\]'
    weight: high
---

## 数据模型规范检查清单

### 1. 模型定义

- [ ] 继承 `Base` 类创建模型
- [ ] 使用 `__tablename__` 定义表名（使用复数形式）
- [ ] 使用 `Mapped` 类型注解定义列

### 2. 列定义

- [ ] 主键使用 UUID 类型并设置 `primary_key=True`
- [ ] 字符串列设置最大长度（如 `String(255)`）
- [ ] 需要唯一的字段设置 `unique=True`
- [ ] 需要查询的字段设置 `index=True`
- [ ] 可选字段使用 `Optional` 类型并设置 `nullable=True`

### 3. 关系定义

- [ ] 使用 `relationship` 定义模型关系
- [ ] 使用字符串引用避免循环导入（`"ClassName"`）
- [ ] 使用 `back_populates` 和 `backref` 维护双向关系

### 4. 时间戳

- [ ] 使用 `DateTime` 类型存储时间
- [ ] 使用 `server_default` 或 `default` 设置默认值
- [ ] 考虑使用时区（`timezone=True`）

### 5. 索引和约束

- [ ] 为常用查询字段创建索引
- [ ] 使用 `Index` 定义复合索引
- [ ] 使用 `UniqueConstraint` 定义唯一约束

### 6. 文档注释

- [ ] 为模型类添加 docstring
- [ ] 为重要字段添加注释说明
- [ ] 字段注释使用中文描述

### 7. 类型提示

- [ ] 使用 `TYPE_CHECKING` 避免循环导入
- [ ] 关系类型使用字符串引用
- [ ] 正确使用 `Optional` 类型
