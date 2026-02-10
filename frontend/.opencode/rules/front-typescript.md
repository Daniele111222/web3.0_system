---
description: TypeScript 编码规范
triggers:
  - condition: file_extension in ['.ts', '.tsx']
    weight: high
  - condition: file_path contains '/types/'
    weight: medium
---

## TypeScript 规范检查清单

### 1. 严格类型检查
- [ ] 启用 `strict: true` 模式
- [ ] 禁止隐式 any 类型
- [ ] 特殊情况使用 any 需注释说明原因

### 2. 类型定义规范
- [ ] 对象结构使用 `interface`
- [ ] 联合/交叉类型使用 `type`
- [ ] 单个文件类型定义≤4个，超出移至 `types.ts`

### 3. 泛型使用
- [ ] 使用有意义的参数名（T、K、V）
- [ ] 添加必要的 `extends` 约束

### 4. 类型导入
- [ ] 使用 `import type` 分离类型导入
- [ ] 避免混用类型和值导入

### 5. 工具类型
- [ ] 合理使用 `Partial`、`Pick`、`Omit`、`Record`
- [ ] 使用类型守卫实现类型收窄

### 6. 命名规范
- [ ] 接口名使用 PascalCase
- [ ] 类型别名使用 PascalCase
- [ ] 泛型参数使用单个大写字母

---
**引用文档**: 详细示例和最佳实践参见 `.opencode/.docs/typescript-guide.md`
