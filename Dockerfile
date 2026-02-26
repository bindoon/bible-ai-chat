# 多阶段构建 Dockerfile
# 前端资源已通过 `npm run build:web` 在本地构建并上传到 OSS，
# Docker 镜像只需打包 index.html（资源路径已指向 CDN）

# Stage 1: 准备后端依赖
FROM crpi-jla89lkg02vybhoy.cn-hangzhou.personal.cr.aliyuncs.com/frankqian/firstdocker:24-alpine AS backend-builder

WORKDIR /app

# 配置 npm 使用淘宝镜像源（与 package-lock.json 一致）
RUN npm config set registry https://registry.npmmirror.com

# 复制 workspace 配置 (server/client 共享根级 package-lock.json)
COPY package*.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# 安装所有 workspace 依赖，然后清理 client 依赖
# 由于 workspaces 的依赖管理机制，需要先安装全部，再删除不需要的
RUN npm install

# Stage 3: 生产镜像
FROM crpi-jla89lkg02vybhoy.cn-hangzhou.personal.cr.aliyuncs.com/frankqian/firstdocker:24-alpine

# 设置工作目录
WORKDIR /app

# 安装 nginx 用于服务前端静态文件
RUN apk add --no-cache nginx

# 复制前端 index.html（资源已指向 OSS/CDN，无需打包静态资源）
COPY client/dist/index.html /usr/share/nginx/html/

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
# 3020: Node.js API (后端)
EXPOSE 80 3020

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
ENTRYPOINT ["/docker-entrypoint.sh"]
