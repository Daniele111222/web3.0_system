import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Calendar, IdCard, Mail, User, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store';
import { userService } from '../../services/user';
import type { UserProfileUpdateRequest } from '../../services/user';
import type { UserResponse } from '../../services/auth';
import './style.less';

const { Text, Title } = Typography;

interface ProfileFormValues {
  username: string;
  full_name?: string;
  avatar_url?: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString();
};

const toFormValues = (profile: UserResponse): ProfileFormValues => ({
  username: profile.username,
  full_name: profile.full_name || '',
  avatar_url: profile.avatar_url || '',
});

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const updateUser = useAuthStore((state) => state.updateUser);
  const cachedUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserResponse | null>(cachedUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayName = useMemo(
    () => profile?.full_name || profile?.username || profile?.email || '-',
    [profile]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getCurrentProfile();
      setProfile(data);
      updateUser(data);
      form.setFieldsValue(toFormValues(data));
    } finally {
      setLoading(false);
    }
  }, [form, updateUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (cachedUser) {
      form.setFieldsValue(toFormValues(cachedUser));
    }
  }, [cachedUser, form]);

  const handleReset = useCallback(() => {
    if (!profile) return;
    form.setFieldsValue(toFormValues(profile));
  }, [form, profile]);

  const handleSubmit = useCallback(
    async (values: ProfileFormValues) => {
      setSaving(true);
      try {
        const payload: UserProfileUpdateRequest = {
          username: values.username,
          full_name: values.full_name?.trim() || null,
          avatar_url: values.avatar_url?.trim() || null,
        };
        const data = await userService.updateCurrentProfile(payload);
        setProfile(data);
        updateUser(data);
        form.setFieldsValue(toFormValues(data));
        message.success('Profile updated');
      } finally {
        setSaving(false);
      }
    },
    [form, updateUser]
  );

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <Title level={2} className="profile-title">
            User Profile
          </Title>
          <Text className="profile-subtitle">
            Manage account identity and public profile fields.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadProfile} loading={loading}>
          Refresh
        </Button>
      </div>

      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} lg={8}>
          <Card className="profile-summary-card" bordered={false}>
            {loading && !profile ? (
              <Skeleton active avatar paragraph={{ rows: 5 }} />
            ) : (
              <Space direction="vertical" size={18} className="profile-summary">
                <Avatar size={88} src={profile?.avatar_url} icon={<User size={36} />} />
                <div className="profile-identity">
                  <Title level={3}>{displayName}</Title>
                  <Text copyable className="profile-email">
                    {profile?.email || '-'}
                  </Text>
                </div>
                <div className="profile-status-row">
                  <Tag color={profile?.is_active ? 'success' : 'default'}>
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </Tag>
                  <Tag
                    color={profile?.is_verified ? 'processing' : 'warning'}
                    icon={profile?.is_verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  >
                    {profile?.is_verified ? 'Verified' : 'Unverified'}
                  </Tag>
                </div>
                <Descriptions column={1} size="small" className="profile-meta">
                  <Descriptions.Item
                    label={
                      <span>
                        <IdCard size={14} /> User ID
                      </span>
                    }
                  >
                    <Text copyable>{profile?.id || '-'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span>
                        <Wallet size={14} /> Wallet
                      </span>
                    }
                  >
                    {profile?.wallet_address ? <Text copyable>{profile.wallet_address}</Text> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span>
                        <Calendar size={14} /> Created
                      </span>
                    }
                  >
                    {formatDateTime(profile?.created_at)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <span>
                        <Mail size={14} /> Last Login
                      </span>
                    }
                  >
                    {formatDateTime(profile?.last_login_at)}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="profile-form-card" bordered={false}>
            {loading && !profile ? (
              <Skeleton active paragraph={{ rows: 7 }} />
            ) : (
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={profile ? toFormValues(profile) : undefined}
                onFinish={handleSubmit}
                className="profile-form"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="username"
                      label="Username"
                      rules={[
                        { required: true, message: 'Please enter a username' },
                        { min: 3, max: 50, message: 'Username must be 3 to 50 characters' },
                        {
                          pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                          message: 'Start with a letter; use letters, numbers, and underscores',
                        },
                      ]}
                    >
                      <Input prefix={<User size={16} />} placeholder="username" maxLength={50} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="full_name" label="Full Name" rules={[{ max: 100 }]}>
                      <Input placeholder="Display name" maxLength={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="avatar_url"
                  label="Avatar URL"
                  rules={[
                    { type: 'url', warningOnly: true, message: 'Use a valid URL when possible' },
                  ]}
                >
                  <Input placeholder="https://example.com/avatar.png" maxLength={500} />
                </Form.Item>

                <div className="profile-readonly-grid">
                  <div className="profile-readonly-item">
                    <span>Email</span>
                    <Text copyable>{profile?.email || '-'}</Text>
                  </div>
                  <div className="profile-readonly-item">
                    <span>Wallet Address</span>
                    <Text copyable={!!profile?.wallet_address}>
                      {profile?.wallet_address || '-'}
                    </Text>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <Button onClick={handleReset} disabled={saving || !profile}>
                    Reset
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
