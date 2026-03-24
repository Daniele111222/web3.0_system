import React, { useMemo } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Input,
  InputNumber,
  Modal,
  Space,
  Typography,
} from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import type { MintGasEstimateResponse, MintNFTRequest, NFTAssetCardData } from '../../../types/nft';

const { Text } = Typography;

interface MintConfirmModalProps {
  open: boolean;
  asset: NFTAssetCardData | null;
  mintAddress: string;
  royaltyEnabled: boolean;
  royaltyReceiver: string;
  royaltyFeeBps: number;
  gasEstimate: MintGasEstimateResponse | null;
  estimating: boolean;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: (request: MintNFTRequest) => Promise<void>;
  onEstimate: (request: MintNFTRequest) => Promise<void>;
  onMintAddressChange: (value: string) => void;
  onRoyaltyEnabledChange: (enabled: boolean) => void;
  onRoyaltyReceiverChange: (value: string) => void;
  onRoyaltyFeeBpsChange: (value: number) => void;
}

const buildMetadataPreview = (asset: NFTAssetCardData | null) => {
  if (!asset) {
    return {};
  }

  const attributes = [
    { trait_type: 'asset_type', value: asset.asset_type },
    { trait_type: 'asset_status', value: asset.status },
    { trait_type: 'asset_id', value: asset.asset_id },
  ];

  return {
    name: asset.asset_name,
    description: asset.description || '',
    image: asset.preview_image || asset.thumbnail_url || '',
    attributes,
    rights_declaration: asset.rights_declaration || '',
    original_creator: asset.creator_name || '',
    creation_timestamp: asset.creation_timestamp || asset.created_at,
  };
};

export const MintConfirmModal: React.FC<MintConfirmModalProps> = ({
  open,
  asset,
  mintAddress,
  royaltyEnabled,
  royaltyReceiver,
  royaltyFeeBps,
  gasEstimate,
  estimating,
  confirming,
  onCancel,
  onConfirm,
  onEstimate,
  onMintAddressChange,
  onRoyaltyEnabledChange,
  onRoyaltyReceiverChange,
  onRoyaltyFeeBpsChange,
}) => {
  const requestPayload = useMemo<MintNFTRequest>(
    () => ({
      minter_address: mintAddress || undefined,
      royalty_receiver: royaltyEnabled ? royaltyReceiver : undefined,
      royalty_fee_bps: royaltyEnabled ? royaltyFeeBps : undefined,
    }),
    [mintAddress, royaltyEnabled, royaltyReceiver, royaltyFeeBps]
  );

  const metadataPreview = useMemo(() => buildMetadataPreview(asset), [asset]);

  return (
    <Modal
      open={open}
      title="确认铸造参数"
      onCancel={onCancel}
      onOk={() => onConfirm(requestPayload)}
      okText="确认铸造"
      cancelText="取消"
      okButtonProps={{ loading: confirming, disabled: !asset }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="资产名称">{asset?.asset_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="资产类型">{asset?.asset_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="资产状态">{asset?.status || '-'}</Descriptions.Item>
        </Descriptions>

        <Input
          placeholder="接收地址（可选，不填则由后端自动回填）"
          value={mintAddress}
          onChange={(event) => onMintAddressChange(event.target.value)}
        />

        <Divider style={{ margin: '8px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            icon={<SafetyOutlined />}
            onClick={() => onRoyaltyEnabledChange(!royaltyEnabled)}
            type={royaltyEnabled ? 'primary' : 'default'}
          >
            {royaltyEnabled ? '已启用版税设置' : '启用版税设置'}
          </Button>
          {royaltyEnabled ? (
            <>
              <Input
                placeholder="版税接收地址"
                value={royaltyReceiver}
                onChange={(event) => onRoyaltyReceiverChange(event.target.value)}
              />
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1000}
                value={royaltyFeeBps}
                onChange={(value) => onRoyaltyFeeBpsChange(Number(value || 0))}
                addonAfter="BPS (0-1000)"
              />
            </>
          ) : null}
        </Space>

        <Button onClick={() => onEstimate(requestPayload)} loading={estimating} disabled={!asset}>
          预估 Gas
        </Button>

        {gasEstimate ? (
          <Alert
            type="info"
            message={`预计 Gas: ${gasEstimate.estimated.gas_limit}`}
            description={`预计费用: ${gasEstimate.estimated.estimated_fee_eth} ETH`}
            showIcon
          />
        ) : null}

        <Divider style={{ margin: '8px 0' }} />
        <Text strong>IPFS 元数据预览</Text>
        <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto' }}>
          {JSON.stringify(metadataPreview, null, 2)}
        </pre>
      </Space>
    </Modal>
  );
};

export default MintConfirmModal;
