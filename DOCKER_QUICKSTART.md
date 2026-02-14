# Docker 快速部署指南

## 🚀 快速开始 (3 步完成部署)

### 步骤 1️⃣: 本地测试

```bash
# 使用 docker-compose 快速测试
docker-compose up --build
```

访问: http://localhost

### 步骤 2️⃣: 构建并推送到阿里云

```bash
# 登录阿里云镜像仓库
docker login --username=your_username registry.cn-hangzhou.aliyuncs.com

# 构建并推送 (一键完成)
./docker/build-and-push.sh
```

### 步骤 3️⃣: 部署到 ECS

**方式 A: 使用自动化脚本**

```bash
./docker/deploy-to-ecs.sh <ECS_IP> <ALIYUN_APP_ID> <ALIYUN_APP_KEY>
```

**方式 B: 使用阿里云云效 Flow**

1. 访问 [云效 Flow 控制台](https://flow.console.aliyun.com/)
2. 创建新流水线，导入 `.flow.yml` 或 `flow-pipeline.yml`
3. 配置环境变量
4. 运行流水线

---

## 📋 前置要求

### 本地开发环境
- ✅ Docker Desktop (或 Docker Engine)
- ✅ 有效的阿里云 RTC App ID 和 App Key

### 阿里云资源
- ✅ ECS 实例 (已安装 Docker)
- ✅ 容器镜像服务 (可选，用于存储镜像)
- ✅ 云效 Flow 服务 (可选，用于自动化部署)

---

## 🛠️ 完整部署流程

### 一、准备阶段

#### 1. 配置阿里云容器镜像服务

访问: https://cr.console.aliyun.com/

```bash
# 创建命名空间
命名空间: voice-chat

# 创建镜像仓库
仓库名称: voice-chat-app
仓库类型: 私有

# 获取仓库地址
registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app
```

#### 2. 准备 ECS 实例

```bash
# SSH 登录 ECS
ssh root@your-ecs-ip

# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl start docker
systemctl enable docker

# 验证 Docker
docker --version

# 配置安全组
# 开放端口: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 二、构建镜像

#### 方式 1: 使用脚本 (推荐)

```bash
# 赋予执行权限
chmod +x docker/build-and-push.sh

# 运行构建脚本
./docker/build-and-push.sh

# 自定义配置
export REGISTRY=registry.cn-hangzhou.aliyuncs.com
export NAMESPACE=voice-chat
export IMAGE_NAME=voice-chat-app
export VERSION=v1.0.0
./docker/build-and-push.sh
```

#### 方式 2: 手动构建

```bash
# 设置变量
REGISTRY=registry.cn-hangzhou.aliyuncs.com
NAMESPACE=voice-chat
IMAGE_NAME=voice-chat-app
VERSION=$(date +%Y%m%d-%H%M%S)

# 构建
docker build -t ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION} .
docker tag ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION} \
           ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest

# 登录并推送
docker login ${REGISTRY}
docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}
docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest
```

### 三、部署到 ECS

#### 方式 1: 自动化脚本部署

```bash
chmod +x docker/deploy-to-ecs.sh

./docker/deploy-to-ecs.sh \
  47.96.123.45 \
  your_aliyun_app_id \
  your_aliyun_app_key \
  latest
```

#### 方式 2: 手动部署

在 ECS 上执行:

```bash
# 登录镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com

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
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest

# 查看日志
docker logs -f voice-chat

# 验证
curl http://localhost/health
```

#### 方式 3: 云效 Flow 自动化部署 (推荐生产环境)

1️⃣ **创建流水线**

访问: https://flow.console.aliyun.com/

- 选择"从模板创建" 或 "导入配置文件"
- 上传 `.flow.yml` 或 `flow-pipeline.yml`

2️⃣ **配置环境变量**

在流水线设置中添加:

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ECS_IP` | ECS 公网 IP | `47.96.123.45` |
| `ALIYUN_APP_ID` | 阿里云 RTC App ID | `abc123xyz` |
| `ALIYUN_APP_KEY` | 阿里云 RTC App Key | `your-secret-key` |
| `DOCKER_REGISTRY_USERNAME` | 镜像仓库用户名 | `your_username` |
| `DOCKER_REGISTRY_PASSWORD` | 镜像仓库密码 | `your_password` |

3️⃣ **配置 SSH 密钥**

- 在云效控制台配置 ECS SSH 密钥
- 或使用密码认证

4️⃣ **运行流水线**

- 推送代码到主分支自动触发
- 或手动触发流水线

---

## 📊 验证部署

### 1. 检查容器状态

```bash
# 在 ECS 上
docker ps | grep voice-chat
```

### 2. 查看日志

```bash
# 实时日志
docker logs -f voice-chat

# 最近 100 行
docker logs --tail 100 voice-chat
```

### 3. 健康检查

```bash
# 在 ECS 上
curl http://localhost/health

# 从外部
curl http://your-ecs-ip/health
```

### 4. 访问应用

浏览器打开: `http://your-ecs-ip`

---

## 🔄 更新部署

### 重新构建并部署

```bash
# 1. 构建新镜像
./docker/build-and-push.sh

# 2. 部署到 ECS
./docker/deploy-to-ecs.sh <ECS_IP> <APP_ID> <APP_KEY>
```

### 快速重启

```bash
# 在 ECS 上
docker restart voice-chat
```

### 回滚到之前版本

```bash
# 拉取指定版本
docker pull registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:20230615-143022

# 重新部署
docker stop voice-chat && docker rm voice-chat
docker run -d --name voice-chat ... registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:20230615-143022
```

---

## 🐛 故障排查

### 容器无法启动

```bash
# 查看错误日志
docker logs voice-chat

# 检查环境变量
docker inspect voice-chat | grep -A 20 "Env"

# 进入容器调试
docker exec -it voice-chat sh
```

### 前端无法访问

```bash
# 检查 nginx 日志
docker exec voice-chat cat /var/log/nginx/error.log

# 检查防火墙
firewall-cmd --list-ports
# 或
iptables -L -n | grep 80

# 检查安全组
# 在阿里云控制台确认 80 端口已开放
```

### API 请求失败

```bash
# 测试 API
curl http://localhost:3001/api/token

# 检查后端日志
docker logs voice-chat | grep -i error

# 验证环境变量
docker exec voice-chat env | grep ALIYUN
```

---

## 📈 性能优化

### 1. 使用阿里云 SLB (推荐)

- 配置负载均衡器
- 启用 HTTPS/SSL
- 配置健康检查
- 实现会话保持

### 2. 使用阿里云 CDN

- 加速静态资源
- 降低源站压力
- 提高访问速度

### 3. 容器资源限制

```bash
docker run -d \
  --name voice-chat \
  --memory="1g" \
  --cpus="2.0" \
  ...
```

### 4. 启用日志轮转

```bash
docker run -d \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  ...
```

---

## 🔒 安全建议

- ✅ 使用 HTTPS (配置 SLB 或 Let's Encrypt)
- ✅ 限制容器权限 (非 root 用户)
- ✅ 定期更新镜像
- ✅ 使用 secrets 管理敏感信息
- ✅ 配置防火墙规则
- ✅ 启用访问日志审计
- ✅ 定期备份数据

---

## 📚 相关文档

- [完整部署指南](./DEPLOY_DOCKER.md)
- [阿里云容器镜像服务](https://help.aliyun.com/product/60716.html)
- [阿里云云效 Flow](https://help.aliyun.com/product/153526.html)
- [Docker 官方文档](https://docs.docker.com/)

---

## 💡 提示

**第一次部署?** 推荐使用 `docker-compose` 在本地测试，确认无误后再部署到 ECS。

**生产环境?** 推荐使用云效 Flow 实现 CI/CD 自动化部署。

**需要 HTTPS?** 建议使用阿里云 SLB 配置 SSL 证书，而不是在容器内配置。
