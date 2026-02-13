import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './App.less';

/**
 * 应用根组件
 * 提供路由上下文，渲染整个应用
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
