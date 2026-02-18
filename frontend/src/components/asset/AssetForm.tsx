import { useState, type FormEvent } from 'react';
import type { AssetType, LegalStatus } from '../../types';
import type { AssetCreateRequest } from '../../services/asset';
import { FileUpload } from './FileUpload';
import './Asset.less';

interface AssetFormProps {
  onSubmit: (data: AssetCreateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 资产创建表单组件
 *
 * 提供完整的资产信息录入功能，包括：
 * - 基本信息（名称、类型、描述）
 * - 创作者信息（姓名、创作日期）
 * - 法律状态（状态、申请号）
 * - 附件上传
 *
 * @param onSubmit - 表单提交回调
 * @param onCancel - 取消操作回调
 * @param isLoading - 提交加载状态
 */
export function AssetForm({ onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  // 表单数据状态
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

  // 表单错误信息
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 表单验证
   * @returns 验证是否通过
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 验证资产名称
    if (!formData.name.trim()) {
      newErrors.name = '资产名称不能为空';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '资产名称不能超过100个字符';
    }

    // 验证资产描述
    if (!formData.description.trim()) {
      newErrors.description = '资产描述不能为空';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = '资产描述至少需要 10 个字符';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = '资产描述不能超过2000个字符';
    }

    // 验证创作人姓名
    if (!formData.creator_name.trim()) {
      newErrors.creator_name = '创作人姓名不能为空';
    } else if (formData.creator_name.trim().length > 50) {
      newErrors.creator_name = '创作人姓名不能超过50个字符';
    }

    // 验证创作日期
    if (!formData.creation_date) {
      newErrors.creation_date = '创作日期不能为空';
    } else {
      const selectedDate = new Date(formData.creation_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        newErrors.creation_date = '创作日期不能是未来日期';
      }
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

    // 如果有附件，可以在这里处理上传逻辑
    // 目前仅提交表单数据
    await onSubmit(formData);
  };

  /**
   * 处理表单字段变化
   */
  const handleChange = (
    field: keyof AssetCreateRequest,
    value: string | AssetType | LegalStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 清除该字段的错误信息
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * 处理文件选择
   */
  const handleFilesSelected = (files: { file: File }[]) => {
    const fileList = files.map((f) => f.file);
    // 将文件列表附加到表单数据中
    setFormData((prev) => ({
      ...prev,
      asset_metadata: {
        ...prev.asset_metadata,
        attachments: fileList.map((f) => f.name),
      },
    }));
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      {/* 基本信息区域 */}
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
            maxLength={100}
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

      {/* 资产描述 */}
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
          rows={5}
          maxLength={2000}
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      {/* 创作者信息 */}
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
            maxLength={50}
          />
          {errors.creator_name && <span className="error-text">{errors.creator_name}</span>}
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
          {errors.creation_date && <span className="error-text">{errors.creation_date}</span>}
        </div>
      </div>

      {/* 法律状态 */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="legal_status">
            法律状态<span className="required">*</span>
          </label>
          <select
            id="legal_status"
            value={formData.legal_status}
            onChange={(e) => handleChange('legal_status', e.target.value as LegalStatus)}
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

      {/* 附件上传 */}
      <FileUpload onFilesSelected={handleFilesSelected} />

      {/* 表单操作按钮 */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner" />
              创建中...
            </>
          ) : (
            '创建资产'
          )}
        </button>
      </div>
    </form>
  );
}
