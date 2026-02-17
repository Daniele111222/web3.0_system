# IP-NFT 平台认证模块 API 接口文档

**版本**: 2.0  
**更新日期**: 2026-02-16  
**文档状态**: 已发布  
**适用对象**: 前端开发团队

---

## 1. 文档概述

### 1.1 文档说明
本文档描述了 IP-NFT 平台认证模块的 RESTful API 接口，供前端开发团队参考实现。所有接口均基于 FastAPI 框架开发，遵循 RESTful 设计规范。

### 1.2 基础信息

- **Base URL**: `http://localhost:8000/api/v1`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **认证方式**: Bearer Token (JWT)

### 1.3 通用响应格式

所有 API 响应遵循以下格式：

```json
{
  "success": true,        // 操作是否成功
  "message": "操作成功",  // 响应消息
  "data": { ... },        // 响应数据（可选）
  "error": null           // 错误信息（失败时填充）
}
```

### 1.4 HTTP 状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或令牌无效 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 2. 认证 API 端点

### 2.1 用户注册

**POST** `/auth/register`

#### 功能描述
注册新用户账号，返回用户信息和认证令牌。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 用户邮箱地址，需符合邮箱格式 |
| password | string | 是 | 用户密码，6-128字符 |
| username | string | 是 | 用户名，3-50字符，字母开头，只能包含字母、数字、下划线 |
| full_name | string | 否 | 用户全名，最大100字符 |

#### 请求示例

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "john_doe",
  "full_name": "John Doe"
}
```

#### 响应示例

**成功 (201 Created)**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "full_name": "John Doe",
    "avatar_url": null,
    "wallet_address": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-02-16T10:30:00Z",
    "last_login_at": null
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

**失败 (400 Bad Request)**

```json
{
  "detail": {
    "message": "邮箱已被注册",
    "code": "USER_EXISTS"
  }
}
```

---

### 2.2 用户登录 ⭐ 已更新

**POST** `/auth/login`

#### 功能描述
使用邮箱和密码登录，返回用户信息和认证令牌。**新增 "记住我" 功能**。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 用户邮箱地址 |
| password | string | 是 | 用户密码 |
| remember_me | boolean | 否 | **新增：** 记住登录状态，默认 `false`。设置为 `true` 时，Refresh Token 有效期延长至 **30天** |

#### 请求示例

**标准登录（不记住）**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**记住我登录** ⭐
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "remember_me": true
}
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "full_name": "John Doe",
    "avatar_url": null,
    "wallet_address": null,
    "is_active": true,
    "is_verified": true,
    "created_at": "2026-02-16T10:30:00Z",
    "last_login_at": "2026-02-16T14:45:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

**失败 (401 Unauthorized)**

```json
{
  "detail": {
    "message": "邮箱或密码错误",
    "code": "INVALID_CREDENTIALS"
  }
}
```

#### 记住我功能说明 ⭐

| 选项 | Refresh Token 有效期 | 适用场景 |
|------|---------------------|----------|
| `remember_me: false` (默认) | **7天** | 公共电脑或临时登录 |
| `remember_me: true` | **30天** | 个人设备，减少频繁登录 |

**注意：** 用户主动登出会立即清除所有 Token，无论是否设置了"记住我"。

---

### 2.3 刷新令牌

**POST** `/auth/refresh`

#### 功能描述
使用刷新令牌获取新的访问令牌（令牌轮换机制）。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| refresh_token | string | 是 | 刷新令牌 |

#### 请求示例

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### 2.4 用户登出

**POST** `/auth/logout`

#### 功能描述
撤销当前刷新令牌，实现安全登出。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| refresh_token | string | 是 | 当前使用的刷新令牌 |

#### 请求示例

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "Logged out successfully",
  "success": true
}
```

---

### 2.5 登出所有设备

**POST** `/auth/logout-all`

#### 功能描述
撤销当前用户的所有刷新令牌，从所有设备登出。

#### 认证要求
需要 Bearer Token 认证。

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "Logged out from 3 device(s)",
  "success": true
}
```

---

### 2.6 获取当前用户信息

**GET** `/auth/me`

#### 功能描述
获取当前登录用户的详细信息。

#### 认证要求
需要 Bearer Token 认证。

#### 响应示例

**成功 (200 OK)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar_url": null,
  "wallet_address": null,
  "is_active": true,
  "is_verified": true,
  "created_at": "2026-02-16T10:30:00Z",
  "last_login_at": "2026-02-16T14:45:00Z"
}
```

---

## 3. 密码重置 API ⭐ 新增

### 3.1 请求密码重置

**POST** `/auth/forgot-password`

#### 功能描述
向用户邮箱发送密码重置邮件。即使邮箱不存在也会返回成功，防止枚举攻击。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 用户注册邮箱地址 |

#### 请求示例

```json
{
  "email": "user@example.com"
}
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "如果该邮箱已注册，您将收到密码重置邮件",
  "success": true
}
```

**失败 (429 Too Many Requests)**

```json
{
  "detail": {
    "message": "请稍后再试，邮件发送过于频繁",
    "code": "TOO_MANY_REQUESTS"
  }
}
```

#### 业务规则

1. **安全考虑**：无论邮箱是否存在，都返回相同的成功消息，防止枚举攻击
2. **频率限制**：每个邮箱每 5 分钟只能发送一次重置邮件
3. **邮件有效期**：重置链接 30 分钟后过期
4. **单次使用**：每个令牌只能使用一次

---

### 3.2 验证重置令牌

**GET** `/auth/verify-reset-token`

#### 功能描述
验证密码重置令牌是否有效。前端可在重置密码页面加载时调用此接口检查链接有效性。

#### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 重置令牌（从邮件链接中获取） |

#### 请求示例

```
GET /auth/verify-reset-token?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "令牌有效",
  "success": true
}
```

**失败 (400 Bad Request)**

```json
{
  "detail": {
    "message": "重置令牌无效或已过期",
    "code": "RESET_TOKEN_ERROR"
  }
}
```

---

### 3.3 重置密码

**POST** `/auth/reset-password`

#### 功能描述
使用重置令牌设置新密码。

#### 请求参数

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 重置令牌（从邮件链接中获取） |
| new_password | string | 是 | 新密码，6-128字符 |

#### 请求示例

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewSecurePass123"
}
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "密码重置成功，请使用新密码登录",
  "success": true
}
```

**失败 (400 Bad Request)**

```json
{
  "detail": {
    "message": "重置令牌无效或已过期",
    "code": "RESET_TOKEN_ERROR"
  }
}
```

#### 安全特性

1. **令牌失效**：重置成功后，该令牌立即失效
2. **强制登出**：重置成功后，用户的所有设备都会被强制登出，需要重新登录
3. **旧密码失效**：重置后旧密码立即失效

---

## 4. 邮箱验证 API ⭐ 新增

### 4.1 发送验证邮件

**POST** `/auth/send-verification`

#### 功能描述
向当前用户邮箱发送邮箱验证邮件。需要用户已登录（Bearer Token 认证）。

#### 认证要求
需要 Bearer Token 认证。

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "验证邮件已发送，请查收",
  "success": true
}
```

**失败 (429 Too Many Requests)**

```json
{
  "detail": {
    "message": "请稍后再试，邮件发送过于频繁",
    "code": "TOO_MANY_REQUESTS"
  }
}
```

#### 业务规则

1. **频率限制**：每次发送间隔必须大于 60 秒
2. **邮件有效期**：验证链接 24 小时后过期
3. **已验证用户**：如果用户邮箱已验证，直接返回成功，不发送邮件
4. **单次使用**：每个验证令牌只能使用一次

---

### 4.2 验证邮箱

**GET** `/auth/verify-email`

#### 功能描述
验证邮箱验证令牌，完成邮箱验证流程。前端应在验证成功页面调用此接口。

#### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 验证令牌（从邮件链接中获取） |

#### 请求示例

```
GET /auth/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应示例

**成功 (200 OK)**

```json
{
  "message": "邮箱验证成功",
  "success": true
}
```

**失败 (400 Bad Request)**

```json
{
  "detail": {
    "message": "验证令牌无效或已过期",
    "code": "VERIFICATION_TOKEN_ERROR"
  }
}
```

#### 业务规则

1. **令牌失效**：验证成功后，该令牌立即失效
2. **用户状态更新**：验证成功后，`is_verified` 字段自动更新为 `true`
3. **功能解锁**：验证成功后，用户可以创建企业、绑定钱包等

---

### 4.3 获取验证状态

**GET** `/auth/verification-status`

#### 功能描述
获取当前用户的邮箱验证状态。前端可在用户个人中心或设置页面调用此接口显示验证状态。

#### 认证要求
需要 Bearer Token 认证。

#### 响应示例

**成功 (200 OK)**

```json
{
  "is_verified": false,
  "email": "user@example.com",
  "has_pending_token": true,
  "pending_tokens_count": 1
}
```

#### 字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| is_verified | boolean | 邮箱是否已验证 |
| email | string | 用户邮箱地址 |
| has_pending_token | boolean | 是否有待处理的验证令牌（即已发送验证邮件但未验证） |
| pending_tokens_count | integer | 待处理令牌数量 |

#### 使用建议

前端可根据 `is_verified` 和 `has_pending_token` 组合判断显示内容：

| is_verified | has_pending_token | 前端显示建议 |
|-------------|-------------------|--------------|
| true | - | 显示"已验证"标识 |
| false | false | 显示"未验证，发送验证邮件"按钮 |
| false | true | 显示"验证邮件已发送，重新发送(60s)" |

---

## 5. 前端实现参考

### 5.1 忘记密码流程实现

```typescript
// 1. 忘记密码页面 - 发送重置邮件
const handleForgotPassword = async (email: string) => {
  try {
    const response = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 显示成功消息（注意：无论邮箱是否存在都显示成功，防止枚举攻击）
      showMessage('如果该邮箱已注册，您将收到密码重置邮件');
    } else {
      showError(data.detail?.message || '请求失败');
    }
  } catch (error) {
    showError('网络错误，请重试');
  }
};

// 2. 重置密码页面 - 验证令牌有效性
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/v1/auth/verify-reset-token?token=${token}`);
        setIsValid(response.ok);
      } catch (error) {
        setIsValid(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  if (isValid === null) return <Loading />;
  if (!isValid) return <InvalidTokenPage />;
  
  return <ResetPasswordForm token={token} />;
};

// 3. 重置密码表单
const handleResetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('密码重置成功，请使用新密码登录');
      // 跳转到登录页
      navigate('/login');
    } else {
      showError(data.detail?.message || '重置失败');
    }
  } catch (error) {
    showError('网络错误，请重试');
  }
};
```

---

### 5.2 邮箱验证流程实现

```typescript
// 1. 邮箱验证状态组件
const EmailVerificationStatus = () => {
  const [status, setStatus] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    fetchVerificationStatus();
  }, []);
  
  // 获取验证状态
  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/v1/auth/verification-status', {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('获取验证状态失败:', error);
    }
  };
  
  // 发送验证邮件
  const sendVerificationEmail = async () => {
    if (cooldown > 0) return;
    
    try {
      const response = await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('验证邮件已发送，请查收');
        // 开始60秒冷却
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // 刷新状态
        fetchVerificationStatus();
      } else {
        if (response.status === 429) {
          showError('请求过于频繁，请稍后再试');
        } else {
          showError(data.detail?.message || '发送失败');
        }
      }
    } catch (error) {
      showError('网络错误，请重试');
    }
  };
  
  // 渲染状态
  const renderStatus = () => {
    if (!status) return <Loading />;
    
    // 已验证
    if (status.is_verified) {
      return (
        <div className="verification-status verified">
          <Icon type="check-circle" />
          <span>邮箱已验证</span>
        </div>
      );
    }
    
    // 未验证但有待处理令牌（已发送邮件）
    if (status.has_pending_token) {
      return (
        <div className="verification-status pending">
          <Icon type="mail" />
          <span>验证邮件已发送至 {status.email}</span>
          <Button 
            onClick={sendVerificationEmail} 
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `${cooldown}秒后重试` : '重新发送'}
          </Button>
        </div>
      );
    }
    
    // 未验证且无待处理令牌
    return (
      <div className="verification-status unverified">
        <Icon type="warning" />
        <span>邮箱未验证</span>
        <Button onClick={sendVerificationEmail}>
          发送验证邮件
        </Button>
      </div>
    );
  };
  
  return (
    <div className="email-verification-panel">
      <h3>邮箱验证</h3>
      {renderStatus()}
    </div>
  );
};

// 2. 邮箱验证回调页面
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    verifyEmail();
  }, [token]);
  
  const verifyEmail = async () => {
    if (!token) {
      setStatus('error');
      setMessage('验证链接无效，缺少令牌');
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('邮箱验证成功！您可以使用完整功能了。');
      } else {
        setStatus('error');
        setMessage(data.detail?.message || '验证失败，链接可能已过期');
      }
    } catch (error) {
      setStatus('error');
      setMessage('网络错误，请重试');
    }
  };
  
  return (
    <div className="verify-email-page">
      {status === 'loading' && <Loading message="正在验证邮箱..." />}
      {status === 'success' && (
        <div className="success-message">
          <Icon type="check-circle" />
          <h2>验证成功</h2>
          <p>{message}</p>
          <Button onClick={() => navigate('/dashboard')}>
            进入控制台
          </Button>
        </div>
      )}
      {status === 'error' && (
        <div className="error-message">
          <Icon type="close-circle" />
          <h2>验证失败</h2>
          <p>{message}</p>
          <Button onClick={() => navigate('/settings')}>
            前往设置重新发送
          </Button>
        </div>
      )}
    </div>
  );
};

// 3. 功能限制提示组件
const VerificationRequiredModal = ({ 
  isOpen, 
  onClose, 
  action 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  action: string;
}) => {
  const navigate = useNavigate();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="verification-required-modal">
        <Icon type="mail" className="icon" />
        <h2>需要验证邮箱</h2>
        <p>您需要验证邮箱才能{action}。</p>
        <div className="actions">
          <Button onClick={() => navigate('/settings/verification')}>
            去验证
          </Button>
          <Button type="secondary" onClick={onClose}>
            稍后再说
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 4. 功能限制说明

### 4.1 未验证用户限制

未验证邮箱的用户将受到以下功能限制：

| 功能模块 | 限制说明 | 提示方式 |
|----------|----------|----------|
| 创建企业 | ❌ 禁止 | 显示验证邮箱提示模态框 |
| 绑定钱包 | ❌ 禁止 | 显示验证邮箱提示模态框 |
| 发送邀请 | ❌ 禁止 | 显示验证邮箱提示模态框 |
| 查看公开内容 | ✅ 允许 | - |
| 登录/登出 | ✅ 允许 | - |

### 4.2 验证状态检查时机

建议在前端以下时机检查用户验证状态：

1. **页面加载时**：检查是否需要显示验证提示
2. **执行敏感操作前**：检查是否允许执行操作
3. **用户手动刷新**：提供刷新验证状态按钮

---

## 5. 前端路由建议

### 5.1 新增路由配置

```typescript
// 认证相关路由
const authRoutes = [
  {
    path: '/auth',
    children: [
      { path: 'login', component: LoginPage },
      { path: 'register', component: RegisterPage },
      
      // 忘记密码流程
      { path: 'forgot-password', component: ForgotPasswordPage },
      { path: 'reset-password', component: ResetPasswordPage },
      
      // 邮箱验证
      { path: 'verify-email', component: VerifyEmailPage },
    ]
  }
];

// 设置页面路由
const settingsRoutes = [
  {
    path: '/settings',
    component: SettingsLayout,
    children: [
      { path: 'profile', component: ProfileSettings },
      { path: 'security', component: SecuritySettings },
      { path: 'verification', component: EmailVerificationSettings }, // 邮箱验证设置
      { path: 'wallet', component: WalletSettings },
    ]
  }
];
```

### 5.2 路由守卫配置

```typescript
// 路由守卫 - 检查邮箱验证
const requireEmailVerification = (to, from, next) => {
  const user = getCurrentUser();
  
  if (!user.is_verified) {
    // 显示验证提示模态框
    showVerificationRequiredModal({
      action: to.meta.requiresVerificationText || '执行此操作'
    });
    return next(false);
  }
  
  next();
};

// 需要验证的路由配置
const routes = [
  {
    path: '/enterprise/create',
    component: CreateEnterprisePage,
    meta: {
      requiresAuth: true,
      requiresVerification: true,
      requiresVerificationText: '创建企业'
    },
    beforeEnter: [requireAuth, requireEmailVerification]
  },
  {
    path: '/wallet/bind',
    component: BindWalletPage,
    meta: {
      requiresAuth: true,
      requiresVerification: true,
      requiresVerificationText: '绑定钱包'
    },
    beforeEnter: [requireAuth, requireEmailVerification]
  }
];
```

---

## 6. 测试指南

### 6.1 测试邮箱配置

项目已配置 **Ethereal Email** 测试邮箱，所有邮件会发送到 Ethereal 的虚拟邮箱，不会真正到达收件人。

**查看测试邮件：**
1. 访问 https://ethereal.email/
2. 使用你的测试账号登录：
   - 用户名：`horace.mccullough@ethereal.email`
   - 密码：`p1QBSQKtnsMTpJwHav`
3. 在 "Messages" 标签页查看捕获的邮件

### 6.2 测试场景清单

#### 忘记密码测试
- [ ] 发送重置邮件到已存在邮箱
- [ ] 发送重置邮件到不存在邮箱（应返回相同消息）
- [ ] 5分钟内重复请求（应返回频率限制错误）
- [ ] 验证令牌有效性
- [ ] 使用过期令牌重置（应失败）
- [ ] 使用有效令牌重置密码
- [ ] 重置后使用旧密码登录（应失败）
- [ ] 重置后使用新密码登录（应成功）
- [ ] 重置后旧刷新令牌失效（应需要重新登录）

#### 邮箱验证测试
- [ ] 已验证用户发送验证邮件（应直接返回成功）
- [ ] 未验证用户发送验证邮件
- [ ] 60秒内重复发送（应返回频率限制错误）
- [ ] 验证邮箱（令牌有效）
- [ ] 验证邮箱（令牌过期）
- [ ] 验证后检查用户状态（is_verified 应为 true）
- [ ] 未验证用户尝试创建企业（应被拒绝）
- [ ] 已验证用户创建企业（应成功）

#### 记住我功能测试
- [ ] 登录时不勾选 remember_me，检查 Refresh Token 过期时间（应为7天）
- [ ] 登录时勾选 remember_me，检查 Refresh Token 过期时间（应为30天）
- [ ] 记住我登录后关闭浏览器，再次打开应保持登录状态
- [ ] 用户主动登出，所有 Token 应立即失效

---

## 7. 错误处理指南

### 7.1 通用错误码

| 错误码 | 说明 | 前端处理建议 |
|--------|------|--------------|
| INVALID_CREDENTIALS | 邮箱或密码错误 | 显示"邮箱或密码错误"，不清空输入框 |
| USER_EXISTS | 用户已存在 | 显示"该邮箱/用户名已被注册" |
| ACCOUNT_DISABLED | 账户被禁用 | 显示"账户已被禁用，请联系管理员" |
| INVALID_TOKEN | 令牌无效或过期 | 提示重新登录 |
| RESET_TOKEN_ERROR | 重置令牌无效 | 显示"链接已过期，请重新申请" |
| VERIFICATION_TOKEN_ERROR | 验证令牌无效 | 显示"验证链接已过期，请重新发送" |
| TOO_MANY_REQUESTS | 请求过于频繁 | 显示"操作过于频繁，请稍后再试" |
| EMAIL_NOT_VERIFIED | 邮箱未验证 | 显示验证提示，引导用户验证邮箱 |

### 7.2 HTTP 状态码处理

```typescript
const handleApiError = (response: Response, data: any) => {
  switch (response.status) {
    case 400:
      // 请求参数错误
      showError(data.detail?.message || '请求参数错误');
      break;
      
    case 401:
      // 未认证，清除登录状态并跳转登录页
      clearAuth();
      navigate('/login', { state: { from: location.pathname } });
      break;
      
    case 403:
      // 无权限，显示权限不足提示
      if (data.detail?.code === 'EMAIL_NOT_VERIFIED') {
        showVerificationRequiredModal();
      } else {
        showError('权限不足，无法执行此操作');
      }
      break;
      
    case 404:
      // 资源不存在
      showError('请求的资源不存在');
      break;
      
    case 429:
      // 请求过于频繁
      showError(data.detail?.message || '操作过于频繁，请稍后再试');
      break;
      
    case 500:
      // 服务器内部错误
      showError('服务器错误，请稍后重试');
      break;
      
    default:
      showError('未知错误，请重试');
  }
};
```

---

## 8. 版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| 2.0 | 2026-02-16 | 新增忘记密码、邮箱验证、记住我功能 | 后端团队 |
| 1.0 | 2026-01-15 | 初始版本，基础认证功能 | 后端团队 |

---

## 9. 联系方式

如有 API 相关问题，请联系：

- **后端团队**: backend@ipnft.com
- **API 文档维护**: docs@ipnft.com
- **技术支持**: support@ipnft.com

---

**文档结束**

*本文档由 IP-NFT 后端团队维护，如有变更将及时更新。*
