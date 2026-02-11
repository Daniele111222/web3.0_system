import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import './Asset.less';

interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  onFilesSelected: (files: FileInfo[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

/**
 * 文件上传组件
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
  ],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * 验证文件
   */
  const validateFile = (file: File): boolean => {
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
   * 处理文件选择
   */
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: FileInfo[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < fileList.length; i++) {
      if (currentFileCount + newFiles.length >= maxFiles) {
        alert(`最多只能上传 ${maxFiles} 个文件`);
        break;
      }

      const file = fileList[i];
      if (validateFile(file)) {
        newFiles.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    }

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
          拖拽文件到此处，或点击选择文件
          <br />
          <small>支持 PDF、图片、视频、压缩包等格式，单个文件最大 100MB</small>
        </p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((fileInfo, index) => (
            <div key={index} className="file-item">
              <div className="file-item-info">
                <span className="file-item-name">{fileInfo.name}</span>
                <span className="file-item-size">{formatFileSize(fileInfo.size)}</span>
              </div>
              <button
                type="button"
                className="file-item-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
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
