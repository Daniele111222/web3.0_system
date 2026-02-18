/**
 * 审批详情页面
 * 展示单个审批申请的详细信息和审批操作界面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Tag,
  Timeline,
  Divider,
  Input,
  Tooltip,
  Empty,
  Spin,
  message,
  Typography,
} from 'antd';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Building2,
  User,
  FileText,
  Paperclip,
  History,
  AlertCircle,
} from 'lucide-react';
import { useApprovalDetail, useApprovalAction } from '../../../hooks/useApproval';
import './ApprovalDetail.less';

const { TextArea } = Input;
const { Title } = Typography;

import type { LucideIcon } from 'lucide-react';

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
};

/**
 * 快捷审批模板
 */
const quickTemplates = [
  { key: 'approve', label: '✓ 通过，符合要求', color: '#52c41a' },
  { key: 'reject-incomplete', label: '✗ 拒绝，信息不完整', color: '#ff4d4f' },
  { key: 'return-materials', label: '↩ 退回，需补充材料', color: '#faad14' },
];

/**
 * 获取时间线节点样式
 */
function getTimelineDot(action: string) {
  const icons: Record<string, React.ReactNode> = {
    submit: <Clock size={14} style={{ color: '#1890ff' }} />,
    approve: <CheckCircle2 size={14} style={{ color: '#52c41a' }} />,
    reject: <XCircle size={14} style={{ color: '#ff4d4f' }} />,
    return: <RotateCcw size={14} style={{ color: '#faad14' }} />,
  };
  return icons[action] || <Clock size={14} />;
}

/**
 * 获取操作文本
 */
function getActionText(action: string): string {
  const texts: Record<string, string> = {
    submit: '提交申请',
    approve: '审批通过',
    reject: '审批拒绝',
    return: '申请退回',
  };
  return texts[action] || action;
}

/**
 * 审批详情页面
 */
export default function ApprovalDetail() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: approval, loading, refresh } = useApprovalDetail(approvalId);
  const { loading: actionLoading, executeAction } = useApprovalAction();

  /**
   * 返回列表
   */
  const handleBack = useCallback(() => {
    navigate('/approvals/pending');
  }, [navigate]);

  /**
   * 处理快捷模板选择
   */
  const handleTemplateSelect = useCallback((template: (typeof quickTemplates)[0]) => {
    setSelectedTemplate(template.key);
    const templateTexts: Record<string, string> = {
      approve: '审批通过，符合平台要求',
      'reject-incomplete': '审批拒绝，申请信息不完整',
      'return-materials': '申请退回，需要补充相关材料',
    };
    setComment(templateTexts[template.key] || '');
  }, []);

  /**
   * 处理审批操作
   */
  const handleAction = useCallback(
    async (action: 'approve' | 'reject' | 'return') => {
      if (!approvalId) return;

      const actionTexts: Record<string, string> = {
        approve: '审批通过，符合平台要求',
        reject: '审批拒绝，信息不完整',
        return: '申请退回，需要补充材料',
      };

      const finalComment = comment.trim() || actionTexts[action];

      try {
        await executeAction(approvalId, action, finalComment);
        message.success('审批操作成功');
        refresh();
        setComment('');
        setSelectedTemplate(null);
      } catch {
        message.error('审批操作失败');
      }
    },
    [approvalId, comment, executeAction, refresh]
  );

  if (loading) {
    return (
      <div className="approval-detail-page loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="approval-detail-page empty">
        <Empty description="审批记录不存在" />
        <Button onClick={handleBack} type="primary" style={{ marginTop: 16 }}>
          返回列表
        </Button>
      </div>
    );
  }

  const typeInfo = typeConfig[approval.type] || {
    color: '#8c8c8c',
    label: approval.type,
    icon: FileText,
    bg: '#f5f5f5',
  };
  const TypeIcon = typeInfo.icon;

  return (
    <div className="approval-detail-page">
      {/* 页面头部 */}
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={handleBack}
          className="back-btn"
        >
          返回列表
        </Button>
        <div className="header-title-group">
          <Title level={4} className="page-title">
            审批详情
          </Title>
          <div className="header-tags">
            <Tag
              className="type-tag"
              style={{
                backgroundColor: `${typeInfo.color}15`,
                color: typeInfo.color,
                border: `1px solid ${typeInfo.color}30`,
              }}
            >
              <TypeIcon size={12} style={{ marginRight: 4 }} />
              {typeInfo.label}
            </Tag>
            <Tag className="status-tag pending">待审批</Tag>
          </div>
        </div>
        <div className="header-approval-id">
          <span className="label">审批编号</span>
          <span className="value">{approval.id?.slice(0, 8) || '-'}</span>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="page-content">
        {/* 左侧：申请信息 */}
        <div className="content-left">
          {/* 申请人信息 */}
          <Card className="info-card applicant-card" bordered={false}>
            <div className="card-header">
              <h3 className="card-title">
                <User size={18} />
                申请人信息
              </h3>
            </div>
            <div className="applicant-profile">
              <div className="applicant-avatar-placeholder">
                <User size={28} />
              </div>
              <div className="applicant-details">
                <h4 className="applicant-name">申请人 ID</h4>
                <p className="applicant-id">{approval.applicant_id || '-'}</p>
              </div>
            </div>
          </Card>

          {/* 目标信息 */}
          <Card className="info-card target-card" bordered={false}>
            <div className="card-header">
              <h3 className="card-title">
                <Building2 size={18} />
                目标信息
              </h3>
              <Tag
                className="target-type-tag"
                style={{
                  backgroundColor: `${typeInfo.color}15`,
                  color: typeInfo.color,
                  border: `1px solid ${typeInfo.color}30`,
                }}
              >
                {approval.target_type || '-'}
              </Tag>
            </div>
            <div className="target-content">
              <div className="target-item">
                <span className="item-label">目标 ID</span>
                <span className="item-value code">{approval.target_id || '-'}</span>
              </div>
            </div>
          </Card>

          {/* 申请备注 */}
          {approval.remarks && (
            <Card className="info-card remarks-card" bordered={false}>
              <div className="card-header">
                <h3 className="card-title">
                  <FileText size={18} />
                  申请备注
                </h3>
              </div>
              <p className="remarks-content">{approval.remarks}</p>
            </Card>
          )}

          {/* 附件列表 */}
          {approval.attachments && approval.attachments.length > 0 && (
            <Card className="info-card attachments-card" bordered={false}>
              <div className="card-header">
                <h3 className="card-title">
                  <Paperclip size={18} />
                  附件 ({approval.attachments.length})
                </h3>
              </div>
              <div className="attachments-list">
                {approval.attachments?.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <div className="attachment-icon">
                      <FileText size={20} />
                    </div>
                    <div className="attachment-info">
                      <span className="attachment-name">{file.fileName || '附件'}</span>
                    </div>
                    <Tooltip title="下载">
                      <Button
                        type="text"
                        size="small"
                        icon={<FileText size={16} />}
                        className="download-btn"
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 申请时间信息 */}
          <Card className="info-card time-card" bordered={false}>
            <div className="card-header">
              <h3 className="card-title">
                <Clock size={18} />
                申请时间
              </h3>
            </div>
            <div className="time-info">
              <div className="time-item">
                <span className="time-label">创建时间</span>
                <span className="time-value">
                  {approval.created_at
                    ? new Date(approval.created_at).toLocaleString('zh-CN')
                    : '-'}
                </span>
              </div>
              <div className="time-item">
                <span className="time-label">当前步骤</span>
                <span className="time-value">
                  {approval.current_step} / {approval.total_steps}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧：审批操作 */}
        <div className="content-right">
          {/* 审批操作卡片 */}
          <Card className="action-card" bordered={false}>
            <div className="card-header">
              <h3 className="card-title">
                <CheckCircle2 size={18} />
                审批操作
              </h3>
            </div>

            <div className="action-form">
              <div className="form-item">
                <label className="form-label">
                  审批意见 <span className="required">*</span>
                </label>
                <TextArea
                  rows={4}
                  placeholder="请输入审批意见，最少10个字符..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="comment-input"
                  maxLength={500}
                  showCount
                />
              </div>

              <div className="form-item">
                <label className="form-label">快捷模板</label>
                <div className="template-list">
                  {quickTemplates.map((template) => (
                    <button
                      key={template.key}
                      className={`template-btn ${selectedTemplate === template.key ? 'active' : ''}`}
                      style={{ '--template-color': template.color } as React.CSSProperties}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <Divider className="action-divider" />

              <div className="action-warning">
                <AlertCircle size={16} />
                <span>确认提交审批结果？提交后将不可修改。</span>
              </div>

              <div className="action-btns">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircle2 size={18} />}
                  loading={actionLoading}
                  onClick={() => handleAction('approve')}
                  className="action-btn approve"
                  block
                >
                  通过
                </Button>
                <Button
                  size="large"
                  icon={<XCircle size={18} />}
                  loading={actionLoading}
                  onClick={() => handleAction('reject')}
                  className="action-btn reject"
                  block
                >
                  拒绝
                </Button>
                <Button
                  size="large"
                  icon={<RotateCcw size={18} />}
                  loading={actionLoading}
                  onClick={() => handleAction('return')}
                  className="action-btn return"
                  block
                >
                  退回
                </Button>
              </div>
            </div>
          </Card>

          {/* 审批历史时间线 */}
          <Card className="history-card" bordered={false}>
            <div className="card-header">
              <h3 className="card-title">
                <History size={18} />
                审批历史
              </h3>
            </div>
            <div className="history-timeline">
              {approval.processHistory && approval.processHistory.length > 0 ? (
                <Timeline
                  items={approval.processHistory.map((record, index) => ({
                    key: index,
                    dot: getTimelineDot(record.action),
                    children: (
                      <div className="timeline-item">
                        <div className="timeline-header">
                          <span className="timeline-action">{getActionText(record.action)}</span>
                          <span className="timeline-time">
                            {record.created_at
                              ? new Date(record.created_at).toLocaleString('zh-CN')
                              : '-'}
                          </span>
                        </div>
                        <div className="timeline-operator">
                          <span>{record.operator_id?.slice(0, 8) || '-'}</span>
                          <Tag>{record.operator_role || '-'}</Tag>
                        </div>
                        {record.comment && <div className="timeline-comment">{record.comment}</div>}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description="暂无审批历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
