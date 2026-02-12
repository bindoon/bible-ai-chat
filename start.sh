#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🎙️  在线语音聊天 - 启动检查"
echo "================================"
echo ""

# 检查 Node.js
echo -n "检查 Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗${NC} 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 npm
echo -n "检查 npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗${NC} 未安装"
    exit 1
fi

# 检查依赖
echo -n "检查依赖安装... "
if [ -d "node_modules" ] && [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} 需要安装依赖"
    echo "正在安装依赖..."
    npm install
    cd client && npm install && cd ..
    cd server && npm install && cd ..
fi

# 检查环境变量
echo -n "检查服务器配置... "
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓${NC}"
    
    # 检查配置是否填写
    if grep -q "your_app_id_here" server/.env || grep -q "your_app_key_here" server/.env; then
        echo -e "${YELLOW}⚠️  警告: 环境变量尚未配置${NC}"
        echo ""
        echo "请编辑 server/.env 文件，填入你的阿里云 RTC 配置："
        echo "  ALIYUN_APP_ID=your_app_id"
        echo "  ALIYUN_APP_KEY=your_app_key"
        echo ""
        echo "详细配置步骤请查看: SETUP.md"
        echo ""
        read -p "是否继续启动？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${RED}✗${NC} 未找到"
    echo "正在创建配置文件..."
    cp server/.env.example server/.env
    echo -e "${YELLOW}⚠️  请编辑 server/.env 填入阿里云配置${NC}"
    echo "详细步骤请查看: SETUP.md"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ 检查通过！${NC}"
echo ""
echo "🚀 启动开发服务器..."
echo ""
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3020"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

# 启动服务
npm run dev
