# 数据库表结构文档

本文档详细描述了 Web3 IP-NFT 企业资产管理系统中数据库的所有表结构、字段、枚举值及其作用。

---

## 目录

1. [用户相关表](#1-用户相关表)
2. [企业相关表](#2-企业相关表)
3. [资产相关表](#3-资产相关表)
4. [审批相关表](#4-审批相关表)
5. [认证令牌表](#5-认证令牌表)

---

## 1. 用户相关表

### 1.1 users（用户表）

用于身份验证和个人资料管理的用户模型。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 用户唯一标识符 | 用户的唯一ID，使用UUID生成 |
| email | VARCHAR(255) | 唯一, 非空, 索引 | 用户邮箱 | 用户登录账号，唯一标识 |
| hashed_password | VARCHAR(255) | 非空 | 密码哈希值 | 存储bcrypt哈希后的密码 |
| username | VARCHAR(50) | 唯一, 非空, 索引 | 用户名 | 用户显示名称，唯一标识 |
| full_name | VARCHAR(100) | 可空 | 真实姓名 | 用户的真实姓名 |
| avatar_url | VARCHAR(500) | 可空 | 头像URL | 用户头像图片地址 |
| wallet_address | VARCHAR(42) | 唯一, 索引 | 钱包地址 | 用户绑定的Web3钱包地址（以太坊格式） |
| is_active | BOOLEAN | 默认true | 是否激活 | 账户是否处于激活状态 |
| is_verified | BOOLEAN | 默认false | 是否验证 | 邮箱是否已验证 |
| is_superuser | BOOLEAN | 默认false | 是否超级管理员 | 超级管理员标识，拥有所有权限 |
| created_at | DATETIME | 非空 | 创建时间 | 账户创建时间 |
| updated_at | DATETIME | 非空 | 更新时间 | 账户信息最后更新时间 |
| last_login_at | DATETIME | 可空 | 最后登录时间 | 用户最后登录的时间 |

**索引：**
- `ix_users_email_is_active` (email, is_active) - 常用查询复合索引

---

## 2. 企业相关表

### 2.1 enterprises（企业表）

用于存储企业组织信息，支持多租户架构。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 企业唯一标识符 | 企业的唯一ID，使用UUID生成 |
| name | VARCHAR(100) | 非空, 索引 | 企业名称 | 企业名称 |
| description | TEXT | 可空 | 企业描述 | 企业详细描述信息 |
| logo_url | VARCHAR(500) | 可空 | 企业Logo URL | 企业Logo图片地址 |
| website | VARCHAR(255) | 可空 | 企业官网 | 企业官方网站地址 |
| contact_email | VARCHAR(255) | 可空 | 联系邮箱 | 企业联系邮箱 |
| address | VARCHAR(500) | 可空 | 企业地址 | 企业办公地址 |
| wallet_address | VARCHAR(42) | 唯一, 索引 | 企业钱包地址 | 企业绑定的Web3钱包地址 |
| is_active | BOOLEAN | 默认true | 企业是否激活 | 企业是否处于激活状态 |
| is_verified | BOOLEAN | 默认false | 企业是否已认证 | 企业是否通过认证审核 |
| created_at | DATETIME | 非空 | 创建时间 | 企业创建时间 |
| updated_at | DATETIME | 非空 | 更新时间 | 企业信息最后更新时间 |

**索引：**
- `ix_enterprises_name_is_active` (name, is_active)

**枚举值：**

- MemberRole（企业成员角色）
  - `owner` - 所有者，拥有最高权限
  - `admin` - 管理员，可以管理日常运营
  - `member` - 普通成员，可以参与协作
  - `viewer` - 观察者，只能查看信息

### 2.2 enterprise_members（企业成员关联表）

用于存储用户与企业的关联关系，包括成员角色和加入时间。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 成员关系唯一标识符 | 成员关系的唯一ID |
| enterprise_id | UUID | 外键, 索引 | 所属企业 ID | 关联的企业ID |
| user_id | UUID | 外键, 索引 | 用户 ID | 关联的用户ID |
| role | MemberRole | 默认member | 成员角色 | 成员在企业中的角色权限 |
| joined_at | DATETIME | 非空 | 加入时间 | 成员加入企业的时间 |

**唯一约束：**
- `ix_enterprise_members_enterprise_user` (enterprise_id, user_id) - 确保一个用户在一个企业中只能有一个成员记录

---

## 3. 资产相关表

### 3.1 assets（资产表）

用于存储知识产权资产的详细信息，包括元数据、附件和NFT信息。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 资产唯一标识符 | 资产的唯一ID |
| enterprise_id | UUID | 外键, 索引 | 所属企业 ID | 资产所属的企业 |
| creator_user_id | UUID | 外键, 索引 | 创建者用户 ID | 资产创建者 |
| name | VARCHAR(200) | 非空, 索引 | 资产名称 | 知识产权资产名称 |
| type | AssetType | 非空, 索引 | 资产类型 | 资产的知识产权类型 |
| description | TEXT | 非空 | 资产描述 | 资产的详细描述 |
| creator_name | VARCHAR(100) | 非空 | 创作人姓名 | 原创作者姓名 |
| creation_date | DATE | 非空 | 创作日期 | 作品创作日期 |
| legal_status | LegalStatus | 非空, 索引 | 法律状态 | 资产的法律状态 |
| application_number | VARCHAR(100) | 索引 | 申请号/注册号 | 专利申请号或商标注册号 |
| asset_metadata | JSON | 非空 | 资产元数据（JSON格式） | 扩展元数据信息 |
| status | AssetStatus | 默认DRAFT, 索引 | 资产状态 | 资产在系统中的状态 |
| nft_token_id | VARCHAR(100) | 索引 | NFT Token ID | 铸造后的NFT代币ID |
| nft_contract_address | VARCHAR(42) | 索引 | NFT 合约地址 | NFT所属的合约地址 |
| nft_chain | VARCHAR(50) | 可空 | NFT所在区块链 | NFT所在的区块链网络 |
| metadata_uri | VARCHAR(500) | 可空 | NFT元数据URI（IPFS） | NFT元数据的IPFS存储地址 |
| mint_tx_hash | VARCHAR(66) | 索引 | 铸造交易哈希 | 铸造交易的区块链哈希 |
| metadata_cid | VARCHAR(100) | 可空 | 元数据IPFS CID | 元数据在IPFS上的内容标识符 |
| mint_stage | VARCHAR(20) | 可空 | 铸造阶段 | 当前铸造阶段 |
| mint_progress | INTEGER | 可空 | 铸造进度百分比0-100 | 铸造进度百分比 |
| mint_block_number | INTEGER | 可空 | 铸造区块号 | 铸造交易所在的区块号 |
| mint_gas_used | INTEGER | 可空 | Gas消耗 | 铸造消耗的Gas量 |
| mint_gas_price | VARCHAR(30) | 可空 | Gas价格(wei) | 铸造时的Gas价格 |
| mint_total_cost_eth | VARCHAR(30) | 可空 | 总成本(ETH) | 铸造总成本（ETH） |
| mint_confirmations | INTEGER | 默认0 | 当前确认数 | 区块链确认数 |
| required_confirmations | INTEGER | 默认6 | 所需确认数 | 确认所需的区块数 |
| recipient_address | VARCHAR(42) | 可空 | NFT接收地址 | NFT接收者的钱包地址 |
| mint_requested_at | DATETIME | 可空 | 铸造请求时间 | 用户请求铸造的时间 |
| mint_submitted_at | DATETIME | 可空 | 交易提交时间 | 交易提交到区块链的时间 |
| mint_confirmed_at | DATETIME | 可空 | 交易确认时间 | 交易被确认的时间 |
| mint_completed_at | DATETIME | 可空 | 铸造完成时间 | 铸造完全完成的时间 |
| last_mint_attempt_at | DATETIME | 可空 | 上次铸造尝试时间 | 上一次尝试铸造的时间 |
| mint_attempt_count | INTEGER | 默认0 | 铸造尝试次数 | 已尝试铸造的次数 |
| max_mint_attempts | INTEGER | 默认3 | 最大铸造尝试次数 | 允许的最大尝试次数 |
| last_mint_error | TEXT | 可空 | 上次铸造错误信息 | 最后一次铸造失败的错误信息 |
| last_mint_error_code | VARCHAR(50) | 可空 | 上次铸造错误码 | 最后一次铸造失败的错误代码 |
| can_retry | BOOLEAN | 默认true | 是否可重试 | 是否允许重新尝试铸造 |
| created_at | DATETIME | 非空 | 创建时间 | 资产创建时间 |
| updated_at | DATETIME | 非空 | 更新时间 | 资产信息最后更新时间 |

**索引：**
- `ix_assets_enterprise_status` (enterprise_id, status)
- `ix_assets_type_status` (type, status)
- `ix_assets_created_at` (created_at)

**枚举值：**

- AssetType（资产类型）
  - `PATENT` - 专利
  - `TRADEMARK` - 商标
  - `COPYRIGHT` - 版权
  - `TRADE_SECRET` - 商业秘密
  - `DIGITAL_WORK` - 数字作品

- LegalStatus（法律状态）
  - `PENDING` - 待审批
  - `GRANTED` - 已授权
  - `EXPIRED` - 已过期

- AssetStatus（资产状态）
  - `DRAFT` - 草稿（未铸造）
  - `PENDING` - 待审批
  - `MINTING` - 铸造中
  - `MINTED` - 已铸造为NFT
  - `REJECTED` - 已拒绝
  - `TRANSFERRED` - 已转移
  - `LICENSED` - 已授权
  - `STAKED` - 已质押
  - `MINT_FAILED` - 铸造失败

### 3.2 attachments（资产附件表）

用于存储资产相关的文件附件信息，文件实际存储在IPFS上。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 附件唯一标识符 | 附件的唯一ID |
| asset_id | UUID | 外键, 索引 | 所属资产 ID | 附件所属的资产ID |
| file_name | VARCHAR(255) | 非空 | 文件名 | 原始文件名 |
| file_type | VARCHAR(100) | 非空 | 文件类型（MIME type） | 文件的MIME类型 |
| file_size | BIGINT | 非空 | 文件大小（字节） | 文件大小（字节） |
| ipfs_cid | VARCHAR(100) | 唯一, 索引 | IPFS内容标识符（CID） | 文件在IPFS上的内容标识符 |
| uploaded_at | DATETIME | 非空 | 上传时间 | 附件上传时间 |

**索引：**
- `ix_attachments_asset_uploaded` (asset_id, uploaded_at)

### 3.3 mint_records（铸造记录表）

铸造操作审计日志，记录NFT铸造的每一次操作。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 铸造记录唯一标识符 | 铸造记录的唯一ID |
| asset_id | UUID | 外键, 索引 | 关联资产ID | 关联的资产ID |
| operation | VARCHAR(20) | 非空 | 操作类型 | 铸造操作的类型 |
| stage | VARCHAR(20) | 可空 | 当前阶段 | 铸造的当前阶段 |
| operator_id | UUID | 外键, 可空 | 操作者用户ID | 执行操作的用户ID |
| operator_address | VARCHAR(42) | 可空 | 操作者钱包地址 | 执行操作的钱包地址 |
| token_id | INTEGER | 可空 | NFT Token ID | 铸造的NFT代币ID |
| tx_hash | VARCHAR(66) | 索引 | 交易哈希 | 区块链交易哈希 |
| block_number | INTEGER | 可空 | 区块号 | 交易所在区块号 |
| gas_used | INTEGER | 可空 | Gas消耗 | 交易消耗的Gas |
| status | VARCHAR(20) | 默认PENDING | 状态 | 铸造操作的状态 |
| error_code | VARCHAR(50) | 可空 | 错误码 | 错误代码 |
| error_message | TEXT | 可空 | 错误信息 | 错误详细信息 |
| metadata_uri | VARCHAR(500) | 可空 | NFT元数据URI | NFT元数据地址 |
| created_at | DATETIME | 非空 | 创建时间 | 记录创建时间 |
| updated_at | DATETIME | 非空 | 更新时间 | 记录更新时间 |
| completed_at | DATETIME | 可空 | 完成时间 | 操作完成时间 |

**枚举值：**
- operation（操作类型）
  - `REQUEST` - 请求铸造
  - `SUBMIT` - 提交交易
  - `CONFIRM` - 确认交易
  - `RETRY` - 重试
  - `FAIL` - 失败
  - `SUCCESS` - 成功

- status（状态）
  - `PENDING` - 待处理
  - `SUCCESS` - 成功
  - `FAILED` - 失败

**索引：**
- `ix_mint_records_asset_created` (asset_id, created_at)
- `ix_mint_records_tx_hash` (tx_hash)
- `ix_mint_records_status` (status)

---

## 4. 审批相关表

### 4.1 approvals（审批记录表）

用于存储企业和成员的审批申请记录。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 审批唯一标识符 | 审批记录的唯一ID |
| type | ApprovalType | 非空, 索引 | 审批类型 | 审批申请的类型 |
| target_id | UUID | 索引 | 目标对象ID | 企业ID或成员关系ID |
| target_type | VARCHAR(32) | 非空 | 目标类型 | 目标对象类型：enterprise/member |
| applicant_id | UUID | 外键, 索引 | 申请人用户ID | 提交申请的用户ID |
| status | ApprovalStatus | 默认PENDING, 索引 | 审批状态 | 当前审批状态 |
| current_step | INTEGER | 默认1 | 当前步骤序号 | 审批流程的当前步骤 |
| total_steps | INTEGER | 默认1 | 总步骤数 | 审批流程的总步骤数 |
| remarks | TEXT | 可空 | 申请备注/理由 | 申请备注或理由 |
| attachments | JSON | 可空 | 附件列表（JSON格式） | 申请附件列表 |
| changes | JSON | 可空 | 变更内容（JSON格式） | 变更前后的值 |
| asset_id | UUID | 外键, 索引 | 关联资产ID | 关联的资产ID（用于资产审批） |
| created_at | DATETIME | 非空 | 创建时间 | 申请创建时间 |
| updated_at | DATETIME | 非空 | 更新时间 | 审批更新时间 |
| completed_at | DATETIME | 可空 | 审批完成时间 | 审批完成的时间 |

**枚举值：**

- ApprovalType（审批类型）
  - `enterprise_create` - 企业创建
  - `enterprise_update` - 企业信息变更
  - `member_join` - 成员加入
  - `asset_submit` - 资产提交审批

- ApprovalStatus（审批状态）
  - `pending` - 待审批
  - `approved` - 已通过
  - `rejected` - 已拒绝
  - `returned` - 已退回

### 4.2 approval_processes（审批流程记录表）

用于存储审批流程中的每一步操作记录。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 流程记录唯一标识符 | 流程记录的唯一ID |
| approval_id | UUID | 外键, 索引 | 关联审批ID | 关联的审批ID |
| step | INTEGER | 非空 | 步骤序号 | 流程步骤序号 |
| action | ApprovalAction | 非空 | 操作类型 | 审批操作类型 |
| operator_id | UUID | 外键, 索引 | 操作人用户ID | 执行操作的用户ID |
| operator_role | VARCHAR(32) | 可空 | 操作人角色 | 操作人的角色 |
| comment | TEXT | 可空 | 审批意见 | 审批意见或评论 |
| attachments | JSON | 可空 | 附件列表（JSON格式） | 操作附件 |
| created_at | DATETIME | 非空 | 操作时间 | 操作发生的时间 |

**枚举值：**

- ApprovalAction（审批操作类型）
  - `submit` - 提交申请
  - `approve` - 通过
  - `reject` - 拒绝
  - `return` - 退回
  - `transfer` - 转交

**索引：**
- `ix_approval_processes_approval_id` (approval_id)
- `ix_approval_processes_operator_id` (operator_id)
- `ix_approval_processes_created_at` (created_at)
- `ix_approval_processes_step` (approval_id, step)

### 4.3 approval_notifications（审批通知表）

用于存储审批相关的通知记录。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 通知唯一标识符 | 通知的唯一ID |
| type | VARCHAR(32) | 非空 | 通知类型 | 通知的类型 |
| recipient_id | UUID | 外键, 索引 | 接收人用户ID | 通知接收者ID |
| approval_id | UUID | 外键, 索引 | 关联审批ID | 关联的审批ID |
| title | VARCHAR(255) | 非空 | 通知标题 | 通知标题 |
| content | TEXT | 可空 | 通知内容 | 通知详细内容 |
| is_read | BOOLEAN | 默认false | 是否已读 | 通知是否已被阅读 |
| read_at | DATETIME | 可空 | 阅读时间 | 通知被阅读的时间 |
| created_at | DATETIME | 非空 | 创建时间 | 通知创建时间 |

**枚举值：**

- type（通知类型）
  - `approval_request` - 审批请求
  - `approval_result` - 审批结果
  - `approval_reminder` - 审批提醒

**索引：**
- `ix_approval_notifications_recipient_id` (recipient_id)
- `ix_approval_notifications_approval_id` (approval_id)
- `ix_approval_notifications_is_read` (is_read)
- `ix_approval_notifications_created_at` (created_at)
- `ix_approval_notifications_recipient_read` (recipient_id, is_read)

---

## 5. 认证令牌表

### 5.1 refresh_tokens（刷新令牌表）

用于令牌轮换和撤销的刷新令牌，实现JWT Token自动续期。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 令牌唯一标识符 | 刷新令牌的唯一ID |
| token_hash | VARCHAR(64) | 唯一, 索引 | 令牌哈希值 | 令牌SHA-256哈希值 |
| user_id | UUID | 外键, 索引 | 用户ID | 关联的用户ID |
| device_info | VARCHAR(255) | 可空 | 设备信息 | 登录设备信息 |
| ip_address | VARCHAR(45) | 可空 | IP地址 | 登录IP地址 |
| is_revoked | BOOLEAN | 默认false | 是否撤销 | 令牌是否已被撤销 |
| created_at | DATETIME | 非空 | 创建时间 | 令牌创建时间 |
| expires_at | DATETIME | 非空 | 过期时间 | 令牌过期时间 |
| revoked_at | DATETIME | 可空 | 撤销时间 | 令牌被撤销的时间 |

**索引：**
- `ix_refresh_tokens_user_id_is_revoked` (user_id, is_revoked)
- `ix_refresh_tokens_expires_at` (expires_at)

### 5.2 email_verification_tokens（邮箱验证令牌表）

用于安全邮箱验证流程的令牌。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 令牌唯一标识符 | 验证令牌的唯一ID |
| token_hash | VARCHAR(64) | 唯一, 索引 | SHA-256哈希后的令牌值 | 令牌哈希值 |
| user_id | UUID | 外键, 索引 | 需要验证邮箱的用户ID | 关联的用户ID |
| is_used | BOOLEAN | 默认false | 标记令牌是否已被使用 | 令牌使用状态 |
| created_at | DATETIME | 非空 | 令牌创建时间 | 令牌创建时间 |
| expires_at | DATETIME | 非空 | 令牌过期时间（默认24小时） | 令牌过期时间 |
| used_at | DATETIME | 可空 | 令牌使用时间 | 令牌被使用的时间 |

**索引：**
- `ix_email_verification_tokens_user_is_used` (user_id, is_used)
- `ix_email_verification_tokens_expires_at` (expires_at)

### 5.3 password_reset_tokens（密码重置令牌表）

用于安全密码重置流程的令牌。

| 字段名 | 数据类型 | 约束 | 中文注释 | 作用说明 |
|--------|----------|------|----------|----------|
| id | UUID | 主键 | 令牌唯一标识符 | 重置令牌的唯一ID |
| token_hash | VARCHAR(64) | 唯一, 索引 | SHA-256哈希后的令牌值 | 令牌哈希值 |
| user_id | UUID | 外键, 索引 | 请求密码重置的用户ID | 关联的用户ID |
| is_used | BOOLEAN | 默认false | 标记令牌是否已被使用 | 令牌使用状态 |
| created_at | DATETIME | 非空 | 令牌创建时间 | 令牌创建时间 |
| expires_at | DATETIME | 非空 | 令牌过期时间（默认30分钟） | 令牌过期时间 |
| used_at | DATETIME | 可空 | 令牌使用时间 | 令牌被使用的时间 |

**索引：**
- `ix_password_reset_tokens_user_is_used` (user_id, is_used)
- `ix_password_reset_tokens_expires_at` (expires_at)

---

## 表关系图

```
users
├── refresh_tokens (1:N)
├── password_reset_tokens (1:N)
├── email_verification_tokens (1:N)
├── enterprise_members (1:N)
│   └── enterprises
│       └── assets (1:N)
│           ├── attachments (1:N)
│           └── mint_records (1:N)
├── created_assets (1:N)
├── submitted_approvals (1:N)
├── approval_processes (1:N)
└── approval_notifications (1:N)

approvals (1:N)
├── approval_processes (1:N)
└── approval_notifications (1:N)
```

---

## 数据库技术栈

- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy 2.0 (async)
- **主键类型**: UUID
- **时间戳**: 带时区的 DATETIME (timezone=True)

---

*最后更新: 2026-02-20*
