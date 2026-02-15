import { useParams, useNavigate } from 'react-router-dom';
import { EnterpriseDetail } from '../../../components/enterprise/EnterpriseDetail';

const EnterpriseDetailPage = () => {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/enterprises');
  };

  if (!enterpriseId) {
    handleBack();
    return null;
  }

  return <EnterpriseDetail enterpriseId={enterpriseId} onBack={handleBack} />;
};

export default EnterpriseDetailPage;
