import { ethers } from 'ethers';

export interface BlockchainService {
  connect: () => Promise<string>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  getAccount: () => string | null;
}

class Web3Service implements BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private account: string | null = null;

  async connect(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await this.provider.send('eth_requestAccounts', []);
    this.account = accounts[0] as string;
    this.signer = await this.provider.getSigner();

    return this.account;
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.account = null;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.signMessage(message);
  }

  getAccount(): string | null {
    return this.account;
  }
}

export const blockchainService = new Web3Service();
export default blockchainService;
