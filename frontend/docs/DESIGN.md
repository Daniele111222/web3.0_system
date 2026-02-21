# 极光科技 - 美学设计文档

## 一、设计理念

### 1.1 设计主题

**"极光科技暗色主题" (Dark Aurora Tech Theme)**

融合赛博朋克的霓虹美学与企业级应用的严谨性，打造一个既有未来感又专业可信赖的Web3资产管理平台。

### 1.2 设计目标

- **专业可信**: 企业级质感，传达安全感与技术实力
- **未来科技**: 霓虹渐变、玻璃态、发光效果，彰显Web3属性
- **沉浸体验**: 深色主题减少视觉疲劳，突出内容层次
- **极致细节**: 每个像素都经过精心打磨

### 1.3 设计语言关键词

```
赛博朋克 | 极光 | 玻璃态 | 霓虹 | 深邃
专业 | 科技 | 未来 | 沉浸 | 精致
```

---

## 二、视觉系统

### 2.1 色彩体系

#### 2.1.1 主色调

| 角色            | 色值      | 用途                       |
| --------------- | --------- | -------------------------- |
| **主色-极光青** | `#00d4aa` | 主按钮、链接、高亮、进度条 |
| **主色-浅**     | `#5ff5d4` | 悬停状态、发光效果         |
| **主色-深**     | `#00a884` | 按下状态、深色强调         |

| 角色            | 色值      | 用途               |
| --------------- | --------- | ------------------ |
| **次色-霓虹紫** | `#7c3aed` | 次按钮、标签、图标 |
| **次色-浅**     | `#a78bfa` | 悬停状态、渐变混合 |
| **次色-深**     | `#5b21b6` | 深色背景、强调     |

#### 2.1.2 强调色板

```css
--color-accent-cyan: #06b6d4; /* 信息提示、科技标签 */
--color-accent-blue: #3b82f6; /* 链接、导航激活 */
--color-accent-pink: #ec4899; /* 警告、特殊状态 */
--color-accent-orange: #f97316; /* 注意、高优先级 */
```

#### 2.1.3 语义色

```css
--color-success: #10b981; /* 成功状态、完成标记 */
--color-warning: #f59e0b; /* 警告提示、待处理 */
--color-error: #ef4444; /* 错误状态、拒绝 */
--color-info: #3b82f6; /* 信息提示、进行中 */
```

#### 2.1.4 背景色（深色主题）

```css
--bg-primary: #0a0a0f; /* 主背景 - 深邃近黑 */
--bg-secondary: #12121a; /* 次背景 - 卡片、面板 */
--bg-tertiary: #1a1a25; /* 三级背景 - 悬浮、选中 */
--bg-card: rgba(26, 26, 37, 0.6); /* 玻璃态卡片 */
--bg-glass: rgba(255, 255, 255, 0.03); /* 微透玻璃 */
--bg-hover: rgba(255, 255, 255, 0.05); /* 悬停背景 */
--bg-active: rgba(0, 212, 170, 0.1); /* 激活背景 */
```

#### 2.1.5 文字色

```css
--text-primary: #ffffff; /* 主文字 - 纯白 */
--text-secondary: rgba(255, 255, 255, 0.8); /* 次文字 - 80%白 */
--text-tertiary: rgba(255, 255, 255, 0.5); /* 辅助文字 - 50%白 */
--text-muted: rgba(255, 255, 255, 0.3); /* 弱化文字 - 30%白 */
--text-link: #00d4aa; /* 链接色 */
```

#### 2.1.6 渐变定义

```css
/* 主渐变 - 青到紫 */
--gradient-primary: linear-gradient(135deg, #00d4aa, #7c3aed);

/* 极光背景渐变 - 半透明 */
--gradient-aurora: linear-gradient(135deg, #00d4aa20, #7c3aed20, #06b6d420);

/* 文字渐变 - 白到青到紫 */
--gradient-text: linear-gradient(135deg, #ffffff 0%, #5ff5d4 50%, #a78bfa 100%);

/* 边框渐变 - 发光效果 */
--gradient-border: linear-gradient(135deg, rgba(0, 212, 170, 0.5), rgba(124, 58, 237, 0.5));

/* 按钮渐变 */
--gradient-button: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);
--gradient-button-hover: linear-gradient(135deg, #5ff5d4 0%, #00d4aa 100%);

/* 卡片渐变 */
--gradient-card: linear-gradient(135deg, rgba(26, 26, 37, 0.8), rgba(18, 18, 26, 0.9));
```

### 2.2 字体系统

#### 2.2.1 字体族

```css
/* 主字体 - 现代无衬线 */
--font-sans:
  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  sans-serif;

/* 等宽字体 - 代码、数据 */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, monospace;
```

#### 2.2.2 字号规范

| 级别        | 名称  | 尺寸            | 行高 | 字重 | 用途       |
| ----------- | ----- | --------------- | ---- | ---- | ---------- |
| **Hero**    | 标题1 | 3.5rem (56px)   | 1.1  | 800  | 页面大标题 |
| **H1**      | 标题2 | 2.5rem (40px)   | 1.2  | 700  | 区块标题   |
| **H2**      | 标题3 | 1.75rem (28px)  | 1.3  | 600  | 子区块标题 |
| **H3**      | 标题4 | 1.5rem (24px)   | 1.4  | 600  | 卡片标题   |
| **H4**      | 标题5 | 1.25rem (20px)  | 1.4  | 500  | 小标题     |
| **Body**    | 正文  | 1rem (16px)     | 1.6  | 400  | 普通文本   |
| **Small**   | 小字  | 0.875rem (14px) | 1.5  | 400  | 辅助文字   |
| **Caption** | 说明  | 0.75rem (12px)  | 1.4  | 400  | 标签、注释 |

#### 2.2.3 字体样式

```css
/* 文字渐变效果 */
.text-gradient {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 发光文字 */
.text-glow {
  text-shadow: 0 0 20px rgba(0, 212, 170, 0.5);
}

/* 等宽数字 */
.font-mono {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum';
}
```

### 2.3 间距系统

#### 2.3.1 基础间距

```css
/* 间距比例 - 基于4px倍数 */
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
```

#### 2.3.2 组件间距

```css
/* 页面内边距 */
--page-padding-x: 2rem; /* 水平 */
--page-padding-y: 1.5rem; /* 垂直 */

/* 卡片内边距 */
--card-padding: 1.5rem;

/* 表单间距 */
--form-item-gap: 1rem;

/* 列表间距 */
--list-item-gap: 0.75rem;

/* 网格间距 */
--grid-gap: 1.5rem;
```

### 2.4 圆角系统

```css
/* 圆角比例 */
--radius-sm: 6px; /* 小 - 标签、徽章 */
--radius-md: 10px; /* 中 - 输入框、小按钮 */
--radius-lg: 14px; /* 大 - 卡片、面板 */
--radius-xl: 20px; /* 超大 - 模态框 */
--radius-full: 9999px; /* 全圆 - 头像、标签 */
```

### 2.5 阴影系统

```css
/* 基础阴影 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);

/* 发光阴影 */
--shadow-glow: 0 0 40px rgba(0, 212, 170, 0.3);
--shadow-glow-lg: 0 0 60px rgba(0, 212, 170, 0.4);
--shadow-glow-purple: 0 0 40px rgba(124, 58, 237, 0.3);

/* 卡片阴影 */
--shadow-card: 0 25px 50px rgba(0, 0, 0, 0.5);
--shadow-card-hover: 0 30px 60px rgba(0, 0, 0, 0.6);

/* 柔和阴影 */
--shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.3);

/* 聚焦阴影 */
--shadow-focus: 0 0 0 3px rgba(0, 212, 170, 0.15);
```

---

## 三、动画与交互系统

### 3.1 动画时间函数

```css
/* 基础缓动 */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* 特色缓动 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.45, 0.05, 0.55, 0.95);
--ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 3.2 动画持续时间

```css
/* 微交互 */
--duration-instant: 100ms; /* 即时反馈 */
--duration-fast: 200ms; /* 快速反馈 */
--duration-normal: 300ms; /* 标准过渡 */
--duration-slow: 500ms; /* 缓慢过渡 */

/* 展示动画 */
--duration-entrance: 600ms; /* 进入动画 */
--duration-exit: 400ms; /* 退出动画 */
--duration-page: 800ms; /* 页面切换 */

/* 循环动画 */
--duration-loop-slow: 20s; /* 慢速循环 */
--duration-loop-normal: 10s; /* 常速循环 */
--duration-loop-fast: 5s; /* 快速循环 */
```

### 3.3 关键帧动画

```css
/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 淡入上移 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 淡入缩放 */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 脉冲发光 */
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 212, 170, 0.6);
  }
}

/* 呼吸效果 */
@keyframes breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 浮动效果 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 旋转效果 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 粒子浮动 */
@keyframes particleFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translate(10px, -20px) scale(1.1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-5px, -40px) scale(0.9);
    opacity: 0.4;
  }
  75% {
    transform: translate(15px, -20px) scale(1.05);
    opacity: 0.5;
  }
}

/* 极光背景流动 */
@keyframes auroraFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 网格渐变移动 */
@keyframes gridMove {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(60px);
  }
}

/* 脉冲圆环扩散 */
@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* 3D立方体旋转 */
@keyframes cubeRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg);
  }
  25% {
    transform: rotateX(90deg) rotateY(0deg);
  }
  50% {
    transform: rotateX(90deg) rotateY(90deg);
  }
  75% {
    transform: rotateX(0deg) rotateY(90deg);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg);
  }
}

/* 闪烁效果 */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 弹跳效果 */
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}

/* 摇摆效果 */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

/* 错误抖动 */
@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px);
  }
  75% {
    transform: translateX(8px);
  }
}

/* 加载动画 */
@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 进度条流动 */
@keyframes progressFlow {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}

/* 扫描线效果 */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

/* 故障效果 */
@keyframes glitch {
  0% {
    clip-path: inset(40% 0 61% 0);
    transform: translate(-2px, 2px);
  }
  20% {
    clip-path: inset(92% 0 1% 0);
    transform: translate(2px, -2px);
  }
  40% {
    clip-path: inset(43% 0 1% 0);
    transform: translate(-2px, 2px);
  }
  60% {
    clip-path: inset(25% 0 58% 0);
    transform: translate(2px, -2px);
  }
  80% {
    clip-path: inset(54% 0 7% 0);
    transform: translate(-2px, 2px);
  }
  100% {
    clip-path: inset(58% 0 43% 0);
    transform: translate(2px, -2px);
  }
}
```

### 3.4 交互反馈

#### 3.4.1 按钮状态

```css
/* 默认状态 */
.btn {
  background: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  box-shadow: 0 4px 14px rgba(0, 212, 170, 0.3);
}

/* 悬停状态 */
.btn:hover {
  background: linear-gradient(135deg, #5ff5d4 0%, #00d4aa 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 170, 0.4);
}

/* 按下状态 */
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 212, 170, 0.3);
}

/* 禁用状态 */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 加载状态 */
.btn.loading {
  position: relative;
  color: transparent;
}

.btn.loading::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

#### 3.4.2 输入框状态

```css
/* 基础样式 */
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all var(--duration-fast) var(--ease-out);
}

/* 占位符 */
.input::placeholder {
  color: var(--text-muted);
}

/* 悬停状态 */
.input:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: var(--bg-hover);
}

/* 聚焦状态 */
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 3px rgba(0, 212, 170, 0.15),
    0 0 20px rgba(0, 212, 170, 0.2);
  background: var(--bg-secondary);
}

/* 错误状态 */
.input.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.input.error:focus {
  box-shadow:
    0 0 0 3px rgba(239, 68, 68, 0.15),
    0 0 20px rgba(239, 68, 68, 0.2);
}

/* 禁用状态 */
.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-secondary);
}

/* 成功状态 */
.input.success {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
```

#### 3.4.3 卡片状态

```css
/* 基础卡片 */
.card {
  background: var(--gradient-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  transition: all var(--duration-normal) var(--ease-out);
}

/* 悬停效果 */
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 170, 0.3);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(0, 212, 170, 0.1);
}

/* 激活状态 */
.card.active {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 1px var(--color-primary),
    0 0 30px rgba(0, 212, 170, 0.2);
}

/* 选中状态 */
.card.selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(124, 58, 237, 0.1));
}

/* 禁用状态 */
.card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 玻璃态效果 */
.card.glass {
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

---

## 四、组件设计规范

### 4.1 按钮 (Button)

#### 4.1.1 按钮类型

```typescript
type ButtonType = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

interface ButtonProps {
  type?: ButtonType;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}
```

#### 4.1.2 按钮样式

```less
// 主要按钮 - 渐变背景
.btn-primary {
  background: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4px 14px rgba(0, 212, 170, 0.4);

  &:hover {
    background: linear-gradient(135deg, #5ff5d4 0%, #00d4aa 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 212, 170, 0.5);
  }
}

// 次要按钮 - 霓虹边框
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid rgba(0, 212, 170, 0.5);

  &:hover {
    background: rgba(0, 212, 170, 0.1);
    border-color: var(--color-primary);
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.2);
  }
}

// 幽灵按钮 - 极简风格
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

// 危险按钮 - 红色强调
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);

  &:hover {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
  }
}

// 链接按钮 - 文字风格
.btn-link {
  background: transparent;
  color: var(--color-primary);
  border: none;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: var(--color-primary-light);
    text-decoration: none;
  }
}
```

### 4.2 输入框 (Input)

#### 4.2.1 输入框类型

```typescript
interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  success?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

#### 4.2.2 输入框样式

```less
// 基础样式
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: var(--bg-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow:
      0 0 0 3px rgba(0, 212, 170, 0.15),
      0 0 20px rgba(0, 212, 170, 0.2);
    background: var(--bg-secondary);
  }
}

// 带图标
.input-with-prefix {
  padding-left: 2.5rem;
  position: relative;

  .prefix {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
  }
}

// 错误状态
.input-error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);

  &:focus {
    box-shadow:
      0 0 0 3px rgba(239, 68, 68, 0.15),
      0 0 20px rgba(239, 68, 68, 0.2);
  }
}

// 成功状态
.input-success {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);

  &:focus {
    box-shadow:
      0 0 0 3px rgba(16, 185, 129, 0.15),
      0 0 20px rgba(16, 185, 129, 0.2);
  }
}

// 大尺寸
.input-large {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
}

// 小尺寸
.input-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
```

#### 4.2.3 卡片样式

```less
// 基础卡片
.card {
  background: var(--gradient-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  transition: all var(--duration-normal) var(--ease-out);
}

// 悬停效果
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 170, 0.3);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(0, 212, 170, 0.1);
}

// 激活状态
.card.active {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 1px var(--color-primary),
    0 0 30px rgba(0, 212, 170, 0.2);
}

// 选中状态
.card.selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(124, 58, 237, 0.1));
}

// 禁用状态
.card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

// 玻璃态效果
.card.glass {
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

---

## 五、页面结构规范

### 5.1 页面布局

#### 5.1.1 通用页面结构

```tsx
// 页面组件结构
<PageContainer>
  {/* 页面头部 */}
  <PageHeader>
    <Breadcrumb />
    <TitleSection>
      <PageIcon />
      <PageTitle />
      <PageSubtitle />
    </TitleSection>
    <HeaderActions>
      <ActionButton />
    </HeaderActions>
  </PageHeader>

  {/* 统计卡片 */}
  <StatsSection>
    <StatCard />
    <StatCard />
    <StatCard />
    <StatCard />
  </StatsSection>

  {/* 筛选区域 */}
  <FilterSection>
    <SearchInput />
    <FilterSelect />
    <DateRange />
    <FilterActions>
      <ResetButton />
      <SearchButton />
    </FilterActions>
  </FilterSection>

  {/* 内容区域 */}
  <ContentSection>
    <DataTable /> 或 <CardGrid />
  </ContentSection>

  {/* 分页 */}
  <Pagination />
</PageContainer>
```

#### 5.1.2 页面容器样式

```less
// 页面容器
.page-container {
  min-height: 100vh;
  padding: 1.5rem 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

// 页面头部
.page-header {
  margin-bottom: 2rem;

  .breadcrumb {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--text-tertiary);

    a:hover {
      color: var(--color-primary);
    }
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;

    .page-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-primary);
      border-radius: var(--radius-lg);
      font-size: 1.5rem;
      color: #fff;
    }

    .text-content {
      .page-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-tertiary);
        margin-top: 0.25rem;
      }
    }
  }

  .header-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
}

// 统计卡片区域
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// 筛选区域
.filter-section {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  margin-bottom: 1.5rem;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    .filter-item {
      flex: 1;
      min-width: 200px;

      &.search-input {
        flex: 2;
      }
    }
  }

  .filter-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

// 内容区域
.content-section {
  .data-table {
    background: var(--bg-card);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}
```

---

## 六、响应式设计

### 6.1 断点定义

```css
/* 断点系统 */
--breakpoint-xs: 480px; /* 手机竖屏 */
--breakpoint-sm: 768px; /* 手机横屏/平板竖屏 */
--breakpoint-md: 1024px; /* 平板横屏/小笔记本 */
--breakpoint-lg: 1280px; /* 标准笔记本 */
--breakpoint-xl: 1440px; /* 大屏幕 */
--breakpoint-2xl: 1920px; /* 超大屏幕 */
```

### 6.2 响应式模式

#### 6.2.1 导航响应式

```less
// 桌面端：水平导航
@media (min-width: 1024px) {
  .navigation {
    .nav-menu {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
    }

    .mobile-menu-btn {
      display: none;
    }
  }
}

// 移动端：汉堡菜单
@media (max-width: 1023px) {
  .navigation {
    .nav-menu {
      display: none; // 默认隐藏

      &.mobile-open {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-primary);
        padding: 1.5rem;
        z-index: 100;
      }
    }

    .mobile-menu-btn {
      display: block;
    }
  }
}
```

#### 6.2.2 网格响应式

```less
// 统计卡片网格
.stats-grid {
  display: grid;
  gap: 1.5rem;

  // 默认：单列（手机）
  grid-template-columns: 1fr;

  // 平板：双列
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  // 桌面：四列
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

// 卡片网格
.card-grid {
  display: grid;
  gap: 1.5rem;

  // 默认：单列
  grid-template-columns: 1fr;

  // 小屏手机：可选两列
  @media (min-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  // 平板：自适应
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  // 桌面：宽松布局
  @media (min-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
```

#### 6.2.3 表格响应式

```less
// 数据表格响应式
.data-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  .data-table {
    min-width: 800px; // 保证表格最小宽度

    th,
    td {
      white-space: nowrap; // 防止内容换行
    }
  }

  // 小屏幕优化
  @media (max-width: 768px) {
    .data-table {
      font-size: 0.875rem;

      th,
      td {
        padding: 0.5rem;
      }
    }
  }
}

// 卡片式表格（移动端替代方案）
.card-table {
  display: none;

  @media (max-width: 768px) {
    display: block;

    .card-row {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 0.75rem;

      .card-row-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;

        .label {
          color: var(--text-tertiary);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .value {
          color: var(--text-primary);
          font-weight: 500;
        }
      }
    }
  }
}
```

### 6.3 触摸优化

```less
// 触摸目标最小尺寸
.touch-target {
  min-width: 44px;
  min-height: 44px;

  // 增大移动端点击区域
  @media (max-width: 768px) {
    min-width: 48px;
    min-height: 48px;
  }
}

// 禁用移动端双击缩放
* {
  touch-action: manipulation;
}

// 平滑滚动
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

// 表单元素移动端优化
input,
select,
textarea {
  font-size: 16px; // 防止iOS缩放

  @media (max-width: 768px) {
    font-size: 16px; // 保持16px避免缩放
  }
}

// 按钮移动端优化
button {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
}
```

---

## 七、设计令牌 (Design Tokens)

### 7.1 CSS变量定义

```css
:root {
  /* ===== 颜色令牌 ===== */

  /* 主色 */
  --color-primary: #00d4aa;
  --color-primary-light: #5ff5d4;
  --color-primary-dark: #00a884;
  --color-primary-50: rgba(0, 212, 170, 0.5);
  --color-primary-20: rgba(0, 212, 170, 0.2);
  --color-primary-10: rgba(0, 212, 170, 0.1);
  --color-primary-5: rgba(0, 212, 170, 0.05);

  /* 次色 */
  --color-secondary: #7c3aed;
  --color-secondary-light: #a78bfa;
  --color-secondary-dark: #5b21b6;
  --color-secondary-50: rgba(124, 58, 237, 0.5);
  --color-secondary-20: rgba(124, 58, 237, 0.2);
  --color-secondary-10: rgba(124, 58, 237, 0.1);

  /* 强调色 */
  --color-accent-cyan: #06b6d4;
  --color-accent-blue: #3b82f6;
  --color-accent-pink: #ec4899;
  --color-accent-orange: #f97316;

  /* 语义色 */
  --color-success: #10b981;
  --color-success-light: #34d399;
  --color-success-dark: #059669;
  --color-warning: #f59e0b;
  --color-warning-light: #fbbf24;
  --color-warning-dark: #d97706;
  --color-error: #ef4444;
  --color-error-light: #f87171;
  --color-error-dark: #dc2626;
  --color-info: #3b82f6;
  --color-info-light: #60a5fa;
  --color-info-dark: #2563eb;

  /* 背景色 */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a25;
  --bg-card: rgba(26, 26, 37, 0.6);
  --bg-glass: rgba(255, 255, 255, 0.03);
  --bg-hover: rgba(255, 255, 255, 0.05);
  --bg-active: rgba(0, 212, 170, 0.1);
  --bg-overlay: rgba(0, 0, 0, 0.8);

  /* 文字色 */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  --text-muted: rgba(255, 255, 255, 0.3);
  --text-inverse: #0a0a0f;

  /* 边框色 */
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);
  --border-focus: rgba(0, 212, 170, 0.5);

  /* ===== 字体令牌 ===== */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;

  /* 字号 */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */
  --text-6xl: 3.75rem; /* 60px */

  /* 字重 */
  --font-thin: 100;
  --font-extralight: 200;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;

  /* 行高 */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* 字间距 */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* ===== 间距令牌 ===== */
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-7: 1.75rem; /* 28px */
  --space-8: 2rem; /* 32px */
  --space-9: 2.25rem; /* 36px */
  --space-10: 2.5rem; /* 40px */
  --space-11: 2.75rem; /* 44px */
  --space-12: 3rem; /* 48px */
  --space-14: 3.5rem; /* 56px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-28: 7rem; /* 112px */
  --space-32: 8rem; /* 128px */
  --space-36: 9rem; /* 144px */
  --space-40: 10rem; /* 160px */
  --space-44: 11rem; /* 176px */
  --space-48: 12rem; /* 192px */
  --space-52: 13rem; /* 208px */
  --space-56: 14rem; /* 224px */
  --space-60: 15rem; /* 240px */
  --space-64: 16rem; /* 256px */
  --space-72: 18rem; /* 288px */
  --space-80: 20rem; /* 320px */
  --space-96: 24rem; /* 384px */

  /* ===== 圆角令牌 ===== */
  --radius-none: 0;
  --radius-sm: 0.375rem; /* 6px */
  --radius-md: 0.625rem; /* 10px */
  --radius-lg: 0.875rem; /* 14px */
  --radius-xl: 1.25rem; /* 20px */
  --radius-2xl: 1.5rem; /* 24px */
  --radius-3xl: 2rem; /* 32px */
  --radius-full: 9999px; /* 全圆 */

  /* ===== 阴影令牌 ===== */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);

  /* 发光阴影 */
  --shadow-glow-sm: 0 0 10px rgba(0, 212, 170, 0.2);
  --shadow-glow-md: 0 0 20px rgba(0, 212, 170, 0.3);
  --shadow-glow-lg: 0 0 40px rgba(0, 212, 170, 0.4);
  --shadow-glow-purple: 0 0 40px rgba(124, 58, 237, 0.3);

  /* 卡片阴影 */
  --shadow-card: 0 25px 50px rgba(0, 0, 0, 0.5);
  --shadow-card-hover: 0 30px 60px rgba(0, 0, 0, 0.6);

  /* 聚焦阴影 */
  --shadow-focus: 0 0 0 3px rgba(0, 212, 170, 0.15);
  --shadow-focus-error: 0 0 0 3px rgba(239, 68, 68, 0.15);
  --shadow-focus-success: 0 0 0 3px rgba(16, 185, 129, 0.15);

  /* ===== 动画时间令牌 ===== */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-entrance: 600ms;
  --duration-exit: 400ms;
  --duration-page: 800ms;
  --duration-loop-slow: 20s;
  --duration-loop-normal: 10s;
  --duration-loop-fast: 5s;

  /* ===== 缓动函数令牌 ===== */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.45, 0.05, 0.55, 0.95);
  --ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* ===== Z-Index层级 ===== */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
  --z-max: 9999;

  /* ===== 页面尺寸 ===== */
  --page-max-width: 1920px;
  --page-padding-x: 2rem;
  --page-padding-y: 1.5rem;
  --header-height: 70px;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 80px;

  /* ===== 组件尺寸 ===== */
  --card-padding: 1.5rem;
  --input-height: 44px;
  --input-height-sm: 36px;
  --input-height-lg: 52px;
  --button-height: 44px;
  --button-height-sm: 36px;
  --button-height-lg: 52px;
  --avatar-size-sm: 32px;
  --avatar-size-md: 40px;
  --avatar-size-lg: 48px;
  --avatar-size-xl: 64px;
  --icon-size-sm: 16px;
  --icon-size-md: 20px;
  --icon-size-lg: 24px;
  --icon-size-xl: 32px;

  /* ===== 栅格系统 ===== */
  --grid-columns: 12;
  --grid-gap: 1.5rem;
  --grid-gap-sm: 0.75rem;
  --grid-gap-lg: 2rem;
}
```

---

## 八、页面模板

### 8.1 认证页面

**用途**: 用户登录、注册

**布局结构**:

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │      极光背景动画 (aurora-bg)      │  │
│  │        - 三层渐变流动              │  │
│  │        - 30个浮动粒子              │  │
│  │        - 3D立方体Logo              │  │
│  │        - 脉冲圆环                  │  │
│  │        - 网格背景                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         玻璃态卡片                 │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │     滑动标签 (登录/注册)       │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │     表单输入框 (带发光效果)     │  │  │
│  │  │     表单输入框                 │  │  │
│  │  │     [ ] 记住我                │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │    [  主按钮 (渐变背景)  ]     │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      🔒 SSL | ⛓️ 区块链 | 🛡️ 安全   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 8.2 列表页模板

**用途**: 数据列表展示（企业管理、NFT铸造、审批中心等）

**布局结构**:

```
┌─────────────────────────────────────────┐
│            导航栏 (70px)                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 面包屑导航                         │  │
│  │ 页面标题 + 副标题                   │  │
│  │ [操作按钮]                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │  │
│  │ │ 统计 │ │ 统计 │ │ 统计 │ │ 统计 │  │  │
│  │ │ 卡片 │ │ 卡片 │ │ 卡片 │ │ 卡片 │  │  │
│  │ └─────┘ └─────┘ └─────┘ └─────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 筛选区域                           │  │
│  │ [搜索] [筛选] [日期] [重置] [搜索]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │        数据表格 / 卡片网格          │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │          [ 分页组件 ]               │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### 8.3 详情页模板

**用途**: 数据详情展示（企业详情、NFT详情、审批详情等）

**布局结构**:

```
┌─────────────────────────────────────────┐
│            导航栏 (70px)                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [返回] 面包屑导航                    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         详情头部卡片                │  │
│  │                                   │  │
│  │   [图标] 标题                      │  │
│  │   副标题 / 描述                     │  │
│  │   标签1 标签2 标签3                 │  │
│  │                                   │  │
│  │   [主要操作] [次要操作]              │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌────────────────────────┬───────────┐  │
│  │                        │           │  │
│  │      主要信息区域       │  侧边栏   │  │
│  │                        │           │  │
│  │  ┌──────────────────┐  │  统计    │  │
│  │  │     Tab 1        │  │  卡片    │  │
│  │  │     Tab 2        │  │          │  │
│  │  │     Tab 3        │  │  快捷    │  │
│  │  └──────────────────┘  │  操作    │  │
│  │                        │          │  │
│  │  [列表 / 表格 / 卡片]   │  相关    │  │
│  │                        │  链接    │  │
│  │                        │          │  │
│  └────────────────────────┴───────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        操作记录 / 时间线           │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 九、图标系统

### 9.1 图标库

项目使用两套图标库：

- **Ant Design Icons**: 基础图标集合，与Ant Design组件风格一致
- **Lucide React**: 现代化线性图标，线条简洁优雅

### 9.2 图标规范

```typescript
// 图标尺寸
type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const iconSizes: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// 图标颜色
type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'text';

const iconColors: Record<IconColor, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  text: 'var(--text-primary)',
};
```

### 9.3 图标使用示例

```tsx
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Blocks, Wallet, Sparkles, Shield } from 'lucide-react';

// 导航图标
const navIcons = {
  dashboard: <DashboardOutlined />,
  enterprise: <TeamOutlined />,
  assets: <FileTextOutlined />,
  nft: <Sparkles size={20} />,
  approval: <SafetyCertificateOutlined />,
  blockchain: <Blocks size={20} />,
};

// 状态图标
const statusIcons = {
  success: <Shield className="text-success" size={16} />,
  warning: <Shield className="text-warning" size={16} />,
  error: <Shield className="text-error" size={16} />,
  pending: <Shield className="text-info" size={16} />,
};
```

---

## 十、最佳实践

### 10.1 性能优化

1. **图片优化**: 使用WebP格式，实现懒加载
2. **字体优化**: 使用font-display: swap，预加载关键字体
3. **CSS优化**: 提取关键CSS，延迟加载非关键样式
4. **动画优化**: 使用transform和opacity，避免触发重排

### 10.2 可访问性

1. **颜色对比**: 确保文字与背景对比度至少4.5:1
2. **键盘导航**: 所有交互元素支持Tab键导航
3. **屏幕阅读器**: 使用语义化HTML和ARIA标签
4. **焦点状态**: 为所有交互元素提供清晰的焦点指示器

### 10.3 国际化

1. **文本方向**: 支持RTL（从右到左）布局
2. **日期格式**: 根据地区自动适配
3. **数字格式**: 使用千分位分隔符，支持不同小数点符号
4. **多语言**: 支持动态切换语言，包括字体适配

---

## 十一、设计资源

### 11.1 配色参考

- 主色: #00d4aa (极光青)
- 次色: #7c3aed (霓虹紫)
- 背景: #0a0a0f (深邃黑)
- 成功: #10b981
- 警告: #f59e0b
- 错误: #ef4444

### 11.2 字体推荐

- 主字体: Inter (Google Fonts)
- 等宽字体: JetBrains Mono
- 中文备选: 思源黑体 (Source Han Sans)

### 11.3 图标资源

- Lucide Icons: https://lucide.dev
- Ant Design Icons: https://ant.design/components/icon/

### 11.4 动画参考

- CSS动画: https://animate.style
- 缓动函数: https://easings.net
- 交互动画: https://ui.dev/am

---

**文档版本**: 1.0  
**最后更新**: 2026-02-21  
**作者**: IP-NFT设计团队  
**审核状态**: 已审核

---

本文档是IP-NFT Enterprise Asset Management System的UI美学设计规范，涵盖了从设计理念到实现细节的全方位指导。所有前端开发人员、UI设计师和产品经理都应熟悉本文档，以确保产品的一致性和高质量。
