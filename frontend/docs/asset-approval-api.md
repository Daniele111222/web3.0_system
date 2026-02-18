# 资产审批流程 API 接口文档

> 文档版本: 1.0  
> 更新日期: 2026-02-18  
> 适用范围: Web3 IP-NFT Enterprise Asset Management System

---

## 1. 概述

本文档描述资产创建与审批业务流程相关的 API 接口，包括：
- 资产提交审批
- 审批处理（通过/拒绝/退回）
- 待审批列表查询

---

## 2. 资产状态流转

```
DRAFT (草稿) → PENDING (待审批) → MINTED (已铸造) → ACTIVE (正式资产)
                      ↓
                 REJECTED (已拒绝)
                      ↓
                 DRAFT (可重新编辑)
```

---

## 3. API 接口详情

### 3.1 提交资产审批

将草稿状态的资产提交到审批流程。

**接口地址**: `POST /api/v1/assets/{asset_id}/submit`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| asset_id | UUID | 是 | 资产 ID (路径参数) |
| remarks | string | 否 | 申请备注 |

**请求体示例**:
```json
{
  "remarks": "申请将资产提交审批"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "资产已提交审批",
  "code": "SUCCESS",
  "data": {
    "asset_id": "uuid-string",
    "status": "PENDING",
    "approval_id": "uuid-string"
  }
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 资产不是草稿状态 |
| 400 | 资产没有附件 |
| 403 | 无权操作此资产 |
| 404 | 资产不存在 |

**前置条件**:
1. 资产状态必须为 `DRAFT`
2. 资产必须至少有一个附件
3. 当前用户必须是资产所属企业的成员

---

### 3.2 获取资产列表

获取指定企业的资产列表。

**接口地址**: `GET /api/v1/assets`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| enterprise_id | UUID | 是 | 企业 ID |
| asset_type | string | 否 | 资产类型筛选 (PATENT/TRADEMARK/COPYRIGHT/TRADE_SECRET/DIGITAL_WORK) |
| asset_status | string | 否 | 资产状态筛选 (DRAFT/PENDING/MINTED/REJECTED/TRANSFERRED/LICENSED/STAKED) |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |

**成功响应**:
```json
{
  "items": [
    {
      "id": "uuid-string",
      "enterprise_id": "uuid-string",
      "name": "资产名称",
      "type": "PATENT",
      "description": "资产描述",
      "status": "DRAFT",
      "attachments": [],
      ...
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 3.3 获取待审批列表

获取当前待审批的申请列表。

**接口地址**: `GET /api/v1/approvals/pending`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |
| approval_type | string | 否 | 审批类型筛选 (ENTERPRISE_CREATE/ENTERPRISE_UPDATE/MEMBER_JOIN/ASSET_SUBMIT) |

**成功响应**:
```json
{
  "items": [
    {
      "id": "uuid-string",
      "type": "ASSET_SUBMIT",
      "target_id": "uuid-string",
      "target_type": "enterprise",
      "applicant_id": "uuid-string",
      "status": "pending",
      "asset_id": "uuid-string",
      "remarks": "申请备注",
      "created_at": "2026-02-18T10:00:00Z",
      ...
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 3.4 处理审批

审批管理员处理待审批的申请。

**接口地址**: `POST /api/v1/approvals/{approval_id}/process`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approval_id | UUID | 是 | 审批记录 ID (路径参数) |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | string | 是 | 操作类型: approve / reject / return |
| comment | string | 是 | 审批意见 (至少 10 个字符) |

**请求体示例**:
```json
{
  "action": "approve",
  "comment": "资料齐全，同意通过"
}
```

**成功响应**:
```json
{
  "id": "uuid-string",
  "type": "ASSET_SUBMIT",
  "status": "approved",
  "asset_id": "uuid-string",
  ...
}
```

**审批结果对资产状态的影响**:

| 操作 | 资产状态变更 |
|------|-------------|
| approve (通过) | PENDING → MINTED (同时铸造 NFT) |
| reject (拒绝) | PENDING → REJECTED |
| return (退回) | PENDING → DRAFT (可重新编辑) |

---

### 3.5 获取审批详情

获取单个审批记录的详细信息。

**接口地址**: `GET /api/v1/approvals/{approval_id}`

**成功响应**:
```json
{
  "id": "uuid-string",
  "type": "ASSET_SUBMIT",
  "target_id": "uuid-string",
  "target_type": "enterprise",
  "applicant_id": "uuid-string",
  "status": "pending",
  "asset_id": "uuid-string",
  "remarks": "申请备注",
  "created_at": "2026-02-18T10:00:00Z",
  "updated_at": "2026-02-18T10:00:00Z",
  "completed_at": null,
  "processes": [
    {
      "id": "uuid-string",
      "step": 1,
      "action": "submit",
      "operator_id": "uuid-string",
      "comment": "提交审批",
      "created_at": "2026-02-18T10:00:00Z"
    }
  ]
}
```

---

## 4. 资产状态说明

| 状态 | 说明 | 可操作 |
|------|------|--------|
| DRAFT | 草稿 | 编辑、删除、上传附件、提交审批 |
| PENDING | 待审批 | (不可操作，等待审批) |
| MINTED | 已铸造 NFT | 转移、授权、质押 |
| REJECTED | 已拒绝 | (可重新编辑后再次提交) |
| TRANSFERRED | 已转移 | - |
| LICENSED | 已授权 | - |
| STAKED | 已质押 | - |

---

## 5. 审批类型说明

| 类型 | 说明 |
|------|------|
| ENTERPRISE_CREATE | 企业创建审批 |
| ENTERPRISE_UPDATE | 企业信息变更审批 |
| MEMBER_JOIN | 成员加入审批 |
| ASSET_SUBMIT | 资产提交审批 |

---

## 6. 前端对接要点

### 6.1 提交审批按钮显示条件

```typescript
// 只有 DRAFT 状态的资产显示"提交审批"按钮
const showSubmitButton = asset.status === 'DRAFT';
```

### 6.2 状态徽章映射

```typescript
const statusMap = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING: { label: '待审批', color: 'processing' },
  MINTED: { label: '已铸造', color: 'success' },
  REJECTED: { label: '已拒绝', color: 'error' },
  TRANSFERRED: { label: '已转移', color: 'default' },
  LICENSED: { label: '已授权', color: 'default' },
  STAKED: { label: '已质押', color: 'warning' },
};
```

### 6.3 审批列表筛选

获取资产提交审批类型的列表：
```typescript
const response = await api.get('/approvals/pending', {
  params: { approval_type: 'ASSET_SUBMIT' }
});
```

### 6.4 审批通过后的 NFT 信息

资产审批通过后，会自动铸造 NFT，前端可通过资产详情接口获取：
- `nft_token_id`: NFT Token ID
- `nft_contract_address`: NFT 合约地址
- `nft_chain`: 区块链网络
- `metadata_uri`: NFT 元数据 URI
- `mint_tx_hash`: 铸造交易哈希

---

## 7. 错误码参考

| 错误码 | 说明 |
|--------|------|
| SUCCESS | 成功 |
| ASSET_NOT_FOUND | 资产不存在 |
| ASSET_NOT_DRAFT | 资产不是草稿状态 |
| ASSET_NO_ATTACHMENTS | 资产没有附件 |
| PERMISSION_DENIED | 无权操作 |
| APPROVAL_NOT_FOUND | 审批记录不存在 |
| APPROVAL_ALREADY_PROCESSED | 审批已被处理 |
| INVALID_APPROVAL_ACTION | 无效的审批操作 |

---

**文档结束**
