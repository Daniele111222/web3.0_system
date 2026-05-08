# Web3 IP-NFT 企业资产管理系统 - 功能需求文档

## 项目概述

本系统是一个基于区块链的 IP-NFT 企业资产管理系统，目标是将企业知识产权资产数字化，并通过 NFT、IPFS 与智能合约提供可验证、可追溯、不可篡改的权属管理能力。

本文档描述系统功能范围与接口需求，不记录当前代码实现完成度。当前实现评估请查看 `docs/CURRENT_IMPLEMENTATION_STATUS.md`。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React + TypeScript + Vite + Ant Design |
| 后端 | FastAPI + SQLAlchemy + PostgreSQL |
| 智能合约 | Solidity + Hardhat + OpenZeppelin |
| 存储 | IPFS / Pinata |
| 区块链 | Hardhat 本地节点 / EVM 测试网 |

## 1. 认证与身份管理

### 1.1 功能范围

系统需要支持企业用户的注册、登录、Token 刷新、登出、邮箱验证、密码重置和钱包绑定。

### 1.2 功能要求

| 功能 | 要求 |
| --- | --- |
| 用户注册 | 支持邮箱、用户名、密码注册；密码需进行强度校验 |
| 用户登录 | 支持邮箱和密码登录，返回 Access Token 与 Refresh Token |
| Token 刷新 | 支持 Refresh Token 轮换机制 |
| 登出 | 支持撤销当前 Refresh Token |
| 登出所有设备 | 支持撤销用户所有 Refresh Token |
| 邮箱验证 | 支持发送验证邮件、校验验证 Token、查询验证状态 |
| 密码重置 | 支持发送重置邮件、校验重置 Token、设置新密码 |
| 钱包绑定 | 支持连接钱包、签名挑战、后端验证签名并保存钱包地址 |
| 路由守卫 | 未登录用户访问受保护页面时跳转至登录页 |

### 1.3 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新访问令牌 |
| POST | `/api/v1/auth/logout` | 登出当前设备 |
| POST | `/api/v1/auth/logout-all` | 登出所有设备 |
| GET | `/api/v1/auth/me` | 获取当前登录用户 |
| POST | `/api/v1/auth/bind-wallet` | 绑定钱包 |
| POST | `/api/v1/auth/forgot-password` | 发起密码重置 |
| GET | `/api/v1/auth/verify-reset-token` | 校验密码重置 Token |
| POST | `/api/v1/auth/reset-password` | 重置密码 |
| POST | `/api/v1/auth/send-verification` | 发送邮箱验证邮件 |
| GET | `/api/v1/auth/verify-email` | 验证邮箱 |
| GET | `/api/v1/auth/verification-status` | 查询邮箱验证状态 |

## 2. 用户资料管理

### 2.1 功能范围

系统需要提供用户个人资料查看和更新能力。

### 2.2 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/users/me` | 获取当前用户资料 |
| PUT | `/api/v1/users/me` | 更新当前用户资料 |

## 3. 企业管理

### 3.1 功能范围

系统需要支持企业创建、企业列表、详情查看、信息更新、删除、成员管理、企业钱包绑定和企业成员权限控制。

### 3.2 功能要求

| 功能 | 要求 |
| --- | --- |
| 创建企业 | 用户可创建企业并成为 Owner |
| 企业列表 | 用户可查看自己所属企业 |
| 企业详情 | 展示企业基础信息、钱包地址和成员信息 |
| 更新企业 | Owner/Admin 可更新企业资料 |
| 删除企业 | Owner 可删除企业 |
| 成员邀请 | Owner/Admin 可邀请成员并指定角色 |
| 角色管理 | Owner/Admin 可更新成员角色 |
| 移除成员 | Owner/Admin 可移除成员，Owner 不应被直接移除 |
| 企业钱包绑定 | 支持签名挑战并绑定企业钱包地址 |

### 3.3 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/enterprises` | 创建企业 |
| GET | `/api/v1/enterprises` | 获取企业列表 |
| GET | `/api/v1/enterprises/bound-wallets` | 获取已绑定钱包企业 |
| GET | `/api/v1/enterprises/{id}` | 获取企业详情 |
| PUT | `/api/v1/enterprises/{id}` | 更新企业 |
| DELETE | `/api/v1/enterprises/{id}` | 删除企业 |
| GET | `/api/v1/enterprises/{id}/members` | 获取成员列表 |
| POST | `/api/v1/enterprises/{id}/members` | 邀请成员 |
| PUT | `/api/v1/enterprises/{id}/members/{user_id}` | 更新成员角色 |
| DELETE | `/api/v1/enterprises/{id}/members/{user_id}` | 移除成员 |
| POST | `/api/v1/enterprises/{id}/wallet/challenge` | 创建企业钱包绑定挑战 |
| POST | `/api/v1/enterprises/{id}/wallet` | 绑定企业钱包 |

## 4. IP 资产管理

### 4.1 功能范围

系统需要支持知识产权资产登记、附件上传、资产列表筛选、资产详情查看、草稿更新、草稿删除和提交审批。

### 4.2 资产字段

| 字段 | 要求 |
| --- | --- |
| 资产名称 | 必填 |
| 资产类型 | 必填，支持专利、商标、版权、商业秘密、数字作品 |
| 描述 | 必填 |
| 创作/发明人 | 必填，支持多人 |
| 创作日期 | 必填 |
| 法律状态 | 必填 |
| 申请号/注册号 | 可选 |
| 权利声明 | 可选 |
| 扩展元数据 | 可选 JSON |

### 4.3 附件要求

| 项目 | 要求 |
| --- | --- |
| 存储 | 上传至 IPFS/Pinata |
| 文件信息 | 保存文件名、类型、大小、CID |
| 哈希校验 | 支持附件哈希校验 |

### 4.4 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/assets` | 创建资产 |
| POST | `/api/v1/assets/with-attachments` | 创建资产并上传附件 |
| GET | `/api/v1/assets` | 查询资产列表 |
| GET | `/api/v1/assets/{id}` | 查询资产详情 |
| PUT | `/api/v1/assets/{id}` | 更新资产 |
| DELETE | `/api/v1/assets/{id}` | 删除资产 |
| POST | `/api/v1/assets/{id}/attachments` | 上传附件 |
| POST | `/api/v1/assets/{id}/attachments/verify-hash` | 校验附件哈希 |
| POST | `/api/v1/assets/{id}/submit` | 提交审批 |

## 5. 审批工作流

### 5.1 功能范围

系统需要支持企业创建审批、企业信息变更审批、资产提交审批、审批处理、审批历史、审批统计和审批通知。

### 5.2 审批动作

| 动作 | 说明 |
| --- | --- |
| submit | 提交审批 |
| approve | 通过 |
| reject | 拒绝 |
| return | 退回 |

### 5.3 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/approvals/enterprise-create` | 提交企业创建审批 |
| POST | `/api/v1/approvals/enterprise-update` | 提交企业变更审批 |
| POST | `/api/v1/approvals/{id}/process` | 处理审批 |
| GET | `/api/v1/approvals/statistics` | 获取审批统计 |
| GET | `/api/v1/approvals/pending` | 获取待审批列表 |
| GET | `/api/v1/approvals/history` | 获取审批历史 |
| GET | `/api/v1/approvals/{id}` | 获取审批详情 |
| GET | `/api/v1/approvals/notifications/my` | 获取我的通知 |
| PUT | `/api/v1/approvals/notifications/{id}/read` | 标记通知已读 |
| GET | `/api/v1/approvals/notifications/unread-count` | 获取未读通知数量 |

## 6. NFT 铸造

### 6.1 功能范围

系统需要支持将审批通过的 IP 资产铸造为 NFT，记录链上交易、Token ID、合约地址、元数据 URI、Gas 信息和铸造状态。

### 6.2 功能要求

| 功能 | 要求 |
| --- | --- |
| 单个铸造 | 指定资产并铸造为 NFT |
| 批量铸造 | 支持多个资产批量铸造 |
| Gas 预估 | 铸造前预估费用 |
| 状态查询 | 查询铸造进度和失败原因 |
| 重试铸造 | 对失败铸造进行重试 |
| 铸造历史 | 分页查询企业维度铸造记录 |
| 版税 | 支持 ERC-2981 版税参数 |
| 元数据 | NFT 元数据应指向 IPFS URI |

### 6.3 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/nft/mint` | 铸造 NFT |
| POST | `/api/v1/nft/batch-mint` | 批量铸造 NFT |
| POST | `/api/v1/nft/mint/estimate` | 预估铸造费用 |
| GET | `/api/v1/nft/{asset_id}/mint/status` | 获取铸造状态 |
| POST | `/api/v1/nft/{asset_id}/mint/retry` | 重试铸造 |
| GET | `/api/v1/nft/mint/history` | 获取铸造历史 |

## 7. 权属管理与溯源

### 7.1 功能范围

系统需要支持企业维度 NFT 权属资产查看、权属统计、Token 详情、转移历史、NFT 转移和权属状态更新。

### 7.2 功能要求

| 功能 | 要求 |
| --- | --- |
| 权属资产列表 | 按企业查询当前持有的 NFT/IP 资产 |
| 权属统计 | 统计 Active、Licensed、Staked、Transferred 等状态 |
| 转移历史 | 查询 NFT 的历史权属变更记录 |
| NFT 转移 | 调用合约转移并同步数据库权属记录 |
| 状态更新 | 支持权属状态的业务性更新 |

### 7.3 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/ownership/{enterprise_id}/assets` | 查询企业权属资产 |
| GET | `/api/v1/ownership/{enterprise_id}/stats` | 查询企业权属统计 |
| GET | `/api/v1/ownership/assets/{token_id}` | 查询权属资产详情 |
| GET | `/api/v1/ownership/assets/{token_id}/history` | 查询 NFT 转移历史 |
| POST | `/api/v1/ownership/transfer` | 转移 NFT |
| PATCH | `/api/v1/ownership/assets/{token_id}/status` | 更新权属状态 |
| POST | `/api/v1/nft/transfer` | NFT 转移兼容入口 |
| GET | `/api/v1/nft/{token_id}/history` | NFT 历史兼容入口 |

## 8. IPFS 管理

### 8.1 功能范围

系统需要支持文件上传、JSON 元数据上传、文件删除和网关 URL 查询。

### 8.2 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/ipfs/upload` | 上传文件到 IPFS |
| POST | `/api/v1/ipfs/upload/json` | 上传 JSON 到 IPFS |
| DELETE | `/api/v1/ipfs/delete/{cid}` | 删除/取消固定 CID |
| GET | `/api/v1/ipfs/gateway/{cid}` | 获取网关 URL |

## 9. 合约管理

### 9.1 功能范围

系统需要支持本地或测试网部署 IPNFT 合约、读取部署信息、更新合约地址和检查部署状态。

### 9.2 API 需求

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/contracts/deploy` | 部署合约 |
| GET | `/api/v1/contracts/info` | 获取合约信息 |
| POST | `/api/v1/contracts/update-address` | 更新合约地址 |
| GET | `/api/v1/contracts/status` | 检查部署状态 |

## 10. Dashboard 与链上浏览

### 10.1 Dashboard 需求

系统需要提供资产数量、NFT 铸造数量、审批数量、权属状态等核心运营指标，并支持跳转到相关业务列表。

### 10.2 区块链浏览器需求

系统需要提供基础链上数据浏览能力，包括连接 RPC、查看区块/交易信息、查询合约事件、按 Token ID 查询 NFT 信息。

## 11. 扩展模块

### 11.1 知识产权商业化

商业化模块属于扩展需求，包含许可方案、许可市场、版税收益和 NFT 质押融资。

建议接口包括：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/licensing/create` | 创建许可方案 |
| GET | `/api/v1/licensing/list` | 获取许可列表 |
| POST | `/api/v1/licensing/purchase` | 购买许可 |
| GET | `/api/v1/licensing/my-licenses` | 获取我的许可 |
| GET | `/api/v1/royalty/earnings` | 获取版税收益 |
| POST | `/api/v1/royalty/withdraw` | 提取版税 |
| POST | `/api/v1/staking/stake` | 质押 IP-NFT |
| POST | `/api/v1/staking/unstake` | 赎回 IP-NFT |
| GET | `/api/v1/staking/positions` | 获取质押仓位 |

### 11.2 ZKML

ZKML 模块属于高级扩展需求，包含链下模型推理、零知识证明生成、证明状态查询、链上验证和验证历史。

建议接口包括：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/zkml/generate-proof` | 触发证明生成 |
| GET | `/api/v1/zkml/proof-status/{task_id}` | 查询证明生成状态 |
| POST | `/api/v1/zkml/submit-proof` | 提交证明至链上 |
| GET | `/api/v1/zkml/verification-history` | 获取验证历史 |

## 12. 数据模型概览

| 实体 | 说明 |
| --- | --- |
| User | 用户 |
| RefreshToken | 刷新令牌 |
| EmailVerificationToken | 邮箱验证令牌 |
| PasswordResetToken | 密码重置令牌 |
| Enterprise | 企业 |
| EnterpriseMember | 企业成员关系 |
| Asset | IP 资产 |
| Attachment | 资产附件 |
| MintRecord | NFT 铸造记录 |
| Approval | 审批申请 |
| ApprovalProcess | 审批流程记录 |
| ApprovalNotification | 审批通知 |
| NFTTransferRecord | NFT 权属变更记录 |

详细字段定义见 `docs/DATABASE_SCHEMA.md`。

## 13. 非功能性需求

| 分类 | 要求 |
| --- | --- |
| 安全 | JWT 双令牌、密码哈希、接口鉴权、钱包签名验证、CORS 控制 |
| 性能 | 常规 API 保持低延迟；链上操作需明确等待和错误反馈 |
| 可用性 | 交互操作提供 loading 状态和友好错误提示 |
| 兼容性 | 支持现代浏览器和 MetaMask |
| 可维护性 | 前后端接口保持统一响应结构，数据库变更通过 Alembic 管理 |

---

**文档版本**: v1.1  
**最后更新**: 2026-05-08
