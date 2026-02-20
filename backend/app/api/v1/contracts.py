"""合约管理API模块。

提供智能合约部署、查询和管理功能。
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.contract_deployment_service import ContractDeploymentService
from app.core.blockchain import BlockchainConnectionError

router = APIRouter(prefix="/contracts", tags=["Contracts"])


class DeployContractResponse(BaseModel):
    success: bool
    message: str
    data: dict


class ContractInfoResponse(BaseModel):
    success: bool
    message: str
    data: dict


class UpdateContractAddressRequest(BaseModel):
    contract_address: str


@router.post(
    "/deploy",
    response_model=DeployContractResponse,
    status_code=status.HTTP_201_CREATED,
    summary="部署智能合约",
    description="在区块链上部署IP-NFT智能合约",
)
async def deploy_contract() -> DeployContractResponse:
    """
    部署 IP-NFT 智能合约到区块链。
    
    Returns:
        包含部署结果的字典，包括合约地址、交易哈希等
    
    Raises:
        HTTPException: 部署失败时抛出
    """
    try:
        result = ContractDeploymentService.deploy_contract()
        return DeployContractResponse(**result)
    except BlockchainConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"合约部署失败: {str(e)}",
        )


@router.get(
    "/info",
    response_model=ContractInfoResponse,
    summary="获取合约信息",
    description="获取当前部署的合约信息",
)
async def get_contract_info() -> ContractInfoResponse:
    """
    获取当前合约的信息。
    
    Returns:
        包含合约地址、部署者地址等信息的字典
    """
    result = ContractDeploymentService.get_contract_info()
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message"),
        )
    return ContractInfoResponse(**result)


@router.post(
    "/update-address",
    response_model=ContractInfoResponse,
    summary="更新合约地址",
    description="更新已部署合约的地址配置",
)
async def update_contract_address(
    request: UpdateContractAddressRequest,
) -> ContractInfoResponse:
    """
    更新合约地址配置。
    
    Args:
        request: 包含新合约地址的请求体
    
    Returns:
        更新结果
    """
    result = ContractDeploymentService.update_contract_address(
        request.contract_address
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message"),
        )
    return ContractInfoResponse(**result)


@router.get(
    "/status",
    summary="检查部署状态",
    description="检查是否可以进行合约部署或铸造",
)
async def check_deployment_status():
    """
    检查合约部署准备状态。
    
    Returns:
        检查结果，包括是否可部署、是否可铸造等信息
    """
    result = ContractDeploymentService.check_deployment_ready()
    return result
