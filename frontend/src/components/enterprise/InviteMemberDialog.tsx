import React, { useState } from 'react';
import type { MemberRole } from '../../types';
import './Enterprise.css';

interface InviteMemberDialogProps {
  onInvite: (userId: string, role: MemberRole) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const ROLE_OPTIONS: { value: MemberRole; label: string; description: string }[] = [
  { value: 'admin', label: '管理员', description: '可管理成员和资产' },
  { value: 'member', label: '成员', description: '可查看和操作资产' },
  { value: 'viewer', label: '观察者', description: '仅可查看资产' },
];

export function InviteMemberDialog({ onInvite, onClose, isLoading }: InviteMemberDialogProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('请输入用户 ID');
      return;
    }

    try {
      await onInvite(userId.trim(), role);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('邀请失败，请重试');
      }
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>邀请成员</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">用户 ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="请输入要邀请的用户 ID"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>成员角色</label>
            <div className="role-options">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    disabled={isLoading}
                  />
                  <div className="role-option-content">
                    <span className="role-option-label">{option.label}</span>
                    <span className="role-option-desc">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? '邀请中...' : '邀请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberDialog;
