#!/bin/bash

# 自动化部署脚本（在本地执行）
# 用法: ./scripts/deploy.sh user@your-ecs-ip

set -e  # 遇到错误立即退出

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供服务器地址"
    echo "用法: ./scripts/deploy.sh user@your-ecs-ip"
    exit 1
fi

SERVER=$1
REMOTE_PATH="/var/www/voice-chat"

echo "🚀 开始部署到 $SERVER"
echo "================================"

# 1. 编译前端
echo "📦 编译前端..."
npm run build

# 2. 打包文件
echo "📦 打包文件..."
tar -czf deploy.tar.gz \
    client/dist \
    server/src \
    server/package.json \
    ecosystem.config.cjs \
    scripts/nginx.conf \
    --exclude='node_modules' \
    --exclude='.git'

echo "✅ 打包完成: deploy.tar.gz"

# 3. 上传到服务器
echo "📤 上传文件到服务器..."
scp deploy.tar.gz $SERVER:/tmp/

# 4. 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh $SERVER << 'ENDSSH'
    set -e
    
    REMOTE_PATH="/var/www/voice-chat"
    
    echo "📂 创建目录..."
    sudo mkdir -p $REMOTE_PATH
    sudo chown -R $USER:$USER $REMOTE_PATH
    
    echo "📦 解压文件..."
    cd $REMOTE_PATH
    tar -xzf /tmp/deploy.tar.gz
    rm /tmp/deploy.tar.gz
    
    echo "📦 安装后端依赖..."
    cd $REMOTE_PATH/server
    npm install --production
    
    echo "🔄 重启服务..."
    cd $REMOTE_PATH
    
    # 创建日志目录
    mkdir -p logs
    
    # 重启 PM2
    if pm2 describe voice-chat-api > /dev/null 2>&1; then
        echo "🔄 重载 PM2 服务..."
        pm2 reload ecosystem.config.cjs
    else
        echo "🚀 启动 PM2 服务..."
        pm2 start ecosystem.config.cjs
        pm2 save
    fi
    
    echo "✅ 后端部署完成"
    
    echo "🌐 配置 Nginx..."
    if [ ! -f /etc/nginx/sites-enabled/voice-chat.conf ]; then
        sudo ln -sf $REMOTE_PATH/scripts/nginx.conf /etc/nginx/sites-enabled/voice-chat.conf
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx 配置完成"
    else
        echo "ℹ️  Nginx 配置已存在，跳过"
    fi
    
    echo "================================"
    echo "✅ 部署完成！"
    echo ""
    echo "📊 服务状态:"
    pm2 list
    
ENDSSH

# 5. 清理本地文件
echo "🧹 清理本地临时文件..."
rm -f deploy.tar.gz

echo ""
echo "================================"
echo "✅ 部署流程完成！"
echo ""
echo "📝 下一步:"
echo "1. 确保已配置服务器环境变量 (server/.env)"
echo "2. 访问服务器查看运行状态: ssh $SERVER 'pm2 logs'"
echo "3. 在浏览器访问你的应用"
echo ""
