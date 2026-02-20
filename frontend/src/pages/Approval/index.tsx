/**
 * 审批管理主页面 - 上下布局版本
 * 顶部：审批中心标题、统计卡片、筛选表单
 * 底部：待审批列表
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Tooltip,
  Empty,
  Popconfirm,
  Typography,
  Spin,
} from 'antd';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { useApprovalList, useApprovalAction, useApprovalStats } from '../../hooks/useApproval';
import type { ApprovalType, ApprovalPriority } from '../../types/approval';
import './ApprovalLayout.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * 类型配置
 */
const typeConfig: Record<string, { color: string; label: string; icon: LucideIcon; bg: string }> = {
  enterprise_create: {
    color: '#1677ff',
    label: '企业创建',
    icon: Building2,
    bg: 'linear-gradient(135deg, #e6f4ff 0%, #d6e4ff 100%)',
  },
  enterprise_update: {
    color: '#722ed1',
    label: '企业变更',
    icon: Building2,
    bg: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
  },
  enterprise_delete: {
    color: '#ff4d4f',
    label: '企业注销',
    icon: Building2,
    bg: 'linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%)',
  },
  member_add: {
    color: '#52c41a',
    label: '成员加入',
    icon: User,
    bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
  },
  member_remove: {
    color: '#fa8c16',
    label: '成员移除',
    icon: User,
    bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
  },
  asset_submit: {
    color: '#13c2c2',
    label: '资产提交审批',
    icon: FileText,
    bg: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)',
  },
};

/**
 * 统计卡片组件
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`stat-card ${visible ? 'visible' : ''}`}
      style={{ '--card-color': color } as React.CSSProperties}
    >
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/**
 * 审批管理主页面
 */
export default function ApprovalPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ApprovalType | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<ApprovalPriority | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 获取审批列表数据
  const { data, total, loading, refresh } = useApprovalList({
    page: pagination.current,
    pageSize: pagination.pageSize,
    type: selectedType,
    priority: selectedPriority,
    keyword: searchText || undefined,
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

  // 获取审批统计数据（从后端API）
  const { stats: approvalStats } = useApprovalStats();

  const { executeAction } = useApprovalAction();

  // 使用后端返回的统计数据，如果没有则使用默认值
  const stats = {
    pending: approvalStats?.pending ?? total ?? 0,
    approved: approvalStats?.approved ?? 0,
    rejected: approvalStats?.rejected ?? 0,
    returned: approvalStats?.returned ?? 0,
  };

  /**
   * 处理搜索
   */
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 处理类型筛选
   */
  const handleTypeChange = useCallback((value: ApprovalType | undefined) => {
    setSelectedType(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 处理优先级筛选
   */
  const handlePriorityChange = useCallback((value: ApprovalPriority | undefined) => {
    setSelectedPriority(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 处理日期范围变化
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateChange = useCallback((dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
    } else {
      setDateRange(null);
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 处理分页变化
   */
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  }, []);

  /**
   * 处理审批操作
   */
  const handleAction = useCallback(
    async (approvalId: string, action: 'approve' | 'reject' | 'return', comment: string) => {
      try {
        await executeAction(approvalId, action, comment);
        refresh();
      } catch (error) {
        console.error('审批操作失败:', error);
      }
    },
    [executeAction, refresh]
  );

  /**
   * 查看详情
   */
  const handleViewDetail = useCallback(
    (approvalId: string) => {
      navigate(`/approvals/${approvalId}`);
    },
    [navigate]
  );

  /**
   * 渲染列表项
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderListItem = (item: any) => {
    const typeInfo = typeConfig[item.type] || {
      color: '#8c8c8c',
      label: item.type,
      icon: FileText,
      bg: '#f5f5f5',
    };
    const TypeIcon = typeInfo.icon;

    return (
      <List.Item
        className="approval-item"
        actions={[
          <Tooltip title="查看详情" key="view">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => handleViewDetail(item.id)}
              className="action-btn view"
            />
          </Tooltip>,
          <Tooltip title="通过" key="approve">
            <Popconfirm
              title="确认通过"
              description="确定要批准该申请吗？"
              onConfirm={() => handleAction(item.id, 'approve', '审批通过')}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="text"
                icon={<CheckCircle2 size={16} />}
                className="action-btn approve"
              />
            </Popconfirm>
          </Tooltip>,
          <Tooltip title="拒绝" key="reject">
            <Popconfirm
              title="确认拒绝"
              description="确定要拒绝该申请吗？"
              onConfirm={() => handleAction(item.id, 'reject', '审批拒绝')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="text" icon={<XCircle size={16} />} className="action-btn reject" />
            </Popconfirm>
          </Tooltip>,
          <Tooltip title="退回" key="return">
            <Popconfirm
              title="确认退回"
              description="确定要退回该申请吗？"
              onConfirm={() => handleAction(item.id, 'return', '需要补充材料')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="text" icon={<RotateCcw size={16} />} className="action-btn return" />
            </Popconfirm>
          </Tooltip>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className="approval-icon" style={{ background: typeInfo.bg }}>
              <TypeIcon size={24} color={typeInfo.color} />
            </div>
          }
          title={
            <div className="approval-header">
              <Text className="approval-id">{item.id.slice(0, 8)}</Text>
              <Tag
                className="type-tag"
                style={{
                  backgroundColor: `${typeInfo.color}15`,
                  color: typeInfo.color,
                  border: `1px solid ${typeInfo.color}30`,
                }}
              >
                {typeInfo.label}
              </Tag>
            </div>
          }
          description={
            <div className="approval-content">
              {item.type === 'asset_submit' && item.asset_name && (
                <div className="approval-row asset-info">
                  <span className="label">资产名称:</span>
                  <Text className="value asset-name">{item.asset_name}</Text>
                  {item.asset_type && (
                    <Tag color="cyan" className="asset-type-tag">
                      {item.asset_type === 'PATENT'
                        ? '专利'
                        : item.asset_type === 'TRADEMARK'
                          ? '商标'
                          : item.asset_type === 'COPYRIGHT'
                            ? '版权'
                            : item.asset_type === 'TRADE_SECRET'
                              ? '商业秘密'
                              : item.asset_type === 'DIGITAL_WORK'
                                ? '数字作品'
                                : item.asset_type}
                    </Tag>
                  )}
                </div>
              )}
              {item.type === 'asset_submit' && item.enterprise_name && (
                <div className="approval-row">
                  <span className="label">申请企业:</span>
                  <Text className="value">{item.enterprise_name}</Text>
                </div>
              )}
              <div className="approval-row">
                <span className="label">申请人备注:</span>
                <span className="value">{item.remarks || '-'}</span>
              </div>
              {item.type !== 'asset_submit' && (
                <div className="approval-row">
                  <span className="label">目标ID:</span>
                  <Text className="value target-id">{item.target_id?.slice(0, 8) || '-'}</Text>
                </div>
              )}
              <div className="approval-meta">
                <span className="meta-item">
                  <Clock size={12} />
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </span>
                <span className="meta-item status">
                  <Tag color="orange">待审批</Tag>
                </span>
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="approval-page">
      {/* 页面头部区域 */}
      <div className="page-header-section">
        {/* 标题区域 */}
        <div className="header-title-area">
          <div className="title-icon">
            <ClipboardCheck size={32} />
          </div>
          <div className="title-content">
            <h1 className="main-title">审批中心</h1>
            <p className="sub-title">企业审批管理平台 · 共 {total} 条待审批</p>
          </div>
        </div>

        {/* 统计卡片区域 */}
        <div className="stats-section">
          <StatCard icon={Clock} label="待审批" value={stats.pending} color="#1890ff" delay={0} />
          <StatCard
            icon={CheckCircle2}
            label="已通过"
            value={stats.approved}
            color="#52c41a"
            delay={100}
          />
          <StatCard
            icon={XCircle}
            label="已拒绝"
            value={stats.rejected}
            color="#ff4d4f"
            delay={200}
          />
          <StatCard
            icon={RotateCcw}
            label="已退回"
            value={stats.returned}
            color="#faad14"
            delay={300}
          />
        </div>

        {/* 筛选栏 */}
        <Card className="filter-card" bordered={false}>
          <div className="filter-row">
            <div className="filter-item">
              <span className="filter-label">类型</span>
              <Select
                placeholder="全部类型"
                allowClear
                style={{ width: 160 }}
                value={selectedType}
                onChange={handleTypeChange}
              >
                <Select.Option value="enterprise_create">企业创建</Select.Option>
                <Select.Option value="enterprise_update">企业变更</Select.Option>
                <Select.Option value="enterprise_delete">企业注销</Select.Option>
                <Select.Option value="member_add">成员加入</Select.Option>
                <Select.Option value="member_remove">成员移除</Select.Option>
                <Select.Option value="asset_submit">资产提交审批</Select.Option>
              </Select>
            </div>
            <div className="filter-item">
              <span className="filter-label">优先级</span>
              <Select
                placeholder="全部优先级"
                allowClear
                style={{ width: 120 }}
                value={selectedPriority}
                onChange={handlePriorityChange}
              >
                <Select.Option value="urgent">紧急</Select.Option>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="low">低</Select.Option>
              </Select>
            </div>
            <div className="filter-item">
              <span className="filter-label">申请时间</span>
              <RangePicker style={{ width: 260 }} onChange={handleDateChange} />
            </div>
            <div className="filter-item filter-search">
              <Input.Search
                placeholder="搜索申请人备注"
                allowClear
                style={{ width: 240 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                prefix={<Search size={14} />}
              />
            </div>
            <div className="filter-item">
              <Button
                type="primary"
                icon={<Search size={14} />}
                onClick={() => refresh()}
                loading={loading}
                className="refresh-btn"
              >
                刷新
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 审批列表区域 */}
      <div className="list-section">
        <Card className="list-card" bordered={false}>
          <Spin spinning={loading}>
            <List
              className="approval-list"
              itemLayout="vertical"
              dataSource={data}
              renderItem={renderListItem}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待审批的申请" />
                ),
              }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50'],
                onChange: handlePageChange,
              }}
            />
          </Spin>
        </Card>
      </div>
    </div>
  );
}
