import { useEnterpriseStore } from '../../store';
import { AssetPage } from './AssetPage';

/**
 * 资产页面包装器 - 从企业状态获取当前企业ID
 */
export function AssetPageWrapper() {
  const { currentEnterprise } = useEnterpriseStore();

  if (!currentEnterprise) {
    return (
      <div className="asset-page">
        <div className="info-message">
          <h2>请先选择企业</h2>
          <p>您需要先在企业管理页面选择或创建一个企业，才能管理资产。</p>
        </div>
      </div>
    );
  }

  return <AssetPage enterpriseId={currentEnterprise.id} />;
}
