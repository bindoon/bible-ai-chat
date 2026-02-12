# ECS 部署指南

本文档说明如何将语音聊天应用部署到阿里云 ECS 服务器。

## 📋 前置要求

- 阿里云 ECS 服务器（建议 2 核 4G 以上）
- 已安装 Node.js 18+ 和 npm
- 已安装 Nginx
- 已安装 PM2（`npm install -g pm2`）
- 已配置阿里云 RTC AppID 和 AppKey

## 🚀 部署步骤

### 1. 前端编译

在本地或服务器上编译前端代码：

```bash
# 进入项目根目录
cd /path/to/voice-chat-app

# 安装依赖（如果尚未安装）
npm install

# 编译前端
npm run build
```

编译产物位置：`client/dist/`

**编译说明：**
- TypeScript 类型检查 + Vite 构建
- 输出目录：`client/dist/`
- 包含所有静态资源（JS、CSS、HTML、图片等）
- 已优化压缩，适合生产环境

### 2. 上传文件到 ECS

将以下文件/目录上传到服务器（建议路径：`/var/www/voice-chat/`）：

```bash
# 使用 rsync 或 scp 上传
rsync -avz --exclude 'node_modules' \
  ./ user@your-ecs-ip:/var/www/voice-chat/

# 或使用 scp
scp -r client/dist server scripts user@your-ecs-ip:/var/www/voice-chat/
```

上传内容：
- `client/dist/` - 前端构建产物
- `server/` - 后端代码
- `ecosystem.config.cjs` - PM2 配置
- `scripts/nginx.conf` - Nginx 配置

### 3. 服务器环境配置

SSH 登录到 ECS 服务器：

```bash
ssh user@your-ecs-ip
```

#### 3.1 安装后端依赖

```bash
cd /var/www/voice-chat/server
npm install --production
```

#### 3.2 配置环境变量

创建 `.env` 文件：

```bash
cd /var/www/voice-chat/server
cat > .env << EOF
# 阿里云 RTC 配置
ALIYUN_APP_ID=your_app_id
ALIYUN_APP_KEY=your_app_key

# 服务端口
PORT=3001

# 生产环境标识
NODE_ENV=production
EOF
```

**重要：** 替换 `your_app_id` 和 `your_app_key` 为你的真实凭证！

### 4. 配置 Nginx

#### 4.1 编辑 Nginx 配置

```bash
# 修改配置文件中的域名和路径
sudo nano /var/www/voice-chat/scripts/nginx.conf
```

**必须修改的配置项：**
```nginx
server_name your-domain.com;  # 改为你的域名或 ECS 公网 IP
root /var/www/voice-chat/client/dist;  # 确认路径正确
```

#### 4.2 创建软链接

```bash
# 创建软链接到 Nginx 配置目录
sudo ln -sf /var/www/voice-chat/scripts/nginx.conf \
  /etc/nginx/sites-enabled/voice-chat.conf

# 或直接复制
sudo cp /var/www/voice-chat/scripts/nginx.conf \
  /etc/nginx/conf.d/voice-chat.conf
```

#### 4.3 测试并重启 Nginx

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 5. 使用 PM2 启动后端

#### 5.1 创建日志目录

```bash
cd /var/www/voice-chat
mkdir -p logs
```

#### 5.2 启动应用

```bash
# 启动服务
pm2 start ecosystem.config.cjs

# 保存 PM2 进程列表（用于开机自启）
pm2 save

# 设置 PM2 开机自启
pm2 startup
# 执行输出的命令（类似下面的命令）
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

#### 5.3 查看服务状态

```bash
# 查看所有服务
pm2 list

# 查看详细日志
pm2 logs voice-chat-api

# 实时监控
pm2 monit
```

### 6. 配置防火墙

确保开放必要的端口：

```bash
# 阿里云安全组规则
# 在 ECS 控制台添加以下入站规则：
# - 80/TCP (HTTP)
# - 443/TCP (HTTPS，如果使用 SSL)

# 服务器防火墙（如果使用 ufw）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 7. 验证部署

访问你的服务器：
- HTTP: `http://your-ecs-ip` 或 `http://your-domain.com`
- HTTPS: `https://your-domain.com`（如果已配置 SSL）

检查后端 API：
```bash
curl http://localhost:3001/api/health
```

## 📦 常用 PM2 命令

```bash
# 查看服务列表
pm2 list

# 查看日志
pm2 logs voice-chat-api
pm2 logs voice-chat-api --lines 100

# 重启服务
pm2 restart voice-chat-api

# 停止服务
pm2 stop voice-chat-api

# 删除服务
pm2 delete voice-chat-api

# 重载服务（零停机）
pm2 reload voice-chat-api

# 清空日志
pm2 flush

# 更新 PM2
pm2 update
```

## 🔄 更新部署

当代码更新时：

```bash
# 1. 本地重新编译前端
npm run build

# 2. 上传新文件
rsync -avz client/dist/ user@your-ecs-ip:/var/www/voice-chat/client/dist/
rsync -avz server/ user@your-ecs-ip:/var/www/voice-chat/server/

# 3. 在服务器上重启后端
ssh user@your-ecs-ip
cd /var/www/voice-chat
pm2 reload ecosystem.config.cjs
```

## 🔒 HTTPS 配置（推荐）

阿里云 RTC 要求 HTTPS 连接，建议配置 SSL 证书：

### 方案 1：使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 自动配置证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 方案 2：使用阿里云证书

1. 在阿里云控制台申请免费 SSL 证书
2. 下载证书文件（Nginx 格式）
3. 上传到服务器 `/etc/nginx/ssl/`
4. 修改 `nginx.conf` 启用 HTTPS 配置

## 📊 监控和日志

### 查看 Nginx 日志
```bash
tail -f /var/log/nginx/voice-chat-access.log
tail -f /var/log/nginx/voice-chat-error.log
```

### 查看应用日志
```bash
tail -f /var/www/voice-chat/logs/api-out.log
tail -f /var/www/voice-chat/logs/api-error.log
```

### 系统资源监控
```bash
# CPU 和内存使用
htop

# 磁盘使用
df -h

# 网络连接
netstat -tulpn | grep :3001
```

## ⚠️ 常见问题

### 1. 端口 3001 已被占用
```bash
# 查找占用端口的进程
lsof -ti:3001

# 停止进程
kill -9 $(lsof -ti:3001)
```

### 2. Nginx 502 Bad Gateway
- 检查后端服务是否正常运行：`pm2 list`
- 检查 Nginx 配置：`sudo nginx -t`
- 查看 Nginx 错误日志

### 3. 前端 404 错误
- 确认 `nginx.conf` 中的 `root` 路径正确
- 检查 `try_files` 配置
- 确认 `client/dist/index.html` 存在

### 4. API 请求跨域错误
- 确认 Nginx 代理配置正确
- 检查后端 CORS 设置（已在代码中配置）

## 🎯 性能优化建议

1. **启用 Gzip 压缩**（已在 nginx.conf 中配置）
2. **配置静态资源缓存**（已配置）
3. **使用 CDN**（可选，加速静态资源）
4. **PM2 集群模式**（已配置 2 个实例）
5. **定期清理日志**：
   ```bash
   # 添加到 crontab
   0 0 * * * pm2 flush
   ```

## 📞 技术支持

- 阿里云 RTC 文档：https://help.aliyun.com/product/2640100.html
- Nginx 文档：https://nginx.org/en/docs/
- PM2 文档：https://pm2.keymetrics.io/docs/

---

**部署完成后记得测试：**
- ✅ 前端页面访问正常
- ✅ 创建房间功能正常
- ✅ 复制链接分享功能正常
- ✅ 语音通话连接正常
- ✅ 静音/取消静音功能正常
