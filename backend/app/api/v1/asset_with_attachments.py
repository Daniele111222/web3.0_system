"""支持自动IPFS上传的资产API路由。"""
from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends, UploadFile, File, Form

from app.api.deps import DBSession, CurrentUserId
from app.repositories.asset_repository import AssetRepository
from app.repositories.enterprise_repository import (
    EnterpriseRepository,
    EnterpriseMemberRepository,
)
from app.services.asset_service_with_ipfs import AssetServiceWithIPFS
from app.schemas.asset import AssetCreateRequest, AssetResponse, AttachmentResponse
from app.schemas.response import ApiResponse
import json

router = APIRouter(prefix="/assets", tags=["Assets"])


def parse_current_user_id(current_user_id: str) -> UUID:
    """
    解析并验证当前用户 ID。
    
    Args:
        current_user_id: 当前用户 ID 字符串
        
    Returns:
        UUID: 解析后的用户 ID
        
    Raises:
        HTTPException: 用户 ID 格式无效
    """
    try:
        return UUID(current_user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/with-attachments",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="创建资产并自动上传附件到IPFS",
    description="""
    创建资产并自动上传附件到IPFS。
    
    这个端点将资产创建和附件上传合并为一步操作：
    1. 接收资产基本信息和文件
    2. 创建资产记录
    3. 自动将文件上传到IPFS
    4. 创建附件记录并关联到资产
    
    支持的文件类型：
    - 图片：.jpg, .jpeg, .png, .gif, .webp
    - 文档：.pdf, .doc, .docx, .xls, .xlsx, .txt, .json
    - 视频：.mp4
    - 音频：.mp3
    - 压缩：.zip, .rar, .7z
    
    限制：
    - 单个文件最大 50MB
    - 一次最多上传 10 个文件
    """,
)
async def create_asset_with_attachments(
    db: DBSession,
    current_user_id: CurrentUserId,
    enterprise_id: UUID = Query(..., description="所属企业 ID"),
    asset_data: str = Form(..., description="资产数据（JSON字符串）"),
    files: Optional[List[UploadFile]] = File(None, description="附件文件列表"),
) -> ApiResponse[dict]:
    """
    创建资产并自动上传附件到IPFS。
    
    Args:
        db: 数据库会话
        current_user_id: 当前用户ID
        enterprise_id: 企业ID
        asset_data: 资产数据（JSON字符串）
        files: 附件文件列表
        
    Returns:
        ApiResponse[dict]: 包含资产和附件信息的响应
        
    Raises:
        HTTPException: 验证失败、上传失败等
    """
    # 步骤1：解析资产数据
    try:
        asset_dict = json.loads(asset_data)
        asset_request = AssetCreateRequest(**asset_dict)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"资产数据格式错误：{str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"资产数据验证失败：{str(e)}"
        )
    
    # 步骤2：验证企业存在且用户是成员
    enterprise_repo = EnterpriseRepository(db)
    enterprise = await enterprise_repo.get_by_id(enterprise_id)
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="企业不存在",
        )
    
    user_id = parse_current_user_id(current_user_id)
    member_repo = EnterpriseMemberRepository(db)
    member = await member_repo.get_member(enterprise_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该企业的成员",
        )
    
    # 步骤3：限制文件数量
    if files and len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="一次最多只能上传10个文件",
        )
    
    # 步骤4：调用服务层创建资产并上传附件
    asset_repo = AssetRepository(db)
    asset_service = AssetServiceWithIPFS(asset_repo)
    
    try:
        asset, attachments = await asset_service.create_asset_with_attachments(
            enterprise_id=enterprise_id,
            creator_user_id=user_id,
            asset_data=asset_request,
            files=files,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建资产失败：{str(e)}"
        )
    
    # 步骤5：构建响应
    response_data = {
        "asset": AssetResponse.model_validate(asset).model_dump(),
        "attachments": [
            AttachmentResponse.model_validate(att).model_dump() 
            for att in attachments
        ],
        "summary": {
            "total_files": len(attachments),
            "total_size": sum(att.file_size for att in attachments),
            "gateway_base_url": "https://gateway.pinata.cloud/ipfs/"
        }
    }
    
    return ApiResponse(
        code="SUCCESS",
        message=f"资产创建成功，已上传 {len(attachments)} 个附件到IPFS",
        data=response_data
    )


# 向后兼容：提供原有的分步上传API
# 这些API保持不变，供需要精细控制的前端使用
# - POST /assets (原有：创建资产，不带附件)
# - POST /assets/{asset_id}/attachments (原有：单独上传附件)
# - POST /assets/with-attachments (新增：本文件实现的合并API)
