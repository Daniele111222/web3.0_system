import { useState } from 'react';
import { EnterpriseList } from './EnterpriseList';
import { EnterpriseDetail } from './EnterpriseDetail';
import './Enterprise.css';

export function EnterprisePage() {
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
}

export default EnterprisePage;
