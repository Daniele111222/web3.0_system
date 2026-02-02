import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import './Layout.css';

/**
 * 主布局组件 - 包含导航栏和内容区域
 */
export function Layout() {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
