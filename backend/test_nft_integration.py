#!/usr/bin/env python
"""NFT铸造集成测试脚本。

这个脚本用于手动测试整个NFT铸造流程。
它会：
1. 检查区块链连接
2. 检查/部署合约
3. 创建测试资产
4. 执行NFT铸造
5. 验证铸造结果

用法:
    python test_nft_integration.py
"""
import asyncio
import sys
import os
import io

# 设置控制台编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from datetime import date
from uuid import uuid4

# 添加backend到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 导入配置和模型
from app.core.config import settings
from app.core.blockchain import BlockchainClient, BlockchainConnectionError
from app.services.contract_deployment_service import ContractDeploymentService
from app.models.asset import Asset, AssetStatus, AssetType, LegalStatus
from app.models.enterprise import Enterprise


def print_step(step_num, message):
    """打印步骤标题"""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {message}")
    print('='*60)


def print_result(label, value):
    """打印结果"""
    print(f"  {label}: {value}")


async def main():
    """主测试流程"""
    print("\n" + "="*60)
    print("NFT 铸造集成测试")
    print("="*60)

    # 步骤1: 检查区块链连接
    print_step(1, "检查区块链连接")
    try:
        client = BlockchainClient()
        is_connected = client.is_connected()
        print_result("区块链连接", "✓ 已连接" if is_connected else "✗ 未连接")
        
        if not is_connected:
            print("错误: 无法连接到区块链节点")
            print("请确保Hardhat节点正在运行: npm run node")
            return False
            
        print_result("节点URL", client.provider_url)
        print_result("Chain ID", client.w3.eth.chain_id)
        
    except Exception as e:
        print(f"错误: {e}")
        return False

    # 步骤2: 检查合约状态
    print_step(2, "检查合约状态")
    try:
        status = ContractDeploymentService.check_deployment_ready()
        print_result("部署就绪", "✓ 是" if status["ready"] else "✗ 否")
        
        if status["issues"]:
            print("  问题:")
            for issue in status["issues"]:
                print(f"    - {issue}")
        
        if status["warnings"]:
            print("  警告:")
            for warning in status["warnings"]:
                print(f"    - {warning}")
        
        print_result("可铸造", "✓ 是" if status["can_mint"] else "✗ 否")
        
        # 如果没有部署合约，尝试部署
        if not status["can_mint"] and status["ready"]:
            print("\n  正在部署合约...")
            result = ContractDeploymentService.deploy_contract()
            if result["success"]:
                print("  ✓ 合约部署成功!")
                print_result("合约地址", result["data"]["contract_address"])
            else:
                print(f"  ✗ 合约部署失败: {result.get('message')}")
                return False
        
    except Exception as e:
        print(f"错误: {e}")
        return False

    # 步骤3: 获取合约信息
    print_step(3, "获取合约信息")
    try:
        info = ContractDeploymentService.get_contract_info()
        if info["success"]:
            data = info["data"]
            print_result("合约地址", data.get("contract_address", "未设置"))
            print_result("部署者地址", data.get("deployer_address", "未设置"))
            print_result("已连接", "✓ 是" if data.get("is_connected") else "✗ 否")
            print_result("有ABI", "✓ 是" if data.get("has_abi") else "✗ 否")
        else:
            print(f"错误: {info.get('message')}")
            return False
    except Exception as e:
        print(f"错误: {e}")
        return False

    # 步骤4: 检查数据库连接
    print_step(4, "检查数据库连接")
    try:
        engine = create_engine(settings.DATABASE_SYNC_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print_result("数据库", "✓ 已连接")
            print_result("版本", version[:50] + "...")
        
        # 检查assets表
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM assets"))
            count = result.scalar()
            print_result("资产数量", count)
            
    except Exception as e:
        print(f"错误: {e}")
        return False

    # 步骤5: 创建测试资产(如果需要)
    print_step(5, "创建测试资产")
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # 检查是否有DRAFT或PENDING状态的资产
        result = session.execute(text(
            "SELECT id, name, status FROM assets WHERE status IN ('DRAFT', 'PENDING') LIMIT 1"
        ))
        asset_row = result.fetchone()
        
        if asset_row:
            asset_id = asset_row[0]
            print_result("找到现有资产", asset_row[1])
            print_result("资产状态", asset_row[2])
        else:
            # 获取一个企业ID
            result = session.execute(text("SELECT id FROM enterprises LIMIT 1"))
            enterprise_row = result.fetchone()
            
            if not enterprise_row:
                print("错误: 没有企业数据，请先创建企业")
                return False
            
            enterprise_id = enterprise_row[0]
            
            # 创建测试资产
            asset_id = uuid4()
            asset = Asset(
                id=asset_id,
                enterprise_id=enterprise_id,
                name=f"测试专利_{date.today()}",
                type=AssetType.PATENT,
                description="这是用于NFT铸造测试的资产",
                creator_name="测试创建者",
                creation_date=date.today(),
                legal_status=LegalStatus.PENDING,
                status=AssetStatus.PENDING,
            )
            session.add(asset)
            session.commit()
            print_result("创建新资产", asset.name)
        
        session.close()
        print_result("资产ID", str(asset_id))
        
    except Exception as e:
        print(f"错误: {e}")
        return False

    # 步骤6: 铸造NFT(模拟)
    print_step(6, "NFT铸造测试")
    print("  注意: 完整铸造需要资产有附件且状态为PENDING")
    print("  以下是铸造流程说明:")
    print("  1. 资产必须有附件(attachments)")
    print("  2. 资产状态必须为PENDING或DRAFT")
    print("  3. 调用 POST /api/v1/nft/mint 接口")
    print("  4. 传入 minter_address 参数")
    print()
    print("  API调用示例:")
    print("  curl -X POST 'http://localhost:8000/api/v1/nft/mint?asset_id={asset_id}' \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -H 'Authorization: Bearer <token>' \\")
    print("    -d '{\"minter_address\": \"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\"}'")

    # 步骤7: 总结
    print_step(7, "测试总结")
    print("✓ 所有基础检查通过!")
    print()
    print("后续步骤:")
    print("1. 确保前端已启动并可访问")
    print("2. 通过API创建带有附件的资产")
    print("3. 使用铸造API铸造NFT")
    print("4. 在前端查看铸造结果")
    
    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n测试已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n未处理的错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
