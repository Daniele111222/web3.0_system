import { useState, FormEvent } from 'react';
import type { AssetType, LegalStatus } from '../../types';
import type { AssetCreateRequest } from '../../services/asset';
import './Asset.css';

interface AssetFormProps {
  onSubmit: (data: AssetCreateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 资产信息表单组件
 */
export function AssetForm({ onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const [formData, setFormData] = useState<AssetCreateRequest>({
    name: '',
    type: 'PATENT',
    description: '',
    creator_name: '',
    creation_date: new Date().toISOString().split('T')[0],
    legal_status: 'PENDING',
    application_number: '',
    asset_metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '资产名称不能为空';
    }

    if (!formData.description.trim()) {
      newErrors.description = '资产描述不能为空';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = '资产描述至少需要 10 个字符';
    }

    if (!formData.creator_name.trim()) {
      newErrors.creator_name = '创作人姓名不能为空';
    }

    if (!formData.creation_date) {
      newErrors.creation_date = '创作日期不能为空';
    } else if (new Date(formData.creation_date) > new Date()) {
      newErrors.creation_date = '创作日期不能是未来日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  /**
   * 处理输入变化
   */
  const handleChange = (
    field: keyof AssetCreateRequest,
    value: string | AssetType | LegalStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">
            资产名称<span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入资产名称"
            disabled={isLoading}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="type">
            资产类型<span className="required">*</span>
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value as AssetType)}
            disabled={isLoading}
          >
            <option value="PATENT">专利</option>
            <option value="TRADEMARK">商标</option>
            <option value="COPYRIGHT">版权</option>
            <option value="TRADE_SECRET">商业秘密</option>
            <option value="DIGITAL_WORK">数字作品</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">
          资产描述<span className="required">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="请详细描述资产内容、特点和用途"
          disabled={isLoading}
        />
        {errors.description && (
          <span className="error-text">{errors.description}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="creator_name">
            创作人姓名<span className="required">*</span>
          </label>
          <input
            id="creator_name"
            type="text"
            value={formData.creator_name}
            onChange={(e) => handleChange('creator_name', e.target.value)}
            placeholder="请输入创作人姓名"
            disabled={isLoading}
          />
          {errors.creator_name && (
            <span className="error-text">{errors.creator_name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="creation_date">
            创作日期<span className="required">*</span>
          </label>
          <input
            id="creation_date"
            type="date"
            value={formData.creation_date}
            onChange={(e) => handleChange('creation_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          {errors.creation_date && (
            <span className="error-text">{errors.creation_date}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="legal_status">
            法律状态<span className="required">*</span>
          </label>
          <select
            id="legal_status"
            value={formData.legal_status}
            onChange={(e) =>
              handleChange('legal_status', e.target.value as LegalStatus)
            }
            disabled={isLoading}
          >
            <option value="PENDING">待审批</option>
            <option value="GRANTED">已授权</option>
            <option value="EXPIRED">已过期</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="application_number">申请号/注册号</label>
          <input
            id="application_number"
            type="text"
            value={formData.application_number}
            onChange={(e) => handleChange('application_number', e.target.value)}
            placeholder="例如：CN202410001234.5"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? '创建中...' : '创建资产'}
        </button>
      </div>
    </form>
  );
}
