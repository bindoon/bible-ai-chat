#!/bin/bash

# ECS 部署脚本
# 用于自动化部署应用到阿里云 ECS

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 参数检查
if [ $# -lt 3 ]; then
    echo -e "${RED}使用方法:${NC}"
    echo "  $0 <ECS_IP> <ALIYUN_APP_ID> <ALIYUN_APP_KEY> [IMAGE_TAG]"
    echo ""
    echo "示例:"
    echo "  $0 47.96.123.45 your_app_id your_app_key latest"
    exit 1
fi

ECS_IP=$1
ALIYUN_APP_ID=$2
ALIYUN_APP_KEY=$3
IMAGE_TAG=${4:-latest}

# 配置
REGISTRY="${REGISTRY:-registry.cn-hangzhou.aliyuncs.com}"
NAMESPACE="${NAMESPACE:-voice-chat}"
IMAGE_NAME="${IMAGE_NAME:-voice-chat-app}"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"

CONTAINER_NAME="voice-chat"
SSH_USER="${SSH_USER:-root}"

echo -e "${GREEN}🚀 开始部署到 ECS...${NC}"
echo "目标服务器: ${ECS_IP}"
echo "镜像: ${FULL_IMAGE}"
echo ""

# 检查 SSH 连接
echo -e "${YELLOW}🔍 检查 SSH 连接...${NC}"
if ! ssh -o ConnectTimeout=5 ${SSH_USER}@${ECS_IP} "echo '连接成功'" > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到 ${ECS_IP}${NC}"
    echo "请确保:"
    echo "  1. ECS 实例正在运行"
    echo "  2. 安全组已开放 22 端口"
    echo "  3. SSH 密钥已配置"
    exit 1
fi

echo -e "${GREEN}✅ SSH 连接成功${NC}"

# 在 ECS 上执行部署
echo -e "${YELLOW}📦 在 ECS 上部署应用...${NC}"

ssh ${SSH_USER}@${ECS_IP} <<EOF
set -e

echo "🔍 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash
    systemctl start docker
    systemctl enable docker
fi

echo "✅ Docker 已就绪"

echo "⬇️  拉取最新镜像..."
docker pull ${FULL_IMAGE}

echo "🛑 停止旧容器..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

echo "🚀 启动新容器..."
docker run -d \\
  --name ${CONTAINER_NAME} \\
  --restart unless-stopped \\
  -p 80:80 \\
  -p 3001:3001 \\
  -e ALIYUN_APP_ID=${ALIYUN_APP_ID} \\
  -e ALIYUN_APP_KEY=${ALIYUN_APP_KEY} \\
  -e NODE_ENV=production \\
  ${FULL_IMAGE}

echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo "✅ 容器运行中"
    docker ps | grep ${CONTAINER_NAME}
    
    # 检查健康状态
    echo ""
    echo "🏥 健康检查:"
    curl -f http://localhost/health || echo "⚠️  健康检查失败"
else
    echo "❌ 容器启动失败"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo ""
echo "🧹 清理旧镜像..."
docker image prune -f

echo ""
echo "✅ 部署完成!"
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 部署成功!${NC}"
    echo ""
    echo "应用地址: http://${ECS_IP}"
    echo ""
    echo "查看日志:"
    echo "  ssh ${SSH_USER}@${ECS_IP} 'docker logs -f ${CONTAINER_NAME}'"
    echo ""
    echo "重启应用:"
    echo "  ssh ${SSH_USER}@${ECS_IP} 'docker restart ${CONTAINER_NAME}'"
    echo ""
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi
