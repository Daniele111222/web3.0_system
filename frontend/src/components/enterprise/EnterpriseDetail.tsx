import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Shield,
  Edit3,
  Settings,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { MemberList } from './MemberList';
import { InviteMemberDialog } from './InviteMemberDialog';
import { EnterpriseForm } from './EnterpriseForm';
import type { Enterprise, EnterpriseMember } from '../../types/enterprise';
import './Enterprise.less';

interface EnterpriseDetailProps {
  enterpriseId: string;
  onBack: () => void;
}

// 模拟企业数据
const mockEnterprise: Enterprise = {
  id: '1',
  name: '科技创新有限公司',
  description:
    '专注于人工智能和区块链技术研发，致力于为企业提供数字化解决方案。公司成立于2020年，拥有核心技术专利30余项。',
  address: '北京市海淀区中关村软件园A座18层',
  contactEmail: 'contact@tech-innov.com',
  contactPhone: '010-88888888',
  website: 'https://www.tech-innov.com',
  industry: '科技/软件',
  scale: '100-500人',
  status: 'active',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z',
};

// 模拟成员数据
const mockMembers: EnterpriseMember[] = [
  {
    id: '1',
    enterpriseId: '1',
    userId: 'user1',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15T00:00:00Z',
    user: {
      id: 'user1',
      email: 'ceo@tech-innov.com',
      name: '张明远',
      avatar: null,
    },
  },
  {
    id: '2',
    enterpriseId: '1',
    userId: 'user2',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-01T00:00:00Z',
    user: {
      id: 'user2',
      email: 'cto@tech-innov.com',
      name: '李思涵',
      avatar: null,
    },
  },
  {
    id: '3',
    enterpriseId: '1',
    userId: 'user3',
    role: 'member',
    status: 'active',
    joinedAt: '2024-03-15T00:00:00Z',
    user: {
      id: 'user3',
      email: 'dev@tech-innov.com',
      name: '王浩宇',
      avatar: null,
    },
  },
];

// 活动日志模拟数据
const activityLogs = [
  { id: '1', action: '企业信息更新', user: '张明远', time: '2小时前', icon: Edit3 },
  { id: '2', action: '新成员加入', user: '李思涵', time: '5小时前', icon: Users },
  { id: '3', action: '权限变更', user: '张明远', time: '1天前', icon: Shield },
  { id: '4', action: '企业创建', user: '张明远', time: '10个月前', icon: Building2 },
];

export const EnterpriseDetail = ({ enterpriseId, onBack }: EnterpriseDetailProps) => {
  const [enterprise] = useState<Enterprise>(mockEnterprise);
  const [members] = useState<EnterpriseMember[]>(mockMembers);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // 获取角色徽章
  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      owner: { label: '所有者', className: 'role-owner' },
      admin: { label: '管理员', className: 'role-admin' },
      member: { label: '成员', className: 'role-member' },
    };
    const config = roleConfig[role] || roleConfig.member;
    return <span className={`role-badge ${config.className}`}>{config.label}</span>;
  };

  // 渲染概览标签
  const renderOverview = () => (
    <div className="enterprise-detail-sections">
      <div className="detail-main">
        {/* 企业信息卡片 */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} />
              企业信息
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEditForm(true)}>
              <Edit3 size={16} />
              编辑
            </button>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">企业全称</span>
                <span className="info-value">{enterprise.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">所属行业</span>
                <span className="info-value">{enterprise.industry || '科技/软件'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">企业规模</span>
                <span className="info-value">{enterprise.scale || '100-500人'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">成立时间</span>
                <span className="info-value">
                  {new Date(enterprise.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="info-item info-item-full">
                <span className="info-label">企业简介</span>
                <p className="info-description">{enterprise.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 联系信息 */}
        <div className="card card-elevated" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} />
              联系信息
            </h3>
          </div>
          <div className="card-body">
            <div className="contact-list">
              <div className="contact-item">
                <div className="contact-icon">
                  <MapPin size={18} />
                </div>
                <div className="contact-content">
                  <span className="contact-label">企业地址</span>
                  <span className="contact-value">{enterprise.address}</span>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <Mail size={18} />
                </div>
                <div className="contact-content">
                  <span className="contact-label">联系邮箱</span>
                  <span className="contact-value">{enterprise.contactEmail}</span>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <Phone size={18} />
                </div>
                <div className="contact-content">
                  <span className="contact-label">联系电话</span>
                  <span className="contact-value">{enterprise.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="detail-sidebar">
        {/* 快速统计 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={16} />
              快速统计
            </h3>
          </div>
          <div className="card-body">
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-value">{members.length}</span>
                <span className="quick-stat-label">团队成员</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">12</span>
                <span className="quick-stat-label">IP资产</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">85%</span>
                <span className="quick-stat-label">完成度</span>
              </div>
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={16} />
              最近活动
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="activity-list">
              {activityLogs.map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-icon">
                    <log.icon size={14} />
                  </div>
                  <div className="activity-content">
                    <span className="activity-action">{log.action}</span>
                    <span className="activity-meta">
                      {log.user} · {log.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
              查看全部活动
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染成员标签
  const renderMembers = () => (
    <div className="enterprise-detail-sections">
      <div className="detail-main">
        <MemberList
          members={members}
          onInvite={() => setShowInviteDialog(true)}
          onRemoveMember={(memberId) => {
            console.log('移除成员:', memberId);
          }}
          onUpdateRole={(memberId, role) => {
            console.log('更新角色:', memberId, role);
          }}
        />
      </div>
    </div>
  );

  // 渲染设置标签
  const renderSettings = () => (
    <div className="enterprise-detail-sections">
      <div className="detail-main">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Settings size={18} />
              企业设置
            </h3>
          </div>
          <div className="card-body">
            <p
              className="settings-placeholder"
              style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '3rem' }}
            >
              企业设置功能开发中...
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="enterprise-page">
      {/* Aurora Background Effect */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-1" />
        <div className="aurora-layer aurora-2" />
        <div className="aurora-layer aurora-3" />
      </div>

      {/* Grid Pattern */}
      <div className="enterprise-grid-pattern" />

      {/* Header */}
      <header className="enterprise-header">
        <div className="enterprise-header-content">
          <div className="enterprise-header-left">
            <button className="enterprise-back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="enterprise-header-title-group">
              <h1 className="enterprise-header-title">{enterprise.name}</h1>
              <p className="enterprise-header-subtitle">
                企业ID: {enterprise.id} · 创建于{' '}
                {new Date(enterprise.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="enterprise-header-actions">
            {getStatusBadge(enterprise.status)}
            <button className="btn btn-secondary btn-icon-only">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginTop: '1.5rem', marginBottom: '-1px' }}>
          <button
            className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Building2 size={16} />
            概览
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} />
            成员
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            设置
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="enterprise-main">
        <div className="enterprise-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'members' && renderMembers()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {/* Invite Member Modal */}
      {showInviteDialog && (
        <InviteMemberDialog
          enterpriseId={enterpriseId}
          onClose={() => setShowInviteDialog(false)}
          onInvite={(email, role) => {
            console.log('邀请成员:', email, role);
            setShowInviteDialog(false);
          }}
        />
      )}

      {/* Edit Enterprise Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">编辑企业信息</h2>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <EnterpriseForm
                initialData={enterprise}
                onSubmit={(data) => {
                  console.log('更新企业:', data);
                  setShowEditForm(false);
                }}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 获取状态徽章
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: '运营中', className: 'badge badge-success' },
    pending: { label: '审核中', className: 'badge badge-warning' },
    inactive: { label: '已停用', className: 'badge badge-danger' },
  };
  const config = statusConfig[status] || statusConfig.inactive;
  return <span className={config.className}>{config.label}</span>;
};
