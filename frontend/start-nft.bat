@echo off
chcp 65001 >nul
echo ==========================================
echo    NFT 多层级路由重构 - 启动脚本
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 node_modules...
if not exist "node_modules\.package-lock.json" (
    echo 正在安装依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
) else (
    echo [✓] 依赖已安装
)

echo.
echo [2/3] 检查 TypeScript 类型...
call npx tsc --noEmit
if errorlevel 1 (
    echo [警告] 发现类型错误，但不影响运行
) else (
    echo [✓] 类型检查通过
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ==========================================
echo  启动成功！请访问:
echo  http://localhost:5173/nft
echo ==========================================
echo.
echo 可用路由:
echo   - /nft/dashboard   数据概览
echo   - /nft/assets      资产管理
echo   - /nft/minting     铸造任务
echo   - /nft/history     铸造历史
echo   - /nft/contracts   合约管理
echo.

call npm run dev

pause
