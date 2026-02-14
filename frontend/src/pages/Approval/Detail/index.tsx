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
  Avatar,
  Divider,
  Input,
  Upload,
  Steps,
  Tooltip,
  Empty,
  Spin,
  message,
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
  Download,
  Paperclip,
  History,
  AlertCircle,
} from 'lucide-react';
import { useApprovalDetail, useApprovalAction } from '../../../hooks/useApproval';
import type { ApprovalPriority, ApprovalProcessRecord } from '../../../types/approval';
import './ApprovalDetail.less';

const { TextArea } = Input;
const { Step } = Steps;

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
 * 快捷审批模板
 */
const quickTemplates = [
  { key: 'approve', label: '✓ 通过，符合要求', color: '#52c41a' },
  { key: 'reject-incomplete', label: '✗ 拒绝，信息不完整', color: '#ff4d4f' },
  { key: 'return-materials', label: '↩ 退回，需补充材料', color: '#faad14' },
];

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
        approve: '审批通过',
        reject: '审批拒绝',
        return: '申请退回',
      };

      const finalComment = comment.trim() || actionTexts[action];

      try {
        await executeAction(approvalId, action, finalComment);
        message.success('审批操作成功');
        refresh();
        setComment('');
        setSelectedTemplate(null);
      } catch (error) {
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

  const priorityCfg = priorityConfig[approval.priority];
  const PriorityIcon = priorityCfg.icon;

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
          <h1 className="page-title">审批详情</h1>
          <div className="header-tags">
            <Tag
              className="priority-tag"
              style={{
                backgroundColor: `${priorityCfg.color}20`,
                color: priorityCfg.color,
                borderColor: `${priorityCfg.color}40`,
              }}
            >
              <PriorityIcon size={12} style={{ marginRight: 4 }} />
              {priorityCfg.label}优先级
            </Tag>
            <Tag className="status-tag pending">待审批</Tag>
          </div>
        </div>
        <div className="header-approval-id">
          <span className="label">审批编号</span>
          <span className="value">{approval.approvalId}</span>
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
              <Avatar
                size={64}
                src={approval.applicant.avatar}
                icon={<User size={28} />}
                className="applicant-avatar"
              />
              <div className="applicant-details">
                <h4 className="applicant-name">{approval.applicant.name}</h4>
                <p className="applicant-email">{approval.applicant.email}</p>
                <p className="applicant-id">ID: {approval.applicant.userId}</p>
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
                className="type-tag"
                style={{
                  backgroundColor: `${typeConfig[approval.type].color}20`,
                  color: typeConfig[approval.type].color,
                }}
              >
                {typeConfig[approval.type].label}
              </Tag>
            </div>
            <div className="target-content">
              <div className="target-item">
                <span className="item-label">企业名称</span>
                <span className="item-value">{approval.targetInfo.enterpriseName}</span>
              </div>
              <div className="target-item">
                <span className="item-label">企业ID</span>
                <span className="item-value code">{approval.targetInfo.enterpriseId}</span>
              </div>
              {approval.targetInfo.changes && (
                <div className="changes-section">
                  <h5 className="changes-title">变更内容</h5>
                  {Object.entries(approval.targetInfo.changes).map(
                    ([key, change]: [string, any]) => (
                      <div key={key} className="change-item">
                        <span className="change-field">{key}</span>
                        <div className="change-values">
                          <span className="old-value">{change.old}</span>
                          <span className="arrow">→</span>
                          <span className="new-value">{change.new}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
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
                {approval.attachments.map((file) => (
                  <div key={file.fileId} className="attachment-item">
                    <div className="attachment-icon">
                      <FileText size={20} />
                    </div>
                    <div className="attachment-info">
                      <span className="attachment-name">{file.fileName}</span>
                      {file.fileSize && (
                        <span className="attachment-size">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                    <Tooltip title="下载">
                      <Button
                        type="text"
                        size="small"
                        icon={<Download size={16} />}
                        className="download-btn"
                        href={file.fileUrl}
                        target="_blank"
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            </Card>
          )}
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

              <div className="form-item">
                <label className="form-label">附件上传（可选）</label>
                <Upload.Dragger
                  className="upload-area"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  maxCount={5}
                  beforeUpload={() => false}
                >
                  <p className="upload-icon">
                    <Paperclip size={32} />
                  </p>
                  <p className="upload-text">点击上传或拖拽文件到此处</p>
                  <p className="upload-hint">支持 PDF、图片、Word 格式，单个文件最大 10MB</p>
                </Upload.Dragger>
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
                  items={approval.processHistory.map(
                    (record: ApprovalProcessRecord, index: number) => ({
                      key: index,
                      dot: getTimelineDot(record.action),
                      children: (
                        <div className="timeline-item">
                          <div className="timeline-header">
                            <span className="timeline-action">{getActionText(record.action)}</span>
                            <span className="timeline-time">
                              {new Date(record.time).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <div className="timeline-operator">
                            <Avatar size={20} icon={<User size={12} />} />
                            <span>{record.operator.name}</span>
                            <Tag size="small">{record.operator.role}</Tag>
                          </div>
                          {record.comment && (
                            <div className="timeline-comment">{record.comment}</div>
                          )}
                        </div>
                      ),
                    })
                  )}
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
