"""资产相关的 Pydantic 模式。"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from uuid import UUID
import re

from app.models.asset import AssetType, LegalStatus, AssetStatus


# ============ 附件相关模式 ============

class AttachmentResponse(BaseModel):
    """附件响应模式。"""
    
    id: UUID
    asset_id: UUID
    file_name: str
    file_type: str
    file_size: int
    ipfs_cid: str
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AttachmentUploadRequest(BaseModel):
    """附件上传请求模式。"""
    
    file_name: str = Field(..., min_length=1, max_length=255, description="文件名")
    file_type: str = Field(..., min_length=1, max_length=100, description="文件类型（MIME type）")
    file_size: int = Field(..., gt=0, description="文件大小（字节）")
    ipfs_cid: str = Field(..., min_length=1, max_length=100, description="IPFS CID")
    
    @field_validator('file_type')
    @classmethod
    def validate_file_type(cls, v: str) -> str:
        """
        验证文件类型格式。
        
        Args:
            v: 文件类型字符串
            
        Returns:
            str: 验证后的文件类型
            
        Raises:
            ValueError: 文件类型格式无效
        """
        # 支持的文件类型列表
        allowed_types = [
            # 文档类型
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            # 图片类型
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'image/webp',
            # 视频类型
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/webm',
            # 音频类型
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            # 压缩文件
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            # 代码文件
            'text/html',
            'text/css',
            'text/javascript',
            'application/json',
            'application/xml',
        ]
        
        if v not in allowed_types:
            raise ValueError(f"不支持的文件类型: {v}。支持的类型: {', '.join(allowed_types)}")
        
        return v
    
    @field_validator('ipfs_cid')
    @classmethod
    def validate_ipfs_cid(cls, v: str) -> str:
        """
        验证 IPFS CID 格式。
        
        Args:
            v: IPFS CID 字符串
            
        Returns:
            str: 验证后的 CID
            
        Raises:
            ValueError: CID 格式无效
        """
        # IPFS CID 通常以 Qm 开头（CIDv0）或 bafy 开头（CIDv1）
        if not (v.startswith('Qm') or v.startswith('bafy') or v.startswith('bafk')):
            raise ValueError("无效的 IPFS CID 格式")
        
        # CID 长度检查
        if len(v) < 46:
            raise ValueError("IPFS CID 长度过短")
        
        return v


# ============ 资产相关模式 ============

class AssetCreateRequest(BaseModel):
    """资产创建请求模式。"""
    
    name: str = Field(..., min_length=1, max_length=200, description="资产名称")
    type: AssetType = Field(..., description="资产类型")
    description: str = Field(..., min_length=1, description="资产描述")
    creator_name: str = Field(..., min_length=1, max_length=100, description="创作人姓名")
    creation_date: date = Field(..., description="创作日期")
    legal_status: LegalStatus = Field(..., description="法律状态")
    application_number: Optional[str] = Field(None, max_length=100, description="申请号/注册号")
    asset_metadata: dict = Field(default_factory=dict, description="资产元数据")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """验证资产名称。"""
        v = v.strip()
        if not v:
            raise ValueError("资产名称不能为空")
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        """验证资产描述。"""
        v = v.strip()
        if not v:
            raise ValueError("资产描述不能为空")
        if len(v) < 10:
            raise ValueError("资产描述至少需要 10 个字符")
        return v
    
    @field_validator('creator_name')
    @classmethod
    def validate_creator_name(cls, v: str) -> str:
        """验证创作人姓名。"""
        v = v.strip()
        if not v:
            raise ValueError("创作人姓名不能为空")
        return v
    
    @field_validator('creation_date')
    @classmethod
    def validate_creation_date(cls, v: date) -> date:
        """验证创作日期不能是未来日期。"""
        if v > date.today():
            raise ValueError("创作日期不能是未来日期")
        return v
    
    @field_validator('application_number')
    @classmethod
    def validate_application_number(cls, v: Optional[str]) -> Optional[str]:
        """验证申请号格式。"""
        if v is not None:
            v = v.strip()
            if not v:
                return None
            # 简单的格式验证（可根据实际需求调整）
            if len(v) < 5:
                raise ValueError("申请号格式无效")
        return v


class AssetUpdateRequest(BaseModel):
    """资产更新请求模式（仅允许更新草稿状态的资产）。"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="资产名称")
    description: Optional[str] = Field(None, min_length=1, description="资产描述")
    creator_name: Optional[str] = Field(None, min_length=1, max_length=100, description="创作人姓名")
    creation_date: Optional[date] = Field(None, description="创作日期")
    legal_status: Optional[LegalStatus] = Field(None, description="法律状态")
    application_number: Optional[str] = Field(None, max_length=100, description="申请号/注册号")
    asset_metadata: Optional[dict] = Field(None, description="资产元数据")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """验证资产名称。"""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("资产名称不能为空")
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """验证资产描述。"""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("资产描述不能为空")
            if len(v) < 10:
                raise ValueError("资产描述至少需要 10 个字符")
        return v
    
    @field_validator('creation_date')
    @classmethod
    def validate_creation_date(cls, v: Optional[date]) -> Optional[date]:
        """验证创作日期不能是未来日期。"""
        if v is not None and v > date.today():
            raise ValueError("创作日期不能是未来日期")
        return v


class AssetResponse(BaseModel):
    """资产响应模式。"""
    
    id: UUID
    enterprise_id: UUID
    creator_user_id: Optional[UUID]
    name: str
    type: AssetType
    description: str
    creator_name: str
    creation_date: date
    legal_status: LegalStatus
    application_number: Optional[str]
    asset_metadata: dict
    status: AssetStatus
    nft_token_id: Optional[str]
    nft_contract_address: Optional[str]
    nft_chain: Optional[str]
    metadata_uri: Optional[str]
    mint_tx_hash: Optional[str]
    created_at: datetime
    updated_at: datetime
    attachments: List[AttachmentResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class AssetListResponse(BaseModel):
    """资产列表响应模式。"""
    
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AssetFilterParams(BaseModel):
    """资产筛选参数。"""
    
    type: Optional[AssetType] = Field(None, description="按资产类型筛选")
    status: Optional[AssetStatus] = Field(None, description="按资产状态筛选")
    legal_status: Optional[LegalStatus] = Field(None, description="按法律状态筛选")
    start_date: Optional[date] = Field(None, description="创作日期起始")
    end_date: Optional[date] = Field(None, description="创作日期结束")
    search: Optional[str] = Field(None, max_length=200, description="搜索关键词（名称、描述）")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(20, ge=1, le=100, description="每页数量")
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v: Optional[date], info) -> Optional[date]:
        """验证日期范围。"""
        if v is not None and 'start_date' in info.data:
            start_date = info.data['start_date']
            if start_date is not None and v < start_date:
                raise ValueError("结束日期不能早于开始日期")
        return v
