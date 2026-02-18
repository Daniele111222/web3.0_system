import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Alert, Card, Typography, Spin } from 'antd';
import {
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { authService } from '../../../services/auth';
import styles from './index.module.less';

const { Title, Text } = Typography;

/**
 * 重置密码页面
 * 通过邮件中的token重置密码
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * 验证token有效性
   */
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setErrorMessage('重置链接无效，缺少令牌参数');
        setVerifying(false);
        return;
      }

      try {
        const response = await authService.verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setErrorMessage(response.message || '重置链接无效或已过期');
        }
      } catch {
        setTokenValid(false);
        setErrorMessage('重置链接验证失败，请重新申请');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  /**
   * 处理密码重置提交
   */
  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        new_password: values.newPassword,
      });

      if (response.success) {
        setResetSuccess(true);
      } else {
        setErrorMessage(response.message || '密码重置失败');
      }
    } catch {
      setErrorMessage('密码重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证中状态
  if (verifying) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.loadingWrapper}>
            <Spin size="large" />
            <Text className={styles.loadingText}>正在验证链接有效性...</Text>
          </div>
        </Card>
      </div>
    );
  }

  // Token无效状态
  if (tokenValid === false) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Button
            type="link"
            className={styles.backLink}
            onClick={() => navigate('/auth')}
            icon={<ArrowLeftOutlined />}
          >
            返回登录
          </Button>

          <div className={styles.errorWrapper}>
            <div className={styles.errorIcon}>
              <CloseCircleOutlined />
            </div>
            <Title level={3} className={styles.errorTitle}>
              链接已过期或无效
            </Title>
            <Alert
              message={errorMessage || '该密码重置链接已过期或无效'}
              type="error"
              showIcon
              className={styles.errorAlert}
            />
            <Text className={styles.errorHelp}>
              密码重置链接有效期为30分钟，且只能使用一次。
              <br />
              请重新申请密码重置。
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth/forgot-password')}
              className={styles.retryButton}
            >
              重新申请
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 重置成功状态
  if (resetSuccess) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <CheckCircleOutlined />
            </div>
            <Title level={3} className={styles.successTitle}>
              密码重置成功
            </Title>
            <Text className={styles.successDescription}>
              您的密码已成功重置。
              <br />
              请使用新密码登录您的账户。
            </Text>
            <Alert
              message="为了账户安全，您的所有设备将被登出，需要重新登录。"
              type="info"
              showIcon
              className={styles.successAlert}
            />
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth')}
              className={styles.loginButton}
            >
              前往登录
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 重置密码表单
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {/* 返回按钮 */}
        <Button
          type="link"
          className={styles.backLink}
          onClick={() => navigate('/auth')}
          icon={<ArrowLeftOutlined />}
        >
          返回登录
        </Button>

        {/* 标题 */}
        <div className={styles.header}>
          <Title level={3} className={styles.title}>
            重置密码
          </Title>
          <Text className={styles.subtitle}>请设置您的新密码，密码长度至少6位。</Text>
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            className={styles.errorAlert}
          />
        )}

        {/* 表单 */}
        <Form
          form={form}
          name="resetPassword"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
              { max: 128, message: '密码长度不能超过128位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="请输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="请再次输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item className={styles.submitItem}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className={styles.submitButton}
            >
              重置密码
            </Button>
          </Form.Item>
        </Form>

        {/* 提示信息 */}
        <div className={styles.securityTips}>
          <Text type="secondary" className={styles.tipText}>
            为了您的账户安全，请设置包含字母和数字的强密码
          </Text>
        </div>
      </Card>
    </div>
  );
}
