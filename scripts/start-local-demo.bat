@echo off
chcp 65001 >nul
echo ==========================================
echo   IP-NFT 本地演示环境启动脚本
echo ==========================================
echo.

REM 检查是否已在 contracts 目录
if exist "hardhat.config.ts" (
    set CONTRACTS_DIR=.
) else (
    set CONTRACTS_DIR=contracts
)

cd %CONTRACTS_DIR%

echo [1/4] 检查 Hardhat 节点状态...

REM 使用 PowerShell 检查端口
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8545' -Method POST -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' -ContentType 'application/json' -TimeoutSec 2; exit 0 } catch { exit 1 }"

if %errorlevel% == 0 (
    echo     [OK] Hardhat 节点已在运行
) else (
    echo     [未启动] Hardhat 节点未启动
    echo.
    echo     正在启动 Hardhat 节点...
    start "Hardhat Node" cmd /k "npx hardhat node"
    
    echo     等待节点启动...
    timeout /t 5 /nobreak >nul
)

echo.
echo [2/4] 编译智能合约...
call npx hardhat compile >nul 2>&1
if %errorlevel% neq 0 (
    echo     合约已编译或无需重新编译
) else (
    echo     [OK] 合约编译成功
)

echo.
echo [3/4] 部署合约到本地节点...
call npx hardhat run scripts/deploy.ts --network localhost > deploy-output.txt 2>&1

REM 提取合约地址
set CONTRACT_ADDRESS=
for /f "tokens=*" %%a in ('findstr /C:"IPNFT deployed to:" deploy-output.txt') do (
    for /f "tokens=4" %%b in ("%%a") do (
        set CONTRACT_ADDRESS=%%b
    )
)

if "%CONTRACT_ADDRESS%"=="" (
    echo     [错误] 合约部署失败，请检查节点是否正常运行
    type deploy-output.txt
    pause
    exit /b 1
)

echo     [OK] 合约部署成功
echo     合约地址: %CONTRACT_ADDRESS%

echo.
echo [4/4] 更新前端环境配置...

REM 更新前端 .env.local
cd ..\frontend 2>nul
if exist .env.local (
    echo     备份现有 .env.local 到 .env.local.backup
    copy .env.local .env.local.backup >nul
)

(
echo # =====================================
echo # IP-NFT 前端环境配置
echo # =====================================
echo.
echo # API Configuration
echo VITE_API_BASE_URL=http://localhost:8000
echo.
echo # Blockchain Configuration - Local Hardhat Node
echo VITE_RPC_URL=http://127.0.0.1:8545
echo VITE_CHAIN_ID=31337
echo VITE_NETWORK_NAME=Hardhat Local
echo.
echo # Contract Addresses
echo VITE_IPNFT_CONTRACT_ADDRESS=%CONTRACT_ADDRESS%
echo.
echo # IPFS Configuration
echo VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
) > .env.local

echo     [OK] 前端配置已更新

cd ..\contracts 2>nul

echo.
echo ==========================================
echo   本地演示环境启动完成！
echo ==========================================
echo.
echo [配置信息]
echo 合约地址: %CONTRACT_ADDRESS%
echo RPC 地址: http://127.0.0.1:8545
echo 链 ID: 31337
echo.
echo [测试账户]
echo 管理员:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo 用户A:   0x70997970C51812dc3A010C7d01b50e0d17dc79C8
echo 用户B:   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
echo.
echo [下一步操作]
echo 1. 确保 MetaMask 已配置 Hardhat Local 网络
echo 2. 导入测试账户私钥到 MetaMask
echo 3. 启动前端: cd frontend ^&^& npm run dev
echo 4. 访问 http://localhost:5173 开始演示
echo.
echo [常用命令]
echo - 查看合约信息: npx hardhat console --network localhost
echo - 运行交互脚本: npx hardhat run scripts/interact.ts --network localhost
echo - 查看账户余额: npx hardhat balances --network localhost
echo.
pause

REM 清理临时文件
del deploy-output.txt 2>nul
```
