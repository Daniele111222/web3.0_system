# 表格类组件

本文件包含项目中所有表格相关的组件信息。

## 1. DragTable 拖拽表格

**路径**: `src/components/DragTable/index.jsx`

**用途**: 支持行拖拽排序的表格组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| columns | Array | [] | 列配置 |
| dataSource | Array | [] | 数据源 |
| dragable | boolean | false | 是否可拖拽 |
| onChange | Function | - | 数据变化回调 |

**业务功能**: 
- 支持行拖拽排序
- 支持父子级拖拽
- 使用 react-dnd 实现

**使用场景**: 需要拖拽排序的表格

**示例代码**:
```jsx
import DragTable from '@/components/DragTable';

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '顺序', dataIndex: 'sort' },
];

const data = [
  { id: 1, name: '项目1', sort: 1 },
  { id: 2, name: '项目2', sort: 2 },
];

<DragTable
  columns={columns}
  dataSource={data}
  dragable={true}
  onChange={(newData) => console.log('排序后:', newData)}
/>
```

---

## 2. FormListTable 表单列表表格

**路径**: `src/components/FormListTable/index.tsx`

**用途**: 表单内的列表表格

**API**: 支持 Antd Table 标准 API

**业务功能**: 表单内的列表表格

**使用场景**: 表单中需要展示列表数据的场景

**示例代码**:
```jsx
import FormListTable from '@/components/FormListTable';
import { Form } from 'antd';

const [form] = Form.useForm();

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '值', dataIndex: 'value' },
];

<Form form={form}>
  <FormListTable
    columns={columns}
    dataSource={data}
  />
</Form>
```

---

## 3. RequestTable 请求表格

**路径**: `src/components/RequestTable/index.tsx`

**用途**: 封装了请求逻辑的表格组件

**API**: 封装了请求逻辑的表格组件

**业务功能**: 
- 内置数据请求
- 分页处理
- 自动加载数据

**使用场景**: 需要自动请求数据的列表页面

**示例代码**:
```jsx
import RequestTable from '@/components/RequestTable';

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '状态', dataIndex: 'status' },
];

// 请求函数
const fetchData = async (params) => {
  const res = await api.getList(params);
  return {
    data: res.data.list,
    total: res.data.total,
  };
};

<RequestTable
  columns={columns}
  request={fetchData}
  rowKey="id"
/>
```

---

## 表格组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 需要拖拽排序 | DragTable | 内置拖拽功能 |
| 表单内列表 | FormListTable | 与 Form 集成 |
| 自动请求数据 | RequestTable | 内置请求逻辑 |
| 简单表格展示 | Antd Table | 无需额外封装 |
