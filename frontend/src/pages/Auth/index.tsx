import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import './index.less';

type AuthMode = 'login' | 'register';

interface AuthProps {
  initialMode?: AuthMode;
  onAuthSuccess?: () => void;
}

const Auth = ({ initialMode = 'login', onAuthSuccess }: AuthProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 使用 useMemo 生成粒子样式，避免在渲染中调用 Math.random
  const particleStyles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      key: i,
      style: {
        '--delay': `${Math.random() * 5}s`,
        '--duration': `${10 + Math.random() * 10}s`,
        '--x': `${Math.random() * 100}%`,
        '--size': `${2 + Math.random() * 4}px`,
      } as React.CSSProperties,
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={`auth-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Animated Background */}
      <div className="aurora-bg">
        <div className="aurora-layer aurora-1"></div>
        <div className="aurora-layer aurora-2"></div>
        <div className="aurora-layer aurora-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container">
        {particleStyles.map((particle) => (
          <span key={particle.key} className="particle" style={particle.style}></span>
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="grid-pattern"></div>

      {/* Main Container */}
      <div className="auth-container">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-cube">
              <div className="cube-face front"></div>
              <div className="cube-face back"></div>
              <div className="cube-face left"></div>
              <div className="cube-face right"></div>
              <div className="cube-face top"></div>
              <div className="cube-face bottom"></div>
            </div>
            <div className="logo-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
          <div className="brand-text">
            <h1>IP-NFT</h1>
            <p className="brand-tagline">企业知识产权数字化管理</p>
            <p className="brand-subtitle">Enterprise IP Asset Management Platform</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          {/* Card Glow Effect */}
          <div className="card-glow"></div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <div className="tabs-bg"></div>
            <button
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              <span className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </span>
              <span className="tab-text">登录</span>
            </button>
            <button
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              <span className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </span>
              <span className="tab-text">注册</span>
            </button>
            <div
              className="tab-indicator"
              style={{ transform: `translateX(${mode === 'login' ? '0%' : '100%'})` }}
            ></div>
          </div>

          {/* Form Container with Animation */}
          <div className={`form-wrapper ${mode}`}>
            <div className="form-content">
              {mode === 'login' ? (
                <LoginForm onSuccess={handleSuccess} onRegisterClick={() => setMode('register')} />
              ) : (
                <RegisterForm onSuccess={handleSuccess} onLoginClick={() => setMode('login')} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        <div className="footer-badges">
          <div className="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>SSL 加密</span>
          </div>
          <div className="divider"></div>
          <div className="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>区块链认证</span>
          </div>
          <div className="divider"></div>
          <div className="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>企业级安全</span>
          </div>
        </div>
        <p className="copyright">© 2026 IP-NFT Platform. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Auth;
