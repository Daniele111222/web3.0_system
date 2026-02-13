import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Crown,
  Shield,
  User,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Filter,
} from 'lucide-react';
import type { EnterpriseMember } from '../../types/enterprise';
import './Enterprise.less';

interface MemberListProps {
  members: EnterpriseMember[];
  onInvite: () => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateRole: (memberId: string, role: string) => void;
}

type FilterRole = 'all' | 'owner' | 'admin' | 'member';
type FilterStatus = 'all' | 'active' | 'pending' | 'inactive';

export const MemberList = ({
  members,
  onInvite,
  onRemoveMember,
  onUpdateRole,
}: MemberListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // 过滤成员
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // 搜索过滤
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        member.user.name.toLowerCase().includes(searchLower) ||
        member.user.email.toLowerCase().includes(searchLower);

      // 角色过滤
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      // 状态过滤
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  // 统计
  const stats = useMemo(() => {
    return {
      total: members.length,
      owners: members.filter((m) => m.role === 'owner').length,
      admins: members.filter((m) => m.role === 'admin').length,
      members: members.filter((m) => m.role === 'member').length,
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
    };
  }, [members]);

  // 获取角色信息
  const getRoleInfo = (role: string) => {
    const roleConfig: Record<string, { label: string; icon: typeof Crown; className: string }> = {
      owner: {
        label: '所有者',
        icon: Crown,
        className: 'role-owner',
      },
      admin: {
        label: '管理员',
        icon: Shield,
        className: 'role-admin',
      },
      member: {
        label: '成员',
        icon: User,
        className: 'role-member',
      },
    };
    return roleConfig[role] || roleConfig.member;
  };

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: typeof CheckCircle2 }
    > = {
      active: {
        label: '活跃',
        className: 'status-active',
        icon: CheckCircle2,
      },
      pending: {
        label: '待审核',
        className: 'status-pending',
        icon: Clock,
      },
      inactive: {
        label: '已停用',
        className: 'status-inactive',
        icon: XCircle,
      },
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  return (
    <div className="member-list-container">
      {/* 统计卡片 */}
      <div className="member-stats-grid">
        <div className="member-stat-card">
          <div className="member-stat-icon member-stat-icon-primary">
            <Users size={20} />
          </div>
          <div className="member-stat-content">
            <span className="member-stat-value">{stats.total}</span>
            <span className="member-stat-label">总成员</span>
          </div>
        </div>

        <div className="member-stat-card">
          <div className="member-stat-icon member-stat-icon-success">
            <Crown size={20} />
          </div>
          <div className="member-stat-content">
            <span className="member-stat-value">{stats.owners}</span>
            <span className="member-stat-label">所有者</span>
          </div>
        </div>

        <div className="member-stat-card">
          <div className="member-stat-icon member-stat-icon-warning">
            <Shield size={20} />
          </div>
          <div className="member-stat-content">
            <span className="member-stat-value">{stats.admins}</span>
            <span className="member-stat-label">管理员</span>
          </div>
        </div>

        <div className="member-stat-card">
          <div className="member-stat-icon member-stat-icon-info">
            <CheckCircle2 size={20} />
          </div>
          <div className="member-stat-content">
            <span className="member-stat-value">{stats.active}</span>
            <span className="member-stat-label">活跃</span>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="member-toolbar">
        <div className="member-search">
          <Search className="member-search-icon" size={18} />
          <input
            type="text"
            className="member-search-input"
            placeholder="搜索成员姓名或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="member-filters">
          <div className="member-filter-group">
            <Filter size={14} />
            <select
              className="member-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
            >
              <option value="all">所有角色</option>
              <option value="owner">所有者</option>
              <option value="admin">管理员</option>
              <option value="member">成员</option>
            </select>
          </div>

          <div className="member-filter-group">
            <select
              className="member-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            >
              <option value="all">所有状态</option>
              <option value="active">活跃</option>
              <option value="pending">待审核</option>
              <option value="inactive">已停用</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onInvite}>
          <Plus size={18} />
          邀请成员
        </button>
      </div>

      {/* 成员列表 */}
      <div className="member-list-card">
        <div className="member-list-header">
          <div className="member-list-title">
            <Users size={18} />
            成员列表
            <span className="member-list-count">{filteredMembers.length} 人</span>
          </div>
        </div>

        <div className="member-list-body">
          {filteredMembers.length === 0 ? (
            <div className="member-list-empty">
              <Users size={48} className="empty-icon" />
              <h4>暂无成员</h4>
              <p>没有找到符合条件的成员</p>
            </div>
          ) : (
            filteredMembers.map((member, index) => {
              const roleInfo = getRoleInfo(member.role);
              const statusInfo = getStatusInfo(member.status);
              const RoleIcon = roleInfo.icon;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={member.id}
                  className="member-list-item animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* 头像 */}
                  <div className="member-avatar">
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt={member.user.name} />
                    ) : (
                      <span className="avatar-initials">{member.user.name.charAt(0)}</span>
                    )}
                    <span className={`member-status-indicator ${statusInfo.className}`} />
                  </div>

                  {/* 用户信息 */}
                  <div className="member-info">
                    <div className="member-name-row">
                      <span className="member-name">{member.user.name}</span>
                      {getRoleBadge(member.role)}
                    </div>
                    <div className="member-meta">
                      <Mail size={12} />
                      <span>{member.user.email}</span>
                    </div>
                  </div>

                  {/* 角色选择器 */}
                  <div className="member-role-selector">
                    <button
                      className="role-selector-trigger"
                      onClick={() => setShowRoleMenu(showRoleMenu === member.id ? null : member.id)}
                    >
                      <RoleIcon size={14} />
                      <span>{roleInfo.label}</span>
                      <ChevronDown size={14} />
                    </button>

                    {showRoleMenu === member.id && (
                      <div className="role-selector-dropdown">
                        {['owner', 'admin', 'member'].map((role) => {
                          const info = getRoleInfo(role);
                          const Icon = info.icon;
                          return (
                            <button
                              key={role}
                              className={`role-option ${member.role === role ? 'active' : ''}`}
                              onClick={() => {
                                onUpdateRole(member.id, role);
                                setShowRoleMenu(null);
                              }}
                            >
                              <Icon size={14} />
                              <span>{info.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 状态 */}
                  <div className="member-status">
                    <StatusIcon size={14} />
                    <span>{statusInfo.label}</span>
                  </div>

                  {/* 加入时间 */}
                  <div className="member-joined">
                    <Clock size={12} />
                    <span>{new Date(member.joinedAt).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {/* 操作菜单 */}
                  <div className="member-actions">
                    <button
                      className="btn btn-ghost btn-icon-only"
                      onClick={() =>
                        setShowActionMenu(showActionMenu === member.id ? null : member.id)
                      }
                    >
                      <MoreVertical size={16} />
                    </button>

                    {showActionMenu === member.id && (
                      <div className="action-dropdown">
                        <button
                          className="action-item"
                          onClick={() => {
                            console.log('查看详情:', member.id);
                            setShowActionMenu(null);
                          }}
                        >
                          <User size={14} />
                          查看详情
                        </button>
                        <button
                          className="action-item"
                          onClick={() => {
                            console.log('发送消息:', member.id);
                            setShowActionMenu(null);
                          }}
                        >
                          <Mail size={14} />
                          发送消息
                        </button>
                        <div className="action-divider" />
                        <button
                          className="action-item action-item-danger"
                          onClick={() => {
                            onRemoveMember(member.id);
                            setShowActionMenu(null);
                          }}
                        >
                          <XCircle size={14} />
                          移除成员
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// 获取角色徽章
const getRoleBadge = (role: string) => {
  const roleConfig: Record<string, { label: string; className: string }> = {
    owner: { label: '所有者', className: 'role-badge role-owner' },
    admin: { label: '管理员', className: 'role-badge role-admin' },
    member: { label: '成员', className: 'role-badge role-member' },
  };
  const config = roleConfig[role] || roleConfig.member;
  return <span className={config.className}>{config.label}</span>;
};
