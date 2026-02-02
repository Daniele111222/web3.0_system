import { useState } from 'react';
import type { EnterpriseMember, MemberRole } from '../../types';
import './Enterprise.css';

interface MemberListProps {
  members: EnterpriseMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onUpdateRole: (userId: string, role: MemberRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '所有者',
  admin: '管理员',
  member: '成员',
  viewer: '观察者',
};

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '成员' },
  { value: 'viewer', label: '观察者' },
];

export function MemberList({
  members,
  currentUserId,
  isOwner,
  isAdmin,
  onUpdateRole,
  onRemoveMember,
  isLoading,
}: MemberListProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');

  const handleEditRole = (member: EnterpriseMember) => {
    setEditingUserId(member.user_id);
    setSelectedRole(member.role);
  };

  const handleSaveRole = async (userId: string) => {
    await onUpdateRole(userId, selectedRole);
    setEditingUserId(null);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const canManageMember = (member: EnterpriseMember): boolean => {
    if (member.role === 'owner') return false;
    if (member.user_id === currentUserId) return true;
    return isOwner || isAdmin;
  };

  const canChangeRole = (member: EnterpriseMember): boolean => {
    if (member.role === 'owner') return false;
    return isOwner;
  };

  return (
    <div className="member-list">
      <h3>成员列表 ({members.length})</h3>
      <table className="member-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>加入时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="member-info">
                {member.avatar_url && (
                  <img src={member.avatar_url} alt={member.username} className="member-avatar" />
                )}
                <div>
                  <span className="member-name">{member.full_name || member.username}</span>
                  <span className="member-username">@{member.username}</span>
                </div>
              </td>
              <td>{member.email}</td>
              <td>
                {editingUserId === member.user_id ? (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                    disabled={isLoading}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`role-badge role-${member.role}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </td>
              <td>{new Date(member.joined_at).toLocaleDateString('zh-CN')}</td>
              <td className="member-actions">
                {editingUserId === member.user_id ? (
                  <>
                    <button
                      className="btn-small btn-primary"
                      onClick={() => handleSaveRole(member.user_id)}
                      disabled={isLoading}
                    >
                      保存
                    </button>
                    <button
                      className="btn-small btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    {canChangeRole(member) && (
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => handleEditRole(member)}
                        disabled={isLoading}
                      >
                        修改角色
                      </button>
                    )}
                    {canManageMember(member) && (
                      <button
                        className="btn-small btn-danger"
                        onClick={() => onRemoveMember(member.user_id)}
                        disabled={isLoading}
                      >
                        {member.user_id === currentUserId ? '退出' : '移除'}
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MemberList;
