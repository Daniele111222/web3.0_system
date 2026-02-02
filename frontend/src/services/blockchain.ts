import { ethers } from 'ethers';

export interface BlockchainService {
  connect: () => Promise<string>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  getAccount: () => string | null;
}

/**
 * Web3 服务类
 * 实现区块链钱包连接、签名等功能
 */
class Web3Service implements BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private account: string | null = null;

  /**
   * 连接钱包
   * @returns 钱包地址
   * @throws 如果 MetaMask 未安装则抛出错误
   */
  async connect(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask 未安装');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await this.provider.send('eth_requestAccounts', []);
    this.account = accounts[0] as string;
    this.signer = await this.provider.getSigner();

    return this.account;
  }

  /**
   * 断开钱包连接
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.account = null;
  }

  /**
   * 签名消息
   * @param message 要签名的消息
   * @returns 签名结果
   * @throws 如果钱包未连接则抛出错误
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('钱包未连接');
    }
    return await this.signer.signMessage(message);
  }

  /**
   * 获取当前账户地址
   * @returns 账户地址或 null
   */
  getAccount(): string | null {
    return this.account;
  }
}

export const blockchainService = new Web3Service();
export default blockchainService;
