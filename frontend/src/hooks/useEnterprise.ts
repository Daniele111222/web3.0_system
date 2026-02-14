import { useCallback, useState } from 'react';
import { useEnterpriseStore } from '../store';
import enterpriseService from '../services/enterprise';
import type {
  EnterpriseCreateRequest,
  EnterpriseUpdateRequest,
  InviteMemberRequest,
  EnterpriseRole,
} from '../types';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }
  return '操作失败，请重试';
}

export function useEnterprise() {
  const {
    enterprises,
    currentEnterprise,
    isLoading,
    error,
    setEnterprises,
    setCurrentEnterprise,
    setLoading,
    setError,
  } = useEnterpriseStore();

  const [actionLoading, setActionLoading] = useState(false);

  // 获取企业列表
  const fetchEnterprises = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      setError(null);
      try {
        const response = await enterpriseService.getMyEnterprises(page, pageSize);
        setEnterprises(response.items);
        return response;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setEnterprises, setLoading, setError]
  );

  // 获取企业详情
  const fetchEnterprise = useCallback(
    async (enterpriseId: string) => {
      setLoading(true);
      setError(null);
      try {
        const enterprise = await enterpriseService.getEnterprise(enterpriseId);
        setCurrentEnterprise(enterprise);
        return enterprise;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentEnterprise, setLoading, setError]
  );

  // 创建企业
  const createEnterprise = useCallback(
    async (data: EnterpriseCreateRequest) => {
      setActionLoading(true);
      setError(null);
      try {
        const enterprise = await enterpriseService.createEnterprise(data);
        setEnterprises([...enterprises, enterprise]);
        return enterprise;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [enterprises, setEnterprises, setError]
  );

  // 更新企业
  const updateEnterprise = useCallback(
    async (enterpriseId: string, data: EnterpriseUpdateRequest) => {
      setActionLoading(true);
      setError(null);
      try {
        const enterprise = await enterpriseService.updateEnterprise(enterpriseId, data);
        setCurrentEnterprise(enterprise);
        setEnterprises(enterprises.map((e) => (e.id === enterpriseId ? enterprise : e)));
        return enterprise;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [enterprises, setEnterprises, setCurrentEnterprise, setError]
  );

  // 删除企业
  const deleteEnterprise = useCallback(
    async (enterpriseId: string) => {
      setActionLoading(true);
      setError(null);
      try {
        await enterpriseService.deleteEnterprise(enterpriseId);
        setEnterprises(enterprises.filter((e) => e.id !== enterpriseId));
        if (currentEnterprise?.id === enterpriseId) {
          setCurrentEnterprise(null);
        }
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [enterprises, currentEnterprise, setEnterprises, setCurrentEnterprise, setError]
  );

  // 邀请成员
  const inviteMember = useCallback(
    async (enterpriseId: string, data: InviteMemberRequest) => {
      setActionLoading(true);
      setError(null);
      try {
        const member = await enterpriseService.inviteMember(enterpriseId, data);
        if (currentEnterprise?.id === enterpriseId) {
          setCurrentEnterprise({
            ...currentEnterprise,
            members: [...(currentEnterprise.members || []), member],
            member_count: (currentEnterprise.member_count || 0) + 1,
          });
        }
        return member;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentEnterprise, setCurrentEnterprise, setError]
  );

  // 更新成员角色
  const updateMemberRole = useCallback(
    async (enterpriseId: string, userId: string, role: EnterpriseRole) => {
      setActionLoading(true);
      setError(null);
      try {
        const member = await enterpriseService.updateMemberRole(enterpriseId, userId, { role });
        if (currentEnterprise?.id === enterpriseId) {
          setCurrentEnterprise({
            ...currentEnterprise,
            members: currentEnterprise.members.map((m) => (m.user_id === userId ? member : m)),
          });
        }
        return member;
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentEnterprise, setCurrentEnterprise, setError]
  );

  // 移除成员
  const removeMember = useCallback(
    async (enterpriseId: string, userId: string) => {
      setActionLoading(true);
      setError(null);
      try {
        await enterpriseService.removeMember(enterpriseId, userId);
        if (currentEnterprise?.id === enterpriseId) {
          setCurrentEnterprise({
            ...currentEnterprise,
            members: (currentEnterprise.members || []).filter((m) => m.user_id !== userId),
            member_count: (currentEnterprise.member_count || 0) - 1,
          });
        }
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentEnterprise, setCurrentEnterprise, setError]
  );

  return {
    enterprises,
    currentEnterprise,
    isLoading,
    actionLoading,
    error,
    fetchEnterprises,
    fetchEnterprise,
    createEnterprise,
    updateEnterprise,
    deleteEnterprise,
    inviteMember,
    updateMemberRole,
    removeMember,
  };
}

export default useEnterprise;
