# 文件处理组件

本文件包含项目中所有文件处理相关的组件信息。

## 1. FileBox 文件盒子

**路径**: `src/components/FileBox/index.tsx`

**用途**: 单个文件展示、预览和下载

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| fileName | string | - | 文件名 |
| fileId | string | - | 文件ID |
| style | any | - | 样式 |
| className | string | - | 类名 |
| downLoadFn | Function | - | 自定义下载函数 |

**业务功能**: 
- 文件预览（图片、PDF）
- 文件下载
- 文件类型图标展示

**使用场景**: 附件展示、文件列表

**示例代码**:
```tsx
import FileBox from '@/components/FileBox';

// 基础用法
<FileBox 
  fileName="合同.pdf" 
  fileId="12345" 
/>

// 自定义样式
<FileBox 
  fileName="图片.png" 
  fileId="67890"
  style={{ marginTop: 10 }}
  className="custom-file"
/>

// 自定义下载函数
<FileBox 
  fileName="文档.docx" 
  fileId="11111"
  downLoadFn={async (fileId) => {
    // 自定义下载逻辑
    await customDownload(fileId);
  }}
/>
```

---

## 2. FileList 文件列表

**路径**: `src/components/FileList/index.tsx`

**用途**: 批量展示文件列表

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| list | any[] | - | 文件列表数据 |
| fileIdkey | string | 'id' | 文件ID字段名 |
| fileNameKey | string | 'fileName' | 文件名字段名 |
| emptyText | string | '-' | 空数据时显示文本 |
| style | any | - | 样式 |
| className | string | - | 类名 |

**业务功能**: 
- 批量展示文件列表
- 使用 FileBox 渲染每个文件

**使用场景**: 详情页附件列表

**示例代码**:
```tsx
import FileList from '@/components/FileList';

const fileData = [
  { id: '1', fileName: '合同.pdf' },
  { id: '2', fileName: '报价单.xlsx' },
  { id: '3', fileName: '说明文档.docx' },
];

// 基础用法
<FileList list={fileData} />

// 自定义字段名
const customData = [
  { fileId: 'a', name: '文件1.pdf' },
  { fileId: 'b', name: '文件2.png' },
];

<FileList 
  list={customData}
  fileIdkey="fileId"
  fileNameKey="name"
  emptyText="暂无附件"
/>

// 配合详情页使用
<Card title="附件列表">
  <FileList 
    list={fileList}
    className="detail-file-list"
  />
</Card>
```

---

## 3. DownloadFile 文件下载

**路径**: `src/components/DownloadFile/index.tsx`

**用途**: 文件下载功能组件

**API**: 

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| files | any[] | [] | 文件列表 |
| type | string | 'fileId' | 下载类型 |

**支持的下载类型**:
- `fileId`: 通过文件ID下载（默认）
- `base64`: base64编码下载
- `url`: 通过URL下载

**业务功能**: 
- 支持多种下载方式（fileId、base64、url）
- 批量文件下载展示

**使用场景**: 文件下载列表

**示例代码**:
```tsx
import DownloadFile from '@/components/DownloadFile';

// fileId 类型下载
const filesById = [
  { fileId: '123', fileName: '文档1.pdf' },
  { fileId: '456', fileName: '文档2.docx' },
];

<DownloadFile 
  files={filesById}
  type="fileId"
/>

// base64 类型下载
const filesByBase64 = [
  { 
    fileName: '图片.png', 
    base64: 'data:image/png;base64,iVBORw0KGgo...' 
  },
];

<DownloadFile 
  files={filesByBase64}
  type="base64"
/>

// url 类型下载
const filesByUrl = [
  { 
    fileName: '视频.mp4', 
    url: 'https://example.com/video.mp4' 
  },
];

<DownloadFile 
  files={filesByUrl}
  type="url"
/>

// 批量下载展示
<Card title="下载列表">
  <DownloadFile 
    files={fileList}
  />
</Card>
```

---

## 4. UploadModal 上传弹窗

**路径**: `src/components/UploadModal/index.tsx`

**用途**: 文件上传弹窗组件

**API**: 

| 属性名 | 类型 | 说明 |
|--------|------|------|
| ref | ref | 组件引用 |

**提供的方法**:

| 方法名 | 参数 | 说明 |
|--------|------|------|
| open | (type, refresh) | 打开上传弹窗 |

**业务功能**: 
- 文件选择和上传
- 上传队列管理
- 上传进度显示
- 多文件上传支持
- 文件类型和大小校验

**使用场景**: 文件上传功能

**示例代码**:
```tsx
import UploadModal from '@/components/UploadModal';
import { useRef } from 'react';
import { Button } from 'antd';

const uploadRef = useRef();

// 打开上传弹窗
const handleOpenUpload = () => {
  uploadRef.current?.open('file', true);
};

// 上传完成的回调
const handleUploadComplete = (files) => {
  console.log('上传完成的文件:', files);
  // 刷新列表
  refreshList();
};

<>
  <Button type="primary" onClick={handleOpenUpload}>
    上传文件
  </Button>
  
  <UploadModal 
    ref={uploadRef}
    onSuccess={handleUploadComplete}
  />
</>
```

---

## 5. CommonUpload 通用上传

**路径**: `src/components/CommonUpload/index.tsx`

**用途**: 封装的上传组件

**API**: 封装的上传组件

**业务功能**: 通用上传封装

**使用场景**: 简单的上传需求

**示例代码**:
```tsx
import CommonUpload from '@/components/CommonUpload';

<CommonUpload
  accept=".jpg,.png,.pdf"
  maxSize={10 * 1024 * 1024} // 10MB
  maxCount={5}
  onChange={(fileList) => console.log(fileList)}
/>
```

---

## 6. FileBreadcrumb 文件面包屑

**路径**: `src/components/FileBreadcrumb/index.tsx`

**用途**: 文件路径导航

**业务功能**: 
- 文件路径层级展示
- 路径导航

**使用场景**: 文件管理器、目录导航

**示例代码**:
```tsx
import FileBreadcrumb from '@/components/FileBreadcrumb';

const pathList = [
  { name: '根目录', path: '/' },
  { name: '文档', path: '/docs' },
  { name: '项目资料', path: '/docs/project' },
];

<FileBreadcrumb 
  pathList={pathList}
  onNavigate={(path) => console.log('导航到:', path)}
/>
```

---

## 文件组件选择指南

| 场景 | 推荐组件 | 原因 |
|------|----------|------|
| 单文件展示 | FileBox | 支持预览和下载 |
| 多文件列表 | FileList | 批量展示 |
| 文件下载功能 | DownloadFile | 支持多种下载方式 |
| 文件上传 | UploadModal | 完整的上传功能 |
| 简单上传 | CommonUpload | 轻量级上传 |
| 文件路径导航 | FileBreadcrumb | 层级展示 |

## 文件处理通用规范

1. **文件ID字段**: 默认使用 `id` 或 `fileId`，可通过配置修改
2. **文件名字段**: 默认使用 `fileName`，可通过配置修改
3. **文件类型**: 根据文件扩展名自动判断类型图标
4. **空数据展示**: 默认显示 `-` 或自定义空文本
5. **下载方式**: 优先使用文件ID下载，支持base64和URL方式
