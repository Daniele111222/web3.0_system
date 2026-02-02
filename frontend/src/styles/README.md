# Styles Architecture

Modern CSS architecture for Web3 IP-NFT Enterprise Asset Management System.

## Directory Structure

```
src/styles/
├── variables.css          # CSS Variables / Design Tokens
├── base.css              # Reset & Base Styles
├── utilities.css         # Atomic Utility Classes
├── animations.css        # Keyframes & Animation Utilities
├── responsive.css        # Media Queries & Responsive Utilities
├── dark-mode.css         # Dark Mode Support
└── components/
    ├── buttons.css       # Button Component Styles
    ├── messages.css      # Alert/Message/Toast Styles
    └── loading.css       # Loading States & Skeletons
```

## Usage

### Import Order (in App.css)

```css
@import './styles/variables.css'; /* 1. Must be first - defines all CSS vars */
@import './styles/base.css'; /* 2. Reset & base styles */
@import './styles/components/*.css'; /* 3. Component styles */
@import './styles/utilities.css'; /* 4. Utility classes */
@import './styles/animations.css'; /* 5. Animations */
@import './styles/responsive.css'; /* 6. Responsive queries */
@import './styles/dark-mode.css'; /* 7. Dark mode (last) */
```

### Using CSS Variables

```css
.my-component {
  color: var(--color-primary-600);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Using Utility Classes

```html
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 class="text-xl font-bold text-gray-900">Title</h1>
  <button class="btn btn-primary">Action</button>
</div>
```

### Using Components

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-danger">Danger</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Messages -->
<div class="message message-error">Error message</div>
<div class="message message-success">Success message</div>
<div class="message message-warning">Warning message</div>
<div class="message message-info">Info message</div>

<!-- Loading -->
<div class="loading">
  <div class="spinner"></div>
  <span class="loading-text">Loading...</span>
</div>

<!-- Skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-avatar"></div>
```

### Using Animations

```html
<div class="animate-fade-in">Fades in on load</div>
<div class="animate-scale-in delay-200">Scales in with delay</div>
<div class="animate-bounce iterate-infinite">Bouncing forever</div>
```

## Design Tokens

### Colors

- **Primary**: Purple gradient theme (500: #6366f1)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)
- **Gray**: Slate scale (50-900)

### Typography

- **Font**: Inter, system-ui, sans-serif
- **Mono**: JetBrains Mono, Fira Code
- **Sizes**: xs (12px) → 4xl (36px)

### Spacing

- **Scale**: 0.25rem (4px) increments
- **Range**: space-1 (4px) → space-40 (160px)

### Border Radius

- **sm**: 6px
- **md**: 10px
- **lg**: 14px
- **xl**: 20px
- **full**: 9999px

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Dark Mode

Automatic via `prefers-color-scheme: dark`, or manual with `.dark` class on `<html>` or `<body>`.

```html
<html class="dark">
  <!-- Dark mode styles applied -->
</html>
```

## Best Practices

1. **Always use CSS variables** for colors, spacing, etc.
2. **Prefer utility classes** for simple layouts
3. **Use component classes** for complex UI elements
4. **Animate with purpose** - don't overuse animations
5. **Test in dark mode** when adding new styles
6. **Respect reduced motion** preferences
