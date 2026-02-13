import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import './Layout.less';

/**
 * 主布局组件 - 极光科技风格
 * 包含玻璃态导航栏和内容区域
 * 统一的设计风格与登录页保持一致
 */
export function Layout() {
  return (
    <div className="app-layout">
      {/* 导航栏 */}
      <Navigation />

      {/* 主内容区域 */}
      <main className="app-content">
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
