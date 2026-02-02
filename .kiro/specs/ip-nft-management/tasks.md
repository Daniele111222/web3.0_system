# Implementation Plan

## Phase 1: 项目基础架构

- [x] 1. 初始化项目结构
  - [x] 1.1 创建前端React+TypeScript项目
    - 使用Vite创建React项目，配置TypeScript
    - 安装核心依赖：react-router-dom, axios, zustand, ethers.js
    - 配置ESLint和Prettier
    - _Requirements: 全局_
  - [x] 1.2 创建后端FastAPI项目
    - 初始化Python项目结构，配置Poetry/pip
    - 安装核心依赖：fastapi, uvicorn, sqlalchemy, alembic, web3.py, python-jose
    - 配置项目目录结构（api, core, models, schemas, services, repositories）
    - _Requirements: 全局_
  - [x] 1.3 配置PostgreSQL数据库
    - 创建数据库和用户
    - 配置SQLAlchemy连接
    - 设置Alembic迁移工具
    - _Requirements: 全局_
  - [x] 1.4 初始化智能合约项目
    - 使用Hardhat初始化Solidity项目
    - 配置多链部署（Ethereum, Polygon, BSC测试网）
    - 安装OpenZeppelin合约库
    - _Requirements: 5.1_
  
## Phase 2: 用户认证系统

- [ ] 2. 实现用户认证模块
  - [x] 2.1 创建用户数据模型
    - 实现User SQLAlchemy模型（id, email, password_hash, name, wallet_address, email_verified）
    - 实现RefreshToken模型用于令牌管理
    - _Requirements: 1.1, 1.3_
  - [ ] 2.2 创建数据库迁移脚本
    - 生成User和RefreshToken表的Alembic迁移
    - 执行迁移创建数据库表
    - _Requirements: 1.1, 1.3_
  - [x] 2.3 实现密码哈希和JWT工具
    - 实现密码哈希函数（bcrypt）
    - 实现JWT令牌生成和验证函数
    - 配置令牌过期时间和刷新机制
    - _Requirements: 1.1, 1.5_
  - [ ]* 2.4 编写属性测试：认证凭据验证一致性
    - **Property 1: 认证凭据验证一致性**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 2.5 编写属性测试：JWT令牌有效性
    - **Property 2: JWT令牌有效性**
    - **Validates: Requirements 1.5**
  - [x] 2.6 实现注册API端点
    - POST /api/v1/auth/register
    - 邮箱唯一性验证
    - 密码强度验证
    - _Requirements: 1.3_
  - [ ]* 2.7 编写属性测试：用户注册唯一性
    - **Property 3: 用户注册唯一性**
    - **Validates: Requirements 1.3**
  - [x] 2.8 实现登录API端点
    - POST /api/v1/auth/login
    - 返回access_token和refresh_token
    - _Requirements: 1.1, 1.2_
  - [x] 2.9 实现钱包绑定API端点
    - POST /api/v1/auth/bind-wallet
    - 验证钱包签名
    - _Requirements: 1.4_
  - [x] 2.10 实现前端认证页面





    - 登录页面组件
    - 注册页面组件
    - 钱包绑定组件
    - _Requirements: 1.1, 1.3, 1.4_
  - [ ]* 2.11 编写认证模块单元测试
    - 测试登录成功和失败场景
    - 测试注册流程
    - 测试令牌刷新
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 企业与组织管理

- [x] 4. 实现企业管理模块
  - [x] 4.1 创建企业数据模型
    - 实现Enterprise和EnterpriseUser SQLAlchemy模型
    - 创建数据库迁移脚本
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 实现企业CRUD API
    - POST /api/v1/enterprises（创建企业）        
    - GET /api/v1/enterprises/{id}（查询企业）
    - PUT /api/v1/enterprises/{id}（更新企业）
    - _Requirements: 2.1, 2.4_
  - [ ]* 4.3 编写属性测试：企业标识唯一性
    - **Property 4: 企业标识唯一性**
    - **Validates: Requirements 2.1**
  - [x] 4.4 实现成员管理API
    - POST /api/v1/enterprises/{id}/members（邀请成员）
    - PUT /api/v1/enterprises/{id}/members/{user_id}（设置角色）
    - DELETE /api/v1/enterprises/{id}/members/{user_id}（移除成员）
    - _Requirements: 2.2, 2.3_
  - [ ]* 4.5 编写属性测试：角色权限一致性
    - **Property 5: 角色权限一致性**
    - **Validates: Requirements 2.3**
  - [x] 4.6 实现前端企业管理页面
    - 企业创建表单
    - 企业详情页面
    - 成员管理组件
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 4.7 编写企业模块单元测试
    - 测试企业创建和查询
    - 测试成员邀请和角色设置
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

## Phase 4: IP资产录入

- [x] 5. 实现资产录入模块
  - [x] 5.1 创建资产数据模型
    - 实现Asset和Attachment SQLAlchemy模型
    - 创建数据库迁移脚本
    - _Requirements: 3.2, 3.3_
  - [x] 5.2 实现IPFS存储服务
    - 配置IPFS客户端连接
    - 实现文件上传函数
    - 实现CID验证函数
    - _Requirements: 3.1_
  - [ ]* 5.3 编写属性测试：IPFS存储一致性
    - **Property 7: IPFS存储一致性**
    - **Validates: Requirements 3.1**
  - [x] 5.4 实现资产元数据验证
    - 定义Pydantic模式
    - 实现必填字段验证
    - 实现文件格式验证
    - _Requirements: 3.2, 3.5_
  - [ ]* 5.5 编写属性测试：资产元数据验证完整性
    - **Property 6: 资产元数据验证完整性**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 5.6 实现资产CRUD API
    - POST /api/v1/assets（创建资产草稿）
    - GET /api/v1/assets（列表查询）
    - GET /api/v1/assets/{id}（详情查询）
    - PUT /api/v1/assets/{id}（更新草稿）
    - POST /api/v1/assets/{id}/attachments（上传附件）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 5.7 实现前端资产录入页面
    - 资产信息表单组件
    - 文件上传组件
    - 资产草稿列表
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 5.8 编写资产录入模块单元测试
    - 测试资产创建和更新
    - 测试文件上传
    - 测试元数据验证
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 智能合约开发

- [x] 7. 实现IP-NFT智能合约
  - [x] 7.1 实现ERC-721基础合约
    - 继承OpenZeppelin ERC721URIStorage
    - 实现mint函数
    - 实现tokenURI函数
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 7.2 实现版税支持（ERC-2981）
    - 继承OpenZeppelin ERC2981
    - 实现setTokenRoyalty函数
    - _Requirements: 10.1（选做）_
  - [ ] 7.3 实现NFT元数据序列化工具
    - 创建元数据JSON生成函数（后端Python实现）
    - 创建元数据解析函数
    - _Requirements: 5.5, 5.6_
  - [ ]* 7.4 编写属性测试：NFT元数据序列化Round-Trip
    - **Property 8: NFT元数据序列化Round-Trip**
    - **Validates: Requirements 5.5, 5.6**
  - [x] 7.5 编写智能合约测试
    - 测试铸造功能
    - 测试转移功能
    - 测试tokenURI查询
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 7.6 编写合约模糊测试：铸造所有权正确性
    - **Property 9: NFT铸造所有权正确性**
    - **Validates: Requirements 4.1, 4.2, 5.2**
  - [ ] 7.7 部署合约到测试网
    - 编写部署脚本
    - 部署到Polygon Mumbai测试网
    - 验证合约代码
    - _Requirements: 5.1_

## Phase 6: NFT铸造功能

- [ ] 8. 实现NFT铸造模块
  - [ ] 8.1 实现区块链服务
    - 配置Web3客户端
    - 实现合约交互函数
    - 实现交易监听
    - _Requirements: 4.1, 4.6_
  - [ ] 8.2 实现NFT铸造API
    - POST /api/v1/nft/mint
    - 验证钱包绑定状态
    - 调用智能合约铸造
    - 记录交易哈希
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [ ]* 8.3 编写属性测试：NFT铸造记录完整性
    - **Property 10: NFT铸造记录完整性**
    - **Validates: Requirements 4.3**
  - [ ] 8.4 实现元数据上传到IPFS
    - 生成标准化元数据JSON
    - 上传到IPFS
    - 返回metadata URI
    - _Requirements: 4.4_
  - [ ] 8.5 实现前端铸造页面
    - 铸造确认组件
    - 交易状态显示
    - 铸造成功展示
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 8.6 编写NFT铸造模块单元测试
    - 测试铸造流程
    - 测试钱包未绑定场景
    - 测试交易失败处理
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [ ] 9. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: 权属看板

- [ ] 10. 实现权属看板模块
  - [ ] 10.1 实现资产列表查询API
    - GET /api/v1/dashboard/assets
    - 支持分页
    - 支持多条件筛选（类型、状态、时间）
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 10.2 编写属性测试：资产筛选结果正确性
    - **Property 11: 资产筛选结果正确性**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [ ]* 10.3 编写属性测试：资产看板完整性
    - **Property 15: 资产看板完整性**
    - **Validates: Requirements 6.1**
  - [ ] 10.4 实现前端看板页面
    - 资产卡片列表组件
    - 筛选器组件
    - 资产详情弹窗
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 10.5 编写看板模块单元测试
    - 测试列表查询
    - 测试各种筛选条件
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Phase 8: 权属转移与溯源

- [ ] 11. 实现权属转移模块
  - [ ] 11.1 创建NFT事件数据模型
    - 实现NFTEvent SQLAlchemy模型
    - 创建数据库迁移脚本
    - _Requirements: 7.4, 8.1_
  - [ ] 11.2 实现NFT转移API
    - POST /api/v1/nft/transfer
    - 验证所有权
    - 调用智能合约转移
    - 记录转移事件
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 11.3 编写属性测试：NFT转移权限验证
    - **Property 12: NFT转移权限验证**
    - **Validates: Requirements 7.1, 7.5**
  - [ ]* 11.4 编写属性测试：NFT转移完整性
    - **Property 13: NFT转移完整性**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  - [ ] 11.5 实现历史溯源API
    - GET /api/v1/nft/{token_id}/history
    - 返回完整事件链
    - 包含交易哈希链接
    - _Requirements: 8.1, 8.2_
  - [ ]* 11.6 编写属性测试：资产历史完整性
    - **Property 14: 资产历史完整性**
    - **Validates: Requirements 8.1, 8.2**
  - [ ] 11.7 实现前端转移和溯源页面
    - 转移表单组件
    - 历史时间线组件
    - 交易详情链接
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_
  - [ ]* 11.8 编写转移和溯源模块单元测试
    - 测试转移流程
    - 测试权限验证
    - 测试历史查询
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2_

- [ ] 12. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: 商业化功能（选做）

- [ ] 13. 实现商业化授权模块（选做）
  - [ ] 13.1 实现许可智能合约
    - 创建LicenseToken合约
    - 实现许可发放函数
    - 实现许可验证函数
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ] 13.2 实现许可管理API
    - POST /api/v1/licenses/create（创建许可方案）
    - POST /api/v1/licenses/purchase（购买许可）
    - GET /api/v1/licenses（查询许可）
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ] 13.3 实现前端许可管理页面
    - 许可方案设置组件
    - 许可购买组件
    - 许可列表组件
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 14. 实现版税分成模块（选做）
  - [ ] 14.1 扩展智能合约版税功能
    - 实现版税规则设置
    - 实现自动分账逻辑
    - _Requirements: 10.1, 10.2_
  - [ ] 14.2 实现版税查询API
    - GET /api/v1/royalties（查询版税收入）
    - _Requirements: 10.3_
  - [ ] 14.3 实现前端版税管理页面
    - 版税设置组件
    - 版税收入统计组件
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 15. 实现质押融资模块（选做）
  - [ ] 15.1 实现质押智能合约
    - 创建StakingPool合约
    - 实现质押和解押函数
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ] 15.2 实现质押管理API
    - POST /api/v1/staking/stake（质押NFT）
    - POST /api/v1/staking/unstake（解押NFT）
    - GET /api/v1/staking（查询质押状态）
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ] 15.3 实现前端质押页面
    - 质押操作组件
    - 质押状态展示
    - _Requirements: 11.1, 11.2, 11.3_

## Phase 10: 集成与优化

- [ ] 16. 系统集成与优化
  - [x] 16.1 实现前端路由和导航
    - 配置React Router
    - 实现导航菜单
    - 实现权限路由守卫
    - _Requirements: 全局_
  - [x] 16.2 实现前端状态管理
    - 配置Zustand store
    - 实现用户状态管理
    - 实现Web3连接状态管理
    - _Requirements: 全局_
  - [ ] 16.3 实现API错误处理
    - 统一错误响应格式
    - 实现全局异常处理
    - 实现前端错误提示
    - _Requirements: 全局_
  - [ ] 16.4 实现Web3连接管理
    - 实现钱包连接Hook
    - 实现网络切换
    - 实现交易签名
    - _Requirements: 1.4, 4.1, 7.2_
  - [ ]* 16.5 编写E2E测试
    - 测试完整注册登录流程
    - 测试资产创建和铸造流程
    - 测试转移流程
    - _Requirements: 全局_

- [ ] 17. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
