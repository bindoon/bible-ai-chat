# 部署指南

## 快速部署方案

### 方案 A: Vercel (前端) + Railway (后端)

#### 部署后端到 Railway

1. 安装 Railway CLI
```bash
npm i -g @railway/cli
```

2. 登录并初始化
```bash
cd server
railway login
railway init
```

3. 配置环境变量
```bash
railway variables set ALIYUN_APP_ID=your_app_id
railway variables set ALIYUN_APP_KEY=your_app_key
railway variables set PORT=3001
```

4. 部署
```bash
railway up
```

5. 获取后端 URL（如：https://your-app.railway.app）

#### 部署前端到 Vercel

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 更新前端 API 地址

编辑 `client/src/services/api.js`：
```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-backend.railway.app/api'
  : '/api';
```

3. 部署
```bash
cd client
vercel
```

### 方案 B: 阿里云 ECS 一体化部署

1. 购买 ECS 服务器

2. 安装 Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. 克隆代码
```bash
git clone your-repo-url
cd voice-chat-app
npm install
```

4. 配置环境变量
```bash
cd server
cp .env.example .env
nano .env  # 填入配置
```

5. 安装 PM2
```bash
npm i -g pm2
```

6. 启动后端
```bash
cd server
pm2 start src/index.js --name voice-chat-api
```

7. 构建前端
```bash
cd ../client
npm run build
```

8. 安装 Nginx
```bash
sudo apt install nginx
```

9. 配置 Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

10. 配置 HTTPS（必需）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 环境变量清单

### 后端 (server/.env)
```env
ALIYUN_APP_ID=xxx
ALIYUN_APP_KEY=xxx
PORT=3001
NODE_ENV=production
```

### 前端构建
```env
VITE_API_URL=https://your-backend-url.com
```

## 注意事项

1. **HTTPS 必需**：WebRTC 要求 HTTPS 环境（localhost 除外）
2. **CORS 配置**：确保后端允许前端域名跨域请求
3. **防火墙**：开放必要端口（80, 443, 3001）
4. **域名解析**：配置 DNS 记录指向服务器 IP

## 监控和维护

### 查看后端日志
```bash
pm2 logs voice-chat-api
```

### 重启服务
```bash
pm2 restart voice-chat-api
```

### 查看运行状态
```bash
pm2 status
```

## 性能优化

1. 启用 Nginx gzip 压缩
2. 配置 CDN 加速静态资源
3. 使用 Redis 缓存 Token（可选）
4. 监控阿里云 RTC 用量，设置告警

## 成本估算

- **阿里云 RTC**：音频 ¥7/千分钟（有免费额度）
- **Railway**：免费额度 500 小时/月
- **Vercel**：免费计划足够个人使用
- **阿里云 ECS**：约 ¥50-100/月（入门配置）

## 故障排查

### 前端无法连接后端
- 检查 API_BASE_URL 配置
- 检查 CORS 设置
- 查看浏览器 Network 面板

### Token 生成失败
- 验证阿里云密钥是否正确
- 检查服务器环境变量
- 查看服务器日志

### 语音无法连接
- 确认是 HTTPS 环境
- 检查麦克风权限
- 验证阿里云 RTC 服务状态
