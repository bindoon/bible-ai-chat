# 多阶段构建 Dockerfile
# Stage 1: 构建前端
FROM registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:24-alpine AS frontend-builder

WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm ci

# 复制前端源码
COPY client ./client

# 构建前端
RUN npm run build -w client

# Stage 2: 准备后端依赖
FROM registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:24-alpine AS backend-builder

WORKDIR /app

# 复制 workspace 配置 (server/client 共享根级 package-lock.json)
COPY package*.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# 仅安装 server 生产依赖
RUN npm ci --workspace=server --omit=dev

# Stage 3: 生产镜像
FROM registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:24-alpine

# 设置工作目录
WORKDIR /app

# 安装 nginx 用于服务前端静态文件
RUN apk add --no-cache nginx

# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/client/dist /usr/share/nginx/html

# 从构建阶段复制后端代码和依赖
COPY --from=backend-builder /app/node_modules ./node_modules
COPY server/src ./server/src
COPY server/data ./server/data
COPY server/package.json ./server/

# 复制 nginx 配置
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
# 80: Nginx (前端)
# 3001: Node.js API (后端)
EXPOSE 80 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
ENTRYPOINT ["/docker-entrypoint.sh"]
