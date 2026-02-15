# 企业管理模块需求文档

## 文档信息

| 项目     | 内容                             |
| -------- | -------------------------------- |
| 模块名称 | 企业管理 (Enterprise Management) |
| 文档版本 | v1.0                             |
| 创建日期 | 2026-02-15                       |
| 状态     | 待开发                           |

---

## 一、现状分析

### 1.1 接口覆盖情况

| 接口         | 方法   | 路径                                | 前端状态    | 备注          |
| ------------ | ------ | ----------------------------------- | ----------- | ------------- |
| 创建企业     | POST   | /enterprises                        | ⚠️ 部分完成 | 缺少 logo_url |
| 获取企业列表 | GET    | /enterprises                        | ✅ 已完成   |               |
| 获取企业详情 | GET    | /enterprises/{id}                   | ✅ 已完成   |               |
| 更新企业信息 | PUT    | /enterprises/{id}                   | ⚠️ 部分完成 | 缺少 logo_url |
| 删除企业     | DELETE | /enterprises/{id}                   | ✅ 已完成   |               |
| 获取成员列表 | GET    | /enterprises/{id}/members           | ✅ 已完成   |               |
| 邀请成员     | POST   | /enterprises/{id}/members           | ❌ 未完成   | 提示待实现    |
| 更新成员角色 | PUT    | /enterprises/{id}/members/{user_id} | ❌ 未完成   | 提示待实现    |
| 移除成员     | DELETE | /enterprises/{id}/members/{user_id} | ✅ 已完成   |               |

---

## 二、问题清单

### 2.1 字段缺失

#### 2.1.1 创建/更新企业表单

| 字段名   | API要求  | 前端状态 | 说明         |
| -------- | -------- | -------- | ------------ |
| logo_url | 必填: 否 | ❌ 缺失  | 企业Logo URL |

#### 2.1.2 企业详情展示

| 字段名         | API响应 | 前端状态  | 说明         |
| -------------- | ------- | --------- | ------------ |
| is_verified    | 有返回  | ❌ 未展示 | 企业认证状态 |
| wallet_address | 有返回  | ❌ 未展示 | 企业钱包地址 |

### 2.2 多余字段

| 字段名       | 前端存在 | API要求   | 说明                      |
| ------------ | -------- | --------- | ------------------------- |
| industry     | ✅ 存在  | ❌ 不需要 | 行业字段，API无此定义     |
| scale        | ✅ 存在  | ❌ 不需要 | 企业规模字段，API无此定义 |
| contactPhone | ✅ 存在  | ❌ 不需要 | 联系电话字段，API无此定义 |

### 2.3 未完成功能

| 功能         | 状态      | 优先级 | 说明                   |
| ------------ | --------- | ------ | ---------------------- |
| 邀请成员     | ❌ 待实现 | 高     | 点击按钮仅显示提示信息 |
| 更新成员角色 | ❌ 待实现 | 高     | 点击按钮仅显示提示信息 |

### 2.4 潜在问题

| 问题       | 位置                         | 说明                                              |
| ---------- | ---------------------------- | ------------------------------------------------- |
| 重复代码   | EnterpriseDetail.tsx:374-385 | Descriptions.Item 重复渲染了成员数量和状态        |
| 类型不匹配 | EnterpriseList.tsx           | 状态过滤使用 status 字段，但 API 返回 is_verified |

---

## 三、需求清单

### 3.1 字段调整需求

#### P0 - 必须修复

- [ ] **EnterpriseForm.tsx** - 添加 logo_url 字段
  - 类型: string
  - 验证: 最多500字符
  - 组件: 图片上传或URL输入框

- [ ] **EnterpriseDetail.tsx** - 展示 is_verified 字段
  - 位置: 企业概览 Descriptions 中
  - 显示: 已认证 / 未认证

- [ ] **EnterpriseDetail.tsx** - 展示 wallet_address 字段
  - 位置: 企业概览 Descriptions 中
  - 显示: 钱包地址或"未绑定"

#### P1 - 建议修复

- [ ] **EnterpriseForm.tsx** - 移除多余字段
  - 移除: industry (所属行业)
  - 移除: scale (企业规模)
  - 移除: contactPhone (联系电话)

### 3.2 功能开发需求

#### P0 - 必须开发

- [ ] **邀请成员功能**
  - 位置: EnterpriseDetail 成员管理标签页
  - 触发: 点击"邀请成员"按钮
  - 行为: 打开弹窗，输入用户邮箱/ID，选择角色
  - API: POST /enterprises/{id}/members
  - 请求参数:
    ```typescript
    {
      user_id: string,    // 被邀请用户ID
      role: 'admin' | 'member' | 'viewer'  // 角色，默认 member
    }
    ```
  - 响应: 返回新创建的成员信息

- [ ] **更新成员角色功能**
  - 位置: EnterpriseDetail 成员列表每行操作栏
  - 触发: 点击"更改角色"图标
  - 行为: 打开下拉选择框，选择新角色
  - API: PUT /enterprises/{id}/members/{user_id}
  - 请求参数:
    ```typescript
    {
      role: 'admin' | 'member' | 'viewer';
    }
    ```
  - 限制: 不能更改 owner 角色

### 3.3 Bug修复需求

#### P1 - 建议修复

- [ ] **EnterpriseDetail.tsx** - 修复重复的 Descriptions.Item
  - 位置: 第374-385行
  - 问题: member_count 和 status 重复渲染

- [ ] **EnterpriseList.tsx** - 修复状态过滤逻辑
  - 问题: 使用 status 字段过滤，但 API 返回 is_verified
  - 建议: 改为基于 is_verified 判断，或移除状态过滤功能

---

## 四、API字段对照表

### 4.1 创建企业请求

| 字段          | 类型   | 必填 | 前端表单     | 备注 |
| ------------- | ------ | ---- | ------------ | ---- |
| name          | string | 是   | name         | ✅   |
| description   | string | 否   | description  | ✅   |
| logo_url      | string | 否   | **需添加**   |      |
| website       | string | 否   | website      | ✅   |
| contact_email | string | 否   | contactEmail | ✅   |
| address       | string | 否   | address      | ✅   |

### 4.2 企业详情响应

| 字段           | 类型    | 前端展示  | 备注 |
| -------------- | ------- | --------- | ---- |
| id             | string  | ✅        |      |
| name           | string  | ✅        |      |
| description    | string  | ✅        |      |
| logo_url       | string  | ❌ 需添加 |      |
| website        | string  | ✅        |      |
| contact_email  | string  | ✅        |      |
| address        | string  | ✅        |      |
| wallet_address | string  | ❌ 需添加 |      |
| is_active      | boolean | ✅        |      |
| is_verified    | boolean | ❌ 需添加 |      |
| created_at     | string  | ✅        |      |
| updated_at     | string  | ✅        |      |
| member_count   | number  | ✅        |      |
| members        | array   | ✅        |      |

---

## 五、技术债务

### 5.1 类型定义

- [ ] 统一 EnterpriseCreateRequest 和 EnterpriseUpdateRequest 的字段
- [ ] 清理 Enterprise 类型中的冗余字段 (industry, scale, contactPhone)
- [ ] 移除 EnterpriseMember 类型中的冗余字段

### 5.2 代码质量

- [ ] EnterpriseForm 使用 Ant Design Form 组件重构，替换自定义表单
- [ ] 抽取邀请成员弹窗为独立组件 InviteMemberModal
- [ ] 添加企业模块的单元测试

---

## 六、优先级排序

| 优先级 | 任务                               | 预计工时 |
| ------ | ---------------------------------- | -------- |
| P0     | 添加 logo_url 字段                 | 1h       |
| P0     | 邀请成员功能                       | 2h       |
| P0     | 更新成员角色功能                   | 2h       |
| P0     | 展示 is_verified 和 wallet_address | 1h       |
| P1     | 移除多余字段                       | 0.5h     |
| P1     | 修复重复代码 Bug                   | 0.5h     |
| P2     | 状态过滤逻辑修复                   | 1h       |
| P2     | 重构表单组件                       | 2h       |

---

## 七、验收标准

### 7.1 创建企业

- [ ] 可以输入企业名称
- [ ] 可以输入企业描述
- [ ] 可以输入/上传 Logo URL
- [ ] 可以输入企业官网
- [ ] 可以输入联系邮箱
- [ ] 可以输入企业地址
- [ ] 提交后调用正确 API

### 7.2 企业详情

- [ ] 展示企业名称
- [ ] 展示企业描述
- [ ] 展示 Logo
- [ ] 展示企业官网
- [ ] 展示联系邮箱
- [ ] 展示企业地址
- [ ] 展示钱包地址（或未绑定状态）
- [ ] 展示认证状态（已认证/未认证）
- [ ] 展示创建时间
- [ ] 展示成员数量

### 7.3 成员管理

- [ ] 展示成员列表
- [ ] 展示成员角色标签
- [ ] 展示成员加入时间
- [ ] 可以邀请新成员
- [ ] 可以更改成员角色
- [ ] 可以移除成员（owner 除外）
