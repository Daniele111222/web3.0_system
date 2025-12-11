// Asset types
export type AssetType = 'PATENT' | 'TRADEMARK' | 'COPYRIGHT' | 'TRADE_SECRET' | 'DIGITAL_WORK';
export type LegalStatus = 'PENDING' | 'GRANTED' | 'EXPIRED';
export type AssetStatus = 'DRAFT' | 'MINTED' | 'TRANSFERRED' | 'LICENSED' | 'STAKED';

export interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  ipfs_cid: string;
  file_size: number;
  uploaded_at: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  creator: string;
  creation_date: string;
  legal_status: LegalStatus;
  application_number?: string;
  attachments: Attachment[];
  metadata: Record<string, unknown>;
  nft_token_id?: string;
  nft_contract_address?: string;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

// NFT types
export type NFTEventType = 'MINT' | 'TRANSFER' | 'LICENSE' | 'STAKE' | 'UNSTAKE';

export interface NFTEvent {
  event_type: NFTEventType;
  timestamp: string;
  transaction_hash: string;
  from_address?: string;
  to_address?: string;
  details: Record<string, unknown>;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  wallet_address?: string;
  email_verified: boolean;
}

// Enterprise types
export interface Enterprise {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseUser {
  id: string;
  user_id: string;
  enterprise_id: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joined_at: string;
}
