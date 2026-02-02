import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import './AuthPage.css';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  initialMode?: AuthMode;
  onAuthSuccess?: () => void;
}

export const AuthPage = ({ initialMode = 'login', onAuthSuccess }: AuthPageProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      // 登录成功后重定向到之前尝试访问的页面，或默认到看板页面
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>IP-NFT 管理平台</h1>
          <p>企业知识产权数字化管理解决方案</p>
        </div>

        {mode === 'login' ? (
          <LoginForm onSuccess={handleSuccess} onRegisterClick={() => setMode('register')} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} onLoginClick={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
