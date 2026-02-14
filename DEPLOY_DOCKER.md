# Docker 部署指南

## 目录

1. [本地构建和测试](#本地构建和测试)
2. [阿里云镜像仓库部署](#阿里云镜像仓库部署)
3. [阿里云 Flow 服务部署](#阿里云-flow-服务部署)
4. [ECS 手动部署](#ecs-手动部署)
5. [环境变量配置](#环境变量配置)
6. [故障排查](#故障排查)

---

## 本地构建和测试

### 1. 使用 docker-compose 快速测试

```bash
# 确保 server/.env 文件存在并配置了正确的环境变量
# ALIYUN_APP_ID=your_app_id
# ALIYUN_APP_KEY=your_app_key

# 构建并启动
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问应用: http://localhost

### 2. 直接使用 Docker 命令

```bash
# 构建镜像
docker build -t voice-chat-app:latest .

# 运行容器
docker run -d \
  --name voice-chat \
  -p 80:80 \
  -p 3001:3001 \
  -e ALIYUN_APP_ID=your_app_id \
  -e ALIYUN_APP_KEY=your_app_key \
  voice-chat-app:latest

# 查看日志
docker logs -f voice-chat

# 停止容器
docker stop voice-chat
docker rm voice-chat
```

---

## 阿里云镜像仓库部署

### 1. 创建阿里云容器镜像服务仓库

访问: https://cr.console.aliyun.com/

1. 创建命名空间 (例如: `voice-chat`)
2. 创建镜像仓库 (例如: `voice-chat-app`)
3. 获取仓库地址 (例如: `registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app`)

### 2. 登录阿里云镜像仓库

```bash
# 使用阿里云 RAM 用户的 AccessKey 登录
# 或使用容器镜像服务的临时密码
docker login --username=your_username registry.cn-hangzhou.aliyuncs.com
```

### 3. 构建并推送镜像

```bash
# 设置镜像仓库地址
export REGISTRY=registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app
export VERSION=v1.0.0

# 构建镜像
docker build -t ${REGISTRY}:${VERSION} .
docker tag ${REGISTRY}:${VERSION} ${REGISTRY}:latest

# 推送到阿里云
docker push ${REGISTRY}:${VERSION}
docker push ${REGISTRY}:latest
```

**或使用提供的脚本:**

```bash
# 赋予执行权限
chmod +x docker/build-and-push.sh

# 运行脚本
./docker/build-and-push.sh
```

---

## 阿里云 Flow 服务部署

### 前提条件

1. 已创建 ECS 实例
2. ECS 已安装 Docker (`yum install -y docker` 或 `apt-get install -y docker.io`)
3. 已启动 Docker 服务 (`systemctl start docker && systemctl enable docker`)
4. 已配置 ECS 安全组，开放 80 和 443 端口

### 方式一: 使用阿里云云效 Flow (推荐)

#### 1. 创建云效 Flow 流水线

访问: https://flow.console.aliyun.com/

**创建流水线:**

1. 选择"代码源" → 连接你的 Git 仓库 (GitHub/GitLab/Gitee/阿里云 Code)
2. 配置触发条件 (例如: 推送到 main 分支)

**添加构建任务:**

```yaml
# 构建阶段
- name: 构建 Docker 镜像
  type: docker_build
  config:
    dockerfile: Dockerfile
    image: registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app
    tag: ${PIPELINE_ID}
    push: true
```

**添加部署任务:**

```yaml
# 部署阶段
- name: 部署到 ECS
  type: ssh_deploy
  config:
    host: ${ECS_IP}
    username: root
    auth_type: key  # 或 password
    commands:
      # 拉取最新镜像
      - docker pull registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:${PIPELINE_ID}
      
      # 停止旧容器
      - docker stop voice-chat || true
      - docker rm voice-chat || true
      
      # 启动新容器
      - |
        docker run -d \
          --name voice-chat \
          --restart unless-stopped \
          -p 80:80 \
          -p 3001:3001 \
          -e ALIYUN_APP_ID=${ALIYUN_APP_ID} \
          -e ALIYUN_APP_KEY=${ALIYUN_APP_KEY} \
          -e NODE_ENV=production \
          registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:${PIPELINE_ID}
      
      # 清理旧镜像
      - docker image prune -f
```

#### 2. 配置环境变量

在云效 Flow 流水线设置中添加以下环境变量:

- `ECS_IP`: ECS 公网 IP
- `ALIYUN_APP_ID`: 阿里云 RTC App ID
- `ALIYUN_APP_KEY`: 阿里云 RTC App Key

#### 3. 运行流水线

推送代码到主分支，或手动触发流水线。

### 方式二: 使用 Docker Compose 在 ECS 上部署

在 ECS 上创建 `deploy-compose.yml`:

```yaml
version: '3.8'

services:
  voice-chat:
    image: registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest
    container_name: voice-chat-app
    restart: unless-stopped
    ports:
      - "80:80"
      - "3001:3001"
    environment:
      - ALIYUN_APP_ID=${ALIYUN_APP_ID}
      - ALIYUN_APP_KEY=${ALIYUN_APP_KEY}
      - NODE_ENV=production
```

在 ECS 上运行:

```bash
# 拉取最新镜像并启动
docker-compose -f deploy-compose.yml pull
docker-compose -f deploy-compose.yml up -d

# 查看日志
docker-compose -f deploy-compose.yml logs -f
```

---

## ECS 手动部署

如果不使用云效 Flow，可以使用以下脚本手动部署:

### 1. 在 ECS 上配置环境

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl start docker
systemctl enable docker

# 登录阿里云镜像仓库
docker login --username=your_username registry.cn-hangzhou.aliyuncs.com
```

### 2. 使用部署脚本

在本地运行 (自动化部署到 ECS):

```bash
# 赋予执行权限
chmod +x docker/deploy-to-ecs.sh

# 部署到 ECS
./docker/deploy-to-ecs.sh <ECS_IP> <ALIYUN_APP_ID> <ALIYUN_APP_KEY>
```

或手动在 ECS 上运行:

```bash
# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest

# 停止旧容器
docker stop voice-chat 2>/dev/null || true
docker rm voice-chat 2>/dev/null || true

# 启动新容器
docker run -d \
  --name voice-chat \
  --restart unless-stopped \
  -p 80:80 \
  -p 3001:3001 \
  -e ALIYUN_APP_ID=your_app_id \
  -e ALIYUN_APP_KEY=your_app_key \
  -e NODE_ENV=production \
  registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest

# 验证
docker ps
docker logs -f voice-chat
```

---

## 环境变量配置

### 必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ALIYUN_APP_ID` | 阿里云 RTC 应用 ID | `abc123xyz` |
| `ALIYUN_APP_KEY` | 阿里云 RTC 应用密钥 | `your-secret-key` |

### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端 API 端口 | `3001` |

### 配置方式

**方式 1: 使用 docker run -e**

```bash
docker run -e ALIYUN_APP_ID=xxx -e ALIYUN_APP_KEY=yyy ...
```

**方式 2: 使用环境变量文件**

创建 `.env.production`:

```
ALIYUN_APP_ID=your_app_id
ALIYUN_APP_KEY=your_app_key
NODE_ENV=production
```

```bash
docker run --env-file .env.production ...
```

**方式 3: 使用 Docker Secrets (推荐生产环境)**

```bash
echo "your_app_key" | docker secret create aliyun_app_key -
```

---

## 故障排查

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs voice-chat

# 检查容器状态
docker ps -a

# 进入容器调试
docker exec -it voice-chat sh
```

### 2. 前端无法访问

- 检查 ECS 安全组是否开放 80 端口
- 检查 nginx 日志: `docker exec voice-chat cat /var/log/nginx/error.log`
- 验证前端文件: `docker exec voice-chat ls -la /usr/share/nginx/html`

### 3. API 请求失败

- 检查后端日志: `docker logs voice-chat`
- 验证环境变量: `docker exec voice-chat env | grep ALIYUN`
- 测试 API: `curl http://localhost:3001/api/health`

### 4. WebSocket 连接失败

- 确认 nginx 配置正确代理 `/socket.io/` 路径
- 检查防火墙是否阻止 WebSocket 连接
- 验证 Socket.io 日志

### 5. 构建失败

```bash
# 查看构建日志
docker build --no-cache -t voice-chat-app:latest .

# 检查 .dockerignore 文件
cat .dockerignore

# 验证依赖安装
docker run --rm voice-chat-app:latest node --version
```

---

## 性能优化建议

1. **使用阿里云 SLB (负载均衡器)**
   - 配置 HTTPS/SSL 证书
   - 启用健康检查
   - 配置会话保持 (WebSocket 支持)

2. **使用阿里云 CDN**
   - 加速静态资源 (JS/CSS/图片)
   - 降低源站压力

3. **容器资源限制**
   ```bash
   docker run --memory="512m" --cpus="1.0" ...
   ```

4. **启用日志轮转**
   ```bash
   docker run --log-opt max-size=10m --log-opt max-file=3 ...
   ```

---

## 监控和日志

### 查看实时日志

```bash
# 查看所有日志
docker logs -f voice-chat

# 查看最近 100 行
docker logs --tail 100 voice-chat

# 查看 nginx 访问日志
docker exec voice-chat tail -f /var/log/nginx/access.log
```

### 集成阿里云日志服务 (SLS)

在 docker run 命令中添加:

```bash
--log-driver=sls \
--log-opt sls-project=your-project \
--log-opt sls-region=cn-hangzhou \
--log-opt sls-logstore=voice-chat-logs
```

---

## 安全建议

1. ✅ 使用非 root 用户运行容器
2. ✅ 定期更新基础镜像
3. ✅ 使用 Docker secrets 存储敏感信息
4. ✅ 限制容器资源使用
5. ✅ 配置防火墙规则
6. ✅ 启用 HTTPS (使用 SLB 或 Let's Encrypt)
7. ✅ 定期备份数据和日志

---

## 相关链接

- [阿里云容器镜像服务](https://help.aliyun.com/product/60716.html)
- [阿里云云效 Flow](https://help.aliyun.com/product/153526.html)
- [阿里云 ECS](https://help.aliyun.com/product/25365.html)
- [阿里云 RTC 文档](https://help.aliyun.com/document_detail/2640100.html)
- [Docker 官方文档](https://docs.docker.com/)
