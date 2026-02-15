import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: 'length', label: '至少8位字符', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: '包含大写字母', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: '包含小写字母', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: '包含数字', test: (p) => /\d/.test(p) },
  { id: 'special', label: '包含特殊字符', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const RegisterForm = ({ onSuccess, onLoginClick }: RegisterFormProps) => {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
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

    const unmetRequirements = passwordRequirements.filter((req) => !req.test(password));
    if (unmetRequirements.length > 0) {
      setValidationError(`密码不符合要求: ${unmetRequirements[0].label}`);
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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

  const displayError = validationError;

  const getRequirementStatus = (test: (password: string) => boolean) => {
    if (!password) return 'neutral';
    return test(password) ? 'valid' : 'invalid';
  };

  return (
    <div className="auth-form-container">
      <div className="form-header">
        <div className="form-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11ZM22 11H18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>创建账户</h2>
        <p className="form-subtitle">加入 IP-NFT 生态系统</p>
      </div>

      {displayError && (
        <div className="error-message">
          <span className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className={`form-group ${focusedField === 'email' ? 'focused' : ''}`}>
          <label htmlFor="email">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            邮箱地址 <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="name@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
            <div className="input-glow"></div>
          </div>
        </div>

        <div className={`form-group ${focusedField === 'username' ? 'focused' : ''}`}>
          <label htmlFor="username">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            用户名 <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="输入用户名（字母开头）"
              required
              disabled={isLoading}
              minLength={3}
              maxLength={50}
              autoComplete="username"
            />
            <div className="input-glow"></div>
          </div>
          <span className="field-hint">3-50位，字母开头，可包含数字和下划线</span>
        </div>

        <div className={`form-group ${focusedField === 'fullName' ? 'focused' : ''}`}>
          <label htmlFor="fullName">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
              </svg>
            </span>
            姓名
          </label>
          <div className="input-wrapper">
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              placeholder="输入您的姓名（选填）"
              disabled={isLoading}
              maxLength={100}
              autoComplete="name"
            />
            <div className="input-glow"></div>
          </div>
        </div>

        <div className={`form-group ${focusedField === 'password' ? 'focused' : ''}`}>
          <label htmlFor="password">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            密码 <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!showPasswordRequirements) setShowPasswordRequirements(true);
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="创建安全密码"
              required
              disabled={isLoading}
              minLength={8}
              autoComplete="new-password"
            />
            <div className="input-glow"></div>
          </div>

          {showPasswordRequirements && (
            <div className="password-requirements">
              {passwordRequirements.map((req) => {
                const status = getRequirementStatus(req.test);
                return (
                  <div key={req.id} className={`requirement ${status}`}>
                    <span className="requirement-icon">
                      {status === 'valid' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : status === 'invalid' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="5" />
                        </svg>
                      )}
                    </span>
                    <span className="requirement-text">{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''}`}>
          <label htmlFor="confirmPassword">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            确认密码 <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              placeholder="再次输入密码"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            <div className="input-glow"></div>
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <span className="field-error">密码不匹配</span>
          )}
        </div>

        <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              创建账户中...
            </>
          ) : (
            <>
              <span>创建账户</span>
              <svg
                className="arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <div className="footer-line">
          <span></span>
          <p>已有账号？</p>
          <span></span>
        </div>
        <button
          type="button"
          className="btn-link login-link"
          onClick={onLoginClick}
          disabled={isLoading}
        >
          立即登录
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
