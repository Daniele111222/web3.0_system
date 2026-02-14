import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from './components/ConfigProvider';
import { router } from './router';
import './App.less';

/**
 * 应用根组件
 * 提供全局主题配置和路由上下文，渲染整个应用
 * 使用ConfigProvider统一配置antd组件主题，确保暗色主题风格一致
 */
function App() {
  return (
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
