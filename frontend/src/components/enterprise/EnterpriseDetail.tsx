import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  message,
  Form,
  Input,
  Select,
  Divider,
  Avatar,
  Tooltip,
  Empty,
  Spin,
  Alert,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useEnterpriseStore, useAuthStore } from '../../store';
import type { Enterprise, EnterpriseMember, EnterpriseRole } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

interface FormData {
  name: string;
  description: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// 辅助函数：获取角色标签
const getRoleBadge = (role: EnterpriseRole): React.ReactNode => {
  // 定义角色配置映射
  const roleConfig: Record<EnterpriseRole, { color: string; icon: React.ReactNode; text: string }> =
    {
      owner: { color: 'gold', icon: <CrownOutlined />, text: '所有者' },
      admin: { color: 'red', icon: <SettingOutlined />, text: '管理员' },
      member: { color: 'blue', icon: <UserOutlined />, text: '成员' },
      viewer: { color: 'default', icon: <InfoCircleOutlined />, text: '观察者' },
    };

  // 使用类型断言确保类型安全
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;

  return (
    <Tag icon={config.icon} color={config.color}>
      {config.text}
    </Tag>
  );
};

export const EnterpriseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormData>();
  const [settingsForm] = Form.useForm();

  const {
    currentEnterprise,
    members,
    settings,
    isLoading,
    error,
    fetchEnterpriseById,
    fetchEnterpriseMembers,
    fetchEnterpriseSettings,
    updateEnterprise,
    deleteEnterprise,
    updateEnterpriseSettings,
    removeMember,
    // updateMemberRole, // TODO: 未来实现角色更改功能时启用
    clearCurrentEnterprise,
  } = useEnterpriseStore();

  const { user } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingsEditing, setIsSettingsEditing] = useState(false);

  // 检查当前用户是否是管理员或所有者
  const canManageEnterprise = () => {
    if (!currentEnterprise || !user) return false;
    // 添加类型注解
    const member = members.find((m: EnterpriseMember) => m.userId === user.id);
    return member?.role === 'admin' || member?.role === 'owner';
  };

  // 检查当前用户是否是所有者
  const isOwner = () => {
    if (!currentEnterprise || !user) return false;
    // 添加类型注解
    const member = members.find((m: EnterpriseMember) => m.userId === user.id);
    return member?.role === 'owner';
  };

  // 企业详情标签页配置
  const enterpriseTabs = [
    { key: 'overview', label: '概览', icon: <InfoCircleOutlined /> },
    { key: 'members', label: '成员管理', icon: <UserOutlined /> },
    { key: 'settings', label: '企业设置', icon: <SettingOutlined /> },
  ];

  useEffect(() => {
    if (id) {
      fetchEnterpriseById(id);
      fetchEnterpriseMembers(id);
      fetchEnterpriseSettings(id);
    }

    return () => {
      clearCurrentEnterprise();
    };
  }, [
    id,
    fetchEnterpriseById,
    fetchEnterpriseMembers,
    fetchEnterpriseSettings,
    clearCurrentEnterprise,
  ]);

  useEffect(() => {
    if (currentEnterprise && isEditing) {
      form.setFieldsValue({
        name: currentEnterprise.name,
        description: currentEnterprise.description,
        website: currentEnterprise.website,
        contactEmail: currentEnterprise.contactEmail,
        contactPhone: currentEnterprise.contactPhone,
      });
    }
  }, [currentEnterprise, isEditing, form]);

  useEffect(() => {
    if (settings && isSettingsEditing) {
      settingsForm.setFieldsValue({
        requireApproval: settings.requireApproval,
        allowPublicView: settings.allowPublicView,
        defaultMemberRole: settings.defaultMemberRole,
        notificationSettings: settings.notificationSettings,
      });
    }
  }, [settings, isSettingsEditing, settingsForm]);

  const handleUpdate = async (values: FormData) => {
    if (!id || !currentEnterprise) return;

    try {
      await updateEnterprise(id, {
        ...currentEnterprise,
        ...values,
      });
      message.success('企业信息更新成功');
      setIsEditing(false);
    } catch (err) {
      message.error('更新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteEnterprise(id);
      message.success('企业删除成功');
      navigate('/enterprises');
    } catch (err) {
      message.error('删除失败：' + (err instanceof Error ? err.message : '未知错误'));
      setIsDeleting(false);
    }
  };

  const handleUpdateSettings = async (values: any) => {
    if (!id) return;

    try {
      await updateEnterpriseSettings(id, values);
      message.success('设置更新成功');
      setIsSettingsEditing(false);
    } catch (err) {
      message.error('更新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 处理移除成员
  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;

    try {
      await removeMember(id, memberId);
      message.success('成员移除成功');
    } catch (err) {
      message.error('移除失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 辅助函数：判断企业是否活跃
  const isEnterpriseActive = (enterprise: Enterprise | null | undefined): boolean => {
    if (!enterprise) return false;
    return (
      enterprise.isActive === true ||
      enterprise.is_active === true ||
      enterprise.status === 'active'
    );
  };

  // 辅助函数：安全格式化日期
  const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '未知';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return '未知';
    }
  };

  // 辅助函数：安全格式化日期（仅日期）
  const formatDateOnly = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '未知';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return '未知';
    }
  };

  const renderOverview = () => {
    if (!currentEnterprise) return null;

    return (
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {currentEnterprise.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentEnterprise.name}</h2>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">ID: {currentEnterprise.id}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Tag color={isEnterpriseActive(currentEnterprise) ? 'green' : 'red'}>
                  {isEnterpriseActive(currentEnterprise) ? '活跃' : '停用'}
                </Tag>
              </div>
            </div>
          </div>
          {(canManageEnterprise() || isOwner()) && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                  编辑企业信息
                </Button>
              ) : (
                <Space>
                  <Button onClick={() => setIsEditing(false)}>取消</Button>
                  <Button type="primary" onClick={() => form.submit()}>
                    保存
                  </Button>
                </Space>
              )}
              {isOwner() && (
                <Popconfirm
                  title="确认删除企业"
                  description="删除企业后，所有相关数据将无法恢复，是否确认删除？"
                  onConfirm={handleDelete}
                  okText="确认删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true, loading: isDeleting }}
                >
                  <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                    删除企业
                  </Button>
                </Popconfirm>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              name: currentEnterprise.name,
              description: currentEnterprise.description,
              website: currentEnterprise.website,
              contactEmail: currentEnterprise.contactEmail,
              contactPhone: currentEnterprise.contactPhone,
            }}
          >
            <Form.Item
              name="name"
              label="企业名称"
              rules={[{ required: true, message: '请输入企业名称' }]}
            >
              <Input placeholder="请输入企业名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="企业描述"
              rules={[{ required: true, message: '请输入企业描述' }]}
            >
              <TextArea rows={4} placeholder="请输入企业描述" />
            </Form.Item>

            <Form.Item name="website" label="企业官网">
              <Input placeholder="请输入企业官网" />
            </Form.Item>

            <Form.Item name="contactEmail" label="联系邮箱">
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>

            <Form.Item name="contactPhone" label="联系电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Form>
        ) : (
          <>
            <Divider />
            <Descriptions column={2} bordered>
              <Descriptions.Item label="企业名称" span={2}>
                {currentEnterprise.name}
              </Descriptions.Item>
              <Descriptions.Item label="企业描述" span={2}>
                {currentEnterprise.description || '暂无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="企业官网">
                {currentEnterprise.website ? (
                  <a href={currentEnterprise.website} target="_blank" rel="noopener noreferrer">
                    {currentEnterprise.website}
                  </a>
                ) : (
                  '未设置'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="联系邮箱">
                {currentEnterprise.contactEmail || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {currentEnterprise.contactPhone || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDate(currentEnterprise.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="成员数量">{members.length} 人</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={isEnterpriseActive(currentEnterprise) ? 'green' : 'red'}>
                  {isEnterpriseActive(currentEnterprise) ? '活跃' : '停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成员数量">{members.length} 人</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={isEnterpriseActive(currentEnterprise) ? 'green' : 'red'}>
                  {isEnterpriseActive(currentEnterprise) ? '活跃' : '停用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    );
  };

  const renderMembers = () => {
    return (
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">成员管理</span>
            {canManageEnterprise() && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  // TODO: 打开邀请成员弹窗
                  message.info('邀请成员功能待实现');
                }}
              >
                邀请成员
              </Button>
            )}
          </div>
        }
      >
        {members.length === 0 ? (
          <Empty description="暂无成员" />
        ) : (
          <div className="space-y-4">
            {members.map((member: EnterpriseMember) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar size="large" icon={<UserOutlined />} className="bg-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.username || member.userId}
                    </div>
                    <div className="text-sm text-gray-500">{member.userEmail || '暂无邮箱'}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      加入时间: {formatDateOnly(member.joinedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getRoleBadge(member.role)}

                  {canManageEnterprise() && member.userId !== user?.id && (
                    <Space>
                      <Tooltip title="更改角色">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            // TODO: 更改角色逻辑
                            message.info('更改角色功能待实现');
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="移除成员">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            // 调用移除成员函数
                            handleRemoveMember(member.id);
                          }}
                        />
                      </Tooltip>
                    </Space>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const renderSettings = () => {
    return (
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">企业设置</span>
            {canManageEnterprise() && (
              <div className="flex gap-2">
                {isSettingsEditing ? (
                  <>
                    <Button onClick={() => setIsSettingsEditing(false)}>取消</Button>
                    <Button type="primary" onClick={() => settingsForm.submit()}>
                      保存设置
                    </Button>
                  </>
                ) : (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setIsSettingsEditing(true)}
                  >
                    编辑设置
                  </Button>
                )}
              </div>
            )}
          </div>
        }
      >
        {isSettingsEditing ? (
          <Form form={settingsForm} layout="vertical" onFinish={handleUpdateSettings}>
            <Form.Item name="requireApproval" label="成员加入需要审批" valuePropName="checked">
              <Select>
                <Option value={true}>需要审批</Option>
                <Option value={false}>不需要审批</Option>
              </Select>
            </Form.Item>

            <Form.Item name="allowPublicView" label="允许公开查看" valuePropName="checked">
              <Select>
                <Option value={true}>允许</Option>
                <Option value={false}>不允许</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="defaultMemberRole"
              label="默认成员角色"
              rules={[{ required: true, message: '请选择默认角色' }]}
            >
              <Select placeholder="选择默认角色">
                <Option value="member">成员</Option>
                <Option value="viewer">观察者</Option>
              </Select>
            </Form.Item>

            <Divider />

            <h4 className="font-medium mb-4">通知设置</h4>

            <Form.Item
              name={['notificationSettings', 'emailEnabled']}
              label="启用邮件通知"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>启用</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['notificationSettings', 'newMemberAlert']}
              label="新成员加入提醒"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>提醒</Option>
                <Option value={false}>不提醒</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['notificationSettings', 'roleChangeAlert']}
              label="角色变更提醒"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>提醒</Option>
                <Option value={false}>不提醒</Option>
              </Select>
            </Form.Item>
          </Form>
        ) : (
          <>
            {!settings ? (
              <Empty description="暂无设置信息" />
            ) : (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="成员加入需要审批">
                  {settings.requireApproval ? (
                    <Tag color="orange">需要审批</Tag>
                  ) : (
                    <Tag color="green">不需要审批</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="允许公开查看">
                  {settings.allowPublicView ? (
                    <Tag color="green">允许</Tag>
                  ) : (
                    <Tag color="orange">不允许</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="默认成员角色">
                  {getRoleBadge(settings.defaultMemberRole || 'member')}
                </Descriptions.Item>

                <Descriptions.Item label="邮件通知">
                  {settings.notificationSettings?.emailEnabled ? (
                    <Tag color="blue">已启用</Tag>
                  ) : (
                    <Tag color="default">已禁用</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="新成员提醒">
                  {settings.notificationSettings?.newMemberAlert ? (
                    <Tag color="green">已开启</Tag>
                  ) : (
                    <Tag color="default">已关闭</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="角色变更提醒">
                  {settings.notificationSettings?.roleChangeAlert ? (
                    <Tag color="green">已开启</Tag>
                  ) : (
                    <Tag color="default">已关闭</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={() => id && fetchEnterpriseById(id)}>重试</Button>}
        />
      </div>
    );
  }

  if (!currentEnterprise) {
    return (
      <div className="p-6">
        <Alert
          message="企业不存在"
          description="无法找到指定的企业信息"
          type="warning"
          showIcon
          action={<Button onClick={() => navigate('/enterprises')}>返回列表</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/enterprises')}
          className="mb-4"
        >
          返回企业列表
        </Button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {currentEnterprise.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentEnterprise.name}</h1>
            <div className="flex items-center gap-4 text-gray-500">
              <Tag color={isEnterpriseActive(currentEnterprise) ? 'green' : 'red'}>
                {isEnterpriseActive(currentEnterprise) ? '活跃' : '停用'}
              </Tag>
              <span>成员: {members.length} 人</span>
              <span>创建时间: {formatDateOnly(currentEnterprise.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {enterpriseTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  flex items-center gap-2
                  ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 标签页内容 */}
        <div className="mt-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'members' && renderMembers()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDetail;
