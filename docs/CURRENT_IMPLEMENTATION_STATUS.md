# 当前系统实现情况评估

**评估日期**: 2026-05-08  
**评估范围**: `frontend/`、`backend/`、`contracts/` 当前代码实现与 `docs/` 功能需求文档的对应情况。  
**说明**: 本文档只记录当前实现状态和差距，需求说明本身见 `docs/FUNCTION_DOCUMENTATION.md` 与根目录 `需求规格说明书.md`。

## 1. 总体结论

当前系统已经具备 IP-NFT 企业资产管理的核心闭环：认证、企业管理、资产登记、资产审批、NFT 铸造、IPFS 上传、合约部署、权属转移和链上浏览基础页面均有代码落地。

实现状态并不等于全部功能已经可生产使用。代码中仍存在若干占位接口、文档与实现不一致、以及商业化/ZKML 等选做模块未实现的情况。尤其是 `users` 与 `dashboard` 后端接口目前仍是 TODO 占位，不能按已完成能力对外承诺。

## 2. 模块实现状态

| 模块 | 前端实现 | 后端实现 | 合约/链上实现 | 当前状态 |
| --- | --- | --- | --- | --- |
| 用户认证与身份管理 | 已实现 | 已实现 | 不涉及直接链上操作 | 基本完成 |
| 用户资料管理 | 部分实现 | 占位 | 不涉及 | 需补齐 |
| 企业管理 | 已实现 | 已实现 | 企业钱包绑定涉及签名验证 | 基本完成 |
| IP 资产登记与附件 | 已实现 | 已实现 | IPFS/Pinata 上传 | 基本完成 |
| 资产审批工作流 | 已实现 | 已实现 | 不涉及 | 基本完成 |
| NFT 铸造 | 已实现 | 已实现 | `IPNFT.sol` 已实现 | 基本完成 |
| NFT 权属管理与转移 | 已实现 | 已实现 | `transferNFT` 已实现 | 基本完成 |
| NFT 铸造/转移历史 | 已实现 | 已实现 | 依赖链上交易与数据库记录 | 基本完成 |
| Dashboard 统计 | 前端有页面 | 后端占位 | 不涉及 | 部分完成 |
| 区块链浏览器 | 已实现基础页面 | 非主要依赖 | 读取链上事件 | 部分完成 |
| 合约部署与配置 | 已实现 | 已实现 | Hardhat 部署脚本/合约 | 基本完成 |
| IPFS 管理 | 前端/后端均有上传能力 | 已实现 | IPFS/Pinata | 基本完成 |
| 知识产权商业化 | 未实现 | 未实现 | 未实现 License/Staking 合约 | 未实现 |
| ZKML | 未实现 | 未实现 | 未实现 ZKVerifier | 未实现 |

## 3. 已实现的主要能力

### 3.1 用户认证

前端包含登录、注册、忘记密码、重置密码、邮箱验证状态与发送验证邮件逻辑。后端 `auth` 模块提供注册、登录、刷新 Token、登出、登出所有设备、绑定钱包、当前用户、密码重置和邮箱验证接口。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 已实现 |
| POST | `/api/v1/auth/login` | 已实现 |
| POST | `/api/v1/auth/refresh` | 已实现 |
| POST | `/api/v1/auth/logout` | 已实现 |
| POST | `/api/v1/auth/logout-all` | 已实现 |
| POST | `/api/v1/auth/bind-wallet` | 已实现 |
| GET | `/api/v1/auth/me` | 已实现 |
| POST | `/api/v1/auth/forgot-password` | 已实现 |
| GET | `/api/v1/auth/verify-reset-token` | 已实现 |
| POST | `/api/v1/auth/reset-password` | 已实现 |
| POST | `/api/v1/auth/send-verification` | 已实现 |
| GET | `/api/v1/auth/verify-email` | 已实现 |
| GET | `/api/v1/auth/verification-status` | 已实现 |

### 3.2 企业管理

前端有企业列表、企业详情、成员列表、邀请成员、角色更新、移除成员、企业钱包绑定等功能。后端 `enterprises` 路由和 `EnterpriseService` 已实现核心企业管理流程。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| POST | `/api/v1/enterprises` | 已实现 |
| GET | `/api/v1/enterprises` | 已实现 |
| GET | `/api/v1/enterprises/bound-wallets` | 已实现 |
| GET | `/api/v1/enterprises/{id}` | 已实现 |
| PUT | `/api/v1/enterprises/{id}` | 已实现 |
| DELETE | `/api/v1/enterprises/{id}` | 已实现 |
| GET | `/api/v1/enterprises/{id}/members` | 已实现 |
| POST | `/api/v1/enterprises/{id}/members` | 已实现 |
| PUT | `/api/v1/enterprises/{id}/members/{user_id}` | 已实现 |
| DELETE | `/api/v1/enterprises/{id}/members/{user_id}` | 已实现 |
| POST | `/api/v1/enterprises/{id}/wallet/challenge` | 已实现 |
| POST | `/api/v1/enterprises/{id}/wallet` | 已实现 |

未实现或未完整实现：邮件邀请实体、邀请链接、成员主动退出、所有权转让、公开企业申请加入、批量成员管理。

### 3.3 资产管理

前端包含资产列表、资产表单、附件上传、资产提交审批等能力。后端 `assets` 与 `asset_with_attachments` 路由提供资产创建、列表、详情、更新、删除、附件上传、附件哈希校验和提交审批。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| POST | `/api/v1/assets` | 已实现 |
| POST | `/api/v1/assets/with-attachments` | 已实现 |
| GET | `/api/v1/assets` | 已实现 |
| GET | `/api/v1/assets/{id}` | 已实现 |
| PUT | `/api/v1/assets/{id}` | 已实现 |
| DELETE | `/api/v1/assets/{id}` | 已实现 |
| POST | `/api/v1/assets/{id}/attachments` | 已实现 |
| POST | `/api/v1/assets/{id}/submit` | 已实现 |
| POST | `/api/v1/assets/{id}/attachments/verify-hash` | 已实现 |

### 3.4 审批工作流

前端包含待审批、历史审批、审批详情和处理动作。后端 `approvals` 路由支持企业创建审批、企业更新审批、资产提交审批后的处理、审批列表、审批历史、审批详情、统计和通知。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| POST | `/api/v1/approvals/enterprise-create` | 已实现 |
| POST | `/api/v1/approvals/enterprise-update` | 已实现 |
| POST | `/api/v1/approvals/{id}/process` | 已实现 |
| GET | `/api/v1/approvals/statistics` | 已实现 |
| GET | `/api/v1/approvals/pending` | 已实现 |
| GET | `/api/v1/approvals/history` | 已实现 |
| GET | `/api/v1/approvals/{id}` | 已实现 |
| GET | `/api/v1/approvals/notifications/my` | 已实现 |
| PUT | `/api/v1/approvals/notifications/{id}/read` | 已实现 |
| GET | `/api/v1/approvals/notifications/unread-count` | 已实现 |

### 3.5 NFT 铸造与合约

前端包含 NFT Dashboard、待铸造资产、铸造中心、铸造历史、合约管理等页面。后端 `nft` 模块提供单个铸造、批量铸造、Gas 预估、状态查询、重试、铸造历史等接口。合约 `contracts/contracts/IPNFT.sol` 实现 ERC-721、ERC-721 URI、ERC-721 Enumerable、ERC-2981 版税、暂停、批量铸造、元数据锁定、版税锁定和转移限制。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| POST | `/api/v1/nft/mint` | 已实现 |
| POST | `/api/v1/nft/batch-mint` | 已实现 |
| POST | `/api/v1/nft/mint/estimate` | 已实现 |
| GET | `/api/v1/nft/{asset_id}/mint/status` | 已实现 |
| POST | `/api/v1/nft/{asset_id}/mint/retry` | 已实现 |
| GET | `/api/v1/nft/mint/history` | 已实现 |

### 3.6 NFT 权属管理

当前系统已经有独立的 `ownership` 后端模块和前端权属 Dashboard。它支持按企业查询持有资产、统计、Token 详情、转移历史、转移 NFT、更新权属状态。`nft` 模块也保留了转移与历史查询入口。

主要接口包括：

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| GET | `/api/v1/ownership/{enterprise_id}/assets` | 已实现 |
| GET | `/api/v1/ownership/{enterprise_id}/stats` | 已实现 |
| GET | `/api/v1/ownership/assets/{token_id}` | 已实现 |
| GET | `/api/v1/ownership/assets/{token_id}/history` | 已实现 |
| POST | `/api/v1/ownership/transfer` | 已实现 |
| PATCH | `/api/v1/ownership/assets/{token_id}/status` | 已实现 |
| POST | `/api/v1/nft/transfer` | 已实现 |
| GET | `/api/v1/nft/{token_id}/history` | 已实现 |

### 3.7 IPFS 与合约部署

后端 `ipfs` 模块支持文件上传、JSON 上传、删除、网关 URL 查询，并保留若干兼容别名。`contracts` 模块支持合约部署、读取合约信息、更新合约地址和检查部署状态。

| 模块 | 代表接口 | 状态 |
| --- | --- | --- |
| IPFS | `/api/v1/ipfs/upload`、`/api/v1/ipfs/upload/json`、`/api/v1/ipfs/delete/{cid}` | 已实现 |
| 合约 | `/api/v1/contracts/deploy`、`/api/v1/contracts/info`、`/api/v1/contracts/update-address`、`/api/v1/contracts/status` | 已实现 |

## 4. 部分实现或文档需谨慎表述的能力

### 4.1 用户资料管理仍是占位

`backend/app/api/v1/users.py` 中 `/api/v1/users/me` 和 `PUT /api/v1/users/me` 仍返回 TODO 占位信息。因此不应在需求或功能文档中标记为完整已实现。

### 4.2 Dashboard 后端统计仍是占位

`backend/app/api/v1/dashboard.py` 当前只有 `GET /api/v1/dashboard/assets`，且返回 “to be implemented”。前端 Dashboard 页面有展示和本地服务调用，但后端统计接口不是完整实现。

### 4.3 区块链浏览器是基础实现

前端 `BlockchainExplorer` 能连接 RPC、读取区块/交易/事件和查询 Token，但不是完整区块浏览器。文档应表述为基础链上数据浏览能力。

### 4.4 文档中曾标记未实现的 NFT 转移/历史已落地

旧功能文档把 `POST /nft/transfer` 与 `GET /nft/{token_id}/history` 标记为未实现。当前代码已经通过 `OwnershipService` 实现相关能力，并且新增了 `/ownership/*` 更完整的权属接口。

## 5. 未实现能力

| 需求方向 | 当前情况 |
| --- | --- |
| 完整邮件邀请流程 | 未发现 EnterpriseInvitation 模型、邀请邮件接受/拒绝/过期闭环 |
| 成员主动退出企业 | 未发现 `/enterprises/{id}/leave` |
| 企业所有权转让 | 未发现 `/enterprises/{id}/transfer-ownership` |
| 用户主动申请加入企业 | 未发现公开企业搜索、加入申请与审批闭环 |
| 邀请审批策略 | 未发现基于 `requireApproval` 的邀请审批配置闭环 |
| 批量成员管理 | 未发现批量角色更新/批量移除接口 |
| 审计日志完善 | 未发现独立审计日志查询/导出能力 |
| 商业化许可市场 | 未发现 licensing/royalty/staking API 与合约 |
| LicenseToken.sol | 未实现 |
| StakingPool.sol | 未实现 |
| ZKML 证明生成与验证 | 未实现 |
| ZKVerifier.sol / IPZKMLOracle | 未实现 |

## 6. 建议后续处理

1. 将 `docs/FUNCTION_DOCUMENTATION.md` 维持为功能需求与范围说明，不再混入实现完成度。
2. 将本文作为实现状态快照，后续每次完成模块后单独更新本文。
3. 优先修正占位接口与文档不一致处：`users`、`dashboard`。
4. 若要继续补齐企业成员闭环，优先实现邀请模型、成员退出、所有权转让三项 P0 能力。
5. 商业化与 ZKML 属于扩展模块，建议在核心闭环稳定后另开需求文档和迭代计划。
