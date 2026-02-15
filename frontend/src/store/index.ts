import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { enterpriseService } from '../services/enterprise';
import type {
  Enterprise,
  EnterpriseDetail,
  EnterpriseMember,
  EnterpriseSettings,
  EnterpriseUpdateRequest,
} from '../types';

interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      updateUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface Web3State {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  setConnection: (account: string, chainId: number) => void;
  clearConnection: () => void;
}

export const useWeb3Store = create<Web3State>()((set) => ({
  account: null,
  isConnected: false,
  chainId: null,
  setConnection: (account, chainId) =>
    set({
      account,
      isConnected: true,
      chainId,
    }),
  clearConnection: () =>
    set({
      account: null,
      isConnected: false,
      chainId: null,
    }),
}));

// 企业状态管理
interface EnterpriseState {
  enterprises: Enterprise[];
  currentEnterprise: EnterpriseDetail | null;
  members: EnterpriseMember[];
  settings: EnterpriseSettings | null;
  isLoading: boolean;
  error: string | null;
  setEnterprises: (enterprises: Enterprise[]) => void;
  setCurrentEnterprise: (enterprise: EnterpriseDetail | null) => void;
  setMembers: (members: EnterpriseMember[]) => void;
  setSettings: (settings: EnterpriseSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearEnterprise: () => void;
  clearCurrentEnterprise: () => void;
  fetchEnterpriseById: (id: string) => Promise<void>;
  fetchEnterpriseMembers: (id: string) => Promise<void>;
  fetchEnterpriseSettings: (id: string) => Promise<void>;
  updateEnterprise: (id: string, data: EnterpriseUpdateRequest) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
  updateEnterpriseSettings: (id: string, settings: EnterpriseSettings) => Promise<void>;
  removeMember: (enterpriseId: string, userId: string) => Promise<void>;
  inviteMember: (
    enterpriseId: string,
    data: { email?: string; user_id?: string; role: string }
  ) => Promise<void>;
  updateMemberRole: (enterpriseId: string, userId: string, role: string) => Promise<void>;
}

export const useEnterpriseStore = create<EnterpriseState>()((set, get) => ({
  enterprises: [],
  currentEnterprise: null,
  members: [],
  settings: null,
  isLoading: false,
  error: null,

  setEnterprises: (enterprises) => set({ enterprises }),
  setCurrentEnterprise: (enterprise) => set({ currentEnterprise: enterprise }),
  setMembers: (members) => set({ members }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  clearEnterprise: () =>
    set({
      enterprises: [],
      currentEnterprise: null,
      members: [],
      settings: null,
      error: null,
    }),

  clearCurrentEnterprise: () =>
    set({
      currentEnterprise: null,
      members: [],
      settings: null,
      error: null,
    }),

  fetchEnterpriseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const enterprise = await enterpriseService.getEnterprise(id);
      set({ currentEnterprise: enterprise, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取企业详情失败', isLoading: false });
    }
  },

  fetchEnterpriseMembers: async (id: string) => {
    try {
      const members = await enterpriseService.getMembers(id);
      set({ members });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取成员列表失败' });
    }
  },

  fetchEnterpriseSettings: async (id: string) => {
    try {
      const response = await enterpriseService.getEnterprise(id);
      set({ settings: response.settings || null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取设置失败' });
    }
  },

  updateEnterprise: async (id: string, data: EnterpriseUpdateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const enterprise = await enterpriseService.updateEnterprise(id, data);
      set({ currentEnterprise: enterprise, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新企业失败', isLoading: false });
      throw err;
    }
  },

  deleteEnterprise: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await enterpriseService.deleteEnterprise(id);
      get().clearEnterprise();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除企业失败', isLoading: false });
      throw err;
    }
  },

  updateEnterpriseSettings: async (id: string, settings: EnterpriseSettings) => {
    set({ isLoading: true, error: null });
    try {
      // 模拟更新设置（后端API可能需要调整）
      set({ settings, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新设置失败', isLoading: false });
      throw err;
    }
  },

  removeMember: async (enterpriseId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await enterpriseService.removeMember(enterpriseId, userId);
      const members = get().members.filter((m) => m.userId !== userId && m.id !== userId);
      set({ members, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '移除成员失败', isLoading: false });
      throw err;
    }
  },

  inviteMember: async (
    enterpriseId: string,
    data: { email?: string; user_id?: string; role: string }
  ) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await enterpriseService.inviteMember(enterpriseId, {
        email: data.email,
        user_id: data.user_id,
        role: data.role as 'admin' | 'member' | 'viewer',
      });
      const members = get().members.concat(newMember);
      set({ members, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '邀请成员失败', isLoading: false });
      throw err;
    }
  },

  updateMemberRole: async (enterpriseId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMember = await enterpriseService.updateMemberRole(enterpriseId, userId, {
        role: role as 'admin' | 'member' | 'viewer',
      });
      const members = get().members.map((m) =>
        m.userId === userId || m.id === userId ? updatedMember : m
      );
      set({ members, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新角色失败', isLoading: false });
      throw err;
    }
  },
}));
