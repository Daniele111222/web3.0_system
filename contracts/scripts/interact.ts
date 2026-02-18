import { ethers } from "hardhat";

async function main() {
  // 获取测试账户
  const [admin, userA, userB] = await ethers.getSigners();
  
  console.log("=== IP-NFT 本地交互测试 ===\n");
  
  // 获取已部署的合约（需要先部署）
  const contractAddress = process.env.LOCAL_IPNFT_CONTRACT || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
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
