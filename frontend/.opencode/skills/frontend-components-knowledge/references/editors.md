# 编辑器组件

本文件包含项目中所有编辑器相关的组件信息。

## 1. CodeEditor 代码编辑器

**路径**: `src/components/CodeEditor/index.tsx`

**用途**: 基于 CodeMirror 的代码编辑器

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| defaultValue | string | - | 默认值 |
| theme | string | 'light' | 主题 |
| onChange | Function | - | 变化回调 |
| placeholder | string | - | 占位提示 |
| lineWrapping | string | 'wrap' | 换行模式 |
| readOnly | boolean | false | 是否只读 |
| options | object | {} | CodeMirror 配置 |
| onScroll | Function | - | 滚动回调 |

**业务功能**: 
- 基于 CodeMirror 的代码编辑
- 支持 Lua 语法高亮
- 只读/编辑模式切换

**使用场景**: 代码编辑、脚本编辑

**示例代码**:
```tsx
import CodeEditor from '@/components/CodeEditor';
import { useState } from 'react';

const [code, setCode] = useState(`function hello() {
  console.log("Hello World");
}`);

// 基础用法
<CodeEditor
  defaultValue={code}
  onChange={(value) => setCode(value)}
/>

// 暗色主题
<CodeEditor
  defaultValue={code}
  theme="dark"
  onChange={(value) => console.log(value)}
/>

// 只读模式
<CodeEditor
  defaultValue={code}
  readOnly={true}
/>

// 带占位提示
<CodeEditor
  placeholder="请输入Lua脚本..."
  onChange={(value) => console.log(value)}
/>

// 高级配置
<CodeEditor
  defaultValue={code}
  options={{
    lineNumbers: true,      // 显示行号
    mode: 'lua',            // Lua语法高亮
    tabSize: 2,             // 缩进大小
    indentWithTabs: false,  // 使用空格缩进
  }}
  onChange={(value) => setCode(value)}
  onScroll={(scrollInfo) => console.log('滚动位置:', scrollInfo)}
/>

// 在表单中使用
import { Form } from 'antd';

<Form.Item
  name="script"
  label="脚本代码"
  rules={[{ required: true, message: '请输入脚本代码' }]}
>
  <CodeEditor
    placeholder="请输入脚本代码..."
    style={{ minHeight: 200 }}
  />
</Form.Item>
```

---

## 2. SqlEditor SQL编辑器

**路径**: `src/components/SqlEditor/index.tsx`

**用途**: SQL 语句编辑器组件

**API**: SQL 编辑器组件

**业务功能**: SQL 语句编辑

**示例代码**:
```tsx
import SqlEditor from '@/components/SqlEditor';
import { useState } from 'react';

const [sql, setSql] = useState('SELECT * FROM users WHERE id = 1');

// 基础用法
<SqlEditor
  value={sql}
  onChange={(value) => setSql(value)}
/>

// 带语法高亮
<SqlEditor
  value={sql}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    lineNumbers: 'on',
  }}
/>

// 只读模式
<SqlEditor
  value={sql}
  readOnly={true}
  theme="light"
/>

// 在表单中使用
<Form.Item
  name="querySql"
  label="查询SQL"
  rules={[{ required: true, message: '请输入SQL语句' }]}
>
  <SqlEditor
    style={{ height: 200 }}
    placeholder="请输入SQL查询语句..."
  />
</Form.Item>
```

---

## 3. MonacoEditor Monaco编辑器

**路径**: `src/components/MonacoEditor/index.tsx`

**用途**: 基于 Monaco Editor 的封装

**API**: 基于 Monaco Editor 的封装

**业务功能**: 代码编辑、语法高亮

**示例代码**:
```tsx
import MonacoEditor from '@/components/MonacoEditor';
import { useState } from 'react';

const [code, setCode] = useState(`// 示例代码
function calculate(a, b) {
  return a + b;
}`);

// 基础用法
<MonacoEditor
  value={code}
  language="javascript"
  onChange={(value) => setCode(value)}
/>

// 不同语言支持
<MonacoEditor
  value={jsonCode}
  language="json"
  theme="vs"
/>

<MonacoEditor
  value={htmlCode}
  language="html"
  theme="vs-dark"
/>

<MonacoEditor
  value={cssCode}
  language="css"
  options={{
    minimap: { enabled: true },
    fontSize: 14,
  }}
/>

// 高级配置
<MonacoEditor
  value={code}
  language="typescript"
  theme="vs-dark"
  options={{
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    folding: true,
    renderWhitespace: 'all',
  }}
  onChange={(newValue) => setCode(newValue)}
  editorDidMount={(editor, monaco) => {
    console.log('编辑器已挂载');
    // 可以在这里进行编辑器的高级配置
  }}
/>

// 对比模式（Diff Editor）
<MonacoEditor.DiffEditor
  original={oldCode}
  modified={newCode}
  language="javascript"
  theme="vs"
/>

// 在表单中使用
<Form.Item
  name="configJson"
  label="配置JSON"
  rules={[
    { required: true, message: '请输入配置' },
    {
      validator: (_, value) => {
        try {
          JSON.parse(value);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject('请输入有效的JSON格式');
        }
      },
    },
  ]}
>
  <MonacoEditor
    language="json"
    height={300}
    options={{
      minimap: { enabled: false },
    }}
  />
</Form.Item>
```

---

## 编辑器组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 代码编辑（简单） | CodeEditor | 基于 CodeMirror，轻量级 |
| SQL编辑 | SqlEditor | 内置SQL语法高亮 |
| 复杂代码编辑 | MonacoEditor | 功能强大，支持多语言 |
| JSON编辑 | MonacoEditor | 支持JSON校验和格式化 |
| 代码对比 | MonacoEditor.DiffEditor | 内置diff功能 |

## 编辑器组件通用规范

1. **主题选择**: 提供 light 和 dark 主题，根据场景选择
2. **语言支持**: 根据编辑器类型选择合适的语言模式
3. **只读模式**: 查看场景使用 readOnly 模式防止编辑
4. **性能优化**: 大数据量时启用虚拟化渲染
5. **错误处理**: JSON等格式编辑时提供校验功能
