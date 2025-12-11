# Requirements Document

## Introduction

本系统是一个基于Web3的企业知识产权（IP）管理去中心化应用（DApp）。系统通过NFT技术将企业无形资产（专利、商标、版权、商业秘密、数字作品等）进行Token化，构建可信、可追溯、可高效交易的数字化资产管理平台。

**技术栈选型：**
- 前端：React + TypeScript
- 后端：FastAPI (Python) - 选择理由：优秀的异步支持、丰富的Web3生态、清晰的前后端分离架构
- 智能合约：Solidity
- 数据库：PostgreSQL
- 区块链：Ethereum/Polygon/BNB Chain
- 存储：IPFS（链下元数据和文件存储）

## Glossary

- **IP-NFT**: 代表知识产权资产的非同质化代币
- **DApp**: 去中心化应用程序
- **Minting**: NFT铸造过程，将资产信息上链生成唯一代币
- **IPFS**: 星际文件系统，用于去中心化存储
- **元数据(Metadata)**: 描述IP资产属性的结构化数据
- **权属(Ownership)**: IP资产的所有权归属
- **许可凭证(License Token)**: 代表授权许可的代币
- **版税(Royalty)**: 二级市场交易时原创者获得的分成
- **质押(Staking)**: 将NFT作为抵押品锁定以获取贷款
- **SBT(Soulbound Token)**: 不可转让的灵魂绑定代币
- **用户(User)**: 系统注册用户，包括企业管理员和员工
- **企业(Enterprise)**: 在系统中注册的组织实体
- **钱包地址(Wallet Address)**: 用户关联的区块链钱包地址

## Requirements

### Requirement 1: 用户认证系统

**User Story:** 作为企业用户，我希望通过传统账号密码方式登录系统，以便在避免法律风险的前提下安全访问系统功能。

#### Acceptance Criteria

1. WHEN 用户提交有效的邮箱和密码 THEN 认证系统 SHALL 验证凭据并返回JWT访问令牌
2. WHEN 用户提交无效凭据 THEN 认证系统 SHALL 拒绝登录并返回明确的错误信息
3. WHEN 用户首次注册 THEN 认证系统 SHALL 要求邮箱验证并创建用户账户
4. WHEN 用户登录成功 THEN 认证系统 SHALL 允许用户绑定区块链钱包地址到其账户
5. WHEN JWT令牌过期 THEN 认证系统 SHALL 要求用户重新认证或使用刷新令牌
6. WHEN 用户请求密码重置 THEN 认证系统 SHALL 发送重置链接到注册邮箱

### Requirement 2: 企业与组织管理

**User Story:** 作为企业管理员，我希望创建和管理企业组织，以便统一管理企业的知识产权资产。

#### Acceptance Criteria

1. WHEN 用户创建企业 THEN 组织管理系统 SHALL 生成唯一企业标识并关联创建者为管理员
2. WHEN 企业管理员邀请成员 THEN 组织管理系统 SHALL 发送邀请并在接受后添加成员到企业
3. WHEN 企业管理员设置成员角色 THEN 组织管理系统 SHALL 根据角色分配相应的操作权限
4. WHEN 查询企业信息 THEN 组织管理系统 SHALL 返回企业基本信息和成员列表

### Requirement 3: IP资产信息录入

**User Story:** 作为企业用户，我希望录入知识产权资产的详细信息，以便为后续NFT铸造准备完整的资产数据。

#### Acceptance Criteria

1. WHEN 用户上传IP资产附件（专利文档、设计草图、商标图样、源代码哈希、照片、视频） THEN 资产录入系统 SHALL 将文件存储到IPFS并返回内容哈希值
2. WHEN 用户填写资产元数据（名称、类型、描述、创作人、创作日期、法律状态、申请号） THEN 资产录入系统 SHALL 验证必填字段并保存结构化数据
3. WHEN 资产信息保存成功 THEN 资产录入系统 SHALL 生成资产草稿记录并返回唯一资产标识
4. WHEN 用户编辑未铸造的资产草稿 THEN 资产录入系统 SHALL 更新资产信息并保留修改历史
5. IF 用户上传的文件格式不受支持 THEN 资产录入系统 SHALL 拒绝上传并提示支持的文件格式列表

### Requirement 4: NFT铸造

**User Story:** 作为企业用户，我希望将录入的IP资产铸造为NFT，以便在区块链上确立资产的数字所有权凭证。

#### Acceptance Criteria

1. WHEN 用户确认资产信息并发起铸造 THEN NFT铸造系统 SHALL 调用智能合约在指定区块链上铸造IP-NFT
2. WHEN NFT铸造成功 THEN NFT铸造系统 SHALL 将NFT发送到用户绑定的钱包地址
3. WHEN NFT铸造成功 THEN NFT铸造系统 SHALL 记录铸造交易哈希作为上链永久证明
4. WHEN NFT铸造过程中 THEN NFT铸造系统 SHALL 将元数据按标准格式存储到IPFS
5. IF 用户钱包地址未绑定 THEN NFT铸造系统 SHALL 阻止铸造并提示用户先绑定钱包
6. IF 智能合约调用失败 THEN NFT铸造系统 SHALL 记录错误详情并通知用户重试

### Requirement 5: 智能合约 - IP-NFT标准

**User Story:** 作为系统开发者，我希望实现符合标准的IP-NFT智能合约，以便支持资产的铸造、转移和元数据管理。

#### Acceptance Criteria

1. WHEN 智能合约部署 THEN IP-NFT合约 SHALL 实现ERC-721标准接口
2. WHEN 调用铸造函数 THEN IP-NFT合约 SHALL 创建唯一tokenId并关联元数据URI
3. WHEN 调用转移函数 THEN IP-NFT合约 SHALL 验证调用者权限并更新所有权记录
4. WHEN 查询NFT信息 THEN IP-NFT合约 SHALL 返回tokenURI指向的IPFS元数据地址
5. WHEN NFT元数据序列化 THEN IP-NFT合约 SHALL 生成符合JSON标准的元数据格式
6. WHEN NFT元数据反序列化 THEN IP-NFT合约 SHALL 正确解析JSON元数据为结构化对象

### Requirement 6: 权属看板

**User Story:** 作为企业用户，我希望在仪表板上查看企业所有IP-NFT资产，以便直观了解资产状况。

#### Acceptance Criteria

1. WHEN 用户访问权属看板 THEN 看板系统 SHALL 展示企业名下所有IP-NFT资产列表
2. WHEN 用户按资产类型筛选 THEN 看板系统 SHALL 返回匹配类型的资产子集
3. WHEN 用户按资产状态筛选（有效、许可中、质押中） THEN 看板系统 SHALL 返回匹配状态的资产子集
4. WHEN 用户按时间范围筛选 THEN 看板系统 SHALL 返回指定时间段内创建的资产
5. WHEN 资产数据更新 THEN 看板系统 SHALL 同步显示最新的链上状态

### Requirement 7: 权属变更与转移

**User Story:** 作为企业用户，我希望将IP-NFT转移给其他钱包地址，以便实现资产所有权的合法转让。

#### Acceptance Criteria

1. WHEN 用户发起NFT转移请求 THEN 权属转移系统 SHALL 验证用户对该NFT的所有权
2. WHEN 转移验证通过 THEN 权属转移系统 SHALL 调用智能合约执行链上转移
3. WHEN 链上转移成功 THEN 权属转移系统 SHALL 更新本地数据库的所有权记录
4. WHEN 转移完成 THEN 权属转移系统 SHALL 记录转移事件到资产历史记录
5. IF 用户不是NFT所有者 THEN 权属转移系统 SHALL 拒绝转移请求并返回权限错误

### Requirement 8: 历史溯源

**User Story:** 作为企业用户，我希望查看IP-NFT的完整生命周期历史，以便追溯资产的所有权变更和关键事件。

#### Acceptance Criteria

1. WHEN 用户查询NFT历史 THEN 溯源系统 SHALL 返回从铸造开始的所有事件记录
2. WHEN 展示历史事件 THEN 溯源系统 SHALL 包含事件类型、时间戳和交易哈希链接
3. WHEN 用户点击交易链接 THEN 溯源系统 SHALL 跳转到区块链浏览器查看交易详情
4. WHEN 历史数据可视化 THEN 溯源系统 SHALL 以时间线形式展示资产"生命线"

### Requirement 9: 商业化授权与许可（选做）

**User Story:** 作为IP资产所有者，我希望设置授权价格和条款，以便其他用户可以付费获得使用许可。

#### Acceptance Criteria

1. WHEN 所有者设置固定价格许可 THEN 许可系统 SHALL 记录授权价格、范围、地域和期限
2. WHEN 被授权方支付许可费用 THEN 许可系统 SHALL 调用智能合约自动执行授权
3. WHEN 授权执行成功 THEN 许可系统 SHALL 向被授权方地址发送许可凭证Token
4. WHEN 所有者设置分级许可方案 THEN 许可系统 SHALL 支持个人使用、商业使用、独家使用等不同等级
5. IF 许可期限到期 THEN 许可系统 SHALL 自动标记许可凭证为失效状态

### Requirement 10: 版税自动分成（选做）

**User Story:** 作为IP资产原创者，我希望在二级市场交易时自动获得版税分成，以便持续从资产增值中获益。

#### Acceptance Criteria

1. WHEN 创建者设置版税规则 THEN 版税系统 SHALL 在智能合约中记录版税比例和接收地址
2. WHEN 二级市场交易发生 THEN 版税系统 SHALL 自动计算并分配版税到创建者钱包
3. WHEN 版税分配完成 THEN 版税系统 SHALL 记录分配详情供创建者查询

### Requirement 11: 质押与融资（选做）

**User Story:** 作为企业用户，我希望将IP-NFT作为抵押品获取贷款，以便释放无形资产的流动性价值。

#### Acceptance Criteria

1. WHEN 用户发起质押请求 THEN 质押系统 SHALL 将NFT锁定到融资池智能合约
2. WHEN 质押成功 THEN 质押系统 SHALL 根据评估价值发放相应额度的贷款
3. WHEN 用户偿还贷款 THEN 质押系统 SHALL 解锁并返还质押的NFT
4. IF 贷款逾期未还 THEN 质押系统 SHALL 按合约规则处置质押的NFT

### Requirement 12: 二级市场集成（选做）

**User Story:** 作为企业用户，我希望在主流NFT市场挂单出售IP资产，以便扩大资产的交易渠道。

#### Acceptance Criteria

1. WHEN 用户选择挂单出售 THEN 市场集成系统 SHALL 连接到指定NFT交易市场API
2. WHEN 挂单成功 THEN 市场集成系统 SHALL 同步挂单状态到本地系统
3. WHEN 市场交易完成 THEN 市场集成系统 SHALL 更新本地所有权记录和交易历史
