/**
 * 审批相关自定义 Hook
 * 修复了请求过于频繁的问题
 */
import { useState, useEffect, useCallback } from 'react';
import type {
  ApprovalListParams,
  Approval,
  ApprovalDetail,
  ApprovalStatistics,
  ApprovalActionRequest,
} from '../types/approval';
import * as approvalService from '../services/approval';

/**
 * 使用审批列表
 * @param params 查询参数，使用引用稳定的方式传递
 */
export function useApprovalList(params?: ApprovalListParams) {
  const [data, setData] = useState<Approval[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 将 params 转换为稳定的字符串依赖
  const paramsKey = params ? JSON.stringify(params) : '';

  const fetchData = useCallback(
    async (fetchParams?: ApprovalListParams) => {
      setLoading(true);
      setError(null);
      try {
        const finalParams = fetchParams || params;
        const response = await approvalService.getPendingApprovals(finalParams);
        setData(response.items);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('获取审批列表失败'));
      } finally {
        setLoading(false);
      }
    },
    // 使用 paramsKey 代替 params，避免对象引用变化导致的重新创建
    [paramsKey]
  );

  // 只在 paramsKey 变化时触发请求，避免重复请求
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await approvalService.getPendingApprovals(params);
        if (isMounted) {
          setData(response.items);
          setTotal(response.total);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('获取审批列表失败'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [paramsKey]);

  return {
    data,
    total,
    loading,
    error,
    refresh: fetchData,
  };
}

/**
 * 使用审批历史
 */
export function useApprovalHistory(params?: ApprovalListParams) {
  const [data, setData] = useState<Approval[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const paramsKey = params ? JSON.stringify(params) : '';

  const fetchData = useCallback(
    async (fetchParams?: ApprovalListParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await approvalService.getApprovalHistory(fetchParams || params);
        setData(response.items);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('获取审批历史失败'));
      } finally {
        setLoading(false);
      }
    },
    [paramsKey]
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await approvalService.getApprovalHistory(params);
        if (isMounted) {
          setData(response.items);
          setTotal(response.total);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('获取审批历史失败'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [paramsKey]);

  return {
    data,
    total,
    loading,
    error,
    refresh: fetchData,
  };
}

/**
 * 使用审批详情
 */
export function useApprovalDetail(approvalId: string | undefined) {
  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!approvalId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await approvalService.getApprovalDetail(approvalId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取审批详情失败'));
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!approvalId) return;

      setLoading(true);
      try {
        const response = await approvalService.getApprovalDetail(approvalId);
        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('获取审批详情失败'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [approvalId]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}

/**
 * 使用审批统计
 */
export function useApprovalStats() {
  const [stats, setStats] = useState<ApprovalStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await approvalService.getApprovalStatistics();
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取审批统计失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await approvalService.getApprovalStatistics();
        if (isMounted) {
          setStats(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('获取审批统计失败'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

/**
 * 使用审批操作
 */
export function useApprovalAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAction = useCallback(
    async (approvalId: string, action: 'approve' | 'reject' | 'return', comment: string) => {
      setLoading(true);
      setError(null);
      try {
        const request: ApprovalActionRequest = {
          action,
          comment,
        };
        const response = await approvalService.processApproval(approvalId, request);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('审批操作失败');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    executeAction,
  };
}
