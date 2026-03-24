import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import './Asset.less';

/**
 * 文件信息接口
 */
export interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

export type UploadVisualStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface UploadStatusItem {
  status: UploadVisualStatus;
  cid?: string;
  message?: string;
}

/**
 * 文件上传组件属性接口
 */
interface FileUploadProps {
  /** 文件选择回调 */
  onFilesSelected: (files: FileInfo[]) => void;
  /** 文件哈希变更回调 */
  onHashRecordsChange?: (hashRecords: Record<string, string>) => void;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 接受的文件后缀 */
  acceptedExtensions?: string[];
  /** 上传状态映射 */
  uploadStatusMap?: Record<string, UploadStatusItem>;
  /** 提交中状态 */
  isSubmitting?: boolean;
}

/**
 * 文件上传组件
 *
 * 支持拖拽上传和点击选择文件，提供文件列表展示和删除功能。
 *
 * @param onFilesSelected - 文件选择回调函数
 * @param maxFiles - 最大允许上传文件数（默认10）
 * @param acceptedExtensions - 接受的文件后缀数组
 */
export function FileUpload({
  onFilesSelected,
  onHashRecordsChange,
  maxFiles = 10,
  acceptedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.txt',
    '.json',
    '.mp4',
    '.mp3',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.zip',
    '.rar',
    '.7z',
  ],
  uploadStatusMap = {},
  isSubmitting = false,
}: FileUploadProps) {
  // 已选择的文件列表
  const [files, setFiles] = useState<FileInfo[]>([]);
  // 是否正在拖拽
  const [isDragging, setIsDragging] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [hashRecords, setHashRecords] = useState<Record<string, string>>({});
  const [hashingFiles, setHashingFiles] = useState<Record<string, boolean>>({});
  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceCodeExtensions = new Set([
    '.py',
    '.js',
    '.ts',
    '.tsx',
    '.jsx',
    '.java',
    '.go',
    '.rs',
    '.sol',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.rb',
    '.swift',
    '.kt',
    '.scala',
    '.sql',
    '.sh',
    '.bat',
    '.ps1',
    '.yaml',
    '.yml',
    '.toml',
    '.ini',
    '.json',
    '.xml',
  ]);

  const getFileExtension = (name: string): string => {
    if (!name.includes('.')) {
      return '';
    }
    return `.${name.split('.').pop()?.toLowerCase() ?? ''}`;
  };

  const isSourceFile = (name: string): boolean => sourceCodeExtensions.has(getFileExtension(name));

  /**
   * 格式化文件大小显示
   * @param bytes - 字节数
   * @returns 格式化后的字符串
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * 获取文件图标
   * @param fileType - MIME类型
   * @returns 对应的emoji图标
   */
  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦';
    return '📎';
  };

  /**
   * 验证文件是否合法
   * @param file - 文件对象
   * @returns 是否通过验证
   */
  const validateFile = (file: File): boolean => {
    const extension = getFileExtension(file.name);
    if (!acceptedExtensions.includes(extension)) {
      setValidationMessage(`不支持的文件类型: ${extension || '未知类型'}`);
      return false;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationMessage(`文件 ${file.name} 超过 50MB 限制`);
      return false;
    }

    return true;
  };

  /**
   * 处理文件列表
   * @param fileList - 文件列表
   */
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setValidationMessage(null);

    const newFiles: FileInfo[] = [];
    const currentFileCount = files.length;

    // 遍历文件列表
    for (let i = 0; i < fileList.length; i++) {
      // 检查是否超过最大文件数
      if (currentFileCount + newFiles.length >= maxFiles) {
        setValidationMessage(`最多只能上传 ${maxFiles} 个文件`);
        break;
      }

      const file = fileList[i];
      // 验证文件
      if (validateFile(file)) {
        newFiles.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    }

    // 更新文件列表
    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 处理文件放置
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  };

  /**
   * 处理点击上传
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  /**
   * 移除文件
   */
  const handleRemoveFile = (index: number) => {
    const removedFile = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    if (removedFile) {
      const updatedHashes = { ...hashRecords };
      delete updatedHashes[removedFile.name];
      setHashRecords(updatedHashes);
      onHashRecordsChange?.(updatedHashes);
    }
  };

  const calculateFileHash = async (fileInfo: FileInfo) => {
    try {
      setHashingFiles((prev) => ({ ...prev, [fileInfo.name]: true }));
      const fileBuffer = await fileInfo.file.arrayBuffer();
      const digestBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const digestArray = Array.from(new Uint8Array(digestBuffer));
      const hashValue = digestArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const updatedHashes = { ...hashRecords, [fileInfo.name]: hashValue };
      setHashRecords(updatedHashes);
      onHashRecordsChange?.(updatedHashes);
      setValidationMessage(null);
    } catch {
      setValidationMessage(`文件 ${fileInfo.name} 哈希计算失败`);
    } finally {
      setHashingFiles((prev) => ({ ...prev, [fileInfo.name]: false }));
    }
  };

  const statusLabelMap: Record<UploadVisualStatus, string> = {
    pending: '待上传',
    processing: '处理中',
    success: '成功',
    failed: '失败',
  };

  return (
    <div className="form-group">
      <label>附件上传</label>

      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <p>
          {isDragging ? (
            <>
              <strong>释放以上传文件</strong>
            </>
          ) : (
            <>
              <strong>拖拽文件到此处，或点击选择文件</strong>
              <br />
              <small>支持常见文档/图片/音视频/压缩格式，单个文件最大 50MB，最多 10 个</small>
            </>
          )}
        </p>
      </div>

      {validationMessage && <span className="error-text">{validationMessage}</span>}

      {files.length > 0 && (
        <div className="file-list">
          {files.map((fileInfo, index) => (
            <div key={index} className="file-item">
              <div className="file-item-info">
                <span className="file-item-icon">{getFileIcon(fileInfo.type)}</span>
                <span className="file-item-name" title={fileInfo.name}>
                  {fileInfo.name}
                </span>
                <span className="file-item-size">{formatFileSize(fileInfo.size)}</span>
                {uploadStatusMap[fileInfo.name] && (
                  <span className="file-item-status">
                    {statusLabelMap[uploadStatusMap[fileInfo.name].status]}
                  </span>
                )}
              </div>
              <div className="file-item-actions">
                {isSourceFile(fileInfo.name) ? (
                  <button
                    type="button"
                    className="file-item-hash"
                    disabled={hashingFiles[fileInfo.name] || isSubmitting}
                    onClick={(event) => {
                      event.stopPropagation();
                      calculateFileHash(fileInfo);
                    }}
                  >
                    {hashingFiles[fileInfo.name] ? '计算中...' : '计算文件哈希'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="file-item-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  title="移除文件"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {files.map((fileInfo) => {
            const statusItem = uploadStatusMap[fileInfo.name];
            const hashValue = hashRecords[fileInfo.name];
            if (!statusItem?.cid && !hashValue && !statusItem?.message) {
              return null;
            }
            return (
              <div key={`${fileInfo.name}-extra`} className="file-item-extra">
                {statusItem?.cid ? <div>CID: {statusItem.cid}</div> : null}
                {hashValue ? <div>SHA-256: {hashValue}</div> : null}
                {statusItem?.message ? <div>{statusItem.message}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
