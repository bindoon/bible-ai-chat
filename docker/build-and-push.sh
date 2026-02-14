#!/bin/bash

# Docker 镜像构建和推送脚本
# 用于将应用打包并推送到阿里云容器镜像服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
REGISTRY="${REGISTRY:-registry.cn-hangzhou.aliyuncs.com}"
NAMESPACE="${NAMESPACE:-voice-chat}"
IMAGE_NAME="${IMAGE_NAME:-voice-chat-app}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"

echo -e "${GREEN}🚀 开始构建 Docker 镜像...${NC}"
echo "镜像地址: ${FULL_IMAGE}:${VERSION}"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 构建镜像
echo -e "${YELLOW}📦 正在构建镜像...${NC}"
docker build -t ${FULL_IMAGE}:${VERSION} .

# 打标签 latest
echo -e "${YELLOW}🏷️  标记为 latest...${NC}"
docker tag ${FULL_IMAGE}:${VERSION} ${FULL_IMAGE}:latest

# 检查是否已登录
echo -e "${YELLOW}🔐 检查镜像仓库登录状态...${NC}"
if ! docker info | grep -q "Username:"; then
    echo -e "${YELLOW}请登录阿里云镜像仓库:${NC}"
    echo "docker login --username=<your_username> ${REGISTRY}"
    echo ""
    read -p "是否现在登录? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login ${REGISTRY}
    else
        echo -e "${RED}❌ 未登录，取消推送${NC}"
        exit 1
    fi
fi

# 推送镜像
echo -e "${YELLOW}⬆️  推送镜像到阿里云...${NC}"
docker push ${FULL_IMAGE}:${VERSION}
docker push ${FULL_IMAGE}:latest

echo ""
echo -e "${GREEN}✅ 镜像构建和推送成功!${NC}"
echo ""
echo "镜像地址:"
echo "  - ${FULL_IMAGE}:${VERSION}"
echo "  - ${FULL_IMAGE}:latest"
echo ""
echo "在 ECS 上拉取镜像:"
echo "  docker pull ${FULL_IMAGE}:latest"
echo ""
echo "启动容器:"
echo "  docker run -d --name voice-chat --restart unless-stopped \\"
echo "    -p 80:80 -p 3001:3001 \\"
echo "    -e ALIYUN_APP_ID=your_app_id \\"
echo "    -e ALIYUN_APP_KEY=your_app_key \\"
echo "    ${FULL_IMAGE}:latest"
echo ""
