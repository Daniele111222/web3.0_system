# 基础UI组件

本文件包含项目中所有基础UI相关的组件信息。

## 1. Alert 提示组件

**路径**: `src/components/Alert/index.tsx`

**用途**: 显示蓝色信息提示条

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| text | any | - | 提示文本内容 |
| noWrap | boolean | false | 是否不换行 |
| style | any | - | 自定义样式 |

**业务功能**: 
- 显示蓝色信息提示条
- 包含图标和文本内容
- 支持换行控制

**使用场景**: 表单提示、操作说明、注意事项等

**示例代码**:
```tsx
import Alert from '@/components/Alert';

// 基础用法
<Alert text="请注意，此操作不可撤销" />

// 不换行
<Alert text="这是一条重要提示信息" noWrap />

// 自定义样式
<Alert 
  text="温馨提示：请确保信息填写完整"
  style={{ marginBottom: 16, fontSize: 14 }}
/>

// 多行提示
<Alert 
  text={
    <>
      <div>1. 请确保上传的文件格式正确</div>
      <div>2. 文件大小不能超过 10MB</div>
      <div>3. 支持的格式：PDF、DOC、XLS</div>
    </>
  }
/>
```

---

## 2. Back 返回组件

**路径**: `src/components/Back/index.tsx`

**用途**: 可点击的返回标题组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| title | string \| number | - | 标题内容 |
| onClick | any | - | 自定义点击事件 |
| style | any | - | 自定义样式 |

**业务功能**: 
- 显示可点击的返回标题
- 支持自定义点击事件，否则默认返回上一页
- 使用 Umi 的 history API

**使用场景**: 详情页返回列表、面包屑导航的替代方案

**示例代码**:
```tsx
import Back from '@/components/Back';

// 基础用法 - 返回上一页
<Back title="返回列表" />

// 自定义点击事件
<Back 
  title="返回首页"
  onClick={() => {
    history.push('/home');
  }}
/>

// 自定义样式
<Back 
  title="详情页"
  style={{ fontSize: 16, fontWeight: 'bold' }}
/>

// 结合标题使用
<div className="page-header">
  <Back title=" " style={{ marginRight: 8 }} />
  <h1>项目详情</h1>
</div>
```

---

## 3. ContentCard 内容卡片

**路径**: `src/components/ContentCard/index.tsx`

**用途**: 统一的内容容器组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| className | string | - | 自定义类名 |
| tips | any | null | 提示内容 |
| titleProps | titleType | - | 标题配置 |
| children | any | - | 子元素 |
| style | React.CSSProperties | - | 自定义样式 |

**业务功能**: 
- 提供统一的内容容器样式
- 支持标题和提示信息
- 配合 Title 组件使用

**使用场景**: 页面内容区块、详情信息展示

**示例代码**:
```tsx
import ContentCard from '@/components/ContentCard';
import { Form, Input } from 'antd';

// 基础用法
<ContentCard>
  <p>这里是内容区域</p>
</ContentCard>

// 带标题
<ContentCard
  titleProps={{
    title: '基本信息',
    isShowSpot: true,
  }}
>
  <Form>
    <Form.Item label="名称">
      <Input />
    </Form.Item>
  </Form>
</ContentCard>

// 带提示信息
<ContentCard
  titleProps={{
    title: '注意事项',
  }}
  tips="请确保所有信息填写准确无误"
>
  <div>内容区域</div>
</ContentCard>

// 自定义样式
<ContentCard
  className="custom-card"
  style={{ backgroundColor: '#f5f5f5', padding: 24 }}
>
  <h3>自定义样式卡片</h3>
</ContentCard>

// 复杂场景 - 详情页
<ContentCard
  titleProps={{
    title: '项目详情',
    extra: <Button type="primary">编辑</Button>,
  }}
>
  <Row gutter={16}>
    <Col span={12}>
      <p><strong>项目名称:</strong> {project.name}</p>
      <p><strong>项目编码:</strong> {project.code}</p>
    </Col>
    <Col span={12}>
      <p><strong>负责人:</strong> {project.manager}</p>
      <p><strong>状态:</strong> {project.status}</p>
    </Col>
  </Row>
</ContentCard>
```

---

## 4. CustomIcon 自定义图标

**路径**: `src/components/CustomIcon/index.tsx`

**用途**: 封装 iconfont 图标

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| iconName | string | - | 图标类名 |
| type | 'small' \| 'large' \| 'default' | 'default' | 图标大小 |
| style | any | - | 自定义样式 |
| className | any | - | 自定义类名 |

**业务功能**: 
- 封装 iconfont 图标
- 支持三种预设大小
- 提供默认样式

**使用场景**: 全局图标统一封装

**示例代码**:
```tsx
import CustomIcon from '@/components/CustomIcon';

// 基础用法 - 默认大小
<CustomIcon iconName="icon-success" />

// 小图标
<CustomIcon iconName="icon-edit" type="small" />

// 大图标
<CustomIcon iconName="icon-warning" type="large" />

// 自定义样式
<CustomIcon 
  iconName="icon-user" 
  style={{ color: '#1890ff', fontSize: 24 }}
/>

// 自定义类名
<CustomIcon 
  iconName="icon-delete" 
  className="danger-icon"
/>

// 配合按钮使用
<Button icon={<CustomIcon iconName="icon-download" />}>
  下载
</Button>

// 配合菜单使用
<Menu>
  <Menu.Item icon={<CustomIcon iconName="icon-view" />}>
    查看
  </Menu.Item>
  <Menu.Item icon={<CustomIcon iconName="icon-edit" />}>
    编辑
  </Menu.Item>
</Menu>
```

---

## 5. Empty 空状态

**路径**: `src/components/Empty/index.tsx`

**用途**: 标准 Empty 组件封装

**业务功能**: 空状态展示

**示例代码**:
```tsx
import Empty from '@/components/Empty';

// 基础用法
<Empty description="暂无数据" />

// 自定义图片
<Empty 
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description="暂无权限"
/>

// 配合表格使用
<Table 
  dataSource={data}
  columns={columns}
  locale={{
    emptyText: <Empty description="暂无数据" />
  }}
/>
```

---

## 6. Title 标题组件

**路径**: `src/components/Title/index.tsx`

**用途**: 统一的标题样式组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| title | string \| ReactElement | - | 标题内容 |
| className | string | - | 自定义类名 |
| extra | ReactNode | - | 右侧额外内容 |
| isShowSpot | boolean | true | 是否显示左侧色点 |

**业务功能**: 
- 统一的标题样式
- 支持额外操作区域
- 可配置的色点装饰

**使用场景**: 区块标题、卡片标题

**示例代码**:
```tsx
import Title from '@/components/Title';
import { Button } from 'antd';

// 基础用法
<Title title="基本信息" />

// 不显示色点
<Title title="详细信息" isShowSpot={false} />

// 带额外操作
<Title 
  title="项目列表" 
  extra={
    <>
      <Button>导出</Button>
      <Button type="primary">新增</Button>
    </>
  }
/>

// 配合卡片使用
<Card>
  <Title title="今日统计" />
  <div>统计内容...</div>
</Card>

// 自定义样式
<Title 
  title="重要通知" 
  className="important-title"
  style={{ color: '#ff4d4f' }}
/>
```

---

## 7. NewTag 新标签

**路径**: `src/components/NewTag/index.tsx`

**用途**: 状态标签展示

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| content | any | - | 标签内容 |
| color | string | - | 颜色主题 |
| style | any | - | 自定义样式 |
| className | string | - | 自定义类名 |

**预设颜色主题**:

| 主题名 | 颜色值 | 背景色 |
|--------|--------|--------|
| green | #14c5a5 | #EDF9F5 |
| deepGreen | #129671 | rgba(18, 150, 113, 0.08) |
| blue | #007BEA | rgba(0, 82, 217, 0.07) |
| deepBlue | #332cf3 | rgba(51, 44, 243, 0.08) |
| red | #e34d59 | - |
| gray | rgba(0, 0, 0, 0.25) | - |
| yellow | #ffad0d | #FFF9EF |
| purple | #474cc6 | #F2F2FB |

**业务功能**: 
- 状态标签展示
- 多种预设颜色主题
- 统一的标签样式

**使用场景**: 状态标识、类型标签

**示例代码**:
```tsx
import NewTag from '@/components/NewTag';

// 基础用法
<NewTag content="进行中" />

// 预设颜色
<NewTag content="已完成" color="green" />
<NewTag content="审核中" color="blue" />
<NewTag content="已驳回" color="red" />
<NewTag content="待处理" color="yellow" />
<NewTag content="已归档" color="gray" />

// 状态映射
const statusMap = {
  0: { text: '待开始', color: 'gray' },
  1: { text: '进行中', color: 'blue' },
  2: { text: '已完成', color: 'green' },
  3: { text: '已取消', color: 'red' },
};

const status = 1;
<NewTag 
  content={statusMap[status].text} 
  color={statusMap[status].color} 
/>

// 配合表格使用
const columns = [
  { title: '名称', dataIndex: 'name' },
  { 
    title: '状态', 
    dataIndex: 'status',
    render: (status) => (
      <NewTag 
        content={statusMap[status].text} 
        color={statusMap[status].color}
      />
    )
  },
];

// 自定义样式
<NewTag 
  content="VIP" 
  color="purple"
  style={{ fontSize: 12, fontWeight: 'bold' }}
  className="vip-tag"
/>
```

---

## 8. NewMessage 新消息提示

**路径**: `src/components/NewMessage/index.tsx`

**用途**: 全局消息提示封装

**API**: 

| 方法名 | 参数 | 说明 |
|--------|------|------|
| success | content, duration, onClose | 成功提示 |
| error | content, duration, onClose | 错误提示 |
| warning | content, duration, onClose | 警告提示 |
| info | content, duration, onClose | 信息提示 |

**业务功能**: 
- 全局消息提示封装
- 统一的消息样式

**使用场景**: 全局消息反馈

**示例代码**:
```tsx
import NewMessage from '@/components/NewMessage';

// 成功提示
NewMessage.success('操作成功！');

// 错误提示
NewMessage.error('操作失败，请重试！');

// 警告提示
NewMessage.warning('请注意，此操作不可撤销！');

// 信息提示
NewMessage.info('新的消息提醒');

// 自定义显示时长（秒）
NewMessage.success('保存成功！', 3);  // 显示3秒

// 关闭后的回调
NewMessage.success('操作成功！', 2, () => {
  console.log('消息已关闭');
  // 可以在这里刷新页面或跳转
});

// 在异步操作中使用
const handleSave = async () => {
  try {
    const res = await api.saveData(formData);
    if (res.success) {
      NewMessage.success('保存成功！');
      // 刷新列表
      refreshList();
    } else {
      NewMessage.error(res.message || '保存失败');
    }
  } catch (error) {
    NewMessage.error('网络错误，请稍后重试');
  }
};

// 批量操作提示
const handleBatchDelete = async (ids) => {
  try {
    await api.batchDelete(ids);
    NewMessage.success(`成功删除 ${ids.length} 条数据`);
    refreshList();
  } catch (error) {
    NewMessage.error('删除失败');
  }
};
```

---

## 基础UI组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 提示信息 | Alert | 蓝色提示条，统一样式 |
| 返回导航 | Back | 集成返回功能 |
| 内容容器 | ContentCard | 统一卡片样式 |
| 图标展示 | CustomIcon | 封装 iconfont |
| 空状态 | Empty | 标准空状态 |
| 区块标题 | Title | 统一标题样式 |
| 状态标签 | NewTag | 多种颜色主题 |
| 全局消息 | NewMessage | 统一消息提示 |

## 基础UI组件通用规范

1. **样式一致性**: 所有基础UI组件遵循统一的设计规范
2. **可配置性**: 提供 style 和 className 属性支持自定义样式
3. **类型安全**: 使用 TypeScript 定义完整的 props 类型
4. **图标规范**: 图标使用 iconfont，通过 CustomIcon 组件统一封装
5. **颜色规范**: 遵循预设的颜色主题，避免随意定义颜色值
