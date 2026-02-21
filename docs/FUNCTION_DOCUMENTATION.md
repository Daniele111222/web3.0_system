# Web3 IP-NFT 企业资产管理系统 - 功能文档

## 项目概述

本系统是一个基于区块链的 IP-NFT (非同质化代币) 企业资产管理系统，旨在将企业的知识产权资产数字化并记录在区块链上，确保资产权属的可验证性和不可篡改性。

**技术栈**：
- 前端：React 19 + TypeScript + Vite + Ant Design
- 后端：FastAPI (Python) + SQLAlchemy + PostgreSQL 
- 智能合约：Solidity + Hardhat + OpenZeppelin
- 存储：IPFS (Pinata)
- 区块链：Hardhat 本地节点 / Ethereum

---

## 一、已实现功能

### 1. 认证系统

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 用户注册 | ✅ | ✅ | 邮箱+密码注册，返回JWT令牌 |
| 用户登录 | ✅ | ✅ | 支持"记住我"功能（延长Refresh Token有效期） |
| Token刷新 | ✅ | ✅ | 令牌轮换机制（Access Token + Refresh Token） |
| 登出 | ✅ | ✅ | 撤销当前Refresh Token |
| 登出所有设备 | ✅ | ✅ | 撤销用户所有设备的令牌 |
| 密码重置 | ✅ | ✅ | 发送重置邮件 + 令牌验证 |
| 邮箱验证 | ✅ | ✅ | 发送验证邮件 + 令牌验证 |
| 获取当前用户 | ✅ | ✅ | 获取登录用户信息 |
| 钱包绑定 | ✅ | ✅ | 将ETH钱包地址绑定到用户账号 |

### 2. 用户管理

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 用户信息查看 | ✅ | ✅ | 获取用户详细信息 |
| 用户信息更新 | ✅ | ✅ | 更新用户资料 |

### 3. 企业管理

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 创建企业 | ✅ | ✅ | 创建新企业，创建者自动成为Owner |
| 企业列表 | ✅ | ✅ | 获取用户所属企业列表（分页） |
| 企业详情 | ✅ | ✅ | 获取企业详细信息+成员列表 |
| 更新企业 | ✅ | ✅ | 更新企业信息（Owner/Admin） |
| 删除企业 | ✅ | ✅ | 删除企业（仅Owner） |
| 成员列表 | ✅ | ✅ | 获取企业所有成员 |
| 邀请成员 | ✅ | ✅ | 邀请用户加入企业（指定角色） |
| 更新成员角色 | ✅ | ✅ | 更新成员角色（Owner/Admin/Member） |
| 移除成员 | ✅ | ✅ | 从企业移除成员 |
| 企业钱包绑定 | ✅ | ✅ | 绑定企业ETH钱包地址 |

### 4. 资产管理

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 创建资产草稿 | ✅ | ✅ | 创建新资产（需指定企业） |
| 资产列表 | ✅ | ✅ | 获取企业资产列表（支持筛选+分页） |
| 资产详情 | ✅ | ✅ | 获取资产详细信息 |
| 更新资产 | ✅ | ✅ | 更新资产草稿（仅DRAFT状态） |
| 删除资产 | ✅ | ✅ | 删除资产草稿（仅DRAFT状态） |
| 上传附件 | ✅ | ✅ | 为资产添加IPFS附件 |
| 提交审批 | ✅ | ✅ | 将资产提交审批 |

**资产筛选支持**：
- 资产类型（AssetType）
- 资产状态（AssetStatus）
- 法律状态（LegalStatus）
- 创作日期范围
- 关键词搜索

### 5. NFT 铸造

| 功能 | 前端 | 后端 | 智能合约 | 说明 |
|------|------|------|----------|------|
| 单个铸造 | ✅ | ✅ | ✅ | 将资产铸造为NFT |
| 批量铸造 | ✅ | ✅ | ✅ | 批量铸造多个NFT |
| 铸造状态查询 | ✅ | ✅ | - | 获取铸造进度和状态 |
| 铸造重试 | ✅ | ✅ | - | 重试失败的铸造 |
| 元数据管理 | - | ✅ | ✅ | 设置/更新NFT元数据URI |
| 版税设置 | - | ✅ | ✅ | 设置NFT版税（ERC-2981） |
| 元数据锁定 | - | ✅ | ✅ | 锁定NFT元数据（不可修改） |
| 版税锁定 | - | ✅ | ✅ | 锁定NFT版税 |
| 转账限制 | - | ✅ | ✅ | 转账时间锁+白名单 |
| 合约暂停 | - | ✅ | ✅ | 暂停合约（紧急情况） |

**铸造状态流转**：DRAFT → MINTING → MINTED / MINT_FAILED

### 6. 审批系统

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 企业创建审批 | ✅ | ✅ | 提交企业创建审批申请 |
| 企业变更审批 | ✅ | ✅ | 提交企业信息变更审批 |
| 审批列表 | ✅ | ✅ | 获取待处理审批列表 |
| 审批详情 | ✅ | ✅ | 获取审批详情+流程历史 |
| 审批处理 | ✅ | ✅ | 通过/拒绝/退回审批 |
| 审批统计 | ✅ | ✅ | 获取审批统计数据 |

### 7. 通知系统

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 通知列表 | ✅ | ✅ | 获取用户通知列表 |
| 标记已读 | ✅ | ✅ | 标记通知为已读 |
| 未读数量 | ✅ | ✅ | 获取未读通知数量 |

### 8. 区块链交互

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 合约部署 | - | ✅ | 部署NFT智能合约到Hardhat节点 |
| IPFS上传 | ✅ | ✅ | 使用Pinata上传文件到IPFS |
| 链上查询 | ✅ | ✅ | 查询NFT链上信息 |
| 区块链浏览器 | ✅ | - | 查看交易和区块信息 |

### 9. Dashboard

| 功能 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 统计数据 | ✅ | ✅ | 获取各类统计数据 |
| 仪表盘展示 | ✅ | - | 数据可视化展示 |

### 10. 系统功能

| 功能 | 说明 |
|------|------|
| CORS中间件 | 跨域资源共享配置 |
| 速率限制 | API请求频率限制 |
| 异常处理 | 统一异常处理和错误响应 |
| 健康检查 | `/health` 端点 |

---

## 二、业务模块分析

### 已完成的业务闭环

1. **用户注册登录流程**
   - 注册 → 登录 → Token管理 → 登出

2. **企业创建与管理流程**
   - 创建企业 → 邀请成员 → 成员管理 → 企业信息更新

3. **资产管理流程**
   - 创建资产 → 上传附件 → 提交审批 → 审批处理

4. **NFT铸造流程**
   - 资产准备 → 铸造NFT → 链上确认 → 状态追踪

---

## 三、待补充功能

### P0 - 高优先级（核心功能缺失）

| 序号 | 功能 | 说明 | 文档位置 |
|------|------|------|----------|
| 1 | 完整的邮件邀请流程 | 创建EnterpriseInvitation模型、发送邀请邮件、接受/拒绝邀请、过期机制 | `docs/requirements/enterprise-member-requirements.md` |
| 2 | 成员主动退出企业 | POST /enterprises/{id}/leave，Owner需先转让所有权 | `docs/requirements/enterprise-member-requirements.md` |
| 3 | 企业所有权转让 | POST /enterprises/{id}/transfer-ownership，仅Owner可操作 | `docs/requirements/enterprise-member-requirements.md` |

### P1 - 中优先级（功能增强）

| 序号 | 功能 | 说明 | 文档位置 |
|------|------|------|----------|
| 4 | 用户主动申请加入企业 | 搜索公开企业 → 提交申请 → 管理员审批 | `docs/requirements/enterprise-member-requirements.md` |
| 5 | 邀请成员时触发审批 | 根据企业requireApproval设置决定是否需要审批 | `docs/requirements/enterprise-member-requirements.md` |
| 6 | 成员权限批量管理 | 批量更新角色、批量移除成员 | `docs/requirements/enterprise-member-requirements.md` |

### P2 - 低优先级（体验优化）

| 序号 | 功能 | 说明 | 文档位置 |
|------|------|------|----------|
| 7 | 邀请链接/邀请码功能 | 创建邀请链接、设置有效期和使用次数 | `docs/requirements/enterprise-member-requirements.md` |
| 8 | 成员活跃度统计 | 登录次数、操作次数统计和展示 | `docs/requirements/enterprise-member-requirements.md` |
| 9 | 审计日志功能完善 | 记录所有重要操作、支持查询和导出 | `docs/requirements/enterprise-member-requirements.md` |

### 其他待实现功能

| 功能 | 说明 | 状态 |
|------|------|------|
| NFT转移 | POST /nft/transfer | 后端接口已定义但未实现 |
| NFT历史记录 | GET /nft/{token_id}/history | 后端接口已定义但未实现 |
| 区块链浏览器增强 | 更多链上数据展示 | 前端页面待完善 |

---

## 四、版本规划建议

### v1.0（当前版本）
- ✅ 基础功能框架搭建
- ✅ 认证系统
- ✅ 企业管理
- ✅ 资产管理
- ✅ NFT铸造核心功能
- ✅ 审批系统

### v1.1（近期 - 补齐核心闭环）
- [ ] 完成P0优先级的3个需求
- 邮件邀请流程
- 成员退出功能
- 企业所有权转让

### v1.2（中期 - 功能增强）
- [ ] 完成P1优先级的3个需求
- 主动申请加入
- 邀请审批流程
- 批量管理

### v1.3（远期 - 体验优化）
- [ ] 完成P2优先级的3个需求
- 邀请链接
- 活跃度统计
- 审计日志

---

## 五、API接口清单

### 认证模块 (`/api/v1/auth`)
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新令牌
- `POST /auth/logout` - 登出
- `POST /auth/logout-all` - 登出所有设备
- `POST /auth/bind-wallet` - 绑定钱包
- `GET /auth/me` - 获取当前用户
- `POST /auth/forgot-password` - 请求密码重置
- `GET /auth/verify-reset-token` - 验证重置令牌
- `POST /auth/reset-password` - 重置密码
- `POST /auth/send-verification` - 发送验证邮件
- `GET /auth/verify-email` - 验证邮箱
- `GET /auth/verification-status` - 获取验证状态

### 用户模块 (`/api/v1/users`)
- `GET /users/{user_id}` - 获取用户信息

### 企业模块 (`/api/v1/enterprises`)
- `POST /enterprises` - 创建企业
- `GET /enterprises` - 获取企业列表
- `GET /enterprises/{id}` - 获取企业详情
- `PUT /enterprises/{id}` - 更新企业
- `DELETE /enterprises/{id}` - 删除企业
- `GET /enterprises/{id}/members` - 获取成员列表
- `POST /enterprises/{id}/members` - 邀请成员
- `PUT /enterprises/{id}/members/{user_id}` - 更新成员角色
- `DELETE /enterprises/{id}/members/{user_id}` - 移除成员
- `POST /enterprises/{id}/wallet` - 绑定企业钱包

### 资产模块 (`/api/v1/assets`)
- `POST /assets` - 创建资产
- `GET /assets` - 获取资产列表
- `GET /assets/{id}` - 获取资产详情
- `PUT /assets/{id}` - 更新资产
- `DELETE /assets/{id}` - 删除资产
- `POST /assets/{id}/attachments` - 上传附件
- `POST /assets/{id}/submit` - 提交审批

### NFT模块 (`/api/v1/nft`)
- `POST /nft/mint` - 铸造NFT
- `POST /nft/batch-mint` - 批量铸造
- `GET /nft/{asset_id}/mint/status` - 获取铸造状态
- `POST /nft/{asset_id}/mint/retry` - 重试铸造
- `POST /nft/transfer` - 转移NFT（未实现）
- `GET /nft/{token_id}/history` - 获取NFT历史（未实现）

### 审批模块 (`/api/v1/approvals`)
- `POST /approvals/enterprise-create` - 提交企业创建审批
- `POST /approvals/enterprise-update` - 提交企业变更审批
- `POST /approvals/{id}/process` - 处理审批
- `GET /approvals/statistics` - 获取审批统计
- `GET /approvals/pending` - 获取待审批列表
- `GET /approvals/{id}` - 获取审批详情
- `GET /approvals/notifications/my` - 获取通知列表
- `PUT /approvals/notifications/{id}/read` - 标记已读
- `GET /approvals/notifications/unread-count` - 获取未读数量

### IPFS模块 (`/api/v1/ipfs`)
- `POST /ipfs/upload` - 上传文件到IPFS

### 合约模块 (`/api/v1/contracts`)
- `POST /contracts/deploy` - 部署合约

### Dashboard模块 (`/api/v1/dashboard`)
- `GET /dashboard/stats` - 获取统计数据

---

## 六、数据模型概览

### 核心实体

1. **User** - 用户
2. **Enterprise** - 企业
3. **EnterpriseMember** - 企业成员关系
4. **Asset** - IP资产
5. **Attachment** - 资产附件
6. **Approval** - 审批申请
7. **ApprovalProcess** - 审批流程记录
8. **Notification** - 通知
9. **RefreshToken** - 刷新令牌
10. **EmailVerificationToken** - 邮箱验证令牌
11. **PasswordResetToken** - 密码重置令牌

---

**文档版本**：v1.0  
**最后更新**：2026-02-20  
**维护者**：开发团队
