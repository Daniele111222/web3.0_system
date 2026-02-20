# NFT铸造功能后端接口文档

## 1. 概述

本文档描述了IP-NFT资产管理系统中NFT铸造功能的后端API接口。该功能实现资产的"数字孪生"上链，将知识产权资产通过NFT形式记录在区块链上。

### 技术栈
- **后端**: FastAPI (Python)
- **区块链**: Hardhat本地节点 (Chain ID: 31337)
- **智能合约**: IPNFT (ERC-721)
- **存储**: IPFS + PostgreSQL

---

## 2. API接口清单

### 2.1 合约管理

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | `/api/v1/contracts/deploy` | 部署智能合约 | 管理员 |
| GET | `/api/v1/contracts/info` | 获取合约信息 | 公开 |
| POST | `/api/v1/contracts/update-address` | 更新合约地址 | 管理员 |
| GET | `/api/v1/contracts/status` | 检查部署状态 | 公开 |

### 2.2 NFT铸造

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | `/api/v1/nft/mint` | 铸造NFT | 企业成员 |
| POST | `/api/v1/nft/batch-mint` | 批量铸造NFT | 企业成员 |
| GET | `/api/v1/nft/{asset_id}/mint/status` | 获取铸造状态 | 企业成员 |
| POST | `/api/v1/nft/{asset_id}/mint/retry` | 重试铸造 | 企业成员 |

---

## 3. 接口详细说明

### 3.1 合约部署

#### POST /api/v1/contracts/deploy

部署IP-NFT智能合约到区块链。

**请求**: 无需请求体

**响应成功 (201)**:
```json
{
  "success": true,
  "message": "Contract deployed successfully",
  "data": {
    "success": true,
    "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "transaction_hash": "0xd0b51da4955328f85ce35bb64981df5e4c1ae9423676285dff5ef1385262c5c1",
    "block_number": 3,
    "gas_used": 2848466
  }
}
```

#### GET /api/v1/contracts/info

获取当前合约信息。

**响应 (200)**:
```json
{
  "success": true,
  "message": "Contract info retrieved",
  "data": {
    "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "deployer_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "chain_id": 31337,
    "is_connected": true,
    "has_contract": true,
    "has_abi": true
  }
}
```

#### GET /api/v1/contracts/status

检查合约部署状态。

**响应 (200)**:
```json
{
  "ready": true,
  "issues": [],
  "warnings": ["DEPLOYER_PRIVATE_KEY is configured"],
  "can_mint": true
}
```

---

### 3.2 NFT铸造

#### POST /api/v1/nft/mint

铸造单个NFT。

**请求参数**:
- `asset_id` (query): 资产ID (UUID)
- `minter_address` (body): 接收NFT的钱包地址

**请求体**:
```json
{
  "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**响应成功 (201)**:
```json
{
  "message": "NFT minted successfully",
  "asset_id": "70e99b29-27ef-4937-9134-38affc0d51be",
  "token_id": 1,
  "tx_hash": "0xabc123...",
  "metadata_uri": "ipfs://QmTest123...",
  "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "status": "MINTED"
}
```

**响应错误 (400)**:
```json
{
  "detail": "Cannot mint NFT for asset with status 'MINTED'. Asset must be in DRAFT or PENDING status."
}
```

---

#### POST /api/v1/nft/batch-mint

批量铸造多个NFT。

**请求体**:
```json
{
  "asset_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**响应成功 (201)**:
```json
{
  "message": "Batch mint completed: 2 succeeded, 1 failed",
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "asset_id": "uuid-1",
      "status": "success",
      "token_id": 1,
      "tx_hash": "0xabc123..."
    },
    {
      "asset_id": "uuid-2",
      "status": "success",
      "token_id": 2,
      "tx_hash": "0xdef456..."
    },
    {
      "asset_id": "uuid-3",
      "status": "failed",
      "error": "Asset not found"
    }
  ]
}
```

---

#### GET /api/v1/nft/{asset_id}/mint/status

获取资产铸造状态。

**响应 (200)**:
```json
{
  "asset_id": "70e99b29-27ef-4937-9134-38affc0d51be",
  "current_status": "MINTING",
  "mint_stage": "CONFIRMING",
  "mint_progress": 70,
  "token_id": null,
  "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "tx_hash": "0xabc123...",
  "metadata_uri": "ipfs://QmTest123...",
  "recipient_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "mint_requested_at": "2026-02-20T10:30:00+00:00",
  "mint_submitted_at": "2026-02-20T10:30:05+00:00",
  "mint_confirmed_at": null,
  "mint_completed_at": null,
  "mint_attempt_count": 1,
  "max_mint_attempts": 3,
  "can_retry": true,
  "last_mint_error": null,
  "last_mint_error_code": null,
  "mint_record": {
    "id": "uuid-record",
    "operation": "REQUEST",
    "stage": "SUBMITTING",
    "status": "PENDING",
    "error_code": null,
    "error_message": null
  }
}
```

---

#### POST /api/v1/nft/{asset_id}/mint/retry

重试铸造失败的NFT。

**请求体**:
```json
{
  "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**响应成功 (201)**:
```json
{
  "message": "NFT minted successfully",
  "asset_id": "70e99b29-27ef-4937-9134-38affc0d51be",
  "token_id": 2,
  "tx_hash": "0xnewtx123...",
  "metadata_uri": "ipfs://QmNew123...",
  "contract_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "status": "MINTED"
}
```

---

## 4. 数据模型

### 4.1 Asset (资产)

NFT铸造相关字段：

| 字段 | 类型 | 描述 |
|------|------|------|
| `status` | Enum | 资产状态 (DRAFT, PENDING, MINTING, MINTED, MINT_FAILED, REJECTED等) |
| `nft_token_id` | String | NFT Token ID |
| `nft_contract_address` | String | NFT合约地址 |
| `nft_chain` | String | 区块链网络 |
| `metadata_uri` | String | NFT元数据URI (IPFS) |
| `metadata_cid` | String | IPFS CID |
| `mint_tx_hash` | String | 铸造交易哈希 |
| `mint_stage` | String | 铸造阶段 (PREPARING, SUBMITTING, CONFIRMING, COMPLETED, FAILED) |
| `mint_progress` | Integer | 铸造进度 (0-100) |
| `mint_attempt_count` | Integer | 铸造尝试次数 |
| `max_mint_attempts` | Integer | 最大尝试次数 (默认3) |
| `can_retry` | Boolean | 是否可重试 |
| `last_mint_error` | Text | 上次错误信息 |
| `last_mint_error_code` | String | 错误码 |
| `recipient_address` | String | NFT接收地址 |
| `mint_requested_at` | DateTime | 铸造请求时间 |
| `mint_submitted_at` | DateTime | 交易提交时间 |
| `mint_confirmed_at` | DateTime | 交易确认时间 |
| `mint_completed_at` | DateTime | 铸造完成时间 |

### 4.2 MintRecord (铸造记录)

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | UUID | 记录ID |
| `asset_id` | UUID | 资产ID |
| `operation` | String | 操作类型 (REQUEST, SUBMIT, CONFIRM, RETRY, FAIL, SUCCESS) |
| `stage` | String | 当前阶段 |
| `operator_id` | UUID | 操作者ID |
| `operator_address` | String | 操作者地址 |
| `token_id` | BigInteger | NFT Token ID |
| `tx_hash` | String | 交易哈希 |
| `status` | String | 状态 (PENDING, SUCCESS, FAILED) |
| `error_code` | String | 错误码 |
| `error_message` | String | 错误信息 |
| `metadata_uri` | String | 元数据URI |
| `created_at` | DateTime | 创建时间 |
| `completed_at` | DateTime | 完成时间 |

---

## 5. 铸造流程

### 5.1 状态流转

```
DRAFT → MINTING → MINTED (成功)
                → MINT_FAILED (失败，可重试)

PENDING → MINTING → MINTED (成功)
                 → MINT_FAILED (失败，可重试)
```

### 5.2 铸造阶段 (mint_stage)

1. **PREPARING** - 准备阶段 (10%)
2. **SUBMITTING** - 提交交易 (30%)
3. **CONFIRMING** - 等待确认 (70%)
4. **COMPLETED** - 铸造完成 (100%)
5. **FAILED** - 铸造失败

### 5.3 前置条件

铸造NFT前，资产必须满足：
1. 状态为 `DRAFT` 或 `PENDING`
2. 至少有一个附件 (Attachment)
3. 未达到最大重试次数

---

## 6. 环境配置

### 必需的环境变量

```env
# Blockchain
WEB3_PROVIDER_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
DEPLOYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# IPFS
IPFS_API_URL=http://localhost:5001
```

---

## 7. 错误码

| 错误码 | 描述 |
|--------|------|
| IPFS_UPLOAD_FAILED | IPFS上传失败 |
| CONTRACT_CALL_FAILED | 智能合约调用失败 |
| ASSET_NOT_FOUND | 资产不存在 |
| INVALID_ASSET_STATUS | 资产状态不正确 |
| MAX_RETRY_EXCEEDED | 超过最大重试次数 |
| INSUFFICIENT_ATTACHMENTS | 资产缺少附件 |

---

## 8. 示例 - 完整铸造流程

### 步骤1: 检查合约状态

```bash
GET /api/v1/contracts/status
```

### 步骤2: 创建资产并上传附件

```bash
# 创建资产
POST /api/v1/assets
{
  "name": "测试专利",
  "type": "PATENT",
  "description": "测试描述",
  "creator_name": "张三",
  "creation_date": "2024-01-01",
  "legal_status": "PENDING"
}

# 上传附件
POST /api/v1/assets/{asset_id}/attachments
Content-Type: multipart/form-data
file: [文件]
```

### 步骤3: 更改资产状态为PENDING

资产审批通过后状态自动变为PENDING。

### 步骤4: 铸造NFT

```bash
POST /api/v1/nft/mint?asset_id={asset_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "minter_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

### 步骤5: 查询铸造状态

```bash
GET /api/v1/nft/{asset_id}/mint/status
Authorization: Bearer {token}
```

---

## 9. 注意事项

1. **铸造前确保资产有附件** - 没有附件的资产无法铸造
2. **状态验证** - 只有DRAFT或PENDING状态的资产可以铸造
3. **重试机制** - 铸造失败后最多可重试3次
4. **Gas费用** - 铸造需要ETH支付Gas费用（本地测试网络免费）
5. **IPFS依赖** - 铸造需要IPFS节点正常运行

---

## 10. 测试账号

Hardhat本地节点的测试账号：

| 账号 | 地址 | 私钥 |
|------|------|------|
| Account 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| Account 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
