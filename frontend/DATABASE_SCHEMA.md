# 数据库表结构文档

本文档描述了 Web3 IP-NFT 企业资产管理系统的数据库表结构。

## 表清单

系统共包含 **9 张表**：

1. [users](#1-users) - 用户表
2. [ip_nfts](#2-ip_nfts) - IP-NFT 资产表
3. [transactions](#3-transactions) - 交易记录表
4. [licenses](#4-licenses) - 许可证表
5. [valuations](#5-valuations) - 资产估值表
6. [notifications](#6-notifications) - 通知表
7. [audit_logs](#7-audit_logs) - 审计日志表
8. [user_favorites](#8-user_favorites) - 用户收藏表
9. [ip_nft_categories](#9-ip_nft_categories) - IP-NFT 分类表

---

## 详细字段说明

### 1. users

用户表，存储系统用户信息。

| 字段名          | 类型         | 约束             | 默认值 | 说明               |
| --------------- | ------------ | ---------------- | ------ | ------------------ |
| id              | UUID         | PK               | auto   | 主键，用户唯一标识 |
| email           | VARCHAR(255) | UNIQUE, NOT NULL | -      | 用户邮箱，用于登录 |
| username        | VARCHAR(100) | UNIQUE, NOT NULL | -      | 用户名             |
| hashed_password | VARCHAR(255) | NOT NULL         | -      | 加密后的密码       |
| is_active       | BOOLEAN      | NOT NULL         | true   | 账户是否激活       |
| is_superuser    | BOOLEAN      | NOT NULL         | false  | 是否超级管理员     |
| wallet_address  | VARCHAR(42)  | -                | NULL   | Web3 钱包地址      |
| avatar_url      | VARCHAR(500) | -                | NULL   | 头像URL            |
| created_at      | TIMESTAMP    | NOT NULL         | now    | 创建时间           |
| updated_at      | TIMESTAMP    | NOT NULL         | now    | 更新时间           |
| last_login_at   | TIMESTAMP    | -                | NULL   | 最后登录时间       |

**索引**：

- email (唯一索引)
- username (唯一索引)
- wallet_address (普通索引)
- created_at (普通索引)

---

### 2. ip_nfts

IP-NFT 资产表，存储知识产权 NFT 资产信息。

| 字段名            | 类型            | 约束             | 默认值 | 说明                                                |
| ----------------- | --------------- | ---------------- | ------ | --------------------------------------------------- |
| id                | UUID            | PK               | auto   | 主键，资产唯一标识                                  |
| token_id          | BIGINT          | UNIQUE, NOT NULL | -      | 链上 NFT Token ID                                   |
| name              | VARCHAR(255)    | NOT NULL         | -      | IP-NFT 名称                                         |
| description       | TEXT            | -                | NULL   | 详细描述                                            |
| ip_type           | VARCHAR(50)     | NOT NULL         | -      | IP 类型：patent, copyright, trademark, trade_secret |
| category_id       | UUID            | FK               | NULL   | 所属分类ID                                          |
| owner_id          | UUID            | FK, NOT NULL     | -      | 当前所有者用户ID                                    |
| creator_id        | UUID            | FK, NOT NULL     | -      | 创建者用户ID                                        |
| metadata_uri      | VARCHAR(500)    | NOT NULL         | -      | 元数据 URI (IPFS)                                   |
| document_uri      | VARCHAR(500)    | -                | NULL   | 法律文档 URI                                        |
| image_url         | VARCHAR(500)    | -                | NULL   | 封面图片 URL                                        |
| status            | VARCHAR(20)     | NOT NULL         | active | 状态：active, inactive, pending, revoked            |
| price             | DECIMAL(28, 18) | -                | NULL   | 当前定价（ETH）                                     |
| is_fractionalized | BOOLEAN         | NOT NULL         | false  | 是否已碎片化                                        |
| fraction_count    | INTEGER         | -                | NULL   | 碎片化份数                                          |
| created_at        | TIMESTAMP       | NOT NULL         | now    | 创建时间                                            |
| updated_at        | TIMESTAMP       | NOT NULL         | now    | 更新时间                                            |
| minted_at         | TIMESTAMP       | -                | NULL   | 铸造时间                                            |
| verified_at       | TIMESTAMP       | -                | NULL   | 验证通过时间                                        |

**外键关系**：

- `category_id` → ip_nft_categories(id)
- `owner_id` → users(id)
- `creator_id` → users(id)

**索引**：

- token_id (唯一索引)
- status (普通索引)
- ip_type (普通索引)
- owner_id (普通索引)
- created_at (普通索引)
- price (普通索引，用于范围查询)

---

### 3. transactions

交易记录表，存储链上交易和资产流转记录。

| 字段名        | 类型            | 约束             | 默认值  | 说明                                                          |
| ------------- | --------------- | ---------------- | ------- | ------------------------------------------------------------- |
| id            | UUID            | PK               | auto    | 主键，交易唯一标识                                            |
| tx_hash       | VARCHAR(66)     | UNIQUE, NOT NULL | -       | 区块链交易哈希                                                |
| tx_type       | VARCHAR(20)     | NOT NULL         | -       | 交易类型：mint, transfer, sale, fractionalize, merge, license |
| status        | VARCHAR(20)     | NOT NULL         | pending | 交易状态：pending, success, failed, cancelled                 |
| ip_nft_id     | UUID            | FK, NOT NULL     | -       | 关联的 IP-NFT ID                                              |
| from_address  | VARCHAR(42)     | -                | NULL    | 转出方地址                                                    |
| to_address    | VARCHAR(42)     | NOT NULL         | -       | 转入方地址                                                    |
| from_user_id  | UUID            | FK               | NULL    | 转出方用户ID                                                  |
| to_user_id    | UUID            | FK, NOT NULL     | -       | 转入方用户ID                                                  |
| price         | DECIMAL(28, 18) | -                | NULL    | 交易价格（ETH）                                               |
| platform_fee  | DECIMAL(28, 18) | -                | NULL    | 平台手续费（ETH）                                             |
| royalty_fee   | DECIMAL(28, 18) | -                | NULL    | 版税（ETH）                                                   |
| gas_fee       | DECIMAL(28, 18) | -                | NULL    | Gas费用（ETH）                                                |
| block_number  | BIGINT          | -                | NULL    | 区块号                                                        |
| confirmed_at  | TIMESTAMP       | -                | NULL    | 确认时间                                                      |
| metadata      | JSONB           | -                | NULL    | 额外元数据                                                    |
| retry_count   | INTEGER         | NOT NULL         | 0       | 重试次数                                                      |
| error_message | TEXT            | -                | NULL    | 错误信息                                                      |
| created_at    | TIMESTAMP       | NOT NULL         | now     | 创建时间                                                      |
| updated_at    | TIMESTAMP       | NOT NULL         | now     | 更新时间                                                      |

**外键关系**：

- `ip_nft_id` → ip_nfts(id)
- `from_user_id` → users(id)
- `to_user_id` → users(id)

**索引**：

- tx_hash (唯一索引)
- status (普通索引)
- tx_type (普通索引)
- ip_nft_id (普通索引)
- from_address (普通索引)
- to_address (普通索引)
- created_at (普通索引)

---

### 4. licenses

许可证表，存储 IP-NFT 的许可授权信息。

| 字段名                 | 类型            | 约束             | 默认值  | 说明                                       |
| ---------------------- | --------------- | ---------------- | ------- | ------------------------------------------ |
| id                     | UUID            | PK               | auto    | 主键，许可证唯一标识                       |
| license_number         | VARCHAR(100)    | UNIQUE, NOT NULL | -       | 许可证编号                                 |
| ip_nft_id              | UUID            | FK, NOT NULL     | -       | 关联的 IP-NFT ID                           |
| licensor_id            | UUID            | FK, NOT NULL     | -       | 授权方用户ID                               |
| licensee_id            | UUID            | FK, NOT NULL     | -       | 被授权方用户ID                             |
| license_type           | VARCHAR(50)     | NOT NULL         | -       | 许可类型：exclusive, non_exclusive, sole   |
| scope                  | VARCHAR(50)     | NOT NULL         | -       | 授权范围：worldwide, regional, limited     |
| field_of_use           | VARCHAR(255)    | -                | NULL    | 使用领域限制                               |
| royalty_rate           | DECIMAL(5, 4)   | -                | NULL    | 版税率（例如 0.05 = 5%）                   |
| upfront_fee            | DECIMAL(28, 18) | -                | NULL    | 预付费（ETH）                              |
| minimum_royalty        | DECIMAL(28, 18) | -                | NULL    | 最低版税（ETH）                            |
| status                 | VARCHAR(20)     | NOT NULL         | pending | 状态：pending, active, expired, terminated |
| start_date             | TIMESTAMP       | NOT NULL         | -       | 开始日期                                   |
| end_date               | TIMESTAMP       | -                | NULL    | 结束日期（NULL表示永久）                   |
| termination_conditions | TEXT            | -                | NULL    | 终止条件说明                               |
| is_sublicensable       | BOOLEAN         | NOT NULL         | false   | 是否允许转授权                             |
| sublicense_terms       | TEXT            | -                | NULL    | 转授权条款                                 |
| ipfs_document_uri      | VARCHAR(500)    | -                | NULL    | 法律文档IPFS地址                           |
| tx_hash                | VARCHAR(66)     | -                | NULL    | 上链交易哈希                               |
| created_at             | TIMESTAMP       | NOT NULL         | now     | 创建时间                                   |
| updated_at             | TIMESTAMP       | NOT NULL         | now     | 更新时间                                   |
| approved_at            | TIMESTAMP       | -                | NULL    | 批准时间                                   |
| terminated_at          | TIMESTAMP       | -                | NULL    | 终止时间                                   |

**外键关系**：

- `ip_nft_id` → ip_nfts(id)
- `licensor_id` → users(id)
- `licensee_id` → users(id)

**索引**：

- license_number (唯一索引)
- status (普通索引)
- ip_nft_id (普通索引)
- licensor_id (普通索引)
- licensee_id (普通索引)
- start_date (普通索引)
- end_date (普通索引)

---

### 5. valuations

资产估值表，存储 IP-NFT 的估值历史记录。

| 字段名            | 类型            | 约束         | 默认值 | 说明                                   |
| ----------------- | --------------- | ------------ | ------ | -------------------------------------- |
| id                | UUID            | PK           | auto   | 主键，估值记录唯一标识                 |
| ip_nft_id         | UUID            | FK, NOT NULL | -      | 关联的 IP-NFT ID                       |
| valuation_type    | VARCHAR(50)     | NOT NULL     | -      | 估值类型：market, income, cost, hybrid |
| valuation_method  | VARCHAR(100)    | -            | NULL   | 具体估值方法                           |
| estimated_value   | DECIMAL(28, 18) | NOT NULL     | -      | 估值金额（ETH）                        |
| value_range_min   | DECIMAL(28, 18) | -            | NULL   | 估值范围下限                           |
| value_range_max   | DECIMAL(28, 18) | -            | NULL   | 估值范围上限                           |
| confidence_score  | DECIMAL(3, 2)   | -            | NULL   | 置信度（0-1）                          |
| currency          | VARCHAR(10)     | NOT NULL     | ETH    | 计价货币                               |
| appraiser_id      | UUID            | FK           | NULL   | 评估人用户ID                           |
| appraisal_date    | TIMESTAMP       | NOT NULL     | -      | 评估日期                               |
| expiry_date       | TIMESTAMP       | -            | NULL   | 有效期至                               |
| market_conditions | TEXT            | -            | NULL   | 市场条件说明                           |
| comparable_sales  | JSONB           | -            | NULL   | 可比交易数据                           |
| risk_factors      | JSONB           | -            | NULL   | 风险因素分析                           |
| methodology_notes | TEXT            | -            | NULL   | 方法论说明                             |
| assumptions       | TEXT            | -            | NULL   | 估值假设条件                           |
| status            | VARCHAR(20)     | NOT NULL     | active | 状态：active, expired, superseded      |
| is_verified       | BOOLEAN         | NOT NULL     | false  | 是否已验证                             |
| verified_by       | UUID            | FK           | NULL   | 验证人用户ID                           |
| verified_at       | TIMESTAMP       | -            | NULL   | 验证时间                               |
| document_uri      | VARCHAR(500)    | -            | NULL   | 估值报告文档URI                        |
| tx_hash           | VARCHAR(66)     | -            | NULL   | 上链交易哈希                           |
| created_at        | TIMESTAMP       | NOT NULL     | now    | 创建时间                               |
| updated_at        | TIMESTAMP       | NOT NULL     | now    | 更新时间                               |

**外键关系**：

- `ip_nft_id` → ip_nfts(id)
- `appraiser_id` → users(id)
- `verified_by` → users(id)

**索引**：

- ip_nft_id (普通索引)
- valuation_type (普通索引)
- appraisal_date (普通索引)
- status (普通索引)
- estimated_value (普通索引)

---

### 6. notifications

通知表，存储用户通知消息。

| 字段名              | 类型         | 约束         | 默认值 | 说明                                                |
| ------------------- | ------------ | ------------ | ------ | --------------------------------------------------- |
| id                  | UUID         | PK           | auto   | 主键，通知唯一标识                                  |
| user_id             | UUID         | FK, NOT NULL | -      | 接收用户ID                                          |
| notification_type   | VARCHAR(50)  | NOT NULL     | -      | 通知类型：transaction, license, system, price_alert |
| title               | VARCHAR(255) | NOT NULL     | -      | 通知标题                                            |
| content             | TEXT         | NOT NULL     | -      | 通知内容                                            |
| priority            | VARCHAR(20)  | NOT NULL     | medium | 优先级：low, medium, high, urgent                   |
| related_entity_type | VARCHAR(50)  | -            | NULL   | 关联实体类型                                        |
| related_entity_id   | UUID         | -            | NULL   | 关联实体ID                                          |
| link_url            | VARCHAR(500) | -            | NULL   | 链接地址                                            |
| is_read             | BOOLEAN      | NOT NULL     | false  | 是否已读                                            |
| read_at             | TIMESTAMP    | -            | NULL   | 阅读时间                                            |
| image_url           | VARCHAR(500) | -            | NULL   | 图片URL                                             |
| metadata            | JSONB        | -            | NULL   | 额外元数据                                          |
| expires_at          | TIMESTAMP    | -            | NULL   | 过期时间                                            |
| created_at          | TIMESTAMP    | NOT NULL     | now    | 创建时间                                            |
| updated_at          | TIMESTAMP    | NOT NULL     | now    | 更新时间                                            |

**外键关系**：

- `user_id` → users(id)

**索引**：

- user_id (普通索引)
- notification_type (普通索引)
- is_read (普通索引)
- created_at (普通索引)
- (user_id, is_read) 复合索引

---

### 7. audit_logs

审计日志表，存储系统操作审计记录。

| 字段名        | 类型         | 约束     | 默认值 | 说明                                                      |
| ------------- | ------------ | -------- | ------ | --------------------------------------------------------- |
| id            | UUID         | PK       | auto   | 主键，日志唯一标识                                        |
| user_id       | UUID         | FK       | NULL   | 操作用户ID                                                |
| action        | VARCHAR(50)  | NOT NULL | -      | 操作类型：create, update, delete, view, transfer, approve |
| entity_type   | VARCHAR(50)  | NOT NULL | -      | 实体类型：ip_nft, user, license, transaction, valuation   |
| entity_id     | UUID         | NOT NULL | -      | 实体ID                                                    |
| old_values    | JSONB        | -        | NULL   | 修改前的值                                                |
| new_values    | JSONB        | -        | NULL   | 修改后的值                                                |
| ip_address    | INET         | -        | NULL   | 操作者IP地址                                              |
| user_agent    | VARCHAR(500) | -        | NULL   | 用户代理字符串                                            |
| request_id    | VARCHAR(100) | -        | NULL   | 请求ID                                                    |
| session_id    | VARCHAR(100) | -        | NULL   | 会话ID                                                    |
| severity      | VARCHAR(20)  | NOT NULL | info   | 严重级别：debug, info, warning, error, critical           |
| metadata      | JSONB        | -        | NULL   | 额外元数据                                                |
| success       | BOOLEAN      | NOT NULL | true   | 操作是否成功                                              |
| error_message | TEXT         | -        | NULL   | 错误信息                                                  |
| created_at    | TIMESTAMP    | NOT NULL | now    | 创建时间                                                  |

**外键关系**：

- `user_id` → users(id)

**索引**：

- user_id (普通索引)
- action (普通索引)
- entity_type (普通索引)
- entity_id (普通索引)
- created_at (普通索引)
- (entity_type, entity_id) 复合索引
- severity (普通索引)

---

### 8. user_favorites

用户收藏表，记录用户收藏的 IP-NFT（关联表）。

| 字段名     | 类型      | 约束         | 默认值 | 说明             |
| ---------- | --------- | ------------ | ------ | ---------------- |
| id         | UUID      | PK           | auto   | 主键             |
| user_id    | UUID      | FK, NOT NULL | -      | 用户ID           |
| ip_nft_id  | UUID      | FK, NOT NULL | -      | 收藏的 IP-NFT ID |
| created_at | TIMESTAMP | NOT NULL     | now    | 收藏时间         |

**外键关系**：

- `user_id` → users(id) ON DELETE CASCADE
- `ip_nft_id` → ip_nfts(id) ON DELETE CASCADE

**约束**：

- UNIQUE(user_id, ip_nft_id) - 防止重复收藏

**索引**：

- user_id (普通索引)
- ip_nft_id (普通索引)
- (user_id, ip_nft_id) 唯一索引

---

### 9. ip_nft_categories

IP-NFT 分类表，定义资产分类体系。

| 字段名      | 类型         | 约束             | 默认值 | 说明                 |
| ----------- | ------------ | ---------------- | ------ | -------------------- |
| id          | UUID         | PK               | auto   | 主键，分类唯一标识   |
| name        | VARCHAR(100) | NOT NULL         | -      | 分类名称             |
| slug        | VARCHAR(100) | UNIQUE, NOT NULL | -      | URL 友好标识         |
| description | TEXT         | -                | NULL   | 分类描述             |
| icon_url    | VARCHAR(500) | -                | NULL   | 图标 URL             |
| parent_id   | UUID         | FK               | NULL   | 父分类ID（支持层级） |
| sort_order  | INTEGER      | NOT NULL         | 0      | 排序顺序             |
| is_active   | BOOLEAN      | NOT NULL         | true   | 是否启用             |
| metadata    | JSONB        | -                | NULL   | 额外元数据           |
| created_at  | TIMESTAMP    | NOT NULL         | now    | 创建时间             |
| updated_at  | TIMESTAMP    | NOT NULL         | now    | 更新时间             |

**外键关系**：

- `parent_id` → ip_nft_categories(id) ON DELETE SET NULL

**约束**：

- CHECK (sort_order >= 0)

**索引**：

- slug (唯一索引)
- parent_id (普通索引)
- is_active (普通索引)
- sort_order (普通索引)

---

## 数据库关系图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  users          │     │  ip_nft_        │     │  ip_nfts        │
│  (用户表)       │     │  categories     │     │  (IP-NFT资产)   │
├─────────────────┤     │  (分类表)       │     ├─────────────────┤
│ PK id           │     ├─────────────────┤     │ PK id           │
│ email (UQ)      │     │ PK id           │     │ FK category_id ─┼──┐
│ username (UQ)   │     │ name            │     │ FK owner_id     │  │
│ wallet_addr     │     │ slug (UQ)       │     │ FK creator_id   │  │
└─────────────────┘     │ FK parent_id ───┼───┐ │ token_id (UQ)   │  │
         │              └─────────────────┘   │ │ status          │  │
         │                                    │ └─────────────────┘  │
         │                                    │          │           │
         │              ┌─────────────────┐   │          │           │
         │              │  user_favorites │   │          │           │
         │              │  (用户收藏)      │   │          │           │
         │              ├─────────────────┤   │          │           │
         │         ┌────┤ FK user_id      │   │          │           │
         │         │    │ FK ip_nft_id ───┼───┼──────────┘           │
         │         │    │ UQ(user, nft) │   │                      │
         │         │    └─────────────────┘   │                      │
         │         │                         │                      │
         │         │    ┌─────────────────┐   │     ┌─────────────────┐
         │         │    │  transactions   │   │     │  licenses       │
         │         │    │  (交易记录)      │   │     │  (许可证)       │
         │         │    ├─────────────────┤   │     ├─────────────────┤
         │         │    │ PK id           │   │     │ PK id           │
         │         │    │ tx_hash (UQ)    │   │     │ license_no (UQ) │
         │         │    │ FK ip_nft_id ───┼───┤     │ FK ip_nft_id ───┼──┐
         │         │    │ FK from_user ───┼───┘     │ FK licensor_id ─┼──┤
         └─────────┼────┤ FK to_user_id   │           │ FK licensee_id ─┼──┤
                   │    │ status          │           │ status          │  │
                   │    └─────────────────┘           └─────────────────┘  │
                   │                                                        │
                   │    ┌─────────────────┐     ┌─────────────────┐       │
                   │    │  valuations     │     │  notifications  │       │
                   │    │  (资产估值)      │     │  (通知表)       │       │
                   │    ├─────────────────┤     ├─────────────────┤       │
                   │    │ PK id           │     │ PK id           │       │
                   └────┤ FK ip_nft_id ───┼─────┤ FK user_id ─────┼───────┘
                        │ FK appraiser_id ┼─────┤ is_read         │
                        │ estimated_value │     │ created_at      │
                        └─────────────────┘     └─────────────────┘
                        │
                        │    ┌─────────────────┐
                        │    │  audit_logs     │
                        │    │  (审计日志)      │
                        │    ├─────────────────┤
                        └────┤ FK user_id      │
                             │ action          │
                             │ entity_type     │
                             │ entity_id       │
                             │ created_at      │
                             └─────────────────┘
```

---

## 关键设计说明

### 1. 主键设计

- 所有表使用 **UUID** 作为主键
- UUID v4 自动生成，确保分布式环境下的唯一性

### 2. 时间戳字段

- 所有表包含 `created_at` 和 `updated_at`
- 使用数据库自动更新时间戳

### 3. 软删除

- 系统使用状态字段（如 `is_active`、`status`）实现逻辑删除
- 不物理删除数据，保证审计追踪能力

### 4. JSONB 字段

- 使用 PostgreSQL JSONB 类型存储灵活元数据
- 适用于 `metadata`、`comparable_sales` 等动态结构数据

### 5. 约束和索引

- 所有外键建立索引，支持 JOIN 查询
- 常用查询字段建立索引
- 唯一约束确保数据完整性

---

## 数据库统计

| 项目     | 数量     |
| -------- | -------- |
| 总表数   | 9 张     |
| 总字段数 | ~250+ 个 |
| 外键关系 | 20+ 个   |
| 索引数量 | 50+ 个   |
| 枚举类型 | 10+ 种   |

---

## 维护建议

1. **定期备份**: 建议每日全量备份，每小时增量备份
2. **索引优化**: 定期检查慢查询日志，优化索引
3. **数据归档**: 对历史审计日志和交易记录进行定期归档
4. **监控告警**: 监控表空间、连接数、慢查询等关键指标

---

_文档生成时间: 2026-02-07_  
_数据库版本: PostgreSQL 15+_  
_应用版本: Web3 IP-NFT v1.0_
