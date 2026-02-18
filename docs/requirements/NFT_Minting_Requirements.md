# IP资产NFT铸造功能需求文档

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-02-17 |
| 适用范围 | 毕设项目 - Web3 IP-NFT资产管理系统 |
| 目标环境 | 本地Hardhat节点（开发/演示环境） |

---

## 2. 功能概述

### 2.1 功能目标
实现IP资产的"数字孪生"上链，将物理世界的知识产权资产通过NFT形式记录在区块链上，确保资产权属的可验证性和不可篡改性。

### 2.2 功能范围
- 资产信息登记（已完成）
- 多媒体附件上传（已完成）
- NFT铸造（本需求）
- 铸造状态管理
- 链上资产查询

### 2.3 非功能目标
- 演示友好：支持毕设答辩场景
- 开发高效：3-5天内完成开发
- 调试便利：支持本地节点重置和状态查看

---

## 3. 系统架构

### 3.1 架构图

```
                    前端层 (React 19)
         资产登记表单    铸造按钮    铸造状态/结果展示
                      │
                      │ HTTP/REST
                      ▼
                   后端层 (FastAPI)
        ┌──────────────────────────────────────┐
        │          NFT铸造服务                │
        │  交易构建 → 签名 → 发送交易          │
        │  状态轮询    结果解析                │
        └──────────────────────────────────────┘
        ┌──────────────────────────────────────┐
        │          资产服务                   │
        │  - 资产CRUD操作                     │
        │  - 状态管理 (DRAFT → MINTING → MINTED)│
        └──────────────────────────────────────┘
                      │
                      │ Web3.py / HTTP
                      ▼
                区块链层 (Hardhat本地节点)
        ┌─────────────────────────────────────────┐
        │          IPAssetNFT 智能合约            │
        │  - ERC721标准                          │
        │  - 自定义功能: mintAsset(), batchMint()   │
        │  - 资产映射: assetId ↔ tokenId          │
        └─────────────────────────────────────────┘
        ┌─────────────────────────────────────────┐
        │          本地测试网络                    │
        │  - 出块时间: 即时（自动化挖矿）           │
        │  - 账户: 20个预置测试账户               │
        └─────────────────────────────────────────┘
```

### 3.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端 | React + TypeScript | ^19.0.0 | UI界面 |
| 前端 | Web3.js / ethers.js | ^6.x | 钱包连接（可选） |
| 后端 | FastAPI | ^0.115.0 | API服务 |
| 后端 | Web3.py | ^6.x | 区块链交互 |
| 合约 | Solidity | ^0.8.20 | 智能合约 |
| 节点 | Hardhat | ^2.x | 本地以太坊网络 |
| 存储 | IPFS | kubo | 文件存储 |

---

## 4. 功能需求

### 4.1 功能清单

#### FR-001: 智能合约部署
**优先级**: P0 (核心)  
**描述**: 在本地Hardhat节点部署IPAssetNFT智能合约  
**验收标准**:
- [ ] 合约成功部署到本地节点
- [ ] 返回合约地址和交易哈希
- [ ] 合约支持mintAsset和batchMint方法

#### FR-002: NFT铸造接口
**优先级**: P0 (核心)  
**描述**: 后端提供API接口执行NFT铸造  
**验收标准**:
- [ ] 提供POST /api/v1/assets/{id}/mint接口
- [ ] 调用智能合约mintAsset方法
- [ ] 支持指定接收地址和元数据URI
- [ ] 返回交易哈希和Token ID

#### FR-003: 铸造状态管理
**优先级**: P1 (重要)  
**描述**: 管理资产从DRAFT到MINTED的状态流转  
**验收标准**:
- [ ] 状态流转: DRAFT → MINTING → MINTED (或 FAILED)
- [ ] 提供铸造状态查询接口
- [ ] 铸造失败支持重试

#### FR-004: 前端铸造界面
**优先级**: P1 (重要)  
**描述**: 提供用户友好的铸造操作界面  
**验收标准**:
- [ ] 资产详情页显示"铸造NFT"按钮（仅DRAFT状态）
- [ ] 点击后显示确认对话框（显示预估信息）
- [ ] 铸造中显示进度/loading状态
- [ ] 铸造成功后显示Token ID和交易哈希
- [ ] 铸造失败显示错误信息和重试按钮

#### FR-005: 链上资产查询
**优先级**: P2 (增强)  
**描述**: 支持查询链上NFT资产信息  
**验收标准**:
- [ ] 提供API查询资产的链上信息
- [ ] 返回Token ID、合约地址、交易哈希、区块号
- [ ] 前端展示NFT卡片（包含链上信息）

#### FR-006: 批量铸造（可选）
**优先级**: P3 (可选)  
**描述**: 支持批量铸造多个资产  
**验收标准**:
- [ ] 支持选择多个DRAFT状态资产
- [ ] 一次性提交批量铸造请求
- [ ] 返回批量交易哈希

---

### 4.2 非功能需求

#### NFR-001: 性能
- 铸造API响应时间 < 3秒（本地节点即时出块）
- 支持并发铸造请求（Hardhat支持）

#### NFR-002: 可靠性
- 本地节点崩溃后支持快速重启（Hardhat自带状态持久化）
- 铸造交易失败提供明确错误信息

#### NFR-003: 安全性
- 私钥仅存储在服务器环境变量
- API接口需鉴权（已完成的企业成员验证）

#### NFR-004: 可演示性
- 支持一键启动完整环境（提供启动脚本）
- 提供演示数据集（预置资产数据）

---

## 5. 接口设计

### 5.1 API接口清单

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | /api/v1/admin/contracts/deploy | 部署合约 | 管理员 |
| POST | /api/v1/assets/{asset_id}/mint | 铸造NFT | 企业成员 |
| GET | /api/v1/assets/{asset_id}/mint/status | 查询铸造状态 | 企业成员 |
| POST | /api/v1/assets/batch-mint | 批量铸造 | 企业成员 |
| GET | /api/v1/nft/{token_id} | 查询链上NFT信息 | 公开 |
| GET | /api/v1/assets/{asset_id}/nft/details | 获取资产NFT详情 | 企业成员 |
| POST | /api/v1/admin/mint-retry | 管理员重试失败铸造 | 管理员 |

### 5.2 核心接口详情

#### 5.2.1 铸造NFT

**请求**
```http
POST /api/v1/assets/{asset_id}/mint
Content-Type: application/json
Authorization: Bearer {token}

{
  "recipient_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "metadata_uri": "ipfs://QmXxxx.../metadata.json"
}
```

**响应成功（202 Accepted）**
```json
{
  "success": true,
  "message": "NFT铸造请求已提交",
  "data": {
    "asset_id": "550e8400-e29b-41d4-a716-446655440000",
    "mint_id": "mint_abc123",
    "status": "PENDING",
    "recipient_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "metadata_uri": "ipfs://QmXxxx.../metadata.json",
    "requested_at": "2026-02-17T10:30:00Z",
    "estimated_completion": "2026-02-17T10:30:05Z"
  },
  "_links": {
    "status": "/api/v1/assets/550e8400-e29b-41d4-a716-446655440000/mint/status",
    "asset": "/api/v1/assets/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**响应失败（400/500）**
```json
{
  "success": false,
  "error": {
    "code": "MINT_INVALID_STATE",
    "message": "资产状态不允许铸造",
    "details": {
      "current_status": "MINTED",
      "allowed_statuses": ["DRAFT"],
      "asset_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "solutions": [
    "该资产已完成铸造，请勿重复操作",
    "如需重新铸造，请联系管理员"
  ]
}
```

#### 5.2.2 查询铸造状态

**请求**
```http
GET /api/v1/assets/{asset_id}/mint/status
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "asset_id": "550e8400-e29b-41d4-a716-446655440000",
    "current_status": "MINTING",
    "mint_status": {
      "stage": "CONFIRMING",
      "percentage": 75,
      "confirmations": 3,
      "required_confirmations": 6,
      "current_block": 152,
      "target_block": 155
    },
    "transaction": {
      "tx_hash": "0xabc123...def456",
      "nonce": 5,
      "gas_price": "1000000000",
      "gas_limit": 200000,
      "gas_used": null
    },
    "started_at": "2026-02-17T10:30:01Z",
    "estimated_completion": "2026-02-17T10:30:07Z",
    "auto_refresh": true,
    "refresh_interval": 2000
  }
}
```

---

## 6. 数据模型详细设计

### 6.1 Asset模型（扩展字段）

```python
# backend/app/models/asset.py

class Asset(Base):
    __tablename__ = "assets"
    
    # ========== 基础字段（已有） ==========
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(UUID, ForeignKey("enterprises.id"), nullable=False)
    creator_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    
    # 资产基本信息
    name = Column(String(200), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    description = Column(Text, nullable=False)
    creator_name = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    legal_status = Column(Enum(LegalStatus), nullable=False)
    application_number = Column(String(100), nullable=True)
    asset_metadata = Column(JSON, default=dict)
    
    # ========== NFT铸造扩展字段（新增） ==========
    
    # 铸造状态
    status = Column(Enum(AssetStatus), default=AssetStatus.DRAFT, nullable=False)
    
    # 铸造进度
    mint_stage = Column(String(20), nullable=True, comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED")
    mint_progress = Column(Integer, default=0, comment="铸造进度百分比 0-100")
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True, comment="NFT Token ID")
    contract_address = Column(String(42), nullable=True, comment="NFT合约地址")
    chain_id = Column(Integer, nullable=True, default=31337, comment="链ID (本地节点31337)")
    network_name = Column(String(50), nullable=True, default="Hardhat Local")
    
    # 交易信息
    mint_tx_hash = Column(String(66), nullable=True, comment="铸造交易哈希")
    mint_block_number = Column(BigInteger, nullable=True, comment="铸造区块号")
    mint_block_hash = Column(String(66), nullable=True, comment="铸造区块哈希")
    mint_gas_used = Column(BigInteger, nullable=True, comment="Gas消耗")
    mint_gas_price = Column(String(30), nullable=True, comment="Gas价格 (wei)")
    mint_total_cost_eth = Column(String(30), nullable=True, comment="总成本 (ETH)")
    
    # 确认信息
    mint_confirmations = Column(Integer, default=0, comment="当前确认数")
    required_confirmations = Column(Integer, default=6, comment="所需确认数")
    confirmations_sufficient = Column(Boolean, default=False, comment="确认数是否充足")
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True, comment="NFT元数据URI")
    metadata_cid = Column(String(100), nullable=True, comment="元数据IPFS CID")
    metadata_json = Column(Text, nullable=True, comment="元数据JSON内容")
    
    # 接收者
    recipient_address = Column(String(42), nullable=True, comment="NFT接收地址")
    recipient_type = Column(String(20), nullable=True, comment="接收者类型: ENTERPRISE/USER")
    
    # 时间戳
    mint_requested_at = Column(DateTime, nullable=True, comment="铸造请求时间")
    mint_submitted_at = Column(DateTime, nullable=True, comment="交易提交时间")
    mint_confirmed_at = Column(DateTime, nullable=True, comment="交易确认时间")
    mint_completed_at = Column(DateTime, nullable=True, comment="铸造完成时间")
    last_mint_attempt_at = Column(DateTime, nullable=True, comment="上次铸造尝试时间")
    
    # 错误处理
    mint_attempt_count = Column(Integer, default=0, comment="铸造尝试次数")
    max_mint_attempts = Column(Integer, default=3, comment="最大铸造尝试次数")
    last_mint_error = Column(Text, nullable=True, comment="上次铸造错误信息")
    last_mint_error_code = Column(String(50), nullable=True, comment="上次铸造错误码")
    can_retry = Column(Boolean, default=True, comment="是否可重试")
    next_retry_at = Column(DateTime, nullable=True, comment="下次重试时间")
    
    # ========== 关系字段 ==========
    enterprise = relationship("Enterprise", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")
    attachments = relationship("Attachment", back_populates="asset", cascade="all, delete-orphan")
    mint_records = relationship("MintRecord", back_populates="asset", cascade="all, delete-orphan")
    
    # ========== 索引 ==========
    __table_args__ = (
        Index('ix_assets_status', 'status'),
        Index('ix_assets_token_id', 'token_id'),
        Index('ix_assets_mint_tx_hash', 'mint_tx_hash'),
        Index('ix_assets_enterprise_status', 'enterprise_id', 'status'),
        Index('ix_assets_mint_requested', 'mint_requested_at'),
    )
```

### 6.2 新增MintRecord模型（审计日志）

```python
class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID, ForeignKey("assets.id"), nullable=False, index=True)
    operation = Column(String(20), nullable=False)  # REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS
    stage = Column(String(20), nullable=True)  # PREPARING/SUBMITTING/CONFIRMING/COMPLETED
    
    # 操作者
    operator_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    operator_address = Column(String(42), nullable=True)
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    gas_used = Column(BigInteger, nullable=True)
    
    # 状态
    status = Column(String(20), nullable=False)  # PENDING/SUCCESS/FAILED
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    asset = relationship("Asset", back_populates="mint_records")
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_mint_records_asset', 'asset_id', 'created_at'),
        Index('ix_mint_records_tx_hash', 'tx_hash'),
        Index('ix_mint_records_status', 'status'),
    )
```

---

## 7. 业务流程

### 7.1 铸造流程时序图

```
用户          前端React        FastAPI后端      NFTService       Hardhat节点       PostgreSQL
 |               |                 |               |                 |                |
 |──进入资产详情页─>│                 |               |                 |                |
 |               │──GET /assets/{id}───────────────>│                 |                |
 |               │                 │               │──查询资产详情─────>│                │
 |               │                 │               │<─返回资产数据────│                │
 |               │<─返回资产详情──────────────────│                 │                │
 |<─显示资产详情──│                 │               │                 │                │
 |               │                 │               │                 │                │
 |──点击"铸造NFT"按钮──────────────>│               │                 │                │
 |               │──显示确认对话框───│               │                 │                │
 |<─确认铸造────│                 │               │                 │                │
 |               │                 │               │                 │                │
 |               │──POST /assets/{id}/mint───────>│                 │                │
 |               │                 │──查询资产（加锁）───────────────>│                │
 |               │                 │<─返回资产（验证状态=DRAFT）─────│                │
 |               │                 │               │                 │                │
 |               │                 │──上传元数据到IPFS（如需要）─────>│                │
 |               │                 │<─返回CID和URI─────────────────│                │
 |               │                 │               │                 │                │
 |               │                 │──更新资产状态为MINTING─────────>│                │
 |               │                 │               │                 │                │
 |               │                 │──调用铸造服务───────────────────>│                │
 |               │                 │               │──构建并发送铸造交易───────────────>│
 |               │                 │               │<─返回交易哈希────────────────────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新交易哈希和提交时间──────────>│
 |               │                 │               │                 │                │
 |               │                 │               │──轮询交易确认（等待收据）────────>│
 |               │                 │               │<─返回交易收据（包含Token ID）─────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新铸造成功状态───────────────>│
 |               │                 │               │                 │                │
 |               │                 │<─返回铸造结果────────────────────────────────────│
 |               │<─返回铸造成功响应（202 Accepted）─────────────────────────────────│
 |               │                 │               │                 │                │
 |<─显示铸造成功──│                 │               │                 │                │
   展示Token ID  │                 │               │                 │                │
   和交易哈希    │                 │               │                 │                │

注：前端可轮询或WebSocket接收状态更新
```

### 7.2 状态流转详细说明

```
┌─────────────────────────────────────────────────────────────────┐
│                     铸造状态机 (State Machine)                     │
└─────────────────────────────────────────────────────────────────┘

状态定义：
├── DRAFT (草稿) [初始状态]
│   └── 资产已创建，尚未开始铸造
│   └── 允许操作：编辑、删除、发起铸造
│
├── MINT_PENDING (等待铸造)
│   └── 铸造请求已提交，等待处理
│   └── 允许操作：查询状态、取消（限时）
│
├── MINTING (铸造中)
│   └── 交易已提交到区块链，等待确认
│   ├── 子状态：
│   │   ├── PREPARING (准备中) - 构建交易数据
│   │   ├── SUBMITTING (提交中) - 发送交易到节点
│   │   ├── CONFIRMING (确认中) - 等待区块确认
│   │   └── FINALIZING (完成中) - 更新数据库状态
│   └── 允许操作：查询状态、轮询进度
│
├── MINTED (已铸造) [终态]
│   └── NFT铸造成功，资产已上链
│   └── 允许操作：查看链上信息、转移NFT（未来）
│
├── MINT_FAILED (铸造失败)
│   └── NFT铸造过程中发生错误
│   ├── 失败类型：
│   │   ├── VALIDATION_FAILED (验证失败) - 前置条件不满足
│   │   ├── TRANSACTION_REJECTED (交易被拒绝) - 节点拒绝
│   │   ├── TRANSACTION_FAILED (交易执行失败) - 合约回滚
│   │   ├── CONFIRMATION_TIMEOUT (确认超时) - 长时间未确认
│   │   └── SYSTEM_ERROR (系统错误) - 内部异常
│   └── 允许操作：查看错误详情、重试（有限次数）、取消
│
└── MINT_CANCELLED (已取消)
    └── 铸造请求被主动取消
    └── 允许操作：重新发起铸造

状态流转规则：
1. DRAFT → MINT_PENDING: 用户发起铸造请求
2. MINT_PENDING → MINTING: 系统开始处理，提交交易
3. MINTING → MINTED: 交易确认成功
4. MINTING → MINT_FAILED: 交易失败或超时
5. MINT_PENDING/MINTING → MINT_CANCELLED: 用户取消（限时）
6. MINT_FAILED → MINTING: 重试铸造（自动或手动）
7. * → DRAFT: 重置（管理员操作，慎用）

状态流转约束：
- 终态（MINTED, MINT_CANCELLED）不可流转到其他状态（除非重置）
- MINT_FAILED最多允许重试3次，之后需管理员介入
- MINT_PENDING状态超过5分钟未处理自动转为MINT_FAILED
- MINTING状态超过10分钟未确认视为超时
```

### 7.3 错误处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      错误分类与处理策略                          │
└─────────────────────────────────────────────────────────────────┘

1. 前置验证错误 (400 Bad Request)
   ├── 资产状态不是DRAFT
   ├── 资产不存在或无权限
   ├── 接收地址格式无效
   ├── 元数据格式错误
   └── 处理: 立即返回错误，不进入铸造流程

2. 准备阶段错误 (500 Internal Server Error)
   ├── IPFS上传失败
   ├── 数据库更新失败
   ├──  nonce获取失败
   └── 处理: 记录错误，释放资源，返回失败状态

3. 交易提交错误 (500/502)
   ├── 节点连接失败
   ├── 交易构建失败
   ├── Gas估算失败
   ├── 交易被节点拒绝
   └── 处理: 最多重试3次，间隔2秒，仍失败则标记为FAILED

4. 确认阶段错误 (500/504)
   ├── 交易回执获取失败
   ├── 交易执行失败（合约回滚）
   ├── 确认超时（超过10分钟）
   └── 处理: 
       ├── 合约回滚: 解析revert reason，记录错误
       ├── 超时: 继续后台轮询，API返回PENDING状态
       └── 其他: 标记为FAILED，允许重试

5. 最终化处理错误 (500)
   ├── Token ID提取失败
   ├── 数据库更新失败
   ├── 事件通知失败
   └── 处理: 记录到待处理队列，管理员手动修复

重试策略:
- 自动重试: 仅在交易提交阶段，最多3次
- 手动重试: 通过API调用，任何FAILED状态都可重试（限3次）
- 重试间隔: 指数退避 1s → 2s → 4s

监控与告警:
- 铸造成功率 < 95% 触发告警
- 单笔铸造超过10分钟未结束触发告警
- 连续3次重试失败触发告警
```

---

## 8. 数据模型详细设计

### 8.1 Asset模型（扩展字段）

```python
# backend/app/models/asset.py

class Asset(Base):
    __tablename__ = "assets"
    
    # ========== 基础字段（已有） ==========
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(UUID, ForeignKey("enterprises.id"), nullable=False)
    creator_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    
    # 资产基本信息
    name = Column(String(200), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    description = Column(Text, nullable=False)
    creator_name = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    legal_status = Column(Enum(LegalStatus), nullable=False)
    application_number = Column(String(100), nullable=True)
    asset_metadata = Column(JSON, default=dict)
    
    # ========== NFT铸造扩展字段（新增） ==========
    
    # 铸造状态
    status = Column(Enum(AssetStatus), default=AssetStatus.DRAFT, nullable=False)
    
    # 铸造进度
    mint_stage = Column(String(20), nullable=True, comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED")
    mint_progress = Column(Integer, default=0, comment="铸造进度百分比 0-100")
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True, comment="NFT Token ID")
    contract_address = Column(String(42), nullable=True, comment="NFT合约地址")
    chain_id = Column(Integer, nullable=True, default=31337, comment="链ID (本地节点31337)")
    network_name = Column(String(50), nullable=True, default="Hardhat Local")
    
    # 交易信息
    mint_tx_hash = Column(String(66), nullable=True, comment="铸造交易哈希")
    mint_block_number = Column(BigInteger, nullable=True, comment="铸造区块号")
    mint_block_hash = Column(String(66), nullable=True, comment="铸造区块哈希")
    mint_gas_used = Column(BigInteger, nullable=True, comment="Gas消耗")
    mint_gas_price = Column(String(30), nullable=True, comment="Gas价格 (wei)")
    mint_total_cost_eth = Column(String(30), nullable=True, comment="总成本 (ETH)")
    
    # 确认信息
    mint_confirmations = Column(Integer, default=0, comment="当前确认数")
    required_confirmations = Column(Integer, default=6, comment="所需确认数")
    confirmations_sufficient = Column(Boolean, default=False, comment="确认数是否充足")
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True, comment="NFT元数据URI")
    metadata_cid = Column(String(100), nullable=True, comment="元数据IPFS CID")
    metadata_json = Column(Text, nullable=True, comment="元数据JSON内容")
    
    # 接收者
    recipient_address = Column(String(42), nullable=True, comment="NFT接收地址")
    recipient_type = Column(String(20), nullable=True, comment="接收者类型: ENTERPRISE/USER")
    
    # 时间戳
    mint_requested_at = Column(DateTime, nullable=True, comment="铸造请求时间")
    mint_submitted_at = Column(DateTime, nullable=True, comment="交易提交时间")
    mint_confirmed_at = Column(DateTime, nullable=True, comment="交易确认时间")
    mint_completed_at = Column(DateTime, nullable=True, comment="铸造完成时间")
    last_mint_attempt_at = Column(DateTime, nullable=True, comment="上次铸造尝试时间")
    
    # 错误处理
    mint_attempt_count = Column(Integer, default=0, comment="铸造尝试次数")
    max_mint_attempts = Column(Integer, default=3, comment="最大铸造尝试次数")
    last_mint_error = Column(Text, nullable=True, comment="上次铸造错误信息")
    last_mint_error_code = Column(String(50), nullable=True, comment="上次铸造错误码")
    can_retry = Column(Boolean, default=True, comment="是否可重试")
    next_retry_at = Column(DateTime, nullable=True, comment="下次重试时间")
    
    # ========== 关系字段 ==========
    enterprise = relationship("Enterprise", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")
    attachments = relationship("Attachment", back_populates="asset", cascade="all, delete-orphan")
    mint_records = relationship("MintRecord", back_populates="asset", cascade="all, delete-orphan")
    
    # ========== 索引 ==========
    __table_args__ = (
        Index('ix_assets_status', 'status'),
        Index('ix_assets_token_id', 'token_id'),
        Index('ix_assets_mint_tx_hash', 'mint_tx_hash'),
        Index('ix_assets_enterprise_status', 'enterprise_id', 'status'),
        Index('ix_assets_mint_requested', 'mint_requested_at'),
    )
```

### 8.2 新增MintRecord模型（审计日志）

```python
class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID, ForeignKey("assets.id"), nullable=False, index=True)
    operation = Column(String(20), nullable=False)  # REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS
    stage = Column(String(20), nullable=True)  # PREPARING/SUBMITTING/CONFIRMING/COMPLETED
    
    # 操作者
    operator_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    operator_address = Column(String(42), nullable=True)
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    gas_used = Column(BigInteger, nullable=True)
    
    # 状态
    status = Column(String(20), nullable=False)  # PENDING/SUCCESS/FAILED
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    asset = relationship("Asset", back_populates="mint_records")
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_mint_records_asset', 'asset_id', 'created_at'),
        Index('ix_mint_records_tx_hash', 'tx_hash'),
        Index('ix_mint_records_status', 'status'),
    )
```

---

## 9. 业务流程

### 9.1 铸造流程时序图

```
用户          前端React        FastAPI后端      NFTService       Hardhat节点       PostgreSQL
 |               |                 |               |                 |                |
 |──进入资产详情页─>│                 |               |                 |                |
 |               │──GET /assets/{id}───────────────>│                 |                |
 |               │                 │               │──查询资产详情─────>│                │
 |               │                 │               │<─返回资产数据────│                │
 |               │<─返回资产详情──────────────────│                 │                │
 |<─显示资产详情──│                 │               │                 │                │
 |               │                 │               │                 │                │
 |──点击"铸造NFT"按钮──────────────>│               │                 │                │
 |               │──显示确认对话框───│               │                 │                │
 |<─确认铸造────│                 │               │                 │                │
 |               │                 │               │                 │                │
 |               │──POST /assets/{id}/mint───────>│                 │                │
 |               │                 │──查询资产（加锁）───────────────>│                │
 |               │                 │<─返回资产（验证状态=DRAFT）─────│                │
 |               │                 │               │                 │                │
 |               │                 │──上传元数据到IPFS（如需要）─────>│                │
 |               │                 │<─返回CID和URI─────────────────│                │
 |               │                 │               │                 │                │
 |               │                 │──更新资产状态为MINTING─────────>│                │
 |               │                 │               │                 │                │
 |               │                 │──调用铸造服务───────────────────>│                │
 |               │                 │               │──构建并发送铸造交易───────────────>│
 |               │                 │               │<─返回交易哈希────────────────────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新交易哈希和提交时间──────────>│
 |               │                 │               │                 │                │
 |               │                 │               │──轮询交易确认（等待收据）────────>│
 |               │                 │               │<─返回交易收据（包含Token ID）─────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新铸造成功状态───────────────>│
 |               │                 │               │                 │                │
 |               │                 │<─返回铸造结果────────────────────────────────────│
 |               │<─返回铸造成功响应（202 Accepted）─────────────────────────────────│
 |               │                 │               │                 │                │
 |<─显示铸造成功──│                 │               │                 │                │
   展示Token ID  │                 │               │                 │                │
   和交易哈希    │                 │               │                 │                │

注：前端可轮询或WebSocket接收状态更新
```

### 9.2 状态流转详细说明

```
┌─────────────────────────────────────────────────────────────────┐
│                     铸造状态机 (State Machine)                     │
└─────────────────────────────────────────────────────────────────┘

状态定义：
├── DRAFT (草稿) [初始状态]
│   └── 资产已创建，尚未开始铸造
│   └── 允许操作：编辑、删除、发起铸造
│
├── MINT_PENDING (等待铸造)
│   └── 铸造请求已提交，等待处理
│   └── 允许操作：查询状态、取消（限时）
│
├── MINTING (铸造中)
│   └── 交易已提交到区块链，等待确认
│   ├── 子状态：
│   │   ├── PREPARING (准备中) - 构建交易数据
│   │   ├── SUBMITTING (提交中) - 发送交易到节点
│   │   ├── CONFIRMING (确认中) - 等待区块确认
│   │   └── FINALIZING (完成中) - 更新数据库状态
│   └── 允许操作：查询状态、轮询进度
│
├── MINTED (已铸造) [终态]
│   └── NFT铸造成功，资产已上链
│   └── 允许操作：查看链上信息、转移NFT（未来）
│
├── MINT_FAILED (铸造失败)
│   └── NFT铸造过程中发生错误
│   ├── 失败类型：
│   │   ├── VALIDATION_FAILED (验证失败) - 前置条件不满足
│   │   ├── TRANSACTION_REJECTED (交易被拒绝) - 节点拒绝
│   │   ├── TRANSACTION_FAILED (交易执行失败) - 合约回滚
│   │   ├── CONFIRMATION_TIMEOUT (确认超时) - 长时间未确认
│   │   └── SYSTEM_ERROR (系统错误) - 内部异常
│   └── 允许操作：查看错误详情、重试（有限次数）、取消
│
└── MINT_CANCELLED (已取消)
    └── 铸造请求被主动取消
    └── 允许操作：重新发起铸造

状态流转规则：
1. DRAFT → MINT_PENDING: 用户发起铸造请求
2. MINT_PENDING → MINTING: 系统开始处理，提交交易
3. MINTING → MINTED: 交易确认成功
4. MINTING → MINT_FAILED: 交易失败或超时
5. MINT_PENDING/MINTING → MINT_CANCELLED: 用户取消（限时）
6. MINT_FAILED → MINTING: 重试铸造（自动或手动）
7. * → DRAFT: 重置（管理员操作，慎用）

状态流转约束：
- 终态（MINTED, MINT_CANCELLED）不可流转到其他状态（除非重置）
- MINT_FAILED最多允许重试3次，之后需管理员介入
- MINT_PENDING状态超过5分钟未处理自动转为MINT_FAILED
- MINTING状态超过10分钟未确认视为超时
```

### 7.3 错误处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      错误分类与处理策略                          │
└─────────────────────────────────────────────────────────────────┘

1. 前置验证错误 (400 Bad Request)
   ├── 资产状态不是DRAFT
   ├── 资产不存在或无权限
   ├── 接收地址格式无效
   ├── 元数据格式错误
   └── 处理: 立即返回错误，不进入铸造流程

2. 准备阶段错误 (500 Internal Server Error)
   ├── IPFS上传失败
   ├── 数据库更新失败
   ├──  nonce获取失败
   └── 处理: 记录错误，释放资源，返回失败状态

3. 交易提交错误 (500/502)
   ├── 节点连接失败
   ├── 交易构建失败
   ├── Gas估算失败
   ├── 交易被节点拒绝
   └── 处理: 最多重试3次，间隔2秒，仍失败则标记为FAILED

4. 确认阶段错误 (500/504)
   ├── 交易回执获取失败
   ├── 交易执行失败（合约回滚）
   ├── 确认超时（超过10分钟）
   └── 处理: 
       ├── 合约回滚: 解析revert reason，记录错误
       ├── 超时: 继续后台轮询，API返回PENDING状态
       └── 其他: 标记为FAILED，允许重试

5. 最终化处理错误 (500)
   ├── Token ID提取失败
   ├── 数据库更新失败
   ├── 事件通知失败
   └── 处理: 记录到待处理队列，管理员手动修复

重试策略:
- 自动重试: 仅在交易提交阶段，最多3次
- 手动重试: 通过API调用，任何FAILED状态都可重试（限3次）
- 重试间隔: 指数退避 1s → 2s → 4s

监控与告警:
- 铸造成功率 < 95% 触发告警
- 单笔铸造超过10分钟未结束触发告警
- 连续3次重试失败触发告警
```

---

## 8. 数据模型详细设计

### 8.1 Asset模型（扩展字段）

```python
# backend/app/models/asset.py

class Asset(Base):
    __tablename__ = "assets"
    
    # ========== 基础字段（已有） ==========
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(UUID, ForeignKey("enterprises.id"), nullable=False)
    creator_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    
    # 资产基本信息
    name = Column(String(200), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    description = Column(Text, nullable=False)
    creator_name = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    legal_status = Column(Enum(LegalStatus), nullable=False)
    application_number = Column(String(100), nullable=True)
    asset_metadata = Column(JSON, default=dict)
    
    # ========== NFT铸造扩展字段（新增） ==========
    
    # 铸造状态
    status = Column(Enum(AssetStatus), default=AssetStatus.DRAFT, nullable=False)
    
    # 铸造进度
    mint_stage = Column(String(20), nullable=True, comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED")
    mint_progress = Column(Integer, default=0, comment="铸造进度百分比 0-100")
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True, comment="NFT Token ID")
    contract_address = Column(String(42), nullable=True, comment="NFT合约地址")
    chain_id = Column(Integer, nullable=True, default=31337, comment="链ID (本地节点31337)")
    network_name = Column(String(50), nullable=True, default="Hardhat Local")
    
    # 交易信息
    mint_tx_hash = Column(String(66), nullable=True, comment="铸造交易哈希")
    mint_block_number = Column(BigInteger, nullable=True, comment="铸造区块号")
    mint_block_hash = Column(String(66), nullable=True, comment="铸造区块哈希")
    mint_gas_used = Column(BigInteger, nullable=True, comment="Gas消耗")
    mint_gas_price = Column(String(30), nullable=True, comment="Gas价格 (wei)")
    mint_total_cost_eth = Column(String(30), nullable=True, comment="总成本 (ETH)")
    
    # 确认信息
    mint_confirmations = Column(Integer, default=0, comment="当前确认数")
    required_confirmations = Column(Integer, default=6, comment="所需确认数")
    confirmations_sufficient = Column(Boolean, default=False, comment="确认数是否充足")
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True, comment="NFT元数据URI")
    metadata_cid = Column(String(100), nullable=True, comment="元数据IPFS CID")
    metadata_json = Column(Text, nullable=True, comment="元数据JSON内容")
    
    # 接收者
    recipient_address = Column(String(42), nullable=True, comment="NFT接收地址")
    recipient_type = Column(String(20), nullable=True, comment="接收者类型: ENTERPRISE/USER")
    
    # 时间戳
    mint_requested_at = Column(DateTime, nullable=True, comment="铸造请求时间")
    mint_submitted_at = Column(DateTime, nullable=True, comment="交易提交时间")
    mint_confirmed_at = Column(DateTime, nullable=True, comment="交易确认时间")
    mint_completed_at = Column(DateTime, nullable=True, comment="铸造完成时间")
    last_mint_attempt_at = Column(DateTime, nullable=True, comment="上次铸造尝试时间")
    
    # 错误处理
    mint_attempt_count = Column(Integer, default=0, comment="铸造尝试次数")
    max_mint_attempts = Column(Integer, default=3, comment="最大铸造尝试次数")
    last_mint_error = Column(Text, nullable=True, comment="上次铸造错误信息")
    last_mint_error_code = Column(String(50), nullable=True, comment="上次铸造错误码")
    can_retry = Column(Boolean, default=True, comment="是否可重试")
    next_retry_at = Column(DateTime, nullable=True, comment="下次重试时间")
    
    # ========== 关系字段 ==========
    enterprise = relationship("Enterprise", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")
    attachments = relationship("Attachment", back_populates="asset", cascade="all, delete-orphan")
    mint_records = relationship("MintRecord", back_populates="asset", cascade="all, delete-orphan")
    
    # ========== 索引 ==========
    __table_args__ = (
        Index('ix_assets_status', 'status'),
        Index('ix_assets_token_id', 'token_id'),
        Index('ix_assets_mint_tx_hash', 'mint_tx_hash'),
        Index('ix_assets_enterprise_status', 'enterprise_id', 'status'),
        Index('ix_assets_mint_requested', 'mint_requested_at'),
    )
```

### 8.2 新增MintRecord模型（审计日志）

```python
class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID, ForeignKey("assets.id"), nullable=False, index=True)
    operation = Column(String(20), nullable=False)  # REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS
    stage = Column(String(20), nullable=True)  # PREPARING/SUBMITTING/CONFIRMING/COMPLETED
    
    # 操作者
    operator_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    operator_address = Column(String(42), nullable=True)
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    gas_used = Column(BigInteger, nullable=True)
    
    # 状态
    status = Column(String(20), nullable=False)  # PENDING/SUCCESS/FAILED
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    asset = relationship("Asset", back_populates="mint_records")
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_mint_records_asset', 'asset_id', 'created_at'),
        Index('ix_mint_records_tx_hash', 'tx_hash'),
        Index('ix_mint_records_status', 'status'),
    )
```

---

## 9. 业务流程

### 9.1 铸造流程时序图

```
用户          前端React        FastAPI后端      NFTService       Hardhat节点       PostgreSQL
 |               |                 |               |                 |                |
 |──进入资产详情页─>│                 |               |                 |                |
 |               │──GET /assets/{id}───────────────>│                 |                |
 |               │                 │               │──查询资产详情─────>│                │
 |               │                 │               │<─返回资产数据────│                │
 |               │<─返回资产详情──────────────────│                 │                │
 |<─显示资产详情──│                 │               │                 │                │
 |               │                 │               │                 │                │
 |──点击"铸造NFT"按钮──────────────>│               │                 │                │
 |               │──显示确认对话框───│               │                 │                │
 |<─确认铸造────│                 │               │                 │                │
 |               │                 │               │                 │                │
 |               │──POST /assets/{id}/mint───────>│                 │                │
 |               │                 │──查询资产（加锁）───────────────>│                │
 |               │                 │<─返回资产（验证状态=DRAFT）─────│                │
 |               │                 │               │                 │                │
 |               │                 │──上传元数据到IPFS（如需要）─────>│                │
 |               │                 │<─返回CID和URI─────────────────│                │
 |               │                 │               │                 │                │
 |               │                 │──更新资产状态为MINTING─────────>│                │
 |               │                 │               │                 │                │
 |               │                 │──调用铸造服务───────────────────>│                │
 |               │                 │               │──构建并发送铸造交易───────────────>│
 |               │                 │               │<─返回交易哈希────────────────────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新交易哈希和提交时间──────────>│
 |               │                 │               │                 │                │
 |               │                 │               │──轮询交易确认（等待收据）────────>│
 |               │                 │               │<─返回交易收据（包含Token ID）─────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新铸造成功状态───────────────>│
 |               │                 │               │                 │                │
 |               │                 │<─返回铸造结果────────────────────────────────────│
 |               │<─返回铸造成功响应（202 Accepted）─────────────────────────────────│
 |               │                 │               │                 │                │
 |<─显示铸造成功──│                 │               │                 │                │
   展示Token ID  │                 │               │                 │                │
   和交易哈希    │                 │               │                 │                │

注：前端可轮询或WebSocket接收状态更新
```

### 9.2 状态流转详细说明

```
┌─────────────────────────────────────────────────────────────────┐
│                     铸造状态机 (State Machine)                     │
└─────────────────────────────────────────────────────────────────┘

状态定义：
├── DRAFT (草稿) [初始状态]
│   └── 资产已创建，尚未开始铸造
│   └── 允许操作：编辑、删除、发起铸造
│
├── MINT_PENDING (等待铸造)
│   └── 铸造请求已提交，等待处理
│   └── 允许操作：查询状态、取消（限时）
│
├── MINTING (铸造中)
│   └── 交易已提交到区块链，等待确认
│   ├── 子状态：
│   │   ├── PREPARING (准备中) - 构建交易数据
│   │   ├── SUBMITTING (提交中) - 发送交易到节点
│   │   ├── CONFIRMING (确认中) - 等待区块确认
│   │   └── FINALIZING (完成中) - 更新数据库状态
│   └── 允许操作：查询状态、轮询进度
│
├── MINTED (已铸造) [终态]
│   └── NFT铸造成功，资产已上链
│   └── 允许操作：查看链上信息、转移NFT（未来）
│
├── MINT_FAILED (铸造失败)
│   └── NFT铸造过程中发生错误
│   ├── 失败类型：
│   │   ├── VALIDATION_FAILED (验证失败) - 前置条件不满足
│   │   ├── TRANSACTION_REJECTED (交易被拒绝) - 节点拒绝
│   │   ├── TRANSACTION_FAILED (交易执行失败) - 合约回滚
│   │   ├── CONFIRMATION_TIMEOUT (确认超时) - 长时间未确认
│   │   └── SYSTEM_ERROR (系统错误) - 内部异常
│   └── 允许操作：查看错误详情、重试（有限次数）、取消
│
└── MINT_CANCELLED (已取消)
    └── 铸造请求被主动取消
    └── 允许操作：重新发起铸造

状态流转规则：
1. DRAFT → MINT_PENDING: 用户发起铸造请求
2. MINT_PENDING → MINTING: 系统开始处理，提交交易
3. MINTING → MINTED: 交易确认成功
4. MINTING → MINT_FAILED: 交易失败或超时
5. MINT_PENDING/MINTING → MINT_CANCELLED: 用户取消（限时）
6. MINT_FAILED → MINTING: 重试铸造（自动或手动）
7. * → DRAFT: 重置（管理员操作，慎用）

状态流转约束：
- 终态（MINTED, MINT_CANCELLED）不可流转到其他状态（除非重置）
- MINT_FAILED最多允许重试3次，之后需管理员介入
- MINT_PENDING状态超过5分钟未处理自动转为MINT_FAILED
- MINTING状态超过10分钟未确认视为超时
```

### 7.3 错误处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      错误分类与处理策略                          │
└─────────────────────────────────────────────────────────────────┘

1. 前置验证错误 (400 Bad Request)
   ├── 资产状态不是DRAFT
   ├── 资产不存在或无权限
   ├── 接收地址格式无效
   ├── 元数据格式错误
   └── 处理: 立即返回错误，不进入铸造流程

2. 准备阶段错误 (500 Internal Server Error)
   ├── IPFS上传失败
   ├── 数据库更新失败
   ├──  nonce获取失败
   └── 处理: 记录错误，释放资源，返回失败状态

3. 交易提交错误 (500/502)
   ├── 节点连接失败
   ├── 交易构建失败
   ├── Gas估算失败
   ├── 交易被节点拒绝
   └── 处理: 最多重试3次，间隔2秒，仍失败则标记为FAILED

4. 确认阶段错误 (500/504)
   ├── 交易回执获取失败
   ├── 交易执行失败（合约回滚）
   ├── 确认超时（超过10分钟）
   └── 处理: 
       ├── 合约回滚: 解析revert reason，记录错误
       ├── 超时: 继续后台轮询，API返回PENDING状态
       └── 其他: 标记为FAILED，允许重试

5. 最终化处理错误 (500)
   ├── Token ID提取失败
   ├── 数据库更新失败
   ├── 事件通知失败
   └── 处理: 记录到待处理队列，管理员手动修复

重试策略:
- 自动重试: 仅在交易提交阶段，最多3次
- 手动重试: 通过API调用，任何FAILED状态都可重试（限3次）
- 重试间隔: 指数退避 1s → 2s → 4s

监控与告警:
- 铸造成功率 < 95% 触发告警
- 单笔铸造超过10分钟未结束触发告警
- 连续3次重试失败触发告警
```

---

## 8. 数据模型详细设计

### 8.1 Asset模型（扩展字段）

```python
# backend/app/models/asset.py

class Asset(Base):
    __tablename__ = "assets"
    
    # ========== 基础字段（已有） ==========
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(UUID, ForeignKey("enterprises.id"), nullable=False)
    creator_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    
    # 资产基本信息
    name = Column(String(200), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    description = Column(Text, nullable=False)
    creator_name = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    legal_status = Column(Enum(LegalStatus), nullable=False)
    application_number = Column(String(100), nullable=True)
    asset_metadata = Column(JSON, default=dict)
    
    # ========== NFT铸造扩展字段（新增） ==========
    
    # 铸造状态
    status = Column(Enum(AssetStatus), default=AssetStatus.DRAFT, nullable=False)
    
    # 铸造进度
    mint_stage = Column(String(20), nullable=True, comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED")
    mint_progress = Column(Integer, default=0, comment="铸造进度百分比 0-100")
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True, comment="NFT Token ID")
    contract_address = Column(String(42), nullable=True, comment="NFT合约地址")
    chain_id = Column(Integer, nullable=True, default=31337, comment="链ID (本地节点31337)")
    network_name = Column(String(50), nullable=True, default="Hardhat Local")
    
    # 交易信息
    mint_tx_hash = Column(String(66), nullable=True, comment="铸造交易哈希")
    mint_block_number = Column(BigInteger, nullable=True, comment="铸造区块号")
    mint_block_hash = Column(String(66), nullable=True, comment="铸造区块哈希")
    mint_gas_used = Column(BigInteger, nullable=True, comment="Gas消耗")
    mint_gas_price = Column(String(30), nullable=True, comment="Gas价格 (wei)")
    mint_total_cost_eth = Column(String(30), nullable=True, comment="总成本 (ETH)")
    
    # 确认信息
    mint_confirmations = Column(Integer, default=0, comment="当前确认数")
    required_confirmations = Column(Integer, default=6, comment="所需确认数")
    confirmations_sufficient = Column(Boolean, default=False, comment="确认数是否充足")
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True, comment="NFT元数据URI")
    metadata_cid = Column(String(100), nullable=True, comment="元数据IPFS CID")
    metadata_json = Column(Text, nullable=True, comment="元数据JSON内容")
    
    # 接收者
    recipient_address = Column(String(42), nullable=True, comment="NFT接收地址")
    recipient_type = Column(String(20), nullable=True, comment="接收者类型: ENTERPRISE/USER")
    
    # 时间戳
    mint_requested_at = Column(DateTime, nullable=True, comment="铸造请求时间")
    mint_submitted_at = Column(DateTime, nullable=True, comment="交易提交时间")
    mint_confirmed_at = Column(DateTime, nullable=True, comment="交易确认时间")
    mint_completed_at = Column(DateTime, nullable=True, comment="铸造完成时间")
    last_mint_attempt_at = Column(DateTime, nullable=True, comment="上次铸造尝试时间")
    
    # 错误处理
    mint_attempt_count = Column(Integer, default=0, comment="铸造尝试次数")
    max_mint_attempts = Column(Integer, default=3, comment="最大铸造尝试次数")
    last_mint_error = Column(Text, nullable=True, comment="上次铸造错误信息")
    last_mint_error_code = Column(String(50), nullable=True, comment="上次铸造错误码")
    can_retry = Column(Boolean, default=True, comment="是否可重试")
    next_retry_at = Column(DateTime, nullable=True, comment="下次重试时间")
    
    # ========== 关系字段 ==========
    enterprise = relationship("Enterprise", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")
    attachments = relationship("Attachment", back_populates="asset", cascade="all, delete-orphan")
    mint_records = relationship("MintRecord", back_populates="asset", cascade="all, delete-orphan")
    
    # ========== 索引 ==========
    __table_args__ = (
        Index('ix_assets_status', 'status'),
        Index('ix_assets_token_id', 'token_id'),
        Index('ix_assets_mint_tx_hash', 'mint_tx_hash'),
        Index('ix_assets_enterprise_status', 'enterprise_id', 'status'),
        Index('ix_assets_mint_requested', 'mint_requested_at'),
    )
```

### 8.2 新增MintRecord模型（审计日志）

```python
class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID, ForeignKey("assets.id"), nullable=False, index=True)
    operation = Column(String(20), nullable=False)  # REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS
    stage = Column(String(20), nullable=True)  # PREPARING/SUBMITTING/CONFIRMING/COMPLETED
    
    # 操作者
    operator_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    operator_address = Column(String(42), nullable=True)
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    gas_used = Column(BigInteger, nullable=True)
    
    # 状态
    status = Column(String(20), nullable=False)  # PENDING/SUCCESS/FAILED
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    asset = relationship("Asset", back_populates="mint_records")
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_mint_records_asset', 'asset_id', 'created_at'),
        Index('ix_mint_records_tx_hash', 'tx_hash'),
        Index('ix_mint_records_status', 'status'),
    )
```

---

## 9. 业务流程

### 9.1 铸造流程时序图

```
用户          前端React        FastAPI后端      NFTService       Hardhat节点       PostgreSQL
 |               |                 |               |                 |                |
 |──进入资产详情页─>│                 |               |                 |                |
 |               │──GET /assets/{id}───────────────>│                 |                |
 |               │                 │               │──查询资产详情─────>│                │
 |               │                 │               │<─返回资产数据────│                │
 |               │<─返回资产详情──────────────────│                 │                │
 |<─显示资产详情──│                 │               │                 │                │
 |               │                 │               │                 │                │
 |──点击"铸造NFT"按钮──────────────>│               │                 │                │
 |               │──显示确认对话框───│               │                 │                │
 |<─确认铸造────│                 │               │                 │                │
 |               │                 │               │                 │                │
 |               │──POST /assets/{id}/mint───────>│                 │                │
 |               │                 │──查询资产（加锁）───────────────>│                │
 |               │                 │<─返回资产（验证状态=DRAFT）─────│                │
 |               │                 │               │                 │                │
 |               │                 │──上传元数据到IPFS（如需要）─────>│                │
 |               │                 │<─返回CID和URI─────────────────│                │
 |               │                 │               │                 │                │
 |               │                 │──更新资产状态为MINTING─────────>│                │
 |               │                 │               │                 │                │
 |               │                 │──调用铸造服务───────────────────>│                │
 |               │                 │               │──构建并发送铸造交易───────────────>│
 |               │                 │               │<─返回交易哈希────────────────────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新交易哈希和提交时间──────────>│
 |               │                 │               │                 │                │
 |               │                 │               │──轮询交易确认（等待收据）────────>│
 |               │                 │               │<─返回交易收据（包含Token ID）─────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新铸造成功状态───────────────>│
 |               │                 │               │                 │                │
 |               │                 │<─返回铸造结果────────────────────────────────────│
 |               │<─返回铸造成功响应（202 Accepted）─────────────────────────────────│
 |               │                 │               │                 │                │
 |<─显示铸造成功──│                 │               │                 │                │
   展示Token ID  │                 │               │                 │                │
   和交易哈希    │                 │               │                 │                │

注：前端可轮询或WebSocket接收状态更新
```

### 9.2 状态流转详细说明

```
┌─────────────────────────────────────────────────────────────────┐
│                     铸造状态机 (State Machine)                     │
└─────────────────────────────────────────────────────────────────┘

状态定义：
├── DRAFT (草稿) [初始状态]
│   └── 资产已创建，尚未开始铸造
│   └── 允许操作：编辑、删除、发起铸造
│
├── MINT_PENDING (等待铸造)
│   └── 铸造请求已提交，等待处理
│   └── 允许操作：查询状态、取消（限时）
│
├── MINTING (铸造中)
│   └── 交易已提交到区块链，等待确认
│   ├── 子状态：
│   │   ├── PREPARING (准备中) - 构建交易数据
│   │   ├── SUBMITTING (提交中) - 发送交易到节点
│   │   ├── CONFIRMING (确认中) - 等待区块确认
│   │   └── FINALIZING (完成中) - 更新数据库状态
│   └── 允许操作：查询状态、轮询进度
│
├── MINTED (已铸造) [终态]
│   └── NFT铸造成功，资产已上链
│   └── 允许操作：查看链上信息、转移NFT（未来）
│
├── MINT_FAILED (铸造失败)
│   └── NFT铸造过程中发生错误
│   ├── 失败类型：
│   │   ├── VALIDATION_FAILED (验证失败) - 前置条件不满足
│   │   ├── TRANSACTION_REJECTED (交易被拒绝) - 节点拒绝
│   │   ├── TRANSACTION_FAILED (交易执行失败) - 合约回滚
│   │   ├── CONFIRMATION_TIMEOUT (确认超时) - 长时间未确认
│   │   └── SYSTEM_ERROR (系统错误) - 内部异常
│   └── 允许操作：查看错误详情、重试（有限次数）、取消
│
└── MINT_CANCELLED (已取消)
    └── 铸造请求被主动取消
    └── 允许操作：重新发起铸造

状态流转规则：
1. DRAFT → MINT_PENDING: 用户发起铸造请求
2. MINT_PENDING → MINTING: 系统开始处理，提交交易
3. MINTING → MINTED: 交易确认成功
4. MINTING → MINT_FAILED: 交易失败或超时
5. MINT_PENDING/MINTING → MINT_CANCELLED: 用户取消（限时）
6. MINT_FAILED → MINTING: 重试铸造（自动或手动）
7. * → DRAFT: 重置（管理员操作，慎用）

状态流转约束：
- 终态（MINTED, MINT_CANCELLED）不可流转到其他状态（除非重置）
- MINT_FAILED最多允许重试3次，之后需管理员介入
- MINT_PENDING状态超过5分钟未处理自动转为MINT_FAILED
- MINTING状态超过10分钟未确认视为超时
```

### 7.3 错误处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      错误分类与处理策略                          │
└─────────────────────────────────────────────────────────────────┘

1. 前置验证错误 (400 Bad Request)
   ├── 资产状态不是DRAFT
   ├── 资产不存在或无权限
   ├── 接收地址格式无效
   ├── 元数据格式错误
   └── 处理: 立即返回错误，不进入铸造流程

2. 准备阶段错误 (500 Internal Server Error)
   ├── IPFS上传失败
   ├── 数据库更新失败
   ├──  nonce获取失败
   └── 处理: 记录错误，释放资源，返回失败状态

3. 交易提交错误 (500/502)
   ├── 节点连接失败
   ├── 交易构建失败
   ├── Gas估算失败
   ├── 交易被节点拒绝
   └── 处理: 最多重试3次，间隔2秒，仍失败则标记为FAILED

4. 确认阶段错误 (500/504)
   ├── 交易回执获取失败
   ├── 交易执行失败（合约回滚）
   ├── 确认超时（超过10分钟）
   └── 处理: 
       ├── 合约回滚: 解析revert reason，记录错误
       ├── 超时: 继续后台轮询，API返回PENDING状态
       └── 其他: 标记为FAILED，允许重试

5. 最终化处理错误 (500)
   ├── Token ID提取失败
   ├── 数据库更新失败
   ├── 事件通知失败
   └── 处理: 记录到待处理队列，管理员手动修复

重试策略:
- 自动重试: 仅在交易提交阶段，最多3次
- 手动重试: 通过API调用，任何FAILED状态都可重试（限3次）
- 重试间隔: 指数退避 1s → 2s → 4s

监控与告警:
- 铸造成功率 < 95% 触发告警
- 单笔铸造超过10分钟未结束触发告警
- 连续3次重试失败触发告警
```

---

## 8. 数据模型详细设计

### 8.1 Asset模型（扩展字段）

```python
# backend/app/models/asset.py

class Asset(Base):
    __tablename__ = "assets"
    
    # ========== 基础字段（已有） ==========
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(UUID, ForeignKey("enterprises.id"), nullable=False)
    creator_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    
    # 资产基本信息
    name = Column(String(200), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    description = Column(Text, nullable=False)
    creator_name = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    legal_status = Column(Enum(LegalStatus), nullable=False)
    application_number = Column(String(100), nullable=True)
    asset_metadata = Column(JSON, default=dict)
    
    # ========== NFT铸造扩展字段（新增） ==========
    
    # 铸造状态
    status = Column(Enum(AssetStatus), default=AssetStatus.DRAFT, nullable=False)
    
    # 铸造进度
    mint_stage = Column(String(20), nullable=True, comment="当前阶段: PREPARING/SUBMITTING/CONFIRMING/COMPLETED/FAILED")
    mint_progress = Column(Integer, default=0, comment="铸造进度百分比 0-100")
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True, comment="NFT Token ID")
    contract_address = Column(String(42), nullable=True, comment="NFT合约地址")
    chain_id = Column(Integer, nullable=True, default=31337, comment="链ID (本地节点31337)")
    network_name = Column(String(50), nullable=True, default="Hardhat Local")
    
    # 交易信息
    mint_tx_hash = Column(String(66), nullable=True, comment="铸造交易哈希")
    mint_block_number = Column(BigInteger, nullable=True, comment="铸造区块号")
    mint_block_hash = Column(String(66), nullable=True, comment="铸造区块哈希")
    mint_gas_used = Column(BigInteger, nullable=True, comment="Gas消耗")
    mint_gas_price = Column(String(30), nullable=True, comment="Gas价格 (wei)")
    mint_total_cost_eth = Column(String(30), nullable=True, comment="总成本 (ETH)")
    
    # 确认信息
    mint_confirmations = Column(Integer, default=0, comment="当前确认数")
    required_confirmations = Column(Integer, default=6, comment="所需确认数")
    confirmations_sufficient = Column(Boolean, default=False, comment="确认数是否充足")
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True, comment="NFT元数据URI")
    metadata_cid = Column(String(100), nullable=True, comment="元数据IPFS CID")
    metadata_json = Column(Text, nullable=True, comment="元数据JSON内容")
    
    # 接收者
    recipient_address = Column(String(42), nullable=True, comment="NFT接收地址")
    recipient_type = Column(String(20), nullable=True, comment="接收者类型: ENTERPRISE/USER")
    
    # 时间戳
    mint_requested_at = Column(DateTime, nullable=True, comment="铸造请求时间")
    mint_submitted_at = Column(DateTime, nullable=True, comment="交易提交时间")
    mint_confirmed_at = Column(DateTime, nullable=True, comment="交易确认时间")
    mint_completed_at = Column(DateTime, nullable=True, comment="铸造完成时间")
    last_mint_attempt_at = Column(DateTime, nullable=True, comment="上次铸造尝试时间")
    
    # 错误处理
    mint_attempt_count = Column(Integer, default=0, comment="铸造尝试次数")
    max_mint_attempts = Column(Integer, default=3, comment="最大铸造尝试次数")
    last_mint_error = Column(Text, nullable=True, comment="上次铸造错误信息")
    last_mint_error_code = Column(String(50), nullable=True, comment="上次铸造错误码")
    can_retry = Column(Boolean, default=True, comment="是否可重试")
    next_retry_at = Column(DateTime, nullable=True, comment="下次重试时间")
    
    # ========== 关系字段 ==========
    enterprise = relationship("Enterprise", back_populates="assets")
    creator = relationship("User", back_populates="created_assets")
    attachments = relationship("Attachment", back_populates="asset", cascade="all, delete-orphan")
    mint_records = relationship("MintRecord", back_populates="asset", cascade="all, delete-orphan")
    
    # ========== 索引 ==========
    __table_args__ = (
        Index('ix_assets_status', 'status'),
        Index('ix_assets_token_id', 'token_id'),
        Index('ix_assets_mint_tx_hash', 'mint_tx_hash'),
        Index('ix_assets_enterprise_status', 'enterprise_id', 'status'),
        Index('ix_assets_mint_requested', 'mint_requested_at'),
    )
```

### 8.2 新增MintRecord模型（审计日志）

```python
class MintRecord(Base):
    """铸造操作审计日志"""
    __tablename__ = "mint_records"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID, ForeignKey("assets.id"), nullable=False, index=True)
    operation = Column(String(20), nullable=False)  # REQUEST/SUBMIT/CONFIRM/RETRY/FAIL/SUCCESS
    stage = Column(String(20), nullable=True)  # PREPARING/SUBMITTING/CONFIRMING/COMPLETED
    
    # 操作者
    operator_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    operator_address = Column(String(42), nullable=True)
    
    # 链上信息
    token_id = Column(BigInteger, nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    gas_used = Column(BigInteger, nullable=True)
    
    # 状态
    status = Column(String(20), nullable=False)  # PENDING/SUCCESS/FAILED
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # 元数据
    metadata_uri = Column(String(500), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    asset = relationship("Asset", back_populates="mint_records")
    operator = relationship("User")
    
    # 索引
    __table_args__ = (
        Index('ix_mint_records_asset', 'asset_id', 'created_at'),
        Index('ix_mint_records_tx_hash', 'tx_hash'),
        Index('ix_mint_records_status', 'status'),
    )
```

---

## 9. 业务流程

### 9.1 铸造流程时序图

```
用户          前端React        FastAPI后端      NFTService       Hardhat节点       PostgreSQL
 |               |                 |               |                 |                |
 |──进入资产详情页─>│                 |               |                 |                |
 |               │──GET /assets/{id}───────────────>│                 |                |
 |               │                 │               │──查询资产详情─────>│                │
 |               │                 │               │<─返回资产数据────│                │
 |               │<─返回资产详情──────────────────│                 │                │
 |<─显示资产详情──│                 │               │                 │                │
 |               │                 │               │                 │                │
 |──点击"铸造NFT"按钮──────────────>│               │                 │                │
 |               │──显示确认对话框───│               │                 │                │
 |<─确认铸造────│                 │               │                 │                │
 |               │                 │               │                 │                │
 |               │──POST /assets/{id}/mint───────>│                 │                │
 |               │                 │──查询资产（加锁）───────────────>│                │
 |               │                 │<─返回资产（验证状态=DRAFT）─────│                │
 |               │                 │               │                 │                │
 |               │                 │──上传元数据到IPFS（如需要）─────>│                │
 |               │                 │<─返回CID和URI─────────────────│                │
 |               │                 │               │                 │                │
 |               │                 │──更新资产状态为MINTING─────────>│                │
 |               │                 │               │                 │                │
 |               │                 │──调用铸造服务───────────────────>│                │
 |               │                 │               │──构建并发送铸造交易───────────────>│
 |               │                 │               │<─返回交易哈希────────────────────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新交易哈希和提交时间──────────>│
 |               │                 │               │                 │                │
 |               │                 │               │──轮询交易确认（等待收据）────────>│
 |               │                 │               │<─返回交易收据（包含Token ID）─────│
 |               │                 │               │                 │                │
 |               │                 │               │──更新铸造成功状态───────────────>│
 |               │                 │               │                 │                │
 |               │                 │<─返回铸造结果────────────────────────────────────│
 |               │<─返回铸造成功响应（202 Accepted）─────────────────────────────────│
 |               │                 │               │                 │                │
 |<─显示铸造成功──│                 │               │                 │                │
   展示Token ID  │                 │               │                 │                │
   和交易哈希    │                 │               │                 │                │

注：前端可轮询或WebSocket接收状态更新
```

### 9.2 状态流转详细说明

```
┌─────────────────────────────────────────────────────────────────┐
│                     铸造状态机 (State Machine)                     │
└─────────────────────────────────────────────────────────────────┘

状态定义：
├── DRAFT (草稿) [初始状态]
│   └── 资产已创建，尚未开始铸造
│   └── 允许操作：编辑、删除、发起铸造
│
├── MINT_PENDING (等待铸造)
│   └── 铸造请求已提交，等待处理
│   └── 允许操作：查询状态、取消（限时）
│
├── MINTING (铸造中)
│   └── 交易已提交到区块链，等待确认
│   ├── 子状态：
│   │   ├── PREPARING (准备中) - 构建交易数据
│   │   ├── SUBMITTING (提交中) - 发送交易到节点
│   │   ├── CONFIRMING (确认中) - 等待区块确认
│   │   └── FINALIZING (完成中) - 更新数据库状态
│   └── 允许操作：查询状态、轮询进度
│
├── MINTED (已铸造) [终态]
│   └── NFT铸造成功，资产已上链
│   └── 允许操作：查看链上信息、转移NFT（未来）
│
├── MINT_FAILED (铸造失败)
│   └── NFT铸造过程中发生错误
│   ├── 失败类型：
│   │   ├── VALIDATION_FAILED (验证失败) - 前置条件不满足
│   │   ├── TRANSACTION_REJECTED (交易被拒绝) - 节点拒绝
│   │   ├── TRANSACTION_FAILED (交易执行失败) - 合约回滚
│   │   ├── CONFIRMATION_TIMEOUT (确认超时) - 长时间未确认
│   │   └── SYSTEM_ERROR (系统错误) - 内部异常
│   └── 允许操作：查看错误详情、重试（有限次数）、取消
│
└── MINT_CANCELLED (已取消)
    └── 铸造请求被主动取消
    └── 允许操作：重新发起铸造

状态流转规则：
1. DRAFT → MINT_PENDING: 用户发起铸造请求
2. MINT_PENDING → MINTING: 系统开始处理，提交交易
3. MINTING → MINTED: 交易确认成功
4. MINTING → MINT_FAILED: 交易失败或超时
5. MINT_PENDING/MINTING → MINT_CANCELLED: 用户取消（限时）
6. MINT_FAILED → MINTING: 重试铸造（自动或手动）
7. * → DRAFT: 重置（管理员操作，慎用）

状态流转约束：
- 终态（MINTED, MINT_CANCELLED）不可流转到其他状态（除非重置）
- MINT_FAILED最多允许重试3次，之后需管理员介入
- MINT_PENDING状态超过5分钟未处理自动转为MINT_FAILED
- MINTING状态超过10分钟未确认视为超时
```

### 7.3 错误处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      错误分类与处理策略                          │
└─────────────────────────────────────────────────────────────────┘

1. 前置验证错误 (400 Bad Request)
   ├── 资产状态不是DRAFT
   ├── 资产不存在或无权限
   ├── 接收地址格式无效
   ├── 元数据格式错误
   └── 处理: 立即返回错误，不进入铸造流程

2. 准备阶段错误 (500 Internal Server Error)
   ├── IPFS上传失败
   ├── 数据库更新失败
   ├──  nonce获取失败
   └── 处理: 记录错误，释放资源，返回失败状态

3. 交易提交错误 (500/502)
   ├── 节点连接失败
   ├── 交易构建失败
   ├── Gas估算失败
   ├── 交易被节点拒绝
   └── 处理: 最多重试3次，间隔2秒，仍失败则标记为FAILED

4. 确认阶段错误 (500/504)
   ├── 交易回执获取失败
   ├── 交易执行失败（合约回滚）
   ├── 确认超时（超过10分钟）
   └── 处理: 
       ├── 合约回滚: 解析revert reason，记录错误
       ├── 超时: 继续后台轮询，API返回PENDING状态
       └── 其他: 标记为FAILED，允许重试

5. 最终化处理错误 (500)
   ├── Token ID提取失败
   ├── 数据库更新失败
   ├── 事件通知失败
   └── 处理: 记录到待处理队列，管理员手动修复

重试策略:
- 自动重试: 仅在交易提交阶段，最多3次
- 手动重试: 通过API调用，任何FAILED状态都可重试（限3次）
- 重试间隔: 指数退避 1s → 2s → 4s

监控与告警:
- 铸造成功率 < 95% 触发告警
- 单笔铸造超过10分钟未结束触发告警
- 连续3次重试失败触发告警
```

---

## 10. 验收标准

### 10.1 功能验收

| 验收项 | 验收标准 | 优先级 |
|--------|----------|--------|
| 合约部署 | 成功部署到本地Hardhat节点，返回合约地址 | P0 |
| 单资产铸造 | 完成完整流程：请求→铸造→确认→状态更新 | P0 |
| 状态查询 | 实时查询铸造进度，展示各阶段状态 | P0 |
| 错误处理 | 各类错误场景正确处理，返回友好提示 | P1 |
| 前端界面 | 提供完整UI：按钮→确认→进度→结果展示 | P1 |
| 批量铸造 | 支持多资产批量铸造（可选） | P2 |
| 链上查询 | 直接查询合约获取NFT信息 | P2 |

### 10.2 性能验收

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 铸造接口响应时间 | < 3秒 | 本地节点即时出块 |
| 交易确认时间 | < 5秒 | Hardhat自动化挖矿 |
| 并发铸造支持 | ≥ 5笔/秒 | 多资产同时铸造 |
| 状态查询响应时间 | < 200ms | 频繁轮询测试 |

### 10.3 演示验收（毕设专用）

| 演示场景 | 演示步骤 | 预期效果 |
|----------|----------|----------|
| 基础铸造 | 1. 创建资产<br>2. 点击铸造<br>3. 展示结果 | 1分钟内完成，显示Token ID |
| 错误恢复 | 1. 模拟网络断开<br>2. 展示错误<br>3. 重试成功 | 错误提示清晰，重试流程顺畅 |
| 链上验证 | 1. 展示铸造结果<br>2. 查询合约<br>3. 对比数据 | 链上数据与系统一致 |
| 批量演示 | 1. 选择3-5个资产<br>2. 批量铸造<br>3. 展示结果 | 一次性完成，显示各资产Token ID |

---

## 11. 附录

### 11.1 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| NFT | Non-Fungible Token | 非同质化代币，代表唯一数字资产 |
| 铸造 | Mint | 创建新的NFT并上链 |
| 元数据 | Metadata | 描述NFT的JSON数据，包含名称、描述、图片等 |
| Token ID | Token Identifier | NFT的唯一标识符（整数） |
| 智能合约 | Smart Contract | 部署在区块链上的自动执行程序 |
| Gas | Gas | 执行交易所需的计算资源费用 |
| Hardhat | Hardhat | 以太坊开发环境和工具套件 |
| IPFS | InterPlanetary File System | 去中心化文件存储系统 |
| DRAFT | Draft | 草稿状态，资产已创建但未上链 |
| MINTED | Minted | 已铸造状态，资产已完成NFT上链 |

### 11.2 参考资料

1. ERC-721标准: https://eips.ethereum.org/EIPS/eip-721
2. Hardhat文档: https://hardhat.org/docs
3. Web3.py文档: https://web3py.readthedocs.io/
4. FastAPI文档: https://fastapi.tiangolo.com/
5. OpenZeppelin合约: https://docs.openzeppelin.com/contracts

### 11.3 开发环境配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ipasset
      POSTGRES_PASSWORD: ipasset123
      POSTGRES_DB: ipasset_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # IPFS节点
  ipfs:
    image: ipfs/kubo:latest
    ports:
      - "4001:4001"
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs

  # Redis（缓存，可选）
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  ipfs_data:
```

---

**文档结束**
