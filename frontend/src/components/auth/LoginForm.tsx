import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export const LoginForm = ({ onSuccess, onRegisterClick }: LoginFormProps) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="auth-form-container">
      <div className="form-header">
        <div className="form-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>欢迎回来</h2>
        <p className="form-subtitle">登录您的 IP-NFT 账户</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className={`form-group ${focusedField === 'email' ? 'focused' : ''}`}>
          <label htmlFor="email">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            邮箱地址
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

        <div className={`form-group ${focusedField === 'password' ? 'focused' : ''}`}>
          <label htmlFor="password">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            密码
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <div className="input-glow"></div>
          </div>
        </div>

        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" disabled={isLoading} />
            <span className="checkmark"></span>
            记住我
          </label>
          <button type="button" className="forgot-password">
            忘记密码？
          </button>
        </div>

        <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              登录中...
            </>
          ) : (
            <>
              <span>登录</span>
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
          <p>还没有账号？</p>
          <span></span>
        </div>
        <button
          type="button"
          className="btn-link register-link"
          onClick={onRegisterClick}
          disabled={isLoading}
        >
          创建新账户
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
