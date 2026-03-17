"""支持IPFS自动上传的资产业务逻辑层。"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
import logging
from fastapi import HTTPException, status, UploadFile

from app.models.asset import Asset, Attachment, AssetStatus
from app.repositories.asset_repository import AssetRepository
from app.services.pinata_service import (
    get_pinata_service,
    PinataUploadError,
    PinataFileTooLargeError,
    ALLOWED_EXTENSIONS,
    get_file_extension,
)
from app.schemas.asset import (
    AssetCreateRequest,
)

logger = logging.getLogger(__name__)


class AssetServiceWithIPFS:
    """支持IPFS自动上传的资产服务类。"""
    
    ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS
    MAX_FILE_SIZE = 50 * 1024 * 1024
    MAX_FILES_PER_REQUEST = 10
    
    def __init__(self, asset_repo: AssetRepository):
        """
        初始化资产服务。
        
        Args:
            asset_repo: 资产仓库
        """
        self.asset_repo = asset_repo
        self.pinata_service = get_pinata_service()
    
    def _get_file_extension(self, filename: str) -> str:
        """获取文件扩展名。"""
        return get_file_extension(filename)

    @staticmethod
    def _error_detail(code: str, message: str) -> dict:
        return {"code": code, "message": message}
    
    def _validate_file(self, file: UploadFile) -> None:
        """
        验证文件是否符合要求。
        
        Args:
            file: 上传的文件
            
        Raises:
            HTTPException: 文件验证失败
        """
        # 检查文件名
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=self._error_detail("FILE_NAME_REQUIRED", "文件名不能为空"),
            )
        
        # 检查文件扩展名
        ext = self._get_file_extension(file.filename)
        if ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=self._error_detail("UNSUPPORTED_FILE_TYPE", f"不支持的文件类型: {ext}"),
            )
    
    async def _upload_file_to_ipfs(
        self, 
        file: UploadFile,
        asset_name: str,
        asset_id: UUID,
    ) -> dict:
        """
        上传单个文件到IPFS。
        
        Args:
            file: 上传的文件
            asset_name: 资产名称（用于元数据）
            
        Returns:
            dict: 上传结果，包含cid、gateway_url等信息
            
        Raises:
            HTTPException: 上传失败
        """
        try:
            # 读取文件内容
            content = await file.read()
            
            # 检查文件大小
            if len(content) > self.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=self._error_detail(
                        "FILE_TOO_LARGE",
                        f"文件大小超过限制（最大 {self.MAX_FILE_SIZE // 1024 // 1024}MB）",
                    ),
                )
            
            # 准备元数据
            metadata = {
                "asset_name": asset_name,
                "file_name": file.filename,
                "content_type": file.content_type or "application/octet-stream"
            }
            
            # 上传到Pinata
            result = self.pinata_service.upload_file(
                file_content=content,
                file_name=file.filename or "unnamed",
                metadata=metadata
            )
            logger.info(
                "pinata_file_uploaded",
                extra={
                    "asset_id": str(asset_id),
                    "cid": result.get("cid"),
                    "file_name": file.filename or "unnamed",
                },
            )
            
            return result
            
        except PinataFileTooLargeError as e:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=self._error_detail("FILE_TOO_LARGE", str(e)),
            )
        except PinataUploadError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=self._error_detail("PINATA_UPLOAD_FAILED", f"上传到IPFS失败: {str(e)}"),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=self._error_detail("FILE_PROCESSING_FAILED", f"文件处理失败: {str(e)}"),
            )
    
    async def create_asset_with_attachments(
        self,
        enterprise_id: UUID,
        creator_user_id: UUID,
        asset_data: AssetCreateRequest,
        files: Optional[List[UploadFile]] = None,
    ) -> Tuple[Asset, List[Attachment]]:
        """
        创建资产并自动上传附件到IPFS。
        
        这是主要的资产创建方法，支持：
        1. 创建资产基本信息
        2. 自动将文件上传到IPFS
        3. 创建附件记录关联到资产
        
        Args:
            enterprise_id: 企业ID
            creator_user_id: 创建者用户ID
            asset_data: 资产创建数据
            files: 可选的文件列表，自动上传到IPFS
            
        Returns:
            Tuple[Asset, List[Attachment]]: (创建的资产, 附件列表)
            
        Raises:
            HTTPException: 创建失败或上传失败
        """
        # 步骤1：创建资产基本信息
        asset = Asset(
            enterprise_id=enterprise_id,
            creator_user_id=creator_user_id,
            name=asset_data.name,
            type=asset_data.type,
            description=asset_data.description,
            creator_name=asset_data.creator_name,
            creation_date=asset_data.creation_date,
            legal_status=asset_data.legal_status,
            application_number=asset_data.application_number,
            asset_metadata=asset_data.asset_metadata,
            status=AssetStatus.DRAFT,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        # 保存资产到数据库
        created_asset = await self.asset_repo.create_asset(asset)
        
        # 步骤2：如果有文件，自动上传到IPFS并创建附件
        attachments: List[Attachment] = []
        
        if files and len(files) > self.MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=self._error_detail(
                    "TOO_MANY_FILES",
                    f"一次最多只能上传{self.MAX_FILES_PER_REQUEST}个文件",
                ),
            )

        if files:
            for file in files:
                if not file or not file.filename:
                    continue
                
                # 验证文件
                self._validate_file(file)
                
                try:
                    # 上传到IPFS
                    upload_result = await self._upload_file_to_ipfs(
                        file=file,
                        asset_name=created_asset.name,
                        asset_id=created_asset.id,
                    )
                    
                    # 创建附件记录
                    attachment = Attachment(
                        asset_id=created_asset.id,
                        file_name=file.filename,
                        file_type=file.content_type or "application/octet-stream",
                        file_size=upload_result.get("size", 0),
                        ipfs_cid=upload_result["cid"],
                        uploaded_at=datetime.utcnow(),
                    )
                    
                    # 保存附件 - 使用 add_attachment 方法
                    saved_attachment = await self.asset_repo.add_attachment(attachment)
                    attachments.append(saved_attachment)
                    logger.info(
                        "asset_attachment_persisted",
                        extra={
                            "asset_id": str(created_asset.id),
                            "cid": saved_attachment.ipfs_cid,
                            "file_name": saved_attachment.file_name,
                        },
                    )
                    
                except HTTPException:
                    logger.error(
                        "asset_attachment_upload_failed",
                        extra={
                            "asset_id": str(created_asset.id),
                            "cid": "",
                            "file_name": file.filename or "",
                        },
                    )
                    await self.asset_repo.delete_asset(created_asset)
                    raise
                except Exception as e:
                    logger.error(
                        "asset_attachment_upload_failed",
                        extra={
                            "asset_id": str(created_asset.id),
                            "cid": "",
                            "file_name": file.filename or "",
                            "error": str(e),
                        },
                    )
                    await self.asset_repo.delete_asset(created_asset)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=self._error_detail("ATTACHMENT_UPLOAD_FAILED", f"附件上传失败: {str(e)}"),
                    )
        
        return created_asset, attachments
