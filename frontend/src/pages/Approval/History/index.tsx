/**
 * 审批历史页面
 * 展示所有已处理的审批记录
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Input, Select, DatePicker, Card, Empty, Tooltip } from 'antd';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Building2,
  User,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApprovalHistory } from '../../../hooks/useApproval';
import type {
  Approval,
  ApprovalType,
  ApprovalStatus,
  ApprovalPriority,
} from '../../../types/approval';
import './History.less';

const { RangePicker } = DatePicker;

/**
 * 优先级配置
 */
const priorityConfig: Record<ApprovalPriority, { color: string; label: string; icon: any }> = {
  low: { color: '#8c8c8c', label: '低', icon: Clock },
  medium: { color: '#faad14', label: '中', icon: AlertCircle },
  high: { color: '#fa8c16', label: '高', icon: AlertCircle },
  urgent: { color: '#ff4d4f', label: '紧急', icon: AlertCircle },
};

/**
 * 状态配置
 */
const statusConfig: Record<
  ApprovalStatus,
  { color: string; label: string; icon: any; bgColor: string }
> = {
  pending: { color: '#1890ff', label: '待审批', icon: Clock, bgColor: '#e6f7ff' },
  approved: { color: '#52c41a', label: '已通过', icon: CheckCircle2, bgColor: '#f6ffed' },
  rejected: { color: '#ff4d4f', label: '已拒绝', icon: XCircle, bgColor: '#fff1f0' },
  returned: { color: '#faad14', label: '已退回', icon: RotateCcw, bgColor: '#fffbe6' },
};

/**
 * 类型配置
 */
const typeConfig: Record<ApprovalType, { color: string; label: string; icon: any }> = {
  enterprise: { color: '#1890ff', label: '企业', icon: Building2 },
  member: { color: '#52c41a', label: '成员', icon: User },
};

/**
 * 审批历史页面
 */
export default function History() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ApprovalType | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<ApprovalPriority | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const { data, total, loading, refresh } = useApprovalHistory({
    page: pagination.current,
    pageSize: pagination.pageSize,
    type: selectedType,
    status: selectedStatus,
    priority: selectedPriority,
    keyword: searchText || undefined,
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

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
   * 处理状态筛选
   */
  const handleStatusChange = useCallback((value: ApprovalStatus | undefined) => {
    setSelectedStatus(value);
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
  const handleTableChange = useCallback((newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  }, []);

  /**
   * 查看详情
   */
  const handleViewDetail = useCallback(
    (approvalId: string) => {
      navigate(`/approvals/history/${approvalId}`);
    },
    [navigate]
  );

  /**
   * 导出记录
   */
  const handleExport = useCallback(() => {
    // 实现导出逻辑
  }, []);

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '审批编号',
      dataIndex: 'approvalId',
      key: 'approvalId',
      width: 150,
      render: (value: string) => <span className="approval-code">{value}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value: ApprovalType) => {
        const config = typeConfig[value];
        const Icon = config.icon;
        return (
          <Tag
            className="type-tag"
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
              borderColor: `${config.color}40`,
            }}
          >
            <Icon size={12} style={{ marginRight: 4 }} />
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 180,
      render: (value: any) => (
        <div className="applicant-info">
          <div className="applicant-name">{value.name}</div>
          <div className="applicant-email">{value.email}</div>
        </div>
      ),
    },
    {
      title: '目标企业',
      dataIndex: 'targetInfo',
      key: 'targetInfo',
      width: 200,
      render: (value: any) => (
        <div className="target-info">
          <div className="target-name">{value.enterpriseName}</div>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (value: string) => {
        const config = priorityConfig[value as keyof typeof priorityConfig];
        const Icon = config.icon;
        return (
          <Tag
            className="priority-tag"
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
              borderColor: `${config.color}40`,
            }}
          >
            <Icon size={12} style={{ marginRight: 4 }} />
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: ApprovalStatus) => {
        const config = statusConfig[value];
        const Icon = config.icon;
        return (
          <Tag
            className="status-tag"
            style={{
              backgroundColor: config.bgColor,
              color: config.color,
              borderColor: `${config.color}40`,
            }}
          >
            <Icon size={12} style={{ marginRight: 4 }} />
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '处理时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 150,
      render: (value: string) => (
        <span className="completed-time">
          {value
            ? new Date(value).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: Approval) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            size="small"
            icon={<Eye size={16} />}
            onClick={() => handleViewDetail(record.approvalId)}
            className="action-btn view"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="history-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">审批历史</h1>
          <p className="page-subtitle">查看所有已处理的审批记录</p>
        </div>
        <div className="header-actions">
          <Button
            icon={<FileSpreadsheet size={16} />}
            onClick={handleExport}
            className="action-btn"
          >
            导出
          </Button>
          <Button type="primary" onClick={refresh} loading={loading} className="refresh-btn">
            刷新
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card className="filter-card" bordered={false}>
        <div className="filter-row">
          <div className="filter-item">
            <span className="filter-label">类型</span>
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: 120 }}
              value={selectedType}
              onChange={handleTypeChange}
            >
              <Select.Option value="enterprise">企业</Select.Option>
              <Select.Option value="member">成员</Select.Option>
            </Select>
          </div>
          <div className="filter-item">
            <span className="filter-label">状态</span>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 120 }}
              value={selectedStatus}
              onChange={handleStatusChange}
            >
              <Select.Option value="approved">已通过</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
              <Select.Option value="returned">已退回</Select.Option>
            </Select>
          </div>
          <div className="filter-item">
            <span className="filter-label">优先级</span>
            <Select
              placeholder="全部优先级"
              allowClear
              style={{ width: 140 }}
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
            <span className="filter-label">处理时间</span>
            <RangePicker style={{ width: 240 }} onChange={handleDateChange} />
          </div>
          <div className="filter-item filter-search">
            <Input.Search
              placeholder="搜索申请人或审批编号"
              allowClear
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              prefix={<Search size={16} />}
            />
          </div>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card className="table-card" bordered={false}>
        <Table
          columns={columns as any}
          dataSource={data}
          rowKey="approvalId"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审批历史记录" />
            ),
          }}
        />
      </Card>
    </div>
  );
}
