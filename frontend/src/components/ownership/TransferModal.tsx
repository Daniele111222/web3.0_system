/**
 * NFT 转移模态框组件
 * 用于将 NFT 转移到其他钱包地址
 */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Alert, Typography, Divider, message } from 'antd';
import { SendOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ownershipService } from '../../services/ownership';
import type { OwnershipAsset, TransferResponse } from '../../types/ownership';

const { Text } = Typography;
const { TextArea } = Input;

interface TransferModalProps {
  visible: boolean;
  asset: OwnershipAsset | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ visible, asset, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);

  // 模态框关闭时重置表单和结果
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setResult(null);
    }
  }, [visible, form]);

  // 提交转移表单
  const handleSubmit = async (values: { to_address: string; remarks: string }) => {
    if (!asset) return;

    setLoading(true);
    try {
      const res = await ownershipService.transferNFT({
        token_id: asset.token_id,
        to_address: values.to_address,
        remarks: values.remarks,
      });
      setResult(res);
      message.success('NFT 转移成功');
      // 延迟关闭，让用户看到成功状态
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            error.message
          : '请稍后重试';
      Modal.error({
        title: '转移失败',
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SendOutlined />
          <span>NFT 转移</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      {asset && !result && (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Alert
            message="转移须知"
            description="NFT 转移一旦确认将不可撤销。请确保接收方地址正确。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item label="当前资产">
            <Text strong>{asset.asset_name}</Text>
            <br />
            <Text type="secondary">Token ID: #{asset.token_id}</Text>
          </Form.Item>

          <Form.Item
            name="to_address"
            label="接收方钱包地址"
            rules={[
              { required: true, message: '请输入接收方钱包地址' },
              {
                pattern: /^0x[a-fA-F0-9]{40}$/,
                message: '请输入有效的以太坊地址',
              },
            ]}
          >
            <Input prefix={<WalletOutlined />} placeholder="0x..." />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} placeholder="可选填写转移备注" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认转移
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {result && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <p style={{ marginTop: 16, fontSize: 16 }}>转移成功</p>
          <Text type="secondary">交易哈希:</Text>
          <br />
          <Text copyable style={{ fontFamily: 'monospace' }}>
            {result.tx_hash}
          </Text>
          <Divider />
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default TransferModal;
