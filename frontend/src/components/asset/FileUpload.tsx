import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import './Asset.less';

/**
 * 文件信息接口
 */
interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

/**
 * 文件上传组件属性接口
 */
interface FileUploadProps {
  /** 文件选择回调 */
  onFilesSelected: (files: FileInfo[]) => void;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 接受的文件类型 */
  acceptedTypes?: string[];
}

/**
 * 文件上传组件
 *
 * 支持拖拽上传和点击选择文件，提供文件列表展示和删除功能。
 *
 * @param onFilesSelected - 文件选择回调函数
 * @param maxFiles - 最大允许上传文件数（默认10）
 * @param acceptedTypes - 接受的MIME类型数组
 */
export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}: FileUploadProps) {
  // 已选择的文件列表
  const [files, setFiles] = useState<FileInfo[]>([]);
  // 是否正在拖拽
  const [isDragging, setIsDragging] = useState(false);
  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // 检查文件类型
    if (!acceptedTypes.includes(file.type)) {
      alert(`不支持的文件类型: ${file.type}`);
      return false;
    }

    // 限制单个文件大小为 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`文件 ${file.name} 超过 100MB 限制`);
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

    const newFiles: FileInfo[] = [];
    const currentFileCount = files.length;

    // 遍历文件列表
    for (let i = 0; i < fileList.length; i++) {
      // 检查是否超过最大文件数
      if (currentFileCount + newFiles.length >= maxFiles) {
        alert(`最多只能上传 ${maxFiles} 个文件`);
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
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
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
          accept={acceptedTypes.join(',')}
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
              <small>支持 PDF、图片、视频、压缩包等格式，单个文件最大 100MB</small>
            </>
          )}
        </p>
      </div>

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
              </div>
              <button
                type="button"
                className="file-item-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                title="移除文件"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
