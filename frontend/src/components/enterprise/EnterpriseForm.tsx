import { useState, useCallback } from 'react';
import { Building2, Mail, MapPin, Globe, Image } from 'lucide-react';
import type { Enterprise } from '../../types';
import './Enterprise.less';

interface EnterpriseFormProps {
  initialData?: Partial<Enterprise>;
  onSubmit: (data: Partial<Enterprise>) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  contactEmail: string;
  website: string;
  logo_url: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  address: '',
  contactEmail: '',
  website: '',
  logo_url: '',
};

export const EnterpriseForm = ({ initialData, onSubmit, onCancel }: EnterpriseFormProps) => {
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        ...initialFormData,
        ...initialData,
      };
    }
    return initialFormData;
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入企业名称';
    } else if (formData.name.length < 2) {
      newErrors.name = '企业名称至少2个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入企业简介';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = '请输入联系邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = '请输入有效的邮箱地址';
    }

    if (!formData.address.trim()) {
      newErrors.address = '请输入企业地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 处理输入变化
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // 清除该字段的错误
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        // 直接提交表单数据，不进行模拟延迟
        onSubmit(formData);
      } catch (error) {
        console.error('提交失败:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, onSubmit]
  );

  return (
    <form className="enterprise-form" onSubmit={handleSubmit}>
      {/* 基本信息 */}
      <div className="form-section">
        <h4 className="form-section-title">
          <Building2 size={18} />
          基本信息
        </h4>

        <div className="form-row">
          <div className="form-group form-group-half">
            <label className="form-label form-label-required">企业名称</label>
            <div className="input-wrapper">
              <Building2 className="input-icon" size={18} />
              <input
                type="text"
                className={`form-input with-icon ${errors.name ? 'form-input-error' : ''}`}
                placeholder="请输入企业全称"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group form-group-half">
            <label className="form-label">Logo URL</label>
            <div className="input-wrapper">
              <Image className="input-icon" size={18} />
              <input
                type="url"
                className="form-input with-icon"
                placeholder="https://example.com/logo.png"
                value={formData.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group form-group-half">
            <label className="form-label">官方网站</label>
            <div className="input-wrapper">
              <Globe className="input-icon" size={18} />
              <input
                type="url"
                className="form-input with-icon"
                placeholder="https://www.example.com"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label form-label-required">企业简介</label>
          <textarea
            className={`form-textarea ${errors.description ? 'form-input-error' : ''}`}
            rows={4}
            placeholder="请简要描述企业的主要业务、核心产品或服务..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>
      </div>

      {/* 联系信息 */}
      <div className="form-section">
        <h4 className="form-section-title">
          <Mail size={18} />
          联系信息
        </h4>

        <div className="form-group">
          <label className="form-label form-label-required">联系邮箱</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              type="email"
              className={`form-input with-icon ${errors.contactEmail ? 'form-input-error' : ''}`}
              placeholder="contact@company.com"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            />
          </div>
          {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
        </div>

        <div className="form-group">
          <label className="form-label form-label-required">企业地址</label>
          <div className="input-wrapper">
            <MapPin className="input-icon" size={18} />
            <input
              type="text"
              className={`form-input with-icon ${errors.address ? 'form-input-error' : ''}`}
              placeholder="请输入企业详细地址"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>
          {errors.address && <span className="form-error">{errors.address}</span>}
        </div>
      </div>

      {/* 表单操作 */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner" />
              提交中...
            </>
          ) : initialData ? (
            '保存修改'
          ) : (
            '创建企业'
          )}
        </button>
      </div>
    </form>
  );
};
