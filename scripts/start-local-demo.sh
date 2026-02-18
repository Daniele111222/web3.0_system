#!/bin/bash

# ==========================================
# IP-NFT 本地演示环境启动脚本 (Linux/Mac)
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 标题
echo "=========================================="
echo "  IP-NFT 本地演示环境启动脚本"
echo "=========================================="
echo ""

# 检查当前目录并切换到 contracts
if [ -f "hardhat.config.ts" ]; then
    CONTRACTS_DIR="."
    print_info "当前已在 contracts 目录"
elif [ -d "contracts" ]; then
    CONTRACTS_DIR="contracts"
    print_info "切换到 contracts 目录"
    cd contracts
else
    print_error "未找到 contracts 目录，请确保在项目根目录运行此脚本"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    print_warning "未找到 node_modules，正在安装依赖..."
    npm install
fi

# 步骤 1: 检查 Hardhat 节点状态
echo ""
print_info "[1/4] 检查 Hardhat 节点状态..."

# 检查节点是否已在运行
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8545 > /dev/null 2>&1; then
    print_success "Hardhat 节点已在运行"
    NODE_STARTED=false
else
    print_warning "Hardhat 节点未启动"
    echo ""
    print_info "正在启动 Hardhat 节点..."
    
    # 在新终端窗口启动节点
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && npx hardhat node"'
    else
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $(pwd) && npx hardhat node; read -p 'Press Enter to close...'"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $(pwd) && npx hardhat node" &
        else
            print_error "无法自动打开终端窗口，请手动运行: npx hardhat node"
            exit 1
        fi
    fi
    
    print_info "等待节点启动..."
    sleep 5
    
    # 验证节点已启动
    for i in {1..10}; do
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            http://127.0.0.1:8545 > /dev/null 2>&1; then
            print_success "Hardhat 节点启动成功"
            NODE_STARTED=true
            break
        fi
        sleep 2
    done
    
    if [ "$NODE_STARTED" != "true" ]; then
        print_error "Hardhat 节点启动失败，请手动检查"
        exit 1
    fi
fi

# 步骤 2: 编译智能合约
echo ""
print_info "[2/4] 编译智能合约..."

if npm run compile > /dev/null 2>&1; then
    print_success "合约编译成功"
else
    print_warning "合约已编译或编译出现问题，继续部署..."
fi

# 步骤 3: 部署合约
echo ""
print_info "[3/4] 部署合约到本地节点..."

DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.ts --network localhost 2>&1)
DEPLOY_RESULT=$?

# 提取合约地址
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE "IPNFT deployed to: 0x[a-fA-F0-9]{40}" | grep -oE "0x[a-fA-F0-9]{40}")

if [ -z "$CONTRACT_ADDRESS" ]; then
    # 检查是否已部署过（从之前的部署提取地址）
    if echo "$DEPLOY_OUTPUT" | grep -q "already deployed\|already exists"; then
        print_warning "合约可能已部署，请检查之前的部署记录"
    fi
    
    print_error "合约部署失败"
    echo ""
    echo "部署输出:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

print_success "合约部署成功"
echo "    合约地址: $CONTRACT_ADDRESS"

# 步骤 4: 更新前端配置
echo ""
print_info "[4/4] 更新前端环境配置..."

# 返回项目根目录
cd ..

if [ -d "frontend" ]; then
    cd frontend
    
    # 备份现有配置
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        print_info "已备份现有配置到 .env.local.backup"
    fi
    
    # 写入新配置
    cat > .env.local << EOF
# =====================================
# IP-NFT 前端环境配置
# =====================================

# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Blockchain Configuration - Local Hardhat Node
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_NETWORK_NAME=Hardhat Local

# Contract Addresses
VITE_IPNFT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS

# IPFS Configuration
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
EOF

    print_success "前端配置已更新"
    cd ..
else
    print_warning "未找到 frontend 目录，跳过前端配置"
fi

# 总结
echo ""
echo "=========================================="
echo "  本地演示环境启动完成！"
echo "=========================================="
echo ""
echo -e "${BLUE}[配置信息]${NC}"
echo "  合约地址: $CONTRACT_ADDRESS"
echo "  RPC 地址: http://127.0.0.1:8545"
echo "  链 ID: 31337"
echo ""
echo -e "${BLUE}[测试账户]${NC}"
echo "  管理员:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  用户A:   0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "  用户B:   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo ""
echo -e "${BLUE}[下一步操作]${NC}"
echo "  1. 确保 MetaMask 已配置 Hardhat Local 网络"
echo "  2. 导入测试账户私钥到 MetaMask"
echo "  3. 启动前端: cd frontend && npm run dev"
echo "  4. 访问 http://localhost:5173 开始演示"
echo ""
echo -e "${YELLOW}[常用命令]${NC}"
echo "  查看合约信息: npx hardhat console --network localhost"
echo "  运行交互脚本: npx hardhat run scripts/interact.ts --network localhost"
echo "  查看账户余额: npx hardhat balances --network localhost"
echo ""

# 询问是否启动前端
read -p "是否立即启动前端？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "frontend" ]; then
        echo "正在启动前端服务..."
        cd frontend
        npm run dev
    else
        echo "未找到 frontend 目录"
    fi
fi
