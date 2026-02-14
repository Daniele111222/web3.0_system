import { useState, useCallback } from 'react';
import {
  Mail,
  UserPlus,
  Shield,
  Crown,
  User,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Send,
} from 'lucide-react';
import { useEnterprise } from '../../hooks/useEnterprise';
import './Enterprise.less';

interface InviteMemberDialogProps {
  enterpriseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type InviteRole = 'admin' | 'member';

interface InviteForm {
  email: string;
  role: InviteRole;
}

const roleOptions: { value: InviteRole; label: string; description: string; icon: typeof Crown }[] =
  [
    {
      value: 'admin',
      label: '管理员',
      description: '可以管理成员、查看所有资源',
      icon: Shield,
    },
    {
      value: 'member',
      label: '成员',
      description: '可以查看资源、参与协作',
      icon: User,
    },
  ];

export const InviteMemberDialog = ({
  enterpriseId,
  onClose,
  onSuccess,
}: InviteMemberDialogProps) => {
  const { inviteMember } = useEnterprise();

  const [form, setForm] = useState<InviteForm>({
    email: '',
    role: 'member',
  });
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // 验证邮箱
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // 处理邮箱输入
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const email = e.target.value;
      setForm((prev) => ({ ...prev, email }));

      // 实时验证
      if (email && !validateEmail(email)) {
        setErrors({ email: '请输入有效的邮箱地址' });
      } else {
        setErrors({});
      }
    },
    [validateEmail]
  );

  // 处理角色选择
  const handleRoleSelect = useCallback((role: InviteRole) => {
    setForm((prev) => ({ ...prev, role }));
    setShowRoleDropdown(false);
  }, []);

  // 处理表单提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 验证
      if (!form.email.trim()) {
        setErrors({ email: '请输入邮箱地址' });
        return;
      }

      if (!validateEmail(form.email)) {
        setErrors({ email: '请输入有效的邮箱地址' });
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        // 调用API邀请成员
        await inviteMember(enterpriseId, { email: form.email, role: form.role });
        onClose();
        onSuccess?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '邀请成员失败';
        setErrors({ general: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, validateEmail, enterpriseId, inviteMember, onClose, onSuccess]
  );

  // 获取当前选中的角色
  const selectedRole = roleOptions.find((option) => option.value === form.role);
  const SelectedIcon = selectedRole?.icon || User;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="modal-title">邀请成员</h2>
              <p className="modal-subtitle">发送邀请邮件给新成员加入企业</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 全局错误提示 */}
            {errors.general && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                {errors.general}
              </div>
            )}

            {/* 邮箱输入 */}
            <div className="form-group">
              <label className="form-label form-label-required">
                <Mail size={14} />
                邮箱地址
              </label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="请输入成员邮箱地址"
                value={form.email}
                onChange={handleEmailChange}
                disabled={isSubmitting}
              />
              {errors.email && (
                <span className="form-error">
                  <AlertCircle size={14} />
                  {errors.email}
                </span>
              )}
            </div>

            {/* 角色选择 */}
            <div className="form-group">
              <label className="form-label">
                <Shield size={14} />
                角色权限
              </label>
              <div className="role-selector">
                <button
                  type="button"
                  className="role-selector-trigger"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  disabled={isSubmitting}
                >
                  <SelectedIcon size={16} />
                  <span>{selectedRole?.label || '成员'}</span>
                  <ChevronDown
                    size={16}
                    className={`dropdown-chevron ${showRoleDropdown ? 'rotate' : ''}`}
                  />
                </button>

                {showRoleDropdown && (
                  <div className="role-selector-dropdown">
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`role-option ${form.role === option.value ? 'active' : ''}`}
                          onClick={() => handleRoleSelect(option.value)}
                        >
                          <div className="role-option-header">
                            <Icon size={16} />
                            <span className="role-option-label">{option.label}</span>
                            {form.role === option.value && (
                              <Check size={14} className="role-check" />
                            )}
                          </div>
                          <p className="role-option-description">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !form.email}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  发送中...
                </>
              ) : (
                <>
                  <Send size={16} />
                  发送邀请
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
