# 业务状态组件

本文件包含项目中所有业务状态相关的组件信息。

## 1. AuditCard 审核卡片

**路径**: `src/components/AuditCard/index.tsx`

**用途**: 展示审核流程状态

**提供的组件**:

| 组件名 | 说明 |
|--------|------|
| IngCard | 审核中状态 |
| SuccessCard | 审核通过状态 |
| ErrorCard | 审核驳回状态 |

**业务功能**: 
- 展示不同审核状态的卡片
- 审核中、通过、驳回三种状态

**使用场景**: 审核流程状态展示

**示例代码**:
```tsx
import { AuditCard } from '@/components/AuditCard';

// 审核中状态
<AuditCard.IngCard />

// 审核通过状态
<AuditCard.SuccessCard name="项目审批" />

// 审核驳回状态
<AuditCard.ErrorCard />

// 根据状态动态渲染
const status = 'success'; // 'ing' | 'success' | 'error'

{status === 'ing' && <AuditCard.IngCard />}
{status === 'success' && <AuditCard.SuccessCard name="审批通过" />}
{status === 'error' && <AuditCard.ErrorCard />}
```

---

## 2. ProbeCard 探查卡片

**路径**: `src/components/ProbeCard/index.tsx`

**用途**: 数据探查流程状态展示

**提供的组件**:

| 组件名 | 参数 | 说明 |
|--------|------|------|
| IngCard | meProbe, applyName, applyPlatformName | 探查中状态 |
| WaitCard | meProbe | 待审批状态 |
| ErrorCard | rejectReason | 已驳回状态 |
| StopCard | - | 探查中止状态 |

**业务功能**: 
- 数据探查流程状态展示
- 探查中、待审批、已驳回、探查中止四种状态

**使用场景**: 数据探查业务状态展示

**示例代码**:
```tsx
import { ProbeCard } from '@/components/ProbeCard';

// 探查中状态
<ProbeCard.IngCard 
  meProbe={true}
  applyName="数据探查申请"
  applyPlatformName="数据平台"
/>

// 待审批状态
<ProbeCard.WaitCard meProbe={false} />

// 已驳回状态
<ProbeCard.ErrorCard rejectReason="数据权限不足，无法完成探查" />

// 探查中止状态
<ProbeCard.StopCard />

// 根据状态动态渲染
const probeStatus = 'ing'; // 'ing' | 'wait' | 'error' | 'stop'
const probeData = {
  meProbe: true,
  applyName: '探查申请',
  applyPlatformName: '平台A',
  rejectReason: '权限不足',
};

{probeStatus === 'ing' && (
  <ProbeCard.IngCard 
    meProbe={probeData.meProbe}
    applyName={probeData.applyName}
    applyPlatformName={probeData.applyPlatformName}
  />
)}
{probeStatus === 'wait' && <ProbeCard.WaitCard meProbe={probeData.meProbe} />}
{probeStatus === 'error' && <ProbeCard.ErrorCard rejectReason={probeData.rejectReason} />}
{probeStatus === 'stop' && <ProbeCard.StopCard />}
```

---

## 3. CommonDetail 通用详情

**路径**: `src/components/CommonDetail/index.tsx`

**用途**: 通用详情页组件，支持多种展示形式

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| config | ICommonDetailConfig[] | - | 配置项 |
| data | any | - | 数据源 |
| size | number | 16 | 间距大小 |

**支持的配置类型**:

| type | 说明 |
|------|------|
| main | 主信息区 |
| list | 列表详情 |
| table | 表格展示 |
| panel | 面板展示 |
| render | 自定义渲染 |

**ICommonDetailConfig 结构**:
```typescript
interface ICommonDetailConfig {
  type: 'main' | 'list' | 'table' | 'panel' | 'render';
  title?: string;           // 区块标题
  field?: string;           // 数据字段
  render?: (data) => ReactNode;  // 自定义渲染
  columns?: Column[];       // 表格列配置
  dataKey?: string;         // 数据源键名
}
```

**业务功能**: 
- 多类型详情展示配置
- 主信息、列表、表格、面板等多种展示形式
- 数据源字段映射

**使用场景**: 通用详情页、信息展示页

**示例代码**:
```tsx
import CommonDetail from '@/components/CommonDetail';

// 详情数据
const detailData = {
  projectName: '数据平台建设项目',
  projectCode: 'PRJ2024001',
  status: 1,
  manager: { name: '张三', id: '001' },
  createTime: '2024-01-15',
  budget: 500000,
  description: '这是一个重要的数据平台建设项目...',
  members: [
    { name: '李四', role: '开发', joinTime: '2024-01-20' },
    { name: '王五', role: '测试', joinTime: '2024-02-01' },
  ],
  milestones: [
    { name: '需求分析', status: '完成', endDate: '2024-02-01' },
    { name: '系统设计', status: '进行中', endDate: '2024-03-01' },
    { name: '开发实施', status: '待开始', endDate: '2024-05-01' },
  ],
};

// 配置项
const config = [
  {
    type: 'main',
    title: '项目基本信息',
    field: 'projectInfo',
  },
  {
    type: 'list',
    title: '项目详情',
    field: 'details',
    dataKey: 'detailData',
    render: (data) => [
      { label: '项目名称', value: data.projectName },
      { label: '项目编码', value: data.projectCode },
      { 
        label: '项目状态', 
        value: data.status === 1 ? '进行中' : '已结束',
        render: (val) => <Tag color={data.status === 1 ? 'blue' : 'green'}>{val}</Tag>
      },
      { label: '项目负责人', value: data.manager?.name },
      { label: '创建时间', value: data.createTime },
      { label: '项目预算', value: `¥${data.budget?.toLocaleString()}` },
    ],
  },
  {
    type: 'table',
    title: '项目成员',
    field: 'members',
    columns: [
      { title: '姓名', dataIndex: 'name' },
      { title: '角色', dataIndex: 'role' },
      { title: '加入时间', dataIndex: 'joinTime' },
    ],
  },
  {
    type: 'panel',
    title: '项目里程碑',
    field: 'milestones',
    render: (data) => (
      <Timeline>
        {data.map((item, index) => (
          <Timeline.Item 
            key={index}
            color={item.status === '完成' ? 'green' : item.status === '进行中' ? 'blue' : 'gray'}
          >
            <p>{item.name}</p>
            <p>状态: {item.status}</p>
            <p>截止日期: {item.endDate}</p>
          </Timeline.Item>
        ))}
      </Timeline>
    ),
  },
  {
    type: 'render',
    title: '项目描述',
    field: 'description',
    render: (data) => (
      <div className="project-description">
        <p>{data.description}</p>
      </div>
    ),
  },
];

<CommonDetail
  config={config}
  data={detailData}
  size={24}
/>
```

---

## 4. CommonDetailContent 通用详情内容

**路径**: `src/components/CommonDetailContent/index.tsx`

**用途**: 详情内容区域样式封装

**业务功能**: 详情内容区域样式封装

---

## 5. BaseDescriptions 基础描述列表

**路径**: `src/components/BaseDescriptions/index.tsx`

**用途**: 基于 ProDescriptions 封装

**业务功能**: 基础描述信息展示

---

## 业务状态组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 审核流程状态 | AuditCard | 内置审核中/通过/驳回状态 |
| 数据探查状态 | ProbeCard | 内置探查流程状态 |
| 通用详情页 | CommonDetail | 支持多种展示形式配置 |
| 简单信息展示 | BaseDescriptions | 轻量级描述列表 |

## 业务状态组件通用规范

1. **状态展示**: 使用不同颜色区分状态（蓝色-进行中、绿色-成功、红色-失败）
2. **图标使用**: 配合图标增强状态表达（Loading图标、成功图标、错误图标）
3. **信息完整**: 状态卡片需包含关键信息（申请人、时间、原因等）
4. **响应式**: 卡片布局需适配不同屏幕尺寸
5. **国际化**: 状态文本需支持多语言配置
