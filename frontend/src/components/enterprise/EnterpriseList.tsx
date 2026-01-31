import React, { useEffect, useState } from 'react';
import { useEnterprise } from '../../hooks/useEnterprise';
import { EnterpriseForm } from './EnterpriseForm';
import type { Enterprise, EnterpriseCreateRequest } from '../../types';
import './Enterprise.css';

interface EnterpriseListProps {
  onSelectEnterprise: (enterpriseId: string) => void;
}

export function EnterpriseList({ onSelectEnterprise }: EnterpriseListProps) {
  const { enterprises, isLoading, error, fetchEnterprises, createEnterprise, actionLoading } =
    useEnterprise();

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const handleCreate = async (data: EnterpriseCreateRequest) => {
    const enterprise = await createEnterprise(data);
    setShowCreateForm(false);
    onSelectEnterprise(enterprise.id);
  };

  if (showCreateForm) {
    return (
      <div className="enterprise-page">
        <EnterpriseForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          isLoading={actionLoading}
        />
      </div>
    );
  }

  return (
    <div className="enterprise-page">
      <div className="page-header">
        <h1>我的企业</h1>
        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
          创建企业
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">加载中...</div>
      ) : enterprises.length === 0 ? (
        <div className="empty-state">
          <p>您还没有加入任何企业</p>
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            创建第一个企业
          </button>
        </div>
      ) : (
        <div className="enterprise-grid">
          {enterprises.map((enterprise) => (
            <EnterpriseCard
              key={enterprise.id}
              enterprise={enterprise}
              onClick={() => onSelectEnterprise(enterprise.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EnterpriseCardProps {
  enterprise: Enterprise;
  onClick: () => void;
}

function EnterpriseCard({ enterprise, onClick }: EnterpriseCardProps) {
  return (
    <div className="enterprise-card" onClick={onClick}>
      <div className="card-header">
        {enterprise.logo_url ? (
          <img src={enterprise.logo_url} alt={enterprise.name} className="card-logo" />
        ) : (
          <div className="card-logo-placeholder">{enterprise.name.charAt(0).toUpperCase()}</div>
        )}
        <div className="card-badges">
          {enterprise.is_verified && <span className="badge verified">已认证</span>}
        </div>
      </div>
      <div className="card-body">
        <h3 className="card-title">{enterprise.name}</h3>
        {enterprise.description && (
          <p className="card-description">{enterprise.description}</p>
        )}
        <div className="card-meta">
          <span>{enterprise.member_count} 位成员</span>
          <span>创建于 {new Date(enterprise.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseList;
