# IP-NFT 智能合约

IP-NFT 管理 DApp 的 Solidity 智能合约。

## 概述

IPNFT 合约实现了以下功能：
- ERC-721 标准 NFT 功能
- ERC-721 URI Storage 元数据管理
- ERC-721 Enumerable 代币枚举
- ERC-2981 版税支持

## 环境要求

- Node.js 18+
- npm 或 yarn

## 安装配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

在 `.env` 文件中配置：
- 部署用的私钥
- 目标网络的 RPC URL
- 区块浏览器 API 密钥（用于合约验证）

## 开发命令

### 编译合约

```bash
npm run compile
```

### 运行测试

```bash
npm run test
```

### 运行测试（含覆盖率）

```bash
npm run test:coverage
```

### 启动本地节点

```bash
npm run node
```

## 部署

### 部署到本地网络

```bash
npm run deploy:localhost
```

### 部署到 Polygon Mumbai 测试网

```bash
npm run deploy:mumbai
```

### 部署到 Sepolia 测试网

```bash
npm run deploy:sepolia
```

### 部署到 BSC 测试网

```bash
npm run deploy:bscTestnet
```

## 合约验证

部署后验证合约：

```bash
npx hardhat verify --network <网络名称> <合约地址>
```

## 合约架构

```
contracts/
├── IPNFT.sol          # 主 IP-NFT 合约
└── (未来扩展)
    ├── LicenseToken.sol    # 许可证管理
    └── StakingPool.sol     # NFT 质押
```

## 核心功能

### 铸造
- `mint(address to, string metadataURI)` - 铸造新的 IP-NFT
- `mintWithRoyalty(...)` - 铸造并设置版税信息

### 版税 (ERC-2981)
- `setTokenRoyalty(tokenId, receiver, feeNumerator)` - 设置代币版税
- `royaltyInfo(tokenId, salePrice)` - 查询版税信息

### 元数据
- `tokenURI(tokenId)` - 获取元数据 URI
- `updateTokenURI(tokenId, newURI)` - 更新元数据 URI

### 枚举
- `totalSupply()` - 代币总量
- `tokenByIndex(index)` - 按索引获取代币 ID
- `tokenOfOwnerByIndex(owner, index)` - 按索引获取持有者的代币

## 安全性

- ReentrancyGuard 防止重入攻击
- Ownable 管理员权限控制
- 所有公开函数均有输入验证
