import { Outlet, useLocation } from 'react-router-dom';
import { EnterpriseList } from '../../components/enterprise/EnterpriseList';
import './index.less';

const Enterprise = () => {
  const location = useLocation();
  const isDetailPage =
    location.pathname.includes('/enterprises/') && location.pathname !== '/enterprises';

  return (
    <>
      {!isDetailPage && <EnterpriseList />}
      <Outlet />
    </>
  );
};

export default Enterprise;
