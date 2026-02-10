---
name: frontend-components-knowledge
description: |
  前端组件知识库 - 为AI提供项目组件的分类知识库，帮助AI理解和使用项目中的组件。
  根据组件类型（表格、表单、文件、业务状态等）组织知识，便于AI快速定位和使用合适的组件。

version: 1.0.0
category: frontend

tags:
  - components
  - react
  - typescript
  - knowledge-base

# 知识库依赖文件
references:
  # 表格类组件
  - path: references/tables.md
    type: component-reference
    category: table
    components:
      - DragTable
      - FormListTable
      - RequestTable
  
  # 表单类组件
  - path: references/forms.md
    type: component-reference
    category: form
    components:
      - FormElement
      - CommonFormItems
      - SearchHead
      - FormTable
  
  # 文件处理组件
  - path: references/files.md
    type: component-reference
    category: file
    components:
      - FileBox
      - FileList
      - DownloadFile
      - UploadModal
      - CommonUpload
      - FileBreadcrumb
  
  # 业务状态组件
  - path: references/business.md
    type: component-reference
    category: business
    components:
      - AuditCard
      - ProbeCard
      - CommonDetail
      - CommonDetailContent
      - BaseDescriptions
  
  # 基础UI组件
  - path: references/ui.md
    type: component-reference
    category: ui
    components:
      - Alert
      - Back
      - ContentCard
      - CustomIcon
      - Empty
      - Title
      - NewTag
      - NewMessage
  
  # 编辑器组件
  - path: references/editors.md
    type: component-reference
    category: editor
    components:
      - CodeEditor
      - SqlEditor
      - MonacoEditor
  
  # 交互组件
  - path: references/interactions.md
    type: component-reference
    category: interaction
    components:
      - PopoverEllipsis
      - QuestionPopover
      - IconCopy
      - ControlledModal

# Prompts for different use cases
prompts:
  - name: table-usage
    description: 当需要使用表格组件时
    prompt: |
      请从 references/tables.md 中获取表格组件的详细使用方法。
      根据场景选择合适的表格组件：
      - DragTable: 需要拖拽排序功能的表格
      - FormListTable: 表单内的列表表格
      - RequestTable: 需要内置请求逻辑的表格
  
  - name: form-usage
    description: 当需要使用表单组件时
    prompt: |
      请从 references/forms.md 中获取表单组件的详细使用方法。
      根据场景选择合适的表单组件：
      - FormElement: 通用表单元素封装
      - CommonFormItems: 通用表单项（地址、行业等）
      - SearchHead: 列表页搜索区域
      - FormTable: 标签-值形式的详情展示
  
  - name: file-usage
    description: 当需要处理文件时
    prompt: |
      请从 references/files.md 中获取文件处理组件的详细使用方法。
      根据场景选择合适的文件组件：
      - FileBox: 单个文件展示（预览、下载）
      - FileList: 文件列表展示
      - DownloadFile: 文件下载功能
      - UploadModal: 文件上传弹窗
      - FileBreadcrumb: 文件路径导航

# 元数据
metadata:
  project: connector-frontend
  source: src/components/
  document: src/components/组件分析文档.md
  categories:
    - table
    - form
    - file
    - business
    - ui
    - editor
    - interaction
