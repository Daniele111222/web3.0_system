import { useEffect, useState } from 'react';
import { useEnterprise } from '../../hooks/useEnterprise';
import { useAuthStore } from '../../store';
import { EnterpriseForm } from './EnterpriseForm';
import { MemberList } from './MemberList';
import { InviteMemberDialog } from './InviteMemberDialog';
import type { EnterpriseUpdateRequest, MemberRole } from '../../types';
import './Enterprise.css';

interface EnterpriseDetailProps {
  enterpriseId: string;
  onBack: () => void;
}

export function EnterpriseDetail({ enterpriseId, onBack }: EnterpriseDetailProps) {
  const { user } = useAuthStore();
  const {
    currentEnterprise,
    isLoading,
    actionLoading,
    error,
    fetchEnterprise,
    updateEnterprise,
    deleteEnterprise,
    inviteMember,
    updateMemberRole,
    removeMember,
  } = useEnterprise();

  const [isEditing, setIsEditing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchEnterprise(enterpriseId);
  }, [enterpriseId, fetchEnterprise]);

  if (isLoading && !currentEnterprise) {
    return <div className="loading">加载中...</div>;
  }

  if (error && !currentEnterprise) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button className="btn-primary" onClick={onBack}>
          返回
        </button>
      </div>
    );
  }

  if (!currentEnterprise) {
    return null;
  }

  const currentMember = currentEnterprise.members.find((m) => m.user_id === user?.id);
  const isOwner = currentMember?.role === 'owner';
  const isAdmin = currentMember?.role === 'admin' || isOwner;

  const handleUpdate = async (data: EnterpriseUpdateRequest) => {
    await updateEnterprise(enterpriseId, data);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteEnterprise(enterpriseId);
    onBack();
  };

  const handleInvite = async (userId: string, role: MemberRole) => {
    await inviteMember(enterpriseId, { user_id: userId, role });
  };

  const handleUpdateRole = async (userId: string, role: MemberRole) => {
    await updateMemberRole(enterpriseId, userId, role);
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('确定要移除该成员吗？')) {
      await removeMember(enterpriseId, userId);
      if (userId === user?.id) {
        onBack();
      }
    }
  };

  if (isEditing) {
    return (
      <div className="enterprise-detail">
        <EnterpriseForm
          enterprise={currentEnterprise}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={actionLoading}
        />
      </div>
    );
  }

  return (
    <div className="enterprise-detail">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          ← 返回
        </button>
        <div className="detail-actions">
          {isAdmin && (
            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
              编辑
            </button>
          )}
          {isOwner && (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              删除企业
            </button>
          )}
        </div>
      </div>

      <div className="enterprise-info">
        <div className="enterprise-header">
          {currentEnterprise.logo_url && (
            <img
              src={currentEnterprise.logo_url}
              alt={currentEnterprise.name}
              className="enterprise-logo"
            />
          )}
          <div className="enterprise-title">
            <h1>{currentEnterprise.name}</h1>
            <div className="enterprise-badges">
              {currentEnterprise.is_verified && <span className="badge verified">已认证</span>}
              {!currentEnterprise.is_active && <span className="badge inactive">已停用</span>}
            </div>
          </div>
        </div>

        {currentEnterprise.description && (
          <p className="enterprise-description">{currentEnterprise.description}</p>
        )}

        <div className="enterprise-meta">
          {currentEnterprise.website && (
            <div className="meta-item">
              <span className="meta-label">官网：</span>
              <a href={currentEnterprise.website} target="_blank" rel="noopener noreferrer">
                {currentEnterprise.website}
              </a>
            </div>
          )}
          {currentEnterprise.contact_email && (
            <div className="meta-item">
              <span className="meta-label">联系邮箱：</span>
              <a href={`mailto:${currentEnterprise.contact_email}`}>
                {currentEnterprise.contact_email}
              </a>
            </div>
          )}
          {currentEnterprise.wallet_address && (
            <div className="meta-item">
              <span className="meta-label">钱包地址：</span>
              <code>{currentEnterprise.wallet_address}</code>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">创建时间：</span>
            {new Date(currentEnterprise.created_at).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="members-section">
        <div className="section-header">
          <h2>成员管理</h2>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowInviteDialog(true)}>
              邀请成员
            </button>
          )}
        </div>
        <MemberList
          members={currentEnterprise.members}
          currentUserId={user?.id || ''}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
          isLoading={actionLoading}
        />
      </div>

      {showInviteDialog && (
        <InviteMemberDialog
          onInvite={handleInvite}
          onClose={() => setShowInviteDialog(false)}
          isLoading={actionLoading}
        />
      )}

      {confirmDelete && (
        <div className="dialog-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除企业 "{currentEnterprise.name}" 吗？此操作不可撤销。</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>
                取消
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseDetail;
