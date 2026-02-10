# 交互组件

本文件包含项目中所有交互相关的组件信息。

## 1. PopoverEllipsis 省略提示

**路径**: `src/components/PopoverEllipsis/index.tsx`

**用途**: 内容超出宽度时显示省略号和Popover提示

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| value | string \| number | - | 显示内容 |
| width | number | - | 容器宽度 |

**业务功能**: 
- 内容超出宽度显示省略号
- 鼠标移入显示完整内容 Popover
- 宽度足够时不显示省略号和 Popover

**使用场景**: 表格列内容、长文本展示

**示例代码**:
```tsx
import PopoverEllipsis from '@/components/PopoverEllipsis';

// 基础用法
<PopoverEllipsis value="这是一段很长的文本内容" />

// 指定宽度
<PopoverEllipsis 
  value="这是一段很长的文本内容，超出部分会显示省略号"
  width={200}
/>

// 配合表格使用
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { 
    title: '描述', 
    dataIndex: 'description',
    render: (text) => <PopoverEllipsis value={text} width={300} />
  },
];

// 数字类型
<PopoverEllipsis value={123456789012} width={100} />

// 配合其他组件使用
<Card title="简介">
  <PopoverEllipsis 
    value="这是一个非常长的项目介绍文本..."
    width={400}
  />
</Card>
```

---

## 2. QuestionPopover 问号提示

**路径**: `src/components/QuestionPopover/index.tsx`

**用途**: 问号图标触发Popover显示帮助提示

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| content | ReactNode | - | 提示内容 |
| children | ReactNode | - | 自定义触发元素 |
| contentWidth | string | '330px' | 内容区宽度 |

**业务功能**: 
- 问号图标触发 Popover
- 显示帮助提示信息
- 支持自定义触发元素

**使用场景**: 表单字段说明、功能提示

**示例代码**:
```tsx
import QuestionPopover from '@/components/QuestionPopover';
import { Form, Input } from 'antd';

// 基础用法 - 问号提示
<Form.Item 
  label={
    <>
      项目编码
      <QuestionPopover content="项目编码格式为 PRJ+年份+序号，如 PRJ2024001" />
    </>
  }
  name="projectCode"
>
  <Input placeholder="请输入项目编码" />
</Form.Item>

// 自定义提示内容
<Form.Item label={
  <>
    计算公式
    <QuestionPopover 
      content={
        <div>
          <p><strong>支持的运算符：</strong></p>
          <ul>
            <li>+ 加法</li>
            <li>- 减法</li>
            <li>* 乘法</li>
            <li>/ 除法</li>
          </ul>
          <p><strong>示例：</strong>(A + B) * C / 100</p>
        </div>
      }
      contentWidth="400px"
    />
  </>
}>
  <Input.TextArea />
</Form.Item>

// 自定义触发元素
<QuestionPopover content="点击查看帮助">
  <Button icon={<QuestionCircleOutlined />}>帮助</Button>
</QuestionPopover>

// 表格列头提示
const columns = [
  { 
    title: '字段名', 
    dataIndex: 'name',
    width: 150,
  },
  { 
    title: (
      <>
        计算公式
        <QuestionPopover content="字段间的计算关系，支持 + - * / 运算" />
      </>
    ), 
    dataIndex: 'formula',
  },
];
```

---

## 3. IconCopy 图标复制

**路径**: `src/components/IconCopy/index.tsx`

**用途**: 点击复制内容到剪贴板

**业务功能**: 
- 点击复制内容到剪贴板
- 配合图标使用

**使用场景**: ID复制、链接复制

**示例代码**:
```tsx
import IconCopy from '@/components/IconCopy';

// 基础用法 - 复制文本
<IconCopy text="需要复制的文本内容" />

// 配合ID显示
<div>
  <span>ID: 123456789</span>
  <IconCopy text="123456789" />
</div>

// 复制链接
<IconCopy 
  text="https://example.com/page?id=123" 
  tooltip="复制链接"
/>

// 复制JSON数据
const jsonData = JSON.stringify({ id: 1, name: 'test' });
<IconCopy text={jsonData} tooltip="复制JSON" />

// 在表格中使用
const columns = [
  { 
    title: 'ID', 
    dataIndex: 'id',
    render: (id) => (
      <>
        {id}
        <IconCopy text={id} />
      </>
    )
  },
  { title: '名称', dataIndex: 'name' },
];
```

---

## 4. ControlledModal 受控弹窗

**路径**: `src/components/ControlledModal/index.tsx`

**用途**: 触发按钮与弹窗绑定的受控组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| btn | ReactNode | - | 触发按钮 |
| children | ReactNode | - | 弹窗内容 |
| beforeOpen | Function | - | 打开前回调 |
| onOpen | Function | - | 打开回调 |
| onClose | Function | - | 关闭回调 |
| modalProps | ModalProps | - | Modal 配置 |
| className | string | - | 自定义类名 |

**提供的方法** (通过 ref):

| 方法名 | 说明 |
|--------|------|
| handleOpen | 打开弹窗 |
| handleClose | 关闭弹窗 |

**业务功能**: 
- 触发按钮与弹窗绑定
- 打开前异步校验
- 提交异步处理
- 命令式控制

**使用场景**: 表单弹窗、确认弹窗

**示例代码**:
```tsx
import ControlledModal from '@/components/ControlledModal';
import { Button, Form, Input, message } from 'antd';
import { useRef, useState } from 'react';

const modalRef = useRef();
const [form] = Form.useForm();
const [loading, setLoading] = useState(false);

// 打开前校验
const handleBeforeOpen = async () => {
  // 可以在这里进行打开前的校验
  console.log('弹窗即将打开');
  return true; // 返回 true 允许打开，返回 false 阻止打开
};

// 弹窗打开回调
const handleOpen = () => {
  console.log('弹窗已打开');
  // 可以在这里初始化表单数据
  form.resetFields();
};

// 弹窗关闭回调
const handleClose = () => {
  console.log('弹窗已关闭');
  // 清理工作
  form.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    setLoading(true);
    
    // 调用API保存数据
    await api.saveData(values);
    
    message.success('保存成功');
    modalRef.current?.handleClose();
    // 刷新列表
    refreshList();
  } catch (error) {
    message.error('保存失败：' + error.message);
  } finally {
    setLoading(false);
  }
};

// 基础用法
<ControlledModal
  ref={modalRef}
  btn={<Button type="primary">新增</Button>}
  beforeOpen={handleBeforeOpen}
  onOpen={handleOpen}
  onClose={handleClose}
  modalProps={{
    title: '新增项目',
    width: 600,
    destroyOnClose: true,
  }}
>
  <Form form={form} layout="vertical">
    <Form.Item
      name="name"
      label="项目名称"
      rules={[{ required: true, message: '请输入项目名称' }]}
    >
      <Input placeholder="请输入项目名称" />
    </Form.Item>
    <Form.Item
      name="code"
      label="项目编码"
      rules={[{ required: true, message: '请输入项目编码' }]}
    >
      <Input placeholder="请输入项目编码" />
    </Form.Item>
  </Form>
</ControlledModal>

// 命令式控制
const handleOpenModal = () => {
  modalRef.current?.handleOpen();
};

const handleCloseModal = () => {
  modalRef.current?.handleClose();
};

// 带确认按钮的弹窗
<ControlledModal
  ref={modalRef}
  btn={<Button>删除</Button>}
  modalProps={{
    title: '确认删除',
    okText: '确认',
    okButtonProps: { danger: true },
    onOk: handleDelete,
  }}
>
  <p>确定要删除这条数据吗？此操作不可撤销。</p>
</ControlledModal>

// 多步骤弹窗
const [step, setStep] = useState(1);

<ControlledModal
  ref={modalRef}
  btn={<Button type="primary">开始配置</Button>}
  modalProps={{
    title: `配置向导 (${step}/3)`,
    width: 800,
    footer: (
      <>
        {step > 1 && <Button onClick={() => setStep(step - 1)}>上一步</Button>}
        {step < 3 ? (
          <Button type="primary" onClick={() => setStep(step + 1)}>下一步</Button>
        ) : (
          <Button type="primary" onClick={handleComplete}>完成</Button>
        )}
      </>
    ),
  }}
  onOpen={() => setStep(1)}
>
  {step === 1 && <Step1Content />}
  {step === 2 && <Step2Content />}
  {step === 3 && <Step3Content />}
</ControlledModal>
```

---

## 交互组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 长文本省略 | PopoverEllipsis | 自动判断宽度，支持Popover提示 |
| 帮助提示 | QuestionPopover | 问号图标触发，支持自定义内容 |
| 复制功能 | IconCopy | 点击复制到剪贴板 |
| 弹窗交互 | ControlledModal | 触发按钮与弹窗绑定，支持命令式控制 |

## 交互组件通用规范

1. **交互反馈**: 所有交互操作需提供明确的反馈（如复制成功提示、弹窗打开动画）
2. **可访问性**: 交互组件需支持键盘操作和屏幕阅读器
3. **移动端适配**: 交互组件在移动端需有合适的手势支持
4. **性能优化**: 频繁交互的组件需进行性能优化（如防抖、节流）
5. **错误处理**: 交互失败时需有降级方案和错误提示
