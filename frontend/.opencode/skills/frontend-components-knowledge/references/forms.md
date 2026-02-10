# 表单类组件

本文件包含项目中所有表单相关的组件信息。

## 1. FormElement 表单元素

**路径**: `src/components/FormElement/index.tsx`

**用途**: 统一封装的表单元素组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| type | string | - | 元素类型 |
| 其他属性 | any | - | 对应 Antd 组件属性 |

**支持的类型**:
- Input / InputNumber / TextArea
- DatePicker / RangePicker
- Radio / Select / Cascader
- RemoteSelect (远程搜索选择器)

**业务功能**: 
- 统一封装表单元素
- 远程数据选择支持
- 标准样式预设

**使用场景**: 表单页面统一组件

**示例代码**:
```tsx
import FormElement from '@/components/FormElement';
import { Form } from 'antd';

const [form] = Form.useForm();

<Form form={form}>
  {/* 输入框 */}
  <Form.Item name="name" label="名称">
    <FormElement type="Input" placeholder="请输入名称" />
  </Form.Item>
  
  {/* 文本域 */}
  <Form.Item name="description" label="描述">
    <FormElement type="TextArea" rows={4} />
  </Form.Item>
  
  {/* 数字输入框 */}
  <Form.Item name="count" label="数量">
    <FormElement type="InputNumber" min={0} max={100} />
  </Form.Item>
  
  {/* 日期选择器 */}
  <Form.Item name="date" label="日期">
    <FormElement type="DatePicker" style={{ width: '100%' }} />
  </Form.Item>
  
  {/* 日期范围选择器 */}
  <Form.Item name="dateRange" label="日期范围">
    <FormElement type="RangePicker" style={{ width: '100%' }} />
  </Form.Item>
  
  {/* 单选框 */}
  <Form.Item name="status" label="状态">
    <FormElement 
      type="Radio" 
      options={[
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ]}
    />
  </Form.Item>
  
  {/* 下拉选择器 */}
  <Form.Item name="type" label="类型">
    <FormElement 
      type="Select" 
      options={[
        { label: '类型A', value: 'a' },
        { label: '类型B', value: 'b' },
      ]}
    />
  </Form.Item>
  
  {/* 远程搜索选择器 */}
  <Form.Item name="userId" label="用户">
    <FormElement 
      type="RemoteSelect" 
      fetchUrl="/api/users/search"
      labelKey="name"
      valueKey="id"
    />
  </Form.Item>
</Form>
```

---

## 2. CommonFormItems 通用表单项

**路径**: `src/components/CommonFormItems/index.tsx`

**用途**: 封装常用的表单元素组合

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| getOptions | Function | - | 转换选项数据 |
| disabledId | string \| number | - | 禁用ID |
| params | any | - | 请求参数 |
| disabledHandle | Function | - | 禁用判断函数 |
| addressSelectLevel | number | - | 地址选择层级 |

**提供的组件**:
- `CommonSelectElm`: 通用选择器
- `AddressFormElm`: 地址级联选择
- `IndustryFormElm`: 行业级联选择
- `RemoteSearchSelector`: 远程搜索选择器

**业务功能**: 
- 地址数据联动
- 行业数据联动
- 远程搜索支持

**使用场景**: 表单中的地址、行业等通用选择

**示例代码**:
```tsx
import { 
  CommonSelectElm, 
  AddressFormElm, 
  IndustryFormElm,
  RemoteSearchSelector 
} from '@/components/CommonFormItems';
import { Form } from 'antd';

const [form] = Form.useForm();

<Form form={form}>
  {/* 通用选择器 */}
  <Form.Item name="category" label="分类">
    <CommonSelectElm
      fetchUrl="/api/categories"
      labelKey="name"
      valueKey="id"
    />
  </Form.Item>
  
  {/* 地址级联选择 */}
  <Form.Item name="address" label="地址">
    <AddressFormElm level={3} />
  </Form.Item>
  
  {/* 行业级联选择 */}
  <Form.Item name="industry" label="所属行业">
    <IndustryFormElm />
  </Form.Item>
  
  {/* 远程搜索选择器 */}
  <Form.Item name="productId" label="产品">
    <RemoteSearchSelector
      fetchUrl="/api/products/search"
      searchKey="keyword"
      labelKey="productName"
      valueKey="id"
    />
  </Form.Item>
</Form>
```

---

## 3. SearchHead 搜索头部

**路径**: `src/components/SearchHead/index.tsx`

**用途**: 列表页搜索区域组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| form | any | - | Form 实例 |
| onFinish | Function | - | 提交回调 |
| onReset | Function | - | 重置回调 |
| setParams | Function | - | 设置参数 |
| arrFormItem | Array | - | 表单项配置 |
| isSmall | boolean | - | 是否小尺寸模式 |
| isReset | boolean | true | 是否显示重置按钮 |
| searchTitle | ReactNode | - | 搜索区域标题 |
| renderSearchButtonBefore | Function | - | 渲染查询按钮前内容 |
| renderSearchButtonAfter | Function | - | 渲染查询按钮后内容 |

**业务功能**: 
- 响应式搜索表单布局
- 展开/收起更多搜索项
- 自定义搜索区域

**使用场景**: 列表页搜索区域

**示例代码**:
```tsx
import SearchHead from '@/components/SearchHead';
import { Form } from 'antd';
import { useState } from 'react';

const [form] = Form.useForm();
const [params, setParams] = useState({});

const arrFormItem = [
  {
    type: 'Input',
    label: '名称',
    name: 'name',
    placeholder: '请输入名称',
  },
  {
    type: 'Select',
    label: '状态',
    name: 'status',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
  {
    type: 'DatePicker',
    label: '创建时间',
    name: 'createTime',
  },
];

const handleFinish = (values) => {
  console.log('搜索条件:', values);
  // 执行搜索
};

const handleReset = () => {
  form.resetFields();
  setParams({});
};

<SearchHead
  form={form}
  setParams={setParams}
  arrFormItem={arrFormItem}
  onFinish={handleFinish}
  onReset={handleReset}
  isReset={true}
  searchTitle="搜索条件"
/>
```

---

## 4. FormTable 表单表格

**路径**: `src/components/FormTable/index.tsx`

**用途**: 标签-值形式的详情展示表格

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| list | ListItem[] | - | 表单项列表 |
| extra | string \| ReactNode | - | 额外内容 |
| lableWidth | number \| string | '180px' | 标签宽度 |
| isGray | boolean | false | 是否灰色背景 |
| form | any | - | Form 实例 |

**ListItem 结构**:
```typescript
interface ListItem {
  label: string;      // 标签文本
  name: string;       // 字段名
  render?: Function;  // 自定义渲染函数
  span?: number;      // 占据列数
  type?: string;      // 类型（可选）
}
```

**业务功能**: 
- 标签-值形式的详情展示
- 可配置的列数和布局

**使用场景**: 详情页信息展示

**示例代码**:
```tsx
import FormTable from '@/components/FormTable';
import { Form } from 'antd';

const [form] = Form.useForm();

const detailData = {
  name: '项目名称',
  code: 'PRJ001',
  status: '进行中',
  createTime: '2024-01-01',
  creator: '张三',
  description: '这是一个项目描述',
  budget: 100000,
};

const list = [
  { label: '项目名称', name: 'name' },
  { label: '项目编码', name: 'code' },
  { 
    label: '项目状态', 
    name: 'status',
    render: (value) => <Tag color={value === '进行中' ? 'blue' : 'green'}>{value}</Tag>
  },
  { label: '创建时间', name: 'createTime' },
  { label: '创建人', name: 'creator' },
  { 
    label: '项目预算', 
    name: 'budget',
    render: (value) => `¥${value.toLocaleString()}`
  },
  { 
    label: '项目描述', 
    name: 'description',
    span: 2  // 占据两列
  },
];

<FormTable
  form={form}
  list={list}
  lableWidth="120px"
  isGray={true}
  extra={<Button type="primary">编辑</Button>}
/>
```

---

## 表单组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 通用表单字段 | FormElement | 统一封装，类型丰富 |
| 地址/行业选择 | CommonFormItems | 内置数据联动 |
| 列表页搜索 | SearchHead | 响应式布局，功能完善 |
| 详情信息展示 | FormTable | 标签-值形式布局 |
| 表单验证 | Antd Form | 内置验证规则 |

## 表单组件通用规范

1. **表单项宽度**: 统一使用 `style={{ width: '100%' }}` 或适当宽度
2. **必填项**: 使用 `rules={[{ required: true, message: '请输入xxx' }]}`
3. **表单布局**: 默认使用水平布局 `layout="horizontal"`
4. **提交按钮**: 使用 `htmlType="submit"` 触发表单验证
5. **重置功能**: 提供重置按钮，调用 `form.resetFields()`
