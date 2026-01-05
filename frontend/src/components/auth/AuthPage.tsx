import { useState } from 'react';
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

  const handleSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
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
