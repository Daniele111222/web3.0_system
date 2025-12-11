// Utility functions

/**
 * Format a date string to a localized format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Truncate an Ethereum address for display
 */
export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate IPFS gateway URL from CID
 */
export const getIPFSUrl = (cid: string): string => {
  return `https://ipfs.io/ipfs/${cid}`;
};

/**
 * Get block explorer URL for a transaction
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
