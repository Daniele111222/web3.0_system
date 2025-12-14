import { ethers } from "hardhat";

async function main() {
  console.log("Deploying IPNFT contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy IPNFT contract
  const IPNFT = await ethers.getContractFactory("IPNFT");
  const ipnft = await IPNFT.deploy();

  await ipnft.waitForDeployment();

  const contractAddress = await ipnft.getAddress();
  console.log("IPNFT deployed to:", contractAddress);

  // Log deployment info
  console.log("\n--- Deployment Summary ---");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());

  // Verify contract on block explorer (if not localhost)
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== 31337n) {
    console.log("\nWaiting for block confirmations...");
    // Wait for a few block confirmations
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log("To verify the contract, run:");
    console.log(`npx hardhat verify --network <network> ${contractAddress}`);
  }

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
