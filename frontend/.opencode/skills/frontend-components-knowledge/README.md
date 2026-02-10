# Frontend Components Knowledge Skill

## 概述

本 Skill 为 AI 提供项目前端组件的分类知识库，帮助 AI 理解和使用项目中的组件。

## 组件分类

项目组件按功能和业务场景分为以下类别：

### 1. 表格类组件 (tables.md)
- **DragTable**: 支持拖拽排序的表格
- **FormListTable**: 表单内的列表表格
- **RequestTable**: 内置请求逻辑的表格

**使用场景**: 列表数据展示、数据排序、表单内列表

### 2. 表单类组件 (forms.md)
- **FormElement**: 统一的表单元素封装
- **CommonFormItems**: 通用表单项（地址、行业、远程搜索）
- **SearchHead**: 列表页搜索区域
- **FormTable**: 标签-值形式的详情展示

**使用场景**: 表单页面、搜索区域、详情展示

### 3. 文件处理组件 (files.md)
- **FileBox**: 单个文件展示（预览、下载）
- **FileList**: 批量文件列表展示
- **DownloadFile**: 文件下载功能
- **UploadModal**: 文件上传弹窗
- **CommonUpload**: 通用上传组件
- **FileBreadcrumb**: 文件路径导航

**使用场景**: 文件上传、下载、预览、列表展示

### 4. 业务状态组件 (business.md)
- **AuditCard**: 审核流程状态展示（审核中/通过/驳回）
- **ProbeCard**: 数据探查状态展示（探查中/待审批/已驳回/中止）
- **CommonDetail**: 通用详情页组件
- **CommonDetailContent**: 详情内容包装
- **BaseDescriptions**: 基础描述列表

**使用场景**: 审核流程、数据探查、详情页展示

### 5. 基础UI组件 (ui.md)
- **Alert**: 蓝色提示条
- **Back**: 返回导航
- **ContentCard**: 内容卡片
- **CustomIcon**: 自定义图标（iconfont封装）
- **Empty**: 空状态
- **Title**: 标题组件
- **NewTag**: 状态标签（多色主题）
- **NewMessage**: 全局消息提示

**使用场景**: 通用UI元素、提示信息、状态展示

### 6. 编辑器组件 (editors.md)
- **CodeEditor**: 代码编辑器（CodeMirror封装）
- **SqlEditor**: SQL编辑器
- **MonacoEditor**: Monaco编辑器（VS Code同款）

**使用场景**: 代码编辑、SQL编写、配置编辑

### 7. 交互组件 (interactions.md)
- **PopoverEllipsis**: 省略提示（长文本展示）
- **QuestionPopover**: 问号提示（帮助信息）
- **IconCopy**: 图标复制（复制到剪贴板）
- **ControlledModal**: 受控弹窗（按钮+弹窗绑定）

**使用场景**: 交互反馈、提示信息、复制功能、弹窗交互

## 使用方法

### 方式一：查看特定类别的组件文档

当你需要使用某个特定类别的组件时，直接查看对应的 references 文件：

- 需要使用表格 → 查看 `references/tables.md`
- 需要使用表单 → 查看 `references/forms.md`
- 需要处理文件 → 查看 `references/files.md`
- 需要业务状态 → 查看 `references/business.md`
- 需要基础UI → 查看 `references/ui.md`
- 需要编辑器 → 查看 `references/editors.md`
- 需要交互组件 → 查看 `references/interactions.md`

### 方式二：根据场景选择组件

参考每个类别文件末尾的「组件选择指南」表格，根据你的具体场景选择最合适的组件。

### 方式三：查看示例代码

每个组件都提供了详细的示例代码，包括：
- 基础用法
- 常用属性配置
- 实际业务场景示例
- 表单集成示例

## 最佳实践

1. **组件选择**: 优先使用项目封装的组件，保持代码一致性
2. **属性配置**: 参考文档中的 API 表格，了解每个属性的作用
3. **样式定制**: 使用 style 和 className 进行样式定制
4. **类型安全**: 使用 TypeScript 时参考类型定义
5. **性能优化**: 大数据量场景考虑使用虚拟滚动等优化手段

## 注意事项

1. 所有组件路径基于 `@/components/` 别名
2. 部分组件需要特定的依赖（如 MonacoEditor 需要加载 worker）
3. 表单组件通常需要配合 Ant Design 的 Form 组件使用
4. 文件上传组件需要后端配合提供上传接口

## 更新日志

### v1.0.0
- 初始化组件知识库
- 包含7大类组件：表格、表单、文件、业务状态、UI基础、编辑器、交互
- 提供完整的 API 文档和使用示例
