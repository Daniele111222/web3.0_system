# 权属看板 - 区块链开发方案

## 1. 功能概述

在智能合约层面实现以下功能：
1. **NFT转移功能** - 支持企业将NFT转移给另一个钱包地址
2. **历史事件记录** - 记录所有链上转移事件供前端溯源
3. **权限控制** - 确保只有授权的钱包可以执行转移

---

## 2. 智能合约修改

### 2.1 更新 IPNFT.sol

在现有合约基础上添加转移相关功能：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IPNFT
 * @dev IP-NFT contract for enterprise intellectual property asset management
 * 
 * 扩展功能：
 * - NFT转移（transferFrom）
 * - 批量转移
 * - 转移历史事件记录
 * - 许可功能
 * - 质押功能
 */
contract IPNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    ERC2981, 
    Ownable, 
    ReentrancyGuard,
    Pausable
{
    // Token ID counter
    uint256 private _nextTokenId;

    // ==================== Events ====================
    
    // 转移事件
    event NFTTransferred(
        uint256 indexed tokenId, 
        address indexed from, 
        address indexed to,
        address operator,
        string reason
    );
    
    // 批量转移事件
    event BatchNFTTransferred(
        address indexed from, 
        address indexed to,
        uint256[] tokenIds,
        address operator
    );
    
    // 许可事件
    event NFTLicensed(
        uint256 indexed tokenId,
        address indexed licensor,
        address indexed licensee,
        string licenseType,
        uint256 startTime,
        uint256 endTime
    );
    
    // 解除许可事件
    event NFTLicenseRevoked(
        uint256 indexed tokenId,
        address indexed licensor,
        address indexed licensee
    );
    
    // 质押事件
    event NFTStaked(
        uint256 indexed tokenId,
        address indexed staker,
        string platform,
        string purpose
    );
    
    // 解除质押事件
    event NFTUnstaked(
        uint256 indexed tokenId,
        address indexed staker
    );

    // ==================== State Variables ====================
    
    // 转移记录映射 (tokenId => 转移次数)
    mapping(uint256 => uint256) public transferCount;
    
    // 许可信息 (tokenId => licensee => licenseInfo)
    mapping(uint256 => mapping(address => LicenseInfo)) public licenses;
    
    // 质押信息 (tokenId => stakeInfo)
    mapping(uint256 => StakeInfo) public stakes;
    
    // 是否启用转移白名单
    bool public transferWhitelistEnabled;
    
    // 转移白名单
    mapping(address => bool) public transferWhitelist;
    
    // 最小转移间隔（秒）
    uint256 public minTransferInterval;
    
    // 上次转移时间 (tokenId => timestamp)
    mapping(uint256 => uint256) public lastTransferTime;

    // ==================== Structs ====================
    
    struct LicenseInfo {
        bool exists;
        address licensor;
        string licenseType;  // "exclusive", "non-exclusive"
        uint256 startTime;
        uint256 endTime;
        string territory;
        string restrictions;
        bool active;
    }
    
    struct StakeInfo {
        bool exists;
        address staker;
        string platform;
        string purpose;
        uint256 stakeTime;
        bool active;
    }

    // ==================== Constructor ====================
    
    constructor() ERC721("IP-NFT", "IPNFT") Ownable(msg.sender) {
        _nextTokenId = 1;
        transferLockTime = 0;
        transferWhitelistEnabled = false;
        minTransferInterval = 0;
    }

    // ==================== Transfer Functions ====================
    
    /**
     * @dev 转移NFT（带原因记录）
     * @param from 转出方地址
     * @param to 接收方地址
     * @param tokenId Token ID
     * @param reason 转移原因（可选）
     */
    function transferNFT(
        address from, 
        address to, 
        uint256 tokenId,
        string calldata reason
    ) external nonReentrant whenNotPaused {
        require(from != address(0), "IPNFT: transfer from zero address");
        require(to != address(0), "IPNFT: transfer to zero address");
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        
        // 检查转移权限
        require(
            _isAuthorized(_ownerOf(tokenId), msg.sender, tokenId),
            "IPNFT: transfer caller is not owner nor approved"
        );
        
        // 检查转移间隔
        if (minTransferInterval > 0) {
            require(
                block.timestamp >= lastTransferTime[tokenId] + minTransferInterval,
                "IPNFT: transfer interval not reached"
            );
        }
        
        // 检查白名单
        if (transferWhitelistEnabled) {
            require(transferWhitelist[to], "IPNFT: recipient not whitelisted");
        }
        
        // 执行转移
        _transfer(from, to, tokenId);
        
        // 记录转移次数
        transferCount[tokenId]++;
        lastTransferTime[tokenId] = block.timestamp;
        
        // 清除许可和质押信息
        _clearLicense(tokenId);
        _clearStake(tokenId);
        
        // 记录事件
        emit NFTTransferred(tokenId, from, to, msg.sender, reason);
    }
    
    /**
     * @dev 批量转移NFT
     * @param from 转出方地址
     * @param to 接收方地址
     * @param tokenIds Token ID数组
     */
    function batchTransfer(
        address from,
        address to,
        uint256[] calldata tokenIds
    ) external nonReentrant whenNotPaused {
        require(from != address(0), "IPNFT: transfer from zero address");
        require(to != address(0), "IPNFT: transfer to zero address");
        require(tokenIds.length > 0, "IPNFT: empty tokenIds");
        require(tokenIds.length <= 50, "IPNFT: batch too large");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            require(_ownerOf(tokenId) == from, "IPNFT: not owner of token");
            require(
                _isAuthorized(from, msg.sender, tokenId),
                "IPNFT: transfer caller is not owner nor approved"
            );
            
            _transfer(from, to, tokenId);
            transferCount[tokenId]++;
            lastTransferTime[tokenId] = block.timestamp;
            
            _clearLicense(tokenId);
            _clearStake(tokenId);
        }
        
        emit BatchNFTTransferred(from, to, tokenIds, msg.sender);
    }

    // ==================== License Functions ====================
    
    /**
     * @dev 授予NFT许可
     * @param tokenId Token ID
     * @param licensee 被许可方地址
     * @param licenseType 许可类型
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param territory 地域限制
     * @param restrictions 使用限制
     */
    function grantLicense(
        uint256 tokenId,
        address licensee,
        string calldata licenseType,
        uint256 startTime,
        uint256 endTime,
        string calldata territory,
        string calldata restrictions
    ) external nonReentrant {
        require(_ownerOf(tokenId) == msg.sender, "IPNFT: not the owner");
        require(licensee != address(0), "IPNFT: licensee is zero address");
        
        licenses[tokenId][licensee] = LicenseInfo({
            exists: true,
            licensor: msg.sender,
            licenseType: licenseType,
            startTime: startTime,
            endTime: endTime,
            territory: territory,
            restrictions: restrictions,
            active: true
        });
        
        emit NFTLicensed(tokenId, msg.sender, licensee, licenseType, startTime, endTime);
    }
    
    /**
     * @dev 撤销许可
     * @param tokenId Token ID
     * @param licensee 被许可方地址
     */
    function revokeLicense(uint256 tokenId, address licensee) external {
        require(_ownerOf(tokenId) == msg.sender, "IPNFT: not the owner");
        require(licenses[tokenId][licensee].exists, "IPNFT: license does not exist");
        
        delete licenses[tokenId][licensee];
        
        emit NFTLicenseRevoked(tokenId, msg.sender, licensee);
    }
    
    /**
     * @dev 查询许可信息
     */
    function getLicenseInfo(uint256 tokenId, address licensee) 
        external 
        view 
        returns (
            bool exists,
            address licensor,
            string memory licenseType,
            uint256 startTime,
            uint256 endTime,
            bool active
        ) 
    {
        LicenseInfo memory info = licenses[tokenId][licensee];
        return (
            info.exists,
            info.licensor,
            info.licenseType,
            info.startTime,
            info.endTime,
            info.active
        );
    }
    
    /**
     * @dev 检查是否有有效许可
     */
    function hasValidLicense(uint256 tokenId, address user) external view returns (bool) {
        LicenseInfo memory info = licenses[tokenId][user];
        if (!info.exists || !info.active) return false;
        
        // 检查时间限制
        if (block.timestamp < info.startTime) return false;
        if (info.endTime > 0 && block.timestamp > info.endTime) return false;
        
        return true;
    }
    
    /**
     * @dev 清除许可信息（内部函数）
     */
    function _clearLicense(uint256 tokenId) internal {
        // 注意：这里需要记录所有被许可方，为了简化暂时不清除
        // 生产环境中应该维护一个被许可方列表
    }

    // ==================== Stake Functions ====================
    
    /**
     * @dev 质押NFT
     * @param tokenId Token ID
     * @param platform 质押平台
     * @param purpose 质押目的
     */
    function stakeNFT(
        uint256 tokenId,
        string calldata platform,
        string calldata purpose
    ) external nonReentrant {
        require(_ownerOf(tokenId) == msg.sender, "IPNFT: not the owner");
        require(!stakes[tokenId].active, "IPNFT: already staked");
        
        // 转移NFT到合约进行质押（可选，这里选择记录信息但不实际转移）
        // _transfer(msg.sender, address(this), tokenId);
        
        stakes[tokenId] = StakeInfo({
            exists: true,
            staker: msg.sender,
            platform: platform,
            purpose: purpose,
            stakeTime: block.timestamp,
            active: true
        });
        
        emit NFTStaked(tokenId, msg.sender, platform, purpose);
    }
    
    /**
     * @dev 解除质押
     * @param tokenId Token ID
     */
    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].exists, "IPNFT: not staked");
        require(stakes[tokenId].active, "IPNFT: not active stake");
        require(stakes[tokenId].staker == msg.sender, "IPNFT: not the staker");
        
        stakes[tokenId].active = false;
        
        emit NFTUnstaked(tokenId, msg.sender);
    }
    
    /**
     * @dev 查询质押信息
     */
    function getStakeInfo(uint256 tokenId) 
        external 
        view 
        returns (
            bool exists,
            address staker,
            string memory platform,
            string memory purpose,
            uint256 stakeTime,
            bool active
        ) 
    {
        StakeInfo memory info = stakes[tokenId];
        return (
            info.exists,
            info.staker,
            info.platform,
            info.purpose,
            info.stakeTime,
            info.active
        );
    }
    
    /**
     * @dev 清除质押信息（内部函数）
     */
    function _clearStake(uint256 tokenId) internal {
        if (stakes[tokenId].active) {
            stakes[tokenId].active = false;
        }
    }

    // ==================== Admin Functions ====================
    
    /**
     * @dev 设置最小转移间隔
     */
    function setMinTransferInterval(uint256 interval) external onlyOwner {
        minTransferInterval = interval;
    }
    
    /**
     * @dev 启用/禁用转移白名单
     */
    function setTransferWhitelistEnabled(bool enabled) external onlyOwner {
        transferWhitelistEnabled = enabled;
    }
    
    /**
     * @dev 添加/移除白名单地址
     */
    function setTransferWhitelist(address account, bool allowed) external onlyOwner {
        transferWhitelist[account] = allowed;
    }
    
    /**
     * @dev 批量设置白名单
     */
    function batchSetTransferWhitelist(address[] calldata accounts, bool allowed) 
        external 
        onlyOwner 
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            transferWhitelist[accounts[i]] = allowed;
        }
    }

    // ==================== Query Functions ====================
    
    /**
     * @dev 获取转移次数
     */
    function getTransferCount(uint256 tokenId) external view returns (uint256) {
        return transferCount[tokenId];
    }
    
    /**
     * @dev 获取所有者的所有Token IDs
     */
    function getOwnerTokenIds(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    // ==================== Required Overrides ====================
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // 继承原有的转移限制逻辑
        if (from != address(0) && to != address(0)) {
            require(
                block.timestamp >= mintTimestamps[tokenId] + transferLockTime,
                "IPNFT: transfer lock time not expired"
            );
            if (transferWhitelistEnabled) {
                require(transferWhitelist[to], "IPNFT: recipient not whitelisted");
            }
        }
        
        address result = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0) && from != to) {
            emit NFTTransferred(tokenId, from, to, auth, "");
        }
        
        return result;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

---

## 3. 索引服务（History Indexer）

为了高效查询历史记录，需要部署一个索引服务：

### 3.1 索引服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    索引服务架构                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Hardhat Node] ──events──> [Indexer Service]          │
│                           │                             │
│                           v                             │
│                    [PostgreSQL DB]                      │
│                           │                             │
│                           v                             │
│                    [Backend API] ──> [Frontend]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 索引服务实现

创建 `backend/app/services/indexer_service.py`:

```python
"""
区块链事件索引服务
用于索引NFT转移、许可、质押等链上事件
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
import asyncio
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from web3 import Web3
from eth_abi import decode

from app.core.database import Base, engine, get_session
from app.models.ownership import NFTTransfer, NFTLicense, NFTStake, TransferType, TransferStatus


class HistoryIndexer:
    """历史记录索引器"""
    
    # 事件签名
    EVENT_SIGNATURES = {
        'Transfer': 'Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
        'NFTTransferred': 'NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to, address operator, string reason)',
        'BatchNFTTransferred': 'BatchNFTTransferred(address indexed from, address indexed to, uint256[] tokenIds, address operator)',
        'NFTLicensed': 'NFTLicensed(uint256 indexed tokenId, address indexed licensor, address indexed licensee, string licenseType, uint256 startTime, uint256 endTime)',
        'NFTStaked': 'NFTStaked(uint256 indexed tokenId, address indexed staker, string platform, string purpose)',
        'NFTUnstaked': 'NFTUnstaked(uint256 indexed tokenId, address indexed staker)',
    }
    
    def __init__(self, w3: Web3, contract_address: str, contract_abi: list):
        self.w3 = w3
        self.contract_address = contract_address
        self.contract_abi = contract_abi
        self.contract = w3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )
    
    async def index_transfer_events(
        self,
        from_block: int,
        to_block: int,
        db: AsyncSession
    ) -> int:
        """索引转移事件"""
        
        # 获取转移事件日志
        transfer_event = self.contract.events.NFTTransferred()
        logs = transfer_event.getLogs(fromBlock=from_block, toBlock=to_block)
        
        count = 0
        for log in logs:
            try:
                # 解析事件数据
                event_data = {
                    'token_id': log['args']['tokenId'],
                    'from_address': log['args']['from'],
                    'to_address': log['args']['to'],
                    'operator': log['args']['operator'],
                    'reason': log['args'].get('reason', ''),
                    'tx_hash': log['transactionHash'].hex(),
                    'block_number': log['blockNumber'],
                    'block_timestamp': datetime.fromtimestamp(
                        self.w3.eth.get_block(log['blockNumber'])['timestamp']
                    ),
                }
                
                # 查询是否已存在
                stmt = select(NFTTransfer).where(
                    NFTTransfer.tx_hash == event_data['tx_hash']
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()
                
                if not existing:
                    # 创建记录
                    transfer = NFTTransfer(
                        token_id=event_data['token_id'],
                        contract_address=self.contract_address,
                        transfer_type=TransferType.TRANSFER,
                        from_address=event_data['from_address'],
                        to_address=event_data['to_address'],
                        operator_user_id=None,  # TODO: 关联到用户
                        tx_hash=event_data['tx_hash'],
                        block_number=event_data['block_number'],
                        block_timestamp=event_data['block_timestamp'],
                        status=TransferStatus.CONFIRMED,
                        remarks=event_data['reason'],
                    )
                    db.add(transfer)
                    count += 1
                    
            except Exception as e:
                print(f"Error indexing transfer event: {e}")
                continue
        
        if count > 0:
            await db.commit()
        
        return count
    
    async def index_license_events(
        self,
        from_block: int,
        to_block: int,
        db: AsyncSession
    ) -> int:
        """索引许可事件"""
        
        licensed_event = self.contract.events.NFTLicensed()
        logs = licensed_event.getLogs(fromBlock=from_block, toBlock=to_block)
        
        count = 0
        for log in logs:
            try:
                license_record = NFTLicense(
                    token_id=log['args']['tokenId'],
                    contract_address=self.contract_address,
                    licensor_address=log['args']['licensor'],
                    licensee_address=log['args']['licensee'],
                    license_type=log['args']['licenseType'],
                    start_date=datetime.fromtimestamp(log['args']['startTime']) if log['args']['startTime'] else None,
                    end_date=datetime.fromtimestamp(log['args']['endTime']) if log['args']['endTime'] else None,
                    territory='',
                    restrictions='',
                    status='ACTIVE',
                    tx_hash=log['transactionHash'].hex(),
                )
                db.add(license_record)
                count += 1
                
            except Exception as e:
                print(f"Error indexing license event: {e}")
                continue
        
        if count > 0:
            await db.commit()
        
        return count
    
    async def index_stake_events(
        self,
        from_block: int,
        to_block: int,
        db: AsyncSession
    ) -> int:
        """索引质押事件"""
        
        # 质押事件
        staked_event = self.contract.events.NFTStaked()
        staked_logs = staked_event.getLogs(fromBlock=from_block, toBlock=to_block)
        
        # 解除质押事件
        unstaked_event = self.contract.events.NFTUnstaked()
        unstaked_logs = unstaked_event.getLogs(fromBlock=from_block, toBlock=to_block)
        
        count = 0
        
        for log in staked_logs:
            try:
                stake = NFTStake(
                    token_id=log['args']['tokenId'],
                    contract_address=self.contract_address,
                    staker_address=log['args']['staker'],
                    platform=log['args']['platform'],
                    purpose=log['args']['purpose'],
                    stake_tx_hash=log['transactionHash'].hex(),
                    status='STAKED',
                )
                db.add(stake)
                count += 1
            except Exception as e:
                print(f"Error indexing stake event: {e}")
                continue
        
        for log in unstaked_logs:
            try:
                # 更新质押状态
                stmt = select(NFTStake).where(
                    NFTStake.token_id == log['args']['tokenId'],
                    NFTStake.staker_address == log['args']['staker'],
                    NFTStake.status == 'STAKED'
                )
                result = await db.execute(stmt)
                stake = result.scalar_one_or_none()
                
                if stake:
                    stake.status = 'UNSTAKED'
                    stake.unstaked_at = datetime.now()
                    stake.unstake_tx_hash = log['transactionHash'].hex()
                    count += 1
                    
            except Exception as e:
                print(f"Error indexing unstake event: {e}")
                continue
        
        if count > 0:
            await db.commit()
        
        return count
    
    async def index_from_block(
        self,
        from_block: int,
        to_block: Optional[int] = None
    ):
        """从指定区块开始索引所有事件"""
        
        if to_block is None:
            to_block = self.w3.eth.block_number
        
        async for session in get_session():
            try:
                # 索引各类事件
                transfer_count = await self.index_transfer_events(from_block, to_block, session)
                license_count = await self.index_license_events(from_block, to_block, session)
                stake_count = await self.index_stake_events(from_block, to_block, session)
                
                print(f"Indexed {transfer_count} transfers, {license_count} licenses, {stake_count} stakes")
                
            except Exception as e:
                print(f"Error in indexer: {e}")
                await session.rollback()
            finally:
                await session.close()


# 索引器单例
_indexer: Optional[HistoryIndexer] = None


def get_indexer() -> HistoryIndexer:
    """获取索引器实例"""
    global _indexer
    
    if _indexer is None:
        # 从配置初始化
        from app.core.config import settings
        from app.core.blockchain import get_blockchain_client
        
        blockchain = get_blockchain_client()
        
        _indexer = HistoryIndexer(
            w3=blockchain.w3,
            contract_address=blockchain.contract_address,
            contract_abi=blockchain.contract_abi
        )
    
    return _indexer
```

---

## 4. 部署配置

### 4.1 Hardhat 任务脚本

创建 `contracts/scripts/index-history.js`:

```javascript
const { task } = require("hardhat/config");

task("index-history", "Index NFT history events")
  .addParam("fromBlock", "Starting block number")
  .addParam("toBlock", "Ending block number (optional)")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const contractAddress = (await hre.deployments.get("IPNFT")).address;
    const contract = await ethers.getContractAt("IPNFT", contractAddress);
    
    const fromBlock = parseInt(taskArgs.fromBlock);
    const toBlock = taskArgs.toBlock 
      ? parseInt(taskArgs.toBlock) 
      : await ethers.provider.getBlockNumber();
    
    console.log(`Indexing events from block ${fromBlock} to ${toBlock}...`);
    
    // 索引转移事件
    const transferFilter = contract.filters.NFTTransferred();
    const transferLogs = await contract.queryFilter(transferFilter, fromBlock, toBlock);
    
    console.log(`Found ${transferLogs.length} transfer events`);
    
    for (const log of transferLogs) {
      console.log(`- Token #${log.args.tokenId}: ${log.args.from} -> ${log.args.to}`);
    }
    
    // 索引许可事件
    const licenseFilter = contract.filters.NFTLicensed();
    const licenseLogs = await contract.queryFilter(licenseFilter, fromBlock, toBlock);
    
    console.log(`Found ${licenseLogs.length} license events`);
    
    // 索引质押事件
    const stakeFilter = contract.filters.NFTStaked();
    const stakeLogs = await contract.queryFilter(stakeFilter, fromBlock, toBlock);
    
    console.log(`Found ${stakeLogs.length} stake events`);
    
    console.log("Indexing complete!");
  });

module.exports = {};
```

---

## 5. 测试用例

### 5.1 转移功能测试

创建 `contracts/test/Ownership.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { IPNFT } from "../typechain-types";

describe("IPNFT Ownership", function () {
  let ipnft: IPNFT;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const IPNFT = await ethers.getContractFactory("IPNFT");
    ipnft = await IPNFT.deploy();
    await ipnft.waitForDeployment();
  });

  describe("NFT Transfer", function () {
    it("Should mint and transfer NFT", async function () {
      // 铸造NFT
      const metadataURI = "ipfs://QmTest123";
      const tx = await ipnft.mint(owner.address, metadataURI);
      const receipt = await tx.wait();
      
      // 查找铸造的Token ID
      const tokenId = receipt.logs[0].args[2]; // 从事件中获取
      
      // 转移NFT
      await ipnft.transferNFT(owner.address, user1.address, tokenId, "Test transfer");
      
      // 验证所有权
      expect(await ipnft.ownerOf(tokenId)).to.equal(user1.address);
      
      // 验证转移次数
      expect(await ipnft.transferCount(tokenId)).to.equal(1);
    });

    it("Should batch transfer NFTs", async function () {
      // 铸造多个NFT
      const tokenIds = [];
      for (let i = 0; i < 3; i++) {
        const tx = await ipnft.mint(owner.address, `ipfs://QmTest${i}`);
        const receipt = await tx.wait();
        tokenIds.push(receipt.logs[0].args[2]);
      }
      
      // 批量转移
      await ipnft.batchTransfer(owner.address, user1.address, tokenIds);
      
      // 验证所有权
      for (const tokenId of tokenIds) {
        expect(await ipnft.ownerOf(tokenId)).to.equal(user1.address);
      }
    });
  });

  describe("NFT License", function () {
    it("Should grant and revoke license", async function () {
      // 铸造NFT
      const tx = await ipnft.mint(owner.address, "ipfs://QmTest");
      const receipt = await tx.wait();
      const tokenId = receipt.logs[0].args[2];
      
      // 授予许可
      await ipnft.grantLicense(
        tokenId,
        user1.address,
        "non-exclusive",
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // 30天
        "Global",
        "No modifications"
      );
      
      // 验证许可
      const licenseInfo = await ipnft.getLicenseInfo(tokenId, user1.address);
      expect(licenseInfo.exists).to.be.true;
      expect(licenseInfo.licensor).to.equal(owner.address);
      
      // 撤销许可
      await ipnft.revokeLicense(tokenId, user1.address);
      
      // 验证许可已撤销
      const afterRevoke = await ipnft.getLicenseInfo(tokenId, user1.address);
      expect(afterRevoke.exists).to.be.true;
      expect(afterRevoke.active).to.be.false;
    });
  });

  describe("NFT Stake", function () {
    it("Should stake and unstake NFT", async function () {
      // 铸造NFT
      const tx = await ipnft.mint(owner.address, "ipfs://QmTest");
      const receipt = await tx.wait();
      const tokenId = receipt.logs[0].args[2];
      
      // 质押
      await ipnft.stakeNFT(tokenId, "PlatformX", "Liquidity provision");
      
      // 验证质押
      const stakeInfo = await ipnft.getStakeInfo(tokenId);
      expect(stakeInfo.exists).to.be.true;
      expect(stakeInfo.staker).to.equal(owner.address);
      expect(stakeInfo.active).to.be.true;
      
      // 解除质押
      await ipnft.unstakeNFT(tokenId);
      
      // 验证解除质押
      const afterUnstake = await ipnft.getStakeInfo(tokenId);
      expect(afterUnstake.active).to.be.false;
    });
  });
});
```

---

## 6. 开发清单

### Phase 1: 智能合约
- [ ] 更新 `IPNFT.sol` 添加转移功能
- [ ] 添加许可功能
- [ ] 添加质押功能
- [ ] 添加事件记录

### Phase 2: 索引服务
- [ ] 创建索引服务类
- [ ] 实现转移事件索引
- [ ] 实现许可事件索引
- [ ] 实现质押事件索引
- [ ] 配置定时任务

### Phase 3: 测试
- [ ] 编写转移功能测试
- [ ] 编写许可功能测试
- [ ] 编写质押功能测试
- [ ] 集成测试

### Phase 4: 部署
- [ ] 部署更新后的合约
- [ ] 配置索引服务
- [ ] 历史数据回溯索引
