# Docker 部署完成检查清单

## ✅ 已创建的文件

### Docker 核心文件
- [x] `Dockerfile` - 多阶段构建配置
- [x] `.dockerignore` - 构建优化
- [x] `docker-compose.yml` - 本地测试
- [x] `docker/nginx.conf` - Nginx 配置
- [x] `docker/docker-entrypoint.sh` - 容器启动脚本

### 自动化脚本
- [x] `docker/build-and-push.sh` - 构建并推送镜像到阿里云
- [x] `docker/deploy-to-ecs.sh` - 自动部署到 ECS

### 云效 Flow 配置
- [x] `.flow.yml` - 完整流水线配置
- [x] `flow-pipeline.yml` - 简化流水线配置

### 文档
- [x] `DOCKER_QUICKSTART.md` - 快速开始指南
- [x] `DEPLOY_DOCKER.md` - 完整部署文档
- [x] `README.md` - 已更新包含 Docker 部署

---

## 📋 部署前准备清单

### 阿里云资源
- [ ] 已创建 ECS 实例
- [ ] ECS 已安装 Docker
- [ ] ECS 安全组开放端口: 22, 80, 443
- [ ] (可选) 已创建容器镜像服务仓库
- [ ] (可选) 已开通云效 Flow 服务

### 本地环境
- [ ] 已安装 Docker Desktop
- [ ] 已获取阿里云 RTC App ID 和 App Key
- [ ] 已配置 `server/.env` 文件

### SSH 访问
- [ ] 可以 SSH 登录到 ECS
- [ ] (推荐) 已配置 SSH 密钥认证

---

## 🚀 部署步骤

### 方式 1: 快速部署 (推荐新手)

```bash
# 1. 本地测试
docker-compose up --build
# 访问 http://localhost 确认应用正常

# 2. 停止测试
docker-compose down

# 3. 部署到 ECS
chmod +x docker/deploy-to-ecs.sh
./docker/deploy-to-ecs.sh <ECS_IP> <ALIYUN_APP_ID> <ALIYUN_APP_KEY>

# 4. 访问应用
# http://<ECS_IP>
```

### 方式 2: 使用镜像仓库 (推荐生产)

```bash
# 1. 登录阿里云镜像仓库
docker login --username=<your_username> registry.cn-hangzhou.aliyuncs.com

# 2. 构建并推送
chmod +x docker/build-and-push.sh
./docker/build-and-push.sh

# 3. 在 ECS 上运行
ssh root@<ECS_IP>

# 登录镜像仓库
docker login --username=<your_username> registry.cn-hangzhou.aliyuncs.com

# 拉取并运行
docker pull registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest

docker run -d \
  --name voice-chat \
  --restart unless-stopped \
  -p 80:80 -p 3001:3001 \
  -e ALIYUN_APP_ID=<your_app_id> \
  -e ALIYUN_APP_KEY=<your_app_key> \
  registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest
```

### 方式 3: 云效 Flow 自动化 (推荐团队)

```bash
# 1. 将代码推送到 Git 仓库 (GitHub/GitLab/Gitee/阿里云 Code)
git add .
git commit -m "Add Docker deployment"
git push

# 2. 访问云效 Flow 控制台
# https://flow.console.aliyun.com/

# 3. 创建流水线
# - 导入 .flow.yml 或 flow-pipeline.yml
# - 配置环境变量 (见下方)
# - 配置 SSH 密钥

# 4. 运行流水线
# - 推送到 main 分支自动触发
# - 或手动触发
```

#### 云效 Flow 环境变量配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ECS_IP` | ECS 公网 IP | `47.96.123.45` |
| `ALIYUN_APP_ID` | RTC App ID | `abc123xyz` |
| `ALIYUN_APP_KEY` | RTC App Key | `your-secret-key` |
| `DOCKER_REGISTRY_USERNAME` | 镜像仓库用户名 | `your_username` |
| `DOCKER_REGISTRY_PASSWORD` | 镜像仓库密码 | `your_password` |

---

## 🧪 部署验证

### 1. 检查容器状态

```bash
# 在 ECS 上执行
docker ps | grep voice-chat
```

预期输出:
```
CONTAINER ID   IMAGE                    STATUS         PORTS
abc123def456   voice-chat-app:latest   Up 2 minutes   0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
```

### 2. 查看日志

```bash
docker logs -f voice-chat
```

预期看到:
```
🚀 Starting Voice Chat Application...
✅ Environment variables verified
🌐 Starting Nginx...
⚙️  Starting Node.js server...
Server running on port 3001
```

### 3. 健康检查

```bash
# 在 ECS 上
curl http://localhost/health

# 从外部
curl http://<ECS_IP>/health
```

预期返回: `healthy`

### 4. 访问应用

浏览器打开: `http://<ECS_IP>`

预期看到: 语音聊天应用首页

---

## 🐛 常见问题

### 问题 1: 容器无法启动

**症状:** `docker ps` 没有看到 voice-chat 容器

**解决:**
```bash
# 查看所有容器 (包括已停止的)
docker ps -a

# 查看错误日志
docker logs voice-chat

# 常见原因:
# - 环境变量未设置
# - 端口已被占用
# - 镜像拉取失败
```

### 问题 2: 前端 404 错误

**症状:** 访问 `http://<ECS_IP>` 显示 404

**解决:**
```bash
# 检查 nginx 是否正常
docker exec voice-chat ps aux | grep nginx

# 检查前端文件
docker exec voice-chat ls -la /usr/share/nginx/html

# 查看 nginx 错误日志
docker exec voice-chat cat /var/log/nginx/error.log
```

### 问题 3: API 请求失败

**症状:** 前端可以访问，但无法创建房间

**解决:**
```bash
# 测试 API
curl http://<ECS_IP>:3001/api/token

# 检查后端日志
docker logs voice-chat | grep -i error

# 验证环境变量
docker exec voice-chat env | grep ALIYUN
```

### 问题 4: WebSocket 连接失败

**症状:** Socket.io 无法连接

**解决:**
```bash
# 检查 nginx 配置
docker exec voice-chat cat /etc/nginx/nginx.conf | grep socket.io

# 测试 WebSocket
wscat -c ws://<ECS_IP>/socket.io/

# 检查防火墙
firewall-cmd --list-all
```

### 问题 5: 镜像推送失败

**症状:** `docker push` 权限被拒绝

**解决:**
```bash
# 重新登录
docker logout registry.cn-hangzhou.aliyuncs.com
docker login --username=<your_username> registry.cn-hangzhou.aliyuncs.com

# 检查仓库权限
# 访问 https://cr.console.aliyun.com/ 确认仓库存在且有推送权限
```

---

## 📊 监控和维护

### 查看日志

```bash
# 实时日志
docker logs -f voice-chat

# 最近 100 行
docker logs --tail 100 voice-chat

# 搜索错误
docker logs voice-chat 2>&1 | grep -i error
```

### 容器管理

```bash
# 重启容器
docker restart voice-chat

# 停止容器
docker stop voice-chat

# 删除容器
docker rm -f voice-chat

# 查看资源使用
docker stats voice-chat
```

### 更新应用

```bash
# 方式 1: 使用脚本
./docker/deploy-to-ecs.sh <ECS_IP> <ALIYUN_APP_ID> <ALIYUN_APP_KEY>

# 方式 2: 手动更新
docker pull registry.cn-hangzhou.aliyuncs.com/voice-chat/voice-chat-app:latest
docker stop voice-chat && docker rm voice-chat
docker run -d ... # (使用之前的运行命令)
```

---

## 🔒 安全加固

### 1. 使用 HTTPS

**方式 A: 使用阿里云 SLB (推荐)**
- 在 SLB 配置 SSL 证书
- SLB 监听 443 端口，转发到 ECS 80 端口

**方式 B: 使用 Let's Encrypt**
```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
crontab -e
0 0 1 * * certbot renew --quiet
```

### 2. 限制容器资源

```bash
docker run -d \
  --name voice-chat \
  --memory="1g" \
  --cpus="2.0" \
  --restart unless-stopped \
  ...
```

### 3. 使用 Docker Secrets (生产环境)

```bash
# 创建 secrets
echo "your_app_key" | docker secret create aliyun_app_key -

# 在 docker run 中使用
docker service create \
  --secret aliyun_app_key \
  ...
```

---

## 📚 相关资源

### 文档
- [Docker 快速部署指南](./DOCKER_QUICKSTART.md)
- [Docker 完整部署文档](./DEPLOY_DOCKER.md)
- [传统 ECS 部署](./DEPLOY_ECS.md)
- [项目概览](./AGENTS.md)

### 阿里云服务
- [容器镜像服务控制台](https://cr.console.aliyun.com/)
- [云效 Flow 控制台](https://flow.console.aliyun.com/)
- [ECS 控制台](https://ecs.console.aliyun.com/)
- [RTC 控制台](https://rtc.console.aliyun.com/)

### 外部资源
- [Docker 官方文档](https://docs.docker.com/)
- [阿里云 RTC 文档](https://help.aliyun.com/document_detail/2640100.html)
- [Nginx 文档](https://nginx.org/en/docs/)

---

## 💡 下一步

- [ ] 配置域名和 HTTPS
- [ ] 配置 CDN 加速
- [ ] 设置监控和告警
- [ ] 配置日志收集 (阿里云 SLS)
- [ ] 配置自动备份
- [ ] 性能测试和优化
- [ ] 配置 CI/CD 自动化

---

**祝部署顺利! 🎉**

如有问题，请查看详细文档或提交 Issue。
