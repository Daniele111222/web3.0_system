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
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface EnterpriseMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: MemberRole;
  joined_at: string;
}

export interface Enterprise {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  wallet_address?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface EnterpriseDetail extends Enterprise {
  members: EnterpriseMember[];
}

export interface EnterpriseListResponse {
  items: Enterprise[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface EnterpriseCreateRequest {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
}

export interface EnterpriseUpdateRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
}

export interface InviteMemberRequest {
  user_id: string;
  role: MemberRole;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}
