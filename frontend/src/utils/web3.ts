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
export const getContract = async (
  signerOrProvider?: ethers.Signer | ethers.Provider
): Promise<ethers.Contract> => {
  if (!contract) {
    const prov = signerOrProvider || (await initProvider());
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
