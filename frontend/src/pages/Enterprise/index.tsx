import { useState } from 'react';
import { EnterpriseList } from '../../components/enterprise/EnterpriseList';
import { EnterpriseDetail } from '../../components/enterprise/EnterpriseDetail';
import './index.less';

const Enterprise = () => {
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null);

  if (selectedEnterpriseId) {
    return (
      <EnterpriseDetail
        enterpriseId={selectedEnterpriseId}
        onBack={() => setSelectedEnterpriseId(null)}
      />
    );
  }

  return <EnterpriseList onSelectEnterprise={setSelectedEnterpriseId} />;
};

export default Enterprise;
