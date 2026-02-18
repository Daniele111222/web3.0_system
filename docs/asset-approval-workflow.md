# 资产创建与审批业务流程需求文档

> 文档版本: 1.2  
> 更新日期: 2026-02-18  
> 适用范围: Web3 IP-NFT Enterprise Asset Management System

---

## 1. 业务现状分析

### 1.1 当前代码实现状态

经过代码检查，发现以下功能状态：

| 功能模块     | 预期状态           | 实际状态                      | 备注                    |
| ------------ | ------------------ | ----------------------------- | ---------------------- |
| 资产创建     | DRAFT 状态         | ✅ 已实现                     |                        |
| 资产编辑     | 仅 DRAFT 可编辑    | ✅ 已实现                     |                        |
| 资产删除     | 仅 DRAFT 可删除    | ✅ 已实现                     |                        |
| 附件上传     | 仅 DRAFT 可上传    | ✅ 已实现                     |                        |
| **提交审批** | DRAFT → PENDING    | ❌ **缺失**                   | 需新增 `POST /submit` API |
| **审批列表** | 显示待审批资产     | ✅ 已实现                     | 需增强返回资产详细信息   |
| **审批处理** | 通过后自动铸造 NFT | ❌ **缺失**                   | 需在审批服务中集成NFT   |
| **NFT 铸造** | PENDING → MINTED   | ✅ 已实现服务                  | 需与审批流程集成        |

### 1.2 前端代码实现状态

| 模块          | 功能                   | 实际状态 |
| ------------- | ---------------------- | -------- |
| AssetList     | 资产卡片展示           | ✅ 已实现 |
| AssetList     | 状态徽章显示           | ⚠️ 需补充 PENDING/REJECTED |
| AssetList     | 提交审批按钮           | ❌ 缺失   |
| AssetService  | 提交审批 API 方法      | ❌ 缺失   |
| 审批列表页    | 资产信息展示           | ⚠️ 需增强 |

### 1.3 问题描述

**用户反馈**：

- 创建资产后显示为"草稿"状态
- 审批中心没有待审批的条目
- 没有将草稿转换成正式资产的方式

---

## 2. 业务流程设计

### 2.1 完整业务流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           资产生命周期流程                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐          │
│  │  DRAFT   │ ──> │ PENDING  │ ──> │ MINTED   │ ──> │ ACTIVE   │          │
│  │  (草稿)  │     │ (待审批) │     │ (已铸造) │     │ (正式资产)│          │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘          │
│       │                │                │                                   │
│       │                │                │                                   │
│  创建/编辑          提交审批        审批通过                              │
│  资产信息         资产          自动铸造 NFT                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                       异常流程                                   │        │
│  │                                                                  │        │
│  │  PENDING ──(审批拒绝)──> REJECTED (已拒绝)                      │        │
│  │       │                                                           │        │
│  │       └──(退回补充材料)──> DRAFT (可重新编辑)                      │        │
│  │                                                                  │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 流程步骤详解

| 步骤 | 操作         | 状态变更         | 触发者   |
| ---- | ------------ | ---------------- | -------- |
| 1    | 创建资产草稿 | → DRAFT          | 企业成员 |
| 2    | 编辑资产信息 | DRAFT            | 企业成员 |
| 3    | 上传附件     | DRAFT            | 企业成员 |
| 4    | **提交审批** | DRAFT → PENDING  | 企业成员 |
| 5    | 审批通过     | PENDING → MINTED | 管理员   |
| 6    | 自动铸造 NFT | PENDING → MINTED | 系统自动 |

---

## 3. 功能需求清单

### 3.1 后端 API 需求

#### 3.1.1 资产提交审批 API

**端点**: `POST /api/v1/assets/{asset_id}/submit`

**请求参数**:

```json
{
  "remarks": "申请将资产提交审批"
}
```

**业务逻辑**:

1. 验证资产存在且状态为 `DRAFT`
2. 验证用户是否为资产所属企业成员
3. 验证资产是否有附件（必须有附件才能提交）
4. 创建审批记录（类型: `ASSET_SUBMIT`，关联 asset_id）
5. 更新资产状态为 `PENDING`
6. 返回成功响应

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "资产已提交审批",
  "data": {
    "asset_id": "uuid",
    "status": "PENDING",
    "approval_id": "uuid"
  }
}
```

#### 3.1.2 审批处理回调

**现有 API**: `POST /api/v1/approvals/{approval_id}/process`

**扩展需求**:

- 在 `_handle_approval_result` 方法中增加对 `ASSET_SUBMIT` 类型的处理
- 当审批类型为 `ASSET_SUBMIT` 且操作是 `APPROVE` 时：
  1. 获取审批关联的资产信息
  2. 调用 `NFTService.mint_asset_nft()` 铸造 NFT
  3. 更新资产状态为 `MINTED`
  4. 保存 NFT 信息（token_id, contract_address, tx_hash）
- 当审批类型为 `ASSET_SUBMIT` 且操作是 `REJECT` 时：
  - 更新资产状态为 `REJECTED`
- 当审批类型为 `ASSET_SUBMIT` 且操作是 `RETURN` 时：
  - 更新资产状态为 `DRAFT`（可重新编辑）

#### 3.1.3 待审批列表筛选

**现有 API**: `GET /api/v1/approvals/pending`

**扩展需求**:

- 支持按审批类型筛选 (`approval_type=asset_submit`)
- 返回资产名称、类型等关键信息

### 3.2 前端功能需求

#### 3.2.1 资产列表操作

在资产卡片上添加**提交审批**按钮：

```
┌─────────────────────────────┐
│  资产名称              [草稿]│
│  资产描述...                 │
│  类型: 专利  创建人: 张三    │
│                             │
│  [查看] [编辑] [提交审批]   │
└─────────────────────────────┘
```

**按钮显示条件**:

- 资产状态为 `DRAFT`
- 当前用户是企业成员

**按钮操作**:

1. 点击弹出确认对话框
2. 确认后调用提交审批 API
3. 成功后刷新列表，显示状态变为"待审批"

#### 3.2.2 审批中心展示

在待审批列表中显示资产相关信息：

```
┌─────────────────────────────────────────────────────────┐
│  待审批列表                                              │
├─────────────────────────────────────────────────────────┤
│  [ ]  专利资产 "一种新型算法"    申请企业: XX科技    操作 │
│  [ ]  商标资产 "品牌Logo"        申请企业: XX科技    操作 │
└─────────────────────────────────────────────────────────┘
```

**显示字段**:

- 资产名称
- 资产类型（专利/商标/版权等）
- 申请企业名称
- 申请人
- 申请时间
- 操作（通过/拒绝/查看详情）

---

## 4. 数据模型扩展

### 4.1 审批类型扩展

```python
# backend/app/models/approval.py
class ApprovalType(str, Enum):
    ENTERPRISE_CREATE = "enterprise_create"
    ENTERPRISE_UPDATE = "enterprise_update"
    MEMBER_JOIN = "member_join"
    ASSET_SUBMIT = "asset_submit"  # 新增：资产提交审批
```

### 4.2 资产状态扩展

```python
# backend/app/models/asset.py
class AssetStatus(str, Enum):
    DRAFT = "DRAFT"           # 草稿
    PENDING = "PENDING"       # 待审批（新增）
    MINTED = "MINTED"         # 已铸造
    REJECTED = "REJECTED"     # 已拒绝（新增）
    TRANSFERRED = "TRANSFERRED"
    LICENSED = "LICENSED"
    STAKED = "STAKED"
```

### 4.3 审批记录关联资产

> **注意**: 经检查，Approval 模型中已存在 `asset_id` 字段（在 models/approval.py 中定义），无需额外添加。

```python
# backend/app/models/approval.py - 现有字段已存在
class Approval(Base):
    # ... 现有字段 ...
    asset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id"),
        nullable=True,
        index=True,
    )
```

### 4.4 前端类型扩展

> **注意**: 前端 AssetStatus 类型需要补充 PENDING 和 REJECTED 状态。

```typescript
// frontend/src/types/index.ts - 需更新
export type AssetStatus = 'DRAFT' | 'PENDING' | 'MINTED' | 'REJECTED' | 'TRANSFERRED' | 'LICENSED' | 'STAKED';
```

> **注意**: Asset 接口需要增加 enterprise_id 字段以支持权限验证。

```typescript
// frontend/src/types/index.ts - 需更新
export interface Asset {
  id: string;
  enterprise_id: string;  // 需新增
  name: string;
  type: AssetType;
  description: string;
  creator: string;
  creation_date: string;
  legal_status: LegalStatus;
  application_number?: string;
  attachments: Attachment[];
  metadata: Record<string, unknown>;
  nft_token_id?: string;
  nft_contract_address?: string;
  mint_tx_hash?: string;     // 需新增
  metadata_uri?: string;     // 需新增
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}
```

---

## 5. API 端点汇总

### 5.1 资产相关

| 方法     | 端点                              | 功能         | 状态          |
| -------- | --------------------------------- | ------------ | ------------- |
| POST     | `/api/v1/assets`                 | 创建资产草稿 | ✅ 已实现     |
| GET      | `/api/v1/assets`                 | 获取资产列表 | ✅ 已实现     |
| GET      | `/api/v1/assets/{id}`            | 获取资产详情 | ✅ 已实现     |
| PUT      | `/api/v1/assets/{id}`            | 更新资产草稿 | ✅ 已实现     |
| DELETE   | `/api/v1/assets/{id}`            | 删除资产草稿 | ✅ 已实现     |
| POST     | `/api/v1/assets/{id}/attachments`| 上传附件     | ✅ 已实现     |
| **POST** | **`/api/v1/assets/{id}/submit`** | **提交审批** | **❌ 需开发** |

### 5.2 审批相关

| 方法 | 端点                                  | 功能         | 状态      |
| ---- | ------------------------------------- | ------------ | --------- |
| POST | `/api/v1/approvals/enterprise-create` | 企业创建审批 | ✅ 已实现 |
| POST | `/api/v1/approvals/enterprise-update` | 企业变更审批 | ✅ 已实现 |
| POST | `/api/v1/approvals/{id}/process`      | 处理审批     | ✅ 已实现 |
| GET  | `/api/v1/approvals/pending`           | 待审批列表   | ✅ 已实现 |
| GET  | `/api/v1/approvals/{id}`              | 审批详情     | ✅ 已实现 |

### 5.3 NFT 相关

| 方法 | 端点                              | 功能       | 状态          |
| ---- | --------------------------------- | ---------- | ------------- |
| POST | `/api/v1/nft/mint`                | 铸造 NFT   | ⚠️ 已实现服务 |
| POST | `/api/v1/nft/transfer`            | 转移 NFT   | ⚠️ TODO       |
| GET  | `/api/v1/nft/{token_id}/history`  | NFT 历史   | ⚠️ TODO       |

> **注**: NFT 铸造服务已在 `backend/app/services/nft_service.py` 中实现 `mint_asset_nft` 方法，需与审批流程集成。

---

## 6. 实现计划

### 6.1 第一阶段：核心流程（高优先级）

| 任务                           | 后端 | 前端 | 预计工期 | 备注                              |
| ------------------------------ | ---- | ---- | -------- | --------------------------------- |
| 1. 后端 Schema 定义             | ✅   | -    | 0.25 天  | AssetSubmitRequest/Response       |
| 2. 资产服务新增 submit 方法     | ✅   | -    | 0.25 天  | submit_for_approval              |
| 3. 资产 API 新增 submit 端点    | ✅   | -    | 0.25 天  | POST /assets/{id}/submit          |
| 4. 审批服务集成 NFT 铸造        | ✅   | -    | 0.5 天   | _handle_asset_submit_approval     |
| 5. 前端类型定义更新             | -    | ✅   | 0.25 天  | AssetStatus 补充 PENDING/REJECTED |
| 6. 前端资产服务新增 API 方法     | -    | ✅   | 0.25 天  | submitForApproval                 |
| 7. 前端资产列表增加提交按钮     | -    | ✅   | 0.5 天   | 仅 DRAFT 状态显示                 |
| 8. 前端审批列表资产信息展示     | -    | ✅   | 0.5 天   | 待审批列表增加资产详情             |

### 6.2 第二阶段：完善与测试（中优先级）

| 任务                 | 后端 | 前端 | 预计工期 | 备注                     |
| -------------------- | ---- | ---- | -------- | ------------------------ |
| 1. 审批详情返回资产信息 | ✅   | -    | 0.25 天  | GET /approvals/{id} 增强  |
| 2. 前端展示 NFT 信息    | -    | ✅   | 0.25 天  | 显示 token_id/交易哈希    |
| 3. 前后端联调测试       | ✅   | ✅   | 0.5 天   | 完整流程测试              |
| 4. 审批通过自动铸造测试 | ✅   | -    | 0.25 天  | 端到端 NFT 铸造测试       |

### 6.3 第三阶段：增强功能（低优先级）

| 任务            | 说明             | 预计工期 |
| --------------- | ---------------- | -------- |
| 1. 资产历史记录 | 记录所有状态变更 | 1 天     |
| 2. 批量操作     | 批量提交/审批    | 1 天     |
| 3. 通知优化     | 站内信/邮件通知  | 1 天     |

---

## 7. 验收标准

### 7.1 核心流程验收

- [ ] 用户可以创建资产草稿（状态为 DRAFT）
- [ ] 用户可以在资产列表看到"提交审批"按钮（仅 DRAFT 状态显示）
- [ ] 点击提交审批后，资产状态变为 PENDING
- [ ] 提交审批时验证资产必须有附件（无附件则提示）
- [ ] 审批中心可以看到待审批的资产条目（ASSET_SUBMIT 类型）
- [ ] 审批列表中显示资产名称、类型、企业名称等信息
- [ ] 管理员可以审批通过资产
- [ ] 审批通过后自动调用 NFT 铸造服务
- [ ] 审批通过后资产状态变为 MINTED
- [ ] 审批拒绝后资产状态变为 REJECTED
- [ ] 审批退回后资产状态变为 DRAFT（可重新编辑）

### 7.2 API 接口验收

- [ ] `POST /api/v1/assets/{id}/submit` 接口正常返回
- [ ] `POST /api/v1/assets/{id}/submit` 正确验证 DRAFT 状态
- [ ] `POST /api/v1/assets/{id}/submit` 正确验证附件数量
- [ ] `POST /api/v1/approvals/{id}/process` 处理 ASSET_SUBMIT 类型正确
- [ ] 审批通过后 NFT 铸造服务被正确调用

### 7.3 前端功能验收

- [ ] 资产列表状态徽章正确显示 PENDING/REJECTED
- [ ] DRAFT 状态资产显示"提交审批"按钮
- [ ] 提交审批有确认对话框
- [ ] 提交审批成功/失败有明确提示
- [ ] 审批列表中资产审批类型显示正确
- [ ] 审批详情页展示资产完整信息

### 7.4 用户体验验收

- [ ] 提交审批有确认提示
- [ ] 操作成功/失败有明确提示
- [ ] 列表实时刷新显示最新状态
- [ ] 审批详情页展示资产完整信息

---

## 8. 技术实现要点

### 8.1 后端：资产提交审批 API 实现

#### 8.1.1 新增请求/响应 Schema

```python
# backend/app/schemas/asset.py - 需新增
from pydantic import BaseModel
from typing import Optional

class AssetSubmitRequest(BaseModel):
    """资产提交审批请求"""
    remarks: Optional[str] = Field(None, description="申请备注")

class AssetSubmitResponse(BaseModel):
    """资产提交审批响应"""
    asset_id: UUID
    status: AssetStatus
    approval_id: UUID
```

#### 8.1.2 资产服务层扩展

```python
# backend/app/services/asset_service.py - 需新增方法
async def submit_for_approval(
    self,
    asset_id: UUID,
    enterprise_id: UUID,
    applicant_id: UUID,
    remarks: Optional[str] = None,
) -> Tuple[Asset, Approval]:
    """提交资产进行审批。
    
    1. 验证资产存在且状态为 DRAFT
    2. 验证资产有附件（必须有附件才能提交）
    3. 创建审批记录
    4. 更新资产状态为 PENDING
    """
    # 获取资产
    asset = await self.asset_repo.get_by_id(asset_id)
    if not asset:
        raise NotFoundException("资产不存在")
    
    # 验证状态
    if asset.status != AssetStatus.DRAFT:
        raise BadRequestException("只有草稿状态的资产才能提交审批")
    
    # 验证附件
    if not asset.attachments:
        raise BadRequestException("资产必须至少有一个附件才能提交审批")
    
    # 更新资产状态
    asset.status = AssetStatus.PENDING
    await self.asset_repo.update(asset)
    
    # 创建审批记录
    approval = Approval(
        type=ApprovalType.ASSET_SUBMIT,
        target_id=enterprise_id,
        target_type="enterprise",
        applicant_id=applicant_id,
        status=ApprovalStatus.PENDING,
        asset_id=asset_id,
        remarks=remarks,
    )
    approval_repo = ApprovalRepository(self.db)
    approval = await approval_repo.create_approval(approval)
    
    return asset, approval
```

#### 8.1.3 API 端点实现

```python
# backend/app/api/v1/assets.py - 需新增端点
@router.post(
    "/{asset_id}/submit",
    response_model=ApiResponse[AssetSubmitResponse],
    summary="提交资产审批",
)
async def submit_asset_for_approval(
    asset_id: UUID,
    request: AssetSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """提交资产进行审批。"""
    # 1. 获取资产
    asset_repo = AssetRepository(db)
    asset_service = AssetService(asset_repo)
    asset = await asset_service.get_asset(asset_id)
    
    # 2. 验证用户是企业成员
    member_repo = EnterpriseMemberRepository(db)
    user_id = parse_current_user_id(str(current_user.id))
    member = await member_repo.get_member(asset.enterprise_id, user_id)
    if not member:
        raise HTTPException(status_code=403, detail="您无权操作此资产")
    
    # 3. 提交审批
    asset, approval = await asset_service.submit_for_approval(
        asset_id=asset_id,
        enterprise_id=asset.enterprise_id,
        applicant_id=user_id,
        remarks=request.remarks,
    )
    
    return ApiResponse(
        code="SUCCESS",
        message="资产已提交审批",
        data=AssetSubmitResponse(
            asset_id=asset.id,
            status=asset.status,
            approval_id=approval.id,
        )
    )
```

### 8.2 审批处理集成 NFT 铸造

```python
# backend/app/services/approval_service.py - 需修改
async def _handle_approval_result(self, approval: Approval) -> None:
    if approval.status == ApprovalStatus.APPROVED:
        if approval.type == ApprovalType.ASSET_SUBMIT:
            await self._handle_asset_submit_approval(approval)
    elif approval.status == ApprovalStatus.REJECTED:
        if approval.type == ApprovalType.ASSET_SUBMIT:
            await self._handle_asset_submit_rejected(approval)
    elif approval.status == ApprovalStatus.RETURNED:
        if approval.type == ApprovalType.ASSET_SUBMIT:
            await self._handle_asset_submit_returned(approval)

async def _handle_asset_submit_approval(self, approval: Approval) -> None:
    """处理资产提交审批通过，铸造 NFT。"""
    from app.services.nft_service import NFTService
    
    nft_service = NFTService(self.db)
    
    # 获取企业信息以获取钱包地址
    enterprise = await self.enterprise_repo.get_by_id(approval.target_id)
    
    # 调用 NFT 铸造
    await nft_service.mint_asset_nft(
        asset_id=approval.asset_id,
        minter_address=enterprise.wallet_address,
    )

async def _handle_asset_submit_rejected(self, approval: Approval) -> None:
    """处理资产提交审批被拒绝。"""
    asset_repo = AssetRepository(self.db)
    asset = await asset_repo.get_by_id(approval.asset_id)
    if asset:
        asset.status = AssetStatus.REJECTED
        await asset_repo.update(asset)

async def _handle_asset_submit_returned(self, approval: Approval) -> None:
    """处理资产提交审批被退回。"""
    asset_repo = AssetRepository(self.db)
    asset = await asset_repo.get_by_id(approval.asset_id)
    if asset:
        asset.status = AssetStatus.DRAFT  # 退回后可重新编辑
        await asset_repo.update(asset)
```

### 8.3 审批列表返回资产信息

待审批列表 `GET /api/v1/approvals/pending` 需增强，返回关联的资产基本信息：
- 资产名称
- 资产类型
- 企业名称
- 申请人

### 8.4 前端：资产服务扩展

```typescript
// frontend/src/services/asset.ts - 需新增方法
/**
 * 提交资产审批请求
 */
export interface AssetSubmitRequest {
  remarks?: string;
}

export interface AssetSubmitResponse {
  asset_id: string;
  status: string;
  approval_id: string;
}

class AssetService {
  // ... 现有方法 ...

  /**
   * 提交资产审批
   */
  async submitForApproval(assetId: string, data: AssetSubmitRequest): Promise<AssetSubmitResponse> {
    const response = await api.post<AssetSubmitResponse>(`/assets/${assetId}/submit`, data);
    return response.data;
  }
}
```

### 8.5 前端：资产列表增强

```typescript
// frontend/src/components/asset/AssetList.tsx - 需更新

// 1. 更新状态映射
const getAssetStatusName = (status: string): string => {
  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',      // 需新增
    MINTED: '已铸造',
    REJECTED: '已拒绝',     // 需新增
    TRANSFERRED: '已转移',
    LICENSED: '已授权',
    STAKED: '已质押',
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status: string): string => {
  const classMap: Record<string, string> = {
    DRAFT: 'badge-draft',
    PENDING: 'badge-pending',   // 需新增
    MINTED: 'badge-minted',
    REJECTED: 'badge-rejected',  // 需新增
    // ...
  };
  return `asset-card-badge ${classMap[status] || 'badge-draft'}`;
};

// 2. 添加提交审批按钮（在资产卡片操作区）
{asset.status === 'DRAFT' && (
  <Button 
    type="primary" 
    onClick={(e) => {
      e.stopPropagation();
      onSubmitForApproval(asset);
    }}
  >
    提交审批
  </Button>
)}

// 3. 添加提交审批处理函数
const handleSubmitForApproval = useCallback(async (asset: Asset) => {
  try {
    Modal.confirm({
      title: '确认提交审批',
      content: `确定要提交"${asset.name}"进行审批吗？`,
      onOk: async () => {
        await assetService.submitForApproval(asset.id, {});
        message.success('提交审批成功');
        onRefresh(); // 刷新列表
      },
    });
  } catch (error) {
    message.error('提交审批失败');
  }
}, []);
```

### 8.6 前端：审批列表资产信息展示

```typescript
// 审批列表中资产审批类型的显示增强
const getApprovalTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    // ...
    ASSET_SUBMIT: '资产提交审批',  // 需新增
  };
  return typeMap[type] || type;
};

// 资产审批详情卡片
{approval.type === 'ASSET_SUBMIT' && (
  <Card>
    <Descriptions>
      <Descriptions.Item label="资产名称">{approval.asset_name}</Descriptions.Item>
      <Descriptions.Item label="资产类型">{approval.asset_type}</Descriptions.Item>
      <Descriptions.Item label="所属企业">{approval.enterprise_name}</Descriptions.Item>
    </Descriptions>
  </Card>
)}
```

---

## 9. 相关代码位置

### 9.1 后端代码

| 模块          | 文件路径                                       | 备注                           |
| ------------- | -------------------------------------------- | ------------------------------ |
| 资产 API      | `backend/app/api/v1/assets.py`               | 需新增 submit 端点              |
| 资产服务      | `backend/app/services/asset_service.py`       | 需新增 submit_for_approval 方法 |
| 资产模型      | `backend/app/models/asset.py`                 | ✅ 已含 AssetStatus            |
| 资产 Schema   | `backend/app/schemas/asset.py`                | 需新增提交审批请求/响应 Schema  |
| 审批 API      | `backend/app/api/v1/approvals.py`             | 需扩展处理 ASSET_SUBMIT         |
| 审批服务      | `backend/app/services/approval_service.py`    | 需新增 _handle_asset_submit 等方法 |
| 审批模型      | `backend/app/models/approval.py`              | ✅ 已含 asset_id 字段          |
| 审批仓库      | `backend/app/repositories/approval_repository.py` |                          |
| NFT 服务      | `backend/app/services/nft_service.py`         | ✅ 已实现 mint_asset_nft       |

### 9.2 前端代码

| 模块           | 文件路径                                       | 备注                     |
| -------------- | -------------------------------------------- | ------------------------ |
| 资产类型定义   | `frontend/src/types/index.ts`               | 需补充 PENDING/REJECTED |
| 资产服务       | `frontend/src/services/asset.ts`            | 需新增 submitForApproval |
| 资产列表组件   | `frontend/src/components/asset/AssetList.tsx` | 需增加提交审批按钮      |
| 资产表单组件   | `frontend/src/components/asset/AssetForm.tsx` |                        |
| 资产页面       | `frontend/src/pages/Assets/index.tsx`       |                        |
| 审批列表页面   | `frontend/src/pages/Approval/PendingList/index.tsx` | 需增强资产信息显示 |
| 审批类型定义   | `frontend/src/types/approval.ts`            | 需补充 ASSET_SUBMIT 类型 |

---

**文档结束**
