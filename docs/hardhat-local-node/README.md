# Hardhat 本地区块链节点开发方案

> **文档版本**: v1.0  
> **适用项目**: Web3 IP-NFT 企业资产管理系统  
> **使用场景**: 毕业设计演示环境

---

## 目录

1. [方案概述](#1-方案概述)
2. [技术架构](#2-技术架构)
3. [环境准备](#3-环境准备)
4. [Hardhat 节点配置](#4-hardhat-节点配置)
5. [智能合约部署流程](#5-智能合约部署流程)
6. [本地测试账户配置](#6-本地测试账户配置)
7. [前端集成方案](#7-前端集成方案)
8. [演示脚本](#8-演示脚本)
9. [常见问题与解决方案](#9-常见问题与解决方案)

---

## 1. 方案概述

### 1.1 方案目标

本方案旨在搭建一套完整的**Hardhat 本地区块链节点**，用于毕业设计演示。该方案提供：

- ✅ 完全离线的区块链环境，无需真实Gas费
- ✅ 预设的测试账户和资金，方便演示
- ✅ 快速的交易确认（秒级）
- ✅ 完整的前端-合约交互演示
- ✅ 一键启动/停止的脚本支持

### 1.2 适用场景

| 场景 | 说明 |
|------|------|
| 毕业设计答辩 | 完整功能演示，无需担心网络延迟 |
| 导师检查 | 稳定的演示环境 |
| 功能测试 | 开发阶段快速迭代验证 |
| 教学演示 | 区块链交互流程教学 |

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      演示环境架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────────┐   │
│  │   Frontend   │         │      Hardhat Local Node      │   │
│  │   (React)    │◄───────►│    http://127.0.0.1:8545    │   │
│  │              │  Web3   │    Chain ID: 31337            │   │
│  └──────────────┘         │    Block Time: 即时           │   │
│                           └──────────────────────────────┘   │
│                                    │                        │
│                                    ▼                        │
│                           ┌──────────────────────────────┐   │
│                           │    IPNFT Smart Contract      │   │
│                           │    - Minting                 │   │
│                           │    - Transfer                │   │
│                           │    - Royalty                 │   │
│                           └──────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件说明

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| Hardhat Node | Hardhat 2.19+ | 本地以太坊节点模拟器 |
| Smart Contract | Solidity 0.8.20 | IP-NFT 核心合约 |
| Frontend | React 19 + Vite | 演示界面 |
| Web3 Library | Ethers.js 6.x | 与区块链交互 |

---

## 3. 环境准备

### 3.1 系统要求

- **操作系统**: Windows 10/11, macOS, Linux
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: 任意版本

### 3.2 项目结构

```
web3.0_system/
├── contracts/              # 智能合约目录
│   ├── contracts/          # Solidity 合约文件
│   ├── scripts/            # 部署脚本
│   ├── test/               # 测试文件
│   ├── hardhat.config.ts   # Hardhat 配置文件
│   └── package.json        # 依赖管理
├── frontend/               # 前端应用
│   └── ...
├── backend/                # 后端API
│   └── ...
└── docs/                   # 文档目录
    └── hardhat-local-node/  # 本方案文档
```

### 3.3 安装依赖

```bash
# 进入合约目录
cd contracts

# 安装所有依赖
npm install

# 验证安装
npx hardhat --version
```

---

## 4. Hardhat 节点配置

### 4.1 配置文件详解

当前 `hardhat.config.ts` 已包含完整的网络配置：

```typescript
// 核心配置说明
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 内置 Hardhat 网络（内存模式，用于测试）
    hardhat: {
      chainId: 31337,
    },
    // 本地节点网络（独立进程模式）
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // ... 其他测试网配置
  },
};
```

### 4.2 启动本地节点

```bash
# 进入合约目录
cd contracts

# 方式1: 使用 npm 脚本启动（推荐）
npm run node

# 方式2: 直接使用 npx
npx hardhat node

# 方式3: 指定自定义配置启动
npx hardhat node --port 8545 --hostname 127.0.0.1
```

**启动成功输出示例：**

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...

Account #9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000 ETH)
Private Key: 0x2a871d0798f97d79848a013d4936a6bf4f8d3e8e1f0b9c2d3e4f5a6b7c8d9e0f1
```

### 4.3 预配置测试账户

Hardhat 默认提供 20 个预存资金的测试账户，可用于演示：

| 账户索引 | 地址 | 余额 | 用途建议 |
|---------|------|------|---------|
| #0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 10,000 ETH | 部署者/管理员 |
| #1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 10,000 ETH | 企业用户A |
| #2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 10,000 ETH | 企业用户B |
| #3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 10,000 ETH | 审计员/监管 |

---

## 5. 智能合约部署流程

### 5.1 编译合约

```bash
# 进入合约目录
cd contracts

# 编译合约
npm run compile

# 清理缓存后重新编译
npm run clean && npm run compile
```

### 5.2 部署到本地节点

**步骤 1: 确保节点已启动**

```bash
# 在第一个终端窗口启动节点
cd contracts
npm run node
```

**步骤 2: 执行部署脚本**

```bash
# 在第二个终端窗口执行部署
cd contracts
npm run deploy:localhost
```

**部署成功输出示例：**

```
Deploying IPNFT contract...
Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 9999.999999999999 ETH
IPNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

--- Deployment Summary ---
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployer Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Network: unknown
Chain ID: 31337
```

### 5.3 合约地址管理

创建 `.env.local` 文件记录部署信息：

```bash
# contracts/.env.local
# Hardhat Local Node Configuration
LOCAL_RPC_URL=http://127.0.0.1:8545
LOCAL_CHAIN_ID=31337

# Deployed Contract Addresses
LOCAL_IPNFT_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Test Accounts (Hardhat default)
# Account #0 - Deployer/Admin
LOCAL_ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
LOCAL_ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Account #1 - Enterprise User A
LOCAL_USER_A_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
LOCAL_USER_A_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Account #2 - Enterprise User B
LOCAL_USER_B_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
LOCAL_USER_B_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

---

## 6. 本地测试账户配置

### 6.1 账户角色分配

为演示场景分配不同角色：

```
┌─────────────────────────────────────────────────────────────┐
│                      演示账户体系                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ 管理员   │───►│ 企业A    │    │ 企业B    │               │
│  │ Account0 │    │ Account1 │    │ Account2 │               │
│  └────┬─────┘    └────┬─────┘    └──────────┘               │
│       │               │                                     │
│       ▼               ▼                                     │
│  ┌──────────────────────────────────────┐                  │
│  │         IPNFT 智能合约                │                  │
│  │  - 部署合约                          │                  │
│  │  - 铸造IP资产NFT                     │                  │
│  │  - 转移所有权                        │                  │
│  │  - 设置版税                          │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 MetaMask 配置

**添加本地网络到 MetaMask：**

1. 打开 MetaMask，点击网络选择器
2. 选择 "Add Network" → "Add a network manually"
3. 填写以下信息：

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
Block Explorer URL: (留空)
```

**导入测试账户：**

1. 在 MetaMask 中选择 Hardhat Local 网络
2. 点击账户图标 → "Import Account"
3. 输入私钥（使用 Account #1 用于演示）：
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

---

## 7. 前端集成方案

### 7.1 环境变量配置

在 `frontend/` 目录创建 `.env.local`：

```bash
# frontend/.env.local
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Blockchain Configuration - Local Hardhat Node
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=Hardhat Local

# Contract Addresses (Update after deployment)
VITE_IPNFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# IPFS Configuration (optional - for demo)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### 7.2 Web3 Provider 封装

创建 `frontend/src/utils/web3.ts`：

```typescript
import { ethers } from 'ethers';
import { IPNFT_ABI } from './abis/IPNFT';

// Contract configuration
const CONTRACT_ADDRESS = import.meta.env.VITE_IPNFT_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

// Provider singleton
let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;
let contract: ethers.Contract | null = null;

/**
 * Initialize Web3 provider for local Hardhat node
 */
export const initProvider = async (): Promise<ethers.JsonRpcProvider> => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Verify connection
    const network = await provider.getNetwork();
    console.log('Connected to:', network.name, 'Chain ID:', network.chainId);
  }
  return provider;
};

/**
 * Get signer for a specific account (using private key)
 * For demo purposes - in production use wallet connection
 */
export const getSigner = async (privateKey?: string): Promise<ethers.JsonRpcSigner> => {
  const prov = await initProvider();
  
  if (privateKey) {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey, prov);
    return wallet as unknown as ethers.JsonRpcSigner;
  }
  
  // Use default signer (first account)
  if (!signer) {
    signer = await prov.getSigner(0);
  }
  return signer;
};

/**
 * Get IPNFT contract instance
 */
export const getContract = async (signerOrProvider?: ethers.Signer | ethers.Provider): Promise<ethers.Contract> => {
  if (!contract) {
    const prov = signerOrProvider || await initProvider();
    contract = new ethers.Contract(CONTRACT_ADDRESS, IPNFT_ABI, prov);
  }
  return contract;
};

/**
 * Check if Hardhat node is running
 */
export const isNodeRunning = async (): Promise<boolean> => {
  try {
    const prov = new ethers.JsonRpcProvider(RPC_URL);
    await prov.getBlockNumber();
    return true;
  } catch {
    return false;
  }
};

// Re-export ethers for convenience
export { ethers };
```

### 7.3 合约 ABI

创建 `frontend/src/utils/abis/IPNFT.ts`：

```typescript
export const IPNFT_ABI = [
  // ERC721 标准方法
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  
  // IPNFT 自定义方法
  "function mint(address to, string metadataURI) returns (uint256)",
  "function mintWithRoyalty(address to, string metadataURI, address royaltyReceiver, uint96 royaltyFeeNumerator) returns (uint256)",
  "function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator)",
  "function updateTokenURI(uint256 tokenId, string newURI)",
  "function getOriginalCreator(uint256 tokenId) view returns (address)",
  "function getMintTimestamp(uint256 tokenId) view returns (uint256)",
  "function getNextTokenId() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mintTimestamps(uint256) view returns (uint256)",
  "function originalCreators(uint256) view returns (address)",
  
  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event NFTMinted(uint256 indexed tokenId, address indexed owner, string metadataURI)",
  "event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
  "event RoyaltySet(uint256 indexed tokenId, address receiver, uint96 feeNumerator)",
  "event MetadataUpdated(uint256 indexed tokenId, string newURI)"
];
```

---

## 8. 演示脚本

### 8.1 一键启动脚本

创建 `scripts/start-local-demo.sh` (Linux/Mac) 或 `scripts/start-local-demo.bat` (Windows)：

**Windows 版本 (`scripts/start-local-demo.bat`):**

```batch
@echo off
chcp 65001 >nul
echo ==========================================
echo   IP-NFT 本地演示环境启动脚本
echo ==========================================
echo.

REM 检查是否已在 contracts 目录
if exist "hardhat.config.ts" (
    set CONTRACTS_DIR=.
) else (
    set CONTRACTS_DIR=contracts
)

cd %CONTRACTS_DIR%

echo [1/4] 检查 Hardhat 节点状态...

REM 使用 PowerShell 检查端口
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8545' -Method POST -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' -ContentType 'application/json' -TimeoutSec 2; exit 0 } catch { exit 1 }"

if %errorlevel% == 0 (
    echo     ✓ Hardhat 节点已在运行
) else (
    echo     ✗ Hardhat 节点未启动
    echo.
    echo     正在启动 Hardhat 节点...
    start "Hardhat Node" cmd /k "npx hardhat node"
    
    echo     等待节点启动...
    timeout /t 5 /nobreak >nul
)

echo.
echo [2/4] 编译智能合约...
call npx hardhat compile
if %errorlevel% neq 0 (
    echo     ✗ 合约编译失败
    pause
    exit /b 1
)
echo     ✓ 合约编译成功

echo.
echo [3/4] 部署合约到本地节点...
call npx hardhat run scripts/deploy.ts --network localhost > deploy-output.txt 2>&1

REM 提取合约地址
for /f "tokens=2" %%a in ('findstr /C:"IPNFT deployed to:" deploy-output.txt') do (
    set CONTRACT_ADDRESS=%%a
)

echo     ✓ 合约部署成功
echo     合约地址: %CONTRACT_ADDRESS%

echo.
echo [4/4] 更新前端环境配置...

REM 更新前端 .env.local
cd ..\frontend
(
echo # API Configuration
echo VITE_API_BASE_URL=http://localhost:8000
echo.
echo # Blockchain Configuration - Local Hardhat Node
echo VITE_RPC_URL=http://127.0.0.1:8545
echo VITE_CHAIN_ID=31337
echo VITE_NETWORK_NAME=Hardhat Local
echo.
echo # Contract Addresses
echo VITE_IPNFT_CONTRACT_ADDRESS=%CONTRACT_ADDRESS%
echo.
echo # IPFS Configuration
echo VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
) > .env.local

echo     ✓ 前端配置已更新

cd ..\contracts

echo.
echo ==========================================
echo   本地演示环境启动完成！
echo ==========================================
echo.
echo 合约地址: %CONTRACT_ADDRESS%
echo RPC 地址: http://127.0.0.1:8545
echo 链 ID: 31337
echo.
echo 下一步:
echo   1. 确保 MetaMask 已配置 Hardhat Local 网络
echo   2. 导入测试账户私钥
echo   3. 启动前端: cd frontend ^&^& npm run dev
echo.
echo 按任意键退出...
pause >nul

REM 清理临时文件
del deploy-output.txt 2>nul
```

### 8.2 快速交互脚本

创建 `contracts/scripts/interact.ts` 用于快速测试：

```typescript
import { ethers } from "hardhat";

async function main() {
  // 获取测试账户
  const [admin, userA, userB] = await ethers.getSigners();
  
  console.log("=== IP-NFT 本地交互测试 ===\n");
  
  // 获取已部署的合约（需要先部署）
  const contractAddress = process.env.LOCAL_IPNFT_CONTRACT;
  if (!contractAddress) {
    console.error("错误: 请设置 LOCAL_IPNFT_CONTRACT 环境变量");
    console.log("先执行: npm run deploy:localhost");
    return;
  }
  
  const IPNFT = await ethers.getContractAt("IPNFT", contractAddress);
  console.log("合约地址:", contractAddress);
  
  // 1. 管理员铸造 NFT
  console.log("\n--- 步骤1: 管理员铸造 NFT ---");
  const metadataURI = "ipfs://QmExampleHash123456789/metadata.json";
  
  const mintTx = await IPNFT.connect(admin).mint(userA.address, metadataURI);
  await mintTx.wait();
  
  const tokenId = 1;
  const owner = await IPNFT.ownerOf(tokenId);
  console.log(`NFT #${tokenId} 铸造成功`);
  console.log(`所有者: ${owner}`);
  console.log(`元数据: ${metadataURI}`);
  
  // 2. 查询 NFT 信息
  console.log("\n--- 步骤2: 查询 NFT 信息 ---");
  const creator = await IPNFT.getOriginalCreator(tokenId);
  const timestamp = await IPNFT.getMintTimestamp(tokenId);
  const uri = await IPNFT.tokenURI(tokenId);
  
  console.log(`原始创建者: ${creator}`);
  console.log(`铸造时间: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
  console.log(`Token URI: ${uri}`);
  
  // 3. 转移 NFT
  console.log("\n--- 步骤3: 转移 NFT ---");
  const transferTx = await IPNFT.connect(userA).transferFrom(
    userA.address,
    userB.address,
    tokenId
  );
  await transferTx.wait();
  
  const newOwner = await IPNFT.ownerOf(tokenId);
  console.log(`NFT #${tokenId} 转移成功`);
  console.log(`新所有者: ${newOwner}`);
  
  // 4. 查询余额
  console.log("\n--- 步骤4: 查询账户余额 ---");
  const balanceA = await IPNFT.balanceOf(userA.address);
  const balanceB = await IPNFT.balanceOf(userB.address);
  
  console.log(`用户A NFT 余额: ${balanceA}`);
  console.log(`用户B NFT 余额: ${balanceB}`);
  
  console.log("\n=== 交互测试完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 8. 演示脚本

### 8.3 演示流程指南

创建 `docs/hardhat-local-node/demo-guide.md`：

```markdown
# IP-NFT 毕业设计演示指南

## 演示前准备（5分钟）

### 1. 启动环境
```bash
# 在项目根目录执行
./scripts/start-local-demo.bat  # Windows
# 或
./scripts/start-local-demo.sh   # Linux/Mac
```

### 2. 验证服务状态
- [ ] Hardhat 节点运行在 http://127.0.0.1:8545
- [ ] 合约已部署并记录地址
- [ ] 前端 .env.local 已更新

### 3. 启动前端
```bash
cd frontend
npm run dev
```

---

## 演示流程（15-20分钟）

### 场景1: 系统介绍（2分钟）

**讲解要点：**
- 项目背景：企业IP资产管理的痛点
- 技术方案：Web3 + NFT + 智能合约
- 创新点：去中心化、可追溯、版税自动分配

**展示内容：**
- 项目架构图
- 技术栈概览

---

### 场景2: 区块链网络演示（3分钟）

**演示步骤：**

1. **展示 Hardhat 节点运行**
   ```
   打开终端窗口，显示:
   "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"
   ```

2. **说明本地网络特点**
   - 即时出块，无需等待
   - 预置测试资金
   - 完全免费

3. **展示 MetaMask 配置**
   - 网络名称: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337

---

### 场景3: NFT 铸造演示（5分钟）

**前置条件：**
- 管理员账户（Account #0）已导入 MetaMask
- 企业用户账户（Account #1）已导入 MetaMask

**演示步骤：**

1. **切换到管理员账户**
   - 在 MetaMask 中选择管理员账户
   - 显示余额: 10,000 ETH

2. **进入前端铸造页面**
   - 打开 http://localhost:5173 (或对应端口)
   - 导航到 "铸造 NFT" 页面

3. **填写铸造信息**
   ```
   接收地址: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (企业用户A)
   元数据URI: ipfs://QmExample/tech-patent-001.json
   版税比例: 2.5%
   ```

4. **提交交易**
   - 点击 "铸造" 按钮
   - MetaMask 弹出确认窗口
   - 确认交易（无 Gas 费用）

5. **展示铸造结果**
   - 交易哈希显示
   - 铸造的 Token ID
   - 确认时间（即时）

---

### 场景4: NFT 转让演示（3分钟）

**演示步骤：**

1. **切换到企业用户A账户**
   - 在 MetaMask 中切换账户

2. **查看持有的 NFT**
   - 进入 "我的资产" 页面
   - 显示刚才铸造的 NFT

3. **执行转让**
   ```
   接收方: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (企业用户B)
   Token ID: 1
   ```
   - 确认转让
   - 交易即时确认

4. **验证转让结果**
   - 企业用户A的 NFT 列表为空
   - 企业用户B 收到 NFT

---

### 场景5: 系统特性总结（2分钟）

**重点展示的技术特性：**

1. **即时交易确认**
   - 对比主网需要几分钟，本地节点秒级确认

2. **零成本测试**
   - 所有操作使用测试 ETH，无真实费用

3. **完整功能验证**
   - 铸造、转让、版税设置全部可用

4. **可控演示环境**
   - 网络状态稳定，无外部依赖

---

## 常见问题应对

### Q1: 节点启动失败
**解决方案：**
```bash
# 检查端口占用
netstat -ano | findstr :8545
# 结束占用进程后重试
```

### Q2: 合约部署失败
**解决方案：**
- 确保节点已启动
- 检查 `hardhat.config.ts` 中的 localhost 配置
- 清除缓存: `npm run clean`

### Q3: 前端无法连接
**解决方案：**
- 检查 `.env.local` 中的合约地址
- 确认 MetaMask 网络配置正确
- 检查浏览器控制台错误信息

---

## 演示后整理

### 关闭环境
```bash
# 1. 关闭 Hardhat 节点
# 按 Ctrl+C 关闭节点终端

# 2. 关闭前端服务
# 按 Ctrl+C 关闭前端终端

# 3. 清理环境（可选）
cd contracts
npm run clean
```

---

**文档结束**
```

---

## 9. 常见问题与解决方案

### 9.1 端口冲突问题

**问题**: `Error: listen EADDRINUSE: address already in use 127.0.0.1:8545`

**解决**:
```bash
# Windows - 查找并关闭占用端口的进程
netstat -ano | findstr :8545
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8545 | xargs kill -9
```

### 9.2 合约部署失败

**问题**: `network localhost doesn't exist` 或部署超时

**解决**:
1. 确保节点已启动: `npm run node`
2. 检查 `hardhat.config.ts` 中的网络配置
3. 清理缓存重新部署:
   ```bash
   npm run clean
   npm run compile
   npm run deploy:localhost
   ```

### 9.3 前端连接失败

**问题**: MetaMask 无法连接到本地节点

**解决**:
1. 确保网络配置正确:
   ```
   Network Name: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   ```
2. 重置 MetaMask 账户:
   - Settings → Advanced → Reset Account
3. 检查防火墙/杀毒软件是否拦截连接

---

## 10. 附录

### 10.1 快速参考命令

```bash
# 进入合约目录
cd contracts

# 启动本地节点
npm run node

# 编译合约
npm run compile

# 部署到本地
npm run deploy:localhost

# 运行测试
npm run test

# 查看 Gas 报告
REPORT_GAS=true npm run test

# 生成测试覆盖率报告
npm run test:coverage

# 清理构建缓存
npm run clean
```

### 10.2 预配置账户列表

| 索引 | 地址 | 私钥 | 推荐角色 |
|------|------|------|----------|
| #0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 | 部署者/管理员 |
| #1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | 企业用户A |
| #2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | 企业用户B |
| #3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 | 审计员 |

---

**文档结束**

---

*本文档由智能助手生成，基于 Hardhat 2.19 和 Solidity 0.8.20*  
*最后更新: 2026年2月*
