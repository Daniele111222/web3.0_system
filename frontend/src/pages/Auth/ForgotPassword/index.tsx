import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Card, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authService } from '../../../services/auth';
import styles from './index.module.less';

const { Title, Text } = Typography;

/**
 * 忘记密码页面
 * 提供邮箱输入表单，发送密码重置邮件
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  /**
   * 处理表单提交
   * 发送密码重置请求
   */
  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword({ email: values.email });
      setEmail(values.email);
      setSubmitted(true);
    } catch {
      // 即使出错也显示成功，防止枚举攻击
      setEmail(values.email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // 提交成功后显示成功页面
  if (submitted) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <CheckCircleOutlined />
            </div>
            <Title level={3} className={styles.successTitle}>
              邮件已发送
            </Title>
            <Text className={styles.successDescription}>
              如果该邮箱已注册，您将收到密码重置邮件。
              <br />
              请检查您的收件箱，并按照邮件中的指示操作。
            </Text>
            <div className={styles.emailInfo}>
              <MailOutlined /> {email}
            </div>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth')}
              className={styles.backButton}
            >
              返回登录
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 忘记密码表单页面
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
            忘记密码
          </Title>
          <Text className={styles.subtitle}>请输入您的注册邮箱，我们将向您发送密码重置链接。</Text>
        </div>

        {/* 提示信息 */}
        <Alert
          message="重置链接将在30分钟后过期，请及时操作。"
          type="info"
          showIcon
          className={styles.alert}
        />

        {/* 表单 */}
        <Form
          form={form}
          name="forgotPassword"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined className={styles.inputIcon} />}
              placeholder="请输入您的注册邮箱"
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
              发送重置邮件
            </Button>
          </Form.Item>
        </Form>

        {/* 帮助链接 */}
        <div className={styles.helpLinks}>
          <Text type="secondary">没有收到邮件？</Text>
          <Button type="link" onClick={() => navigate('/auth')}>
            尝试重新登录
          </Button>
        </div>
      </Card>
    </div>
  );
}
