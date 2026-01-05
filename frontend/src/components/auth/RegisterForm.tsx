import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const RegisterForm = ({ onSuccess, onLoginClick }: RegisterFormProps) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
      return false;
    }
    if (password.length < 8) {
      setValidationError('密码长度至少为8位');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError('密码必须包含至少一个大写字母');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setValidationError('密码必须包含至少一个小写字母');
      return false;
    }
    if (!/\d/.test(password)) {
      setValidationError('密码必须包含至少一个数字');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setValidationError('密码必须包含至少一个特殊字符');
      return false;
    }
    if (username.length < 3) {
      setValidationError('用户名长度至少为3位');
      return false;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      setValidationError('用户名必须以字母开头，且只能包含字母、数字和下划线');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const success = await register({
      email,
      username,
      password,
      full_name: fullName || undefined,
    });

    if (success && onSuccess) {
      onSuccess();
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-form-container">
      <h2>注册</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {displayError && <div className="error-message">{displayError}</div>}

        <div className="form-group">
          <label htmlFor="email">邮箱 *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">用户名 *</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-50位，字母开头，可包含数字和下划线"
            required
            disabled={isLoading}
            minLength={3}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fullName">姓名</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="请输入姓名（选填）"
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密码 *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8位以上，包含大小写字母、数字和特殊字符"
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码 *</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? '注册中...' : '注册'}
        </button>
      </form>

      <div className="auth-footer">
        <span>已有账号？</span>
        <button type="button" className="btn-link" onClick={onLoginClick} disabled={isLoading}>
          立即登录
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
