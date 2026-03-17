import { PinataSDK } from 'pinata';

// Pinata SDK 实例
let pinataClient: PinataSDK | null = null;

// 配置
const PINATA_JWT_TOKEN = import.meta.env.VITE_PINATA_JWT_TOKEN || '';
const PINATA_GATEWAY_URL =
  import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';

/**
 * 获取 Pinata SDK 实例
 * @returns PinataSDK 实例
 */
export function getPinataClient(): PinataSDK {
  if (!pinataClient) {
    if (!PINATA_JWT_TOKEN) {
      throw new Error('Pinata JWT Token 未配置，请在 .env 文件中设置 VITE_PINATA_JWT_TOKEN');
    }

    pinataClient = new PinataSDK({
      pinataJwt: PINATA_JWT_TOKEN,
      pinataGateway: PINATA_GATEWAY_URL,
    });
  }

  return pinataClient;
}

/**
 * IPFS 上传结果
 */
export interface IPFSUploadResult {
  /** IPFS CID */
  cid: string;
  /** 文件大小（字节） */
  size: number;
  /** 上传时间戳 */
  timestamp: string;
  /** 网关访问 URL */
  gatewayUrl: string;
  /** 文件名 */
  name: string;
}

/**
 * 上传文件到 IPFS
 * @param file 要上传的文件
 * @param name 可选的自定义文件名
 * @returns 上传结果
 */
export async function uploadFile(file: File, name?: string): Promise<IPFSUploadResult> {
  const client = getPinataClient();

  const uploadName = name || file.name || 'unnamed';
  const result = await client.upload.public.file(file);

  return {
    cid: result.cid,
    size: result.size || 0,
    timestamp: new Date().toISOString(),
    gatewayUrl: `${PINATA_GATEWAY_URL}/${result.cid}`,
    name: uploadName,
  };
}

/**
 * 上传 JSON 数据到 IPFS
 * @param data JSON 数据对象
 * @param name 文件名
 * @param metadata 可选的元数据
 * @returns 上传结果
 */
export async function uploadJSON(
  data: unknown,
  name: string = 'data.json',
  metadata?: Record<string, unknown>
): Promise<IPFSUploadResult> {
  const client = getPinataClient();
  const result = await client.upload.public.json({
    content: data,
    metadata: metadata
      ? {
          name,
          keyvalues: metadata,
        }
      : {
          name,
        },
  });

  return {
    cid: result.cid,
    size: result.size || 0,
    timestamp: new Date().toISOString(),
    gatewayUrl: `${PINATA_GATEWAY_URL}/${result.cid}`,
    name: name,
  };
}

/**
 * 上传文本到 IPFS
 * @param text 文本内容
 * @param name 文件名
 * @returns 上传结果
 */
export async function uploadText(
  text: string,
  name: string = 'text.txt'
): Promise<IPFSUploadResult> {
  const blob = new Blob([text], { type: 'text/plain' });
  const file = new File([blob], name, { type: 'text/plain' });

  return uploadFile(file, name);
}

/**
 * 获取文件的网关 URL
 * @param cid IPFS CID
 * @returns 网关 URL
 */
export function getGatewayUrl(cid: string): string {
  return `${PINATA_GATEWAY_URL}/${cid}`;
}

/**
 * 从 CID 删除文件（取消固定）
 * @param cid IPFS CID
 */
export async function deleteFile(cid: string): Promise<void> {
  getPinataClient();
  const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${PINATA_JWT_TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`删除 Pinata 文件失败: ${response.status}`);
  }
}

/**
 * 验证配置是否正确
 * @returns 配置是否有效
 */
export function validateConfig(): boolean {
  if (!PINATA_JWT_TOKEN) {
    console.error('[IPFS] Pinata JWT Token 未配置');
    return false;
  }

  if (!PINATA_GATEWAY_URL) {
    console.error('[IPFS] Pinata Gateway URL 未配置');
    return false;
  }

  return true;
}
