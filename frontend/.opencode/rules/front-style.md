---
description: 样式规范
triggers:
  - condition: file_extension in ['.less', '.css', '.scss']
    weight: high
  - condition: file_path contains '/styles/'
    weight: high
  - condition: file_content contains 'className\|styles'
    weight: medium
---

## 样式规范检查清单

### 1. CSS Modules
- [ ] 使用 `.module.less` 命名
- [ ] 使用 camelCase 命名类名
- [ ] 通过 `styles.className` 引用

### 2. Tailwind CSS
- [ ] 优先使用 Tailwind 工具类
- [ ] 复杂样式使用 `@apply` 提取
- [ ] 遵循设计系统规范

### 3. Ant Design 定制
- [ ] 使用主题配置定制样式
- [ ] 避免直接覆盖组件样式
- [ ] 通过 ConfigProvider 统一配置

### 4. 命名规范
- [ ] 类名语义化，见名知意
- [ ] 使用 BEM 规范（可选）
- [ ] 避免缩写，除非通用（如 btn）

### 5. 响应式设计
- [ ] 使用 Tailwind 断点
- [ ] 移动优先设计
- [ ] 测试多设备兼容性

### 6. 性能优化
- [ ] 避免深层嵌套选择器
- [ ] 提取公共样式复用
- [ ] 动画使用 transform/opacity

### 7. 变量使用
- [ ] 使用 CSS 变量定义主题色
- [ ] 间距使用设计系统值
- [ ] 字体大小使用预设值

---
**引用文档**: 详细示例参见 `.opencode/.docs/style-guide.md`
