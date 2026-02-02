// 工具函数

/**
 * 将日期字符串格式化为本地格式
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * 截断以太坊地址用于显示
 */
export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * 将文件大小格式化为人类可读的格式
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 根据 CID 生成 IPFS 网关 URL
 */
export const getIPFSUrl = (cid: string): string => {
  return `https://ipfs.io/ipfs/${cid}`;
};

/**
 * 获取交易的区块浏览器 URL
 */
export const getExplorerUrl = (
  txHash: string,
  chain: 'ETHEREUM' | 'POLYGON' | 'BSC' = 'POLYGON'
): string => {
  const explorers = {
    ETHEREUM: 'https://etherscan.io/tx/',
    POLYGON: 'https://polygonscan.com/tx/',
    BSC: 'https://bscscan.com/tx/',
  };
  return `${explorers[chain]}${txHash}`;
};
