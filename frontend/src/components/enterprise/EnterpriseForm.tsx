import React, { useState } from 'react';
import type { EnterpriseCreateRequest, EnterpriseUpdateRequest, EnterpriseDetail } from '../../types';
import './Enterprise.css';

interface EnterpriseFormProps {
  enterprise?: EnterpriseDetail;
  onSubmit: (data: EnterpriseCreateRequest | EnterpriseUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EnterpriseForm({ enterprise, onSubmit, onCancel, isLoading }: EnterpriseFormProps) {
  const [formData, setFormData] = useState({
    name: enterprise?.name || '',
    description: enterprise?.description || '',
    logo_url: enterprise?.logo_url || '',
    website: enterprise?.website || '',
    contact_email: enterprise?.contact_email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!enterprise;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '企业名称不能为空';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = '企业名称长度应在 2-100 个字符之间';
    }

    if (formData.website && !formData.website.match(/^https?:\/\//)) {
      newErrors.website = '官网 URL 必须以 http:// 或 https:// 开头';
    }

    if (
      formData.contact_email &&
      !formData.contact_email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)
    ) {
      newErrors.contact_email = '请输入有效的邮箱地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: EnterpriseCreateRequest | EnterpriseUpdateRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      logo_url: formData.logo_url.trim() || undefined,
      website: formData.website.trim() || undefined,
      contact_email: formData.contact_email.trim() || undefined,
    };

    await onSubmit(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form className="enterprise-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? '编辑企业' : '创建企业'}</h2>

      <div className="form-group">
        <label htmlFor="name">企业名称 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="请输入企业名称"
          disabled={isLoading}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">企业描述</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="请输入企业描述"
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="logo_url">Logo URL</label>
        <input
          type="text"
          id="logo_url"
          name="logo_url"
          value={formData.logo_url}
          onChange={handleChange}
          placeholder="请输入 Logo 图片 URL"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="website">企业官网</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://example.com"
          disabled={isLoading}
        />
        {errors.website && <span className="error">{errors.website}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="contact_email">联系邮箱</label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          value={formData.contact_email}
          onChange={handleChange}
          placeholder="contact@example.com"
          disabled={isLoading}
        />
        {errors.contact_email && <span className="error">{errors.contact_email}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? '提交中...' : isEdit ? '保存' : '创建'}
        </button>
      </div>
    </form>
  );
}

export default EnterpriseForm;
