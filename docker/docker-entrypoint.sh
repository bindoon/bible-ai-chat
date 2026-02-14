#!/bin/sh
set -e

echo "🚀 Starting Voice Chat Application..."

# 创建 nginx 需要的目录
mkdir -p /var/log/nginx
mkdir -p /var/lib/nginx/tmp
mkdir -p /run/nginx

# 检查必需的环境变量
if [ -z "$ALIYUN_APP_ID" ] || [ -z "$ALIYUN_APP_KEY" ]; then
    echo "❌ Error: ALIYUN_APP_ID and ALIYUN_APP_KEY must be set"
    exit 1
fi

echo "✅ Environment variables verified"

# 启动 nginx (后台运行)
echo "🌐 Starting Nginx..."
nginx -g 'daemon off;' &

# 启动 Node.js 后端
echo "⚙️  Starting Node.js server..."
cd /app/server
exec node src/index.js
