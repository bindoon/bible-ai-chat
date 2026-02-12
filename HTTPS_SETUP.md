# HTTPS 开发环境配置

## 问题说明

由于浏览器安全策略，通过局域网 IP 地址访问（如 `http://192.168.x.x:5173`）时，无法使用麦克风等媒体设备。

WebRTC 的 `getUserMedia` API 仅在以下情况下可用：
- ✅ `localhost` 或 `127.0.0.1`
- ✅ HTTPS 连接
- ❌ HTTP + 局域网 IP（会报错）

## 解决方案

### 方案 A：本地测试（推荐）

在同一台电脑上打开多个浏览器标签页测试：

1. 访问 http://localhost:5173
2. 创建房间，复制链接
3. 在新标签页粘贴链接
4. 测试语音通话

### 方案 B：配置本地 HTTPS

#### 1. 安装 mkcert（一次性设置）

**macOS:**
```bash
brew install mkcert
mkcert -install
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
mkcert -install
```

**Windows:**
```bash
choco install mkcert
mkcert -install
```

#### 2. 生成证书

在项目根目录：

```bash
mkdir -p .cert
cd .cert
mkcert localhost 192.168.31.86 # 替换为你的实际 IP
```

这会生成两个文件：
- `localhost+1.pem`（证书）
- `localhost+1-key.pem`（私钥）

#### 3. 配置 Vite

更新 `client/vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../.cert/localhost+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../.cert/localhost+1.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

#### 4. 重启开发服务器

```bash
npm run dev
```

现在可以通过 HTTPS 访问：
- https://localhost:5173
- https://192.168.31.86:5173

⚠️ **注意**：首次访问可能需要在浏览器中接受证书。

### 方案 C：使用 ngrok（远程测试）

如果需要通过互联网分享测试：

1. 安装 ngrok
```bash
# macOS
brew install ngrok

# 或从官网下载
# https://ngrok.com/download
```

2. 启动应用
```bash
npm run dev
```

3. 在另一个终端启动 ngrok
```bash
ngrok http 5173
```

4. ngrok 会提供一个 HTTPS URL（如 `https://abc123.ngrok.io`）
5. 使用这个 URL 测试

### 方案 D：使用模拟数据（开发阶段）

如果只是测试 UI 和交互流程，可以暂时跳过真实的音频连接：

在 `client/src/hooks/useRTC.js` 中，注释掉 `getUserMedia` 调用：

```javascript
// const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// localStreamRef.current = stream;

// 模拟连接成功
setStatus('connected');
console.log('Using mock connection');
```

## 生产环境部署

生产环境必须使用 HTTPS，推荐：

1. **Vercel/Netlify**：自动提供 HTTPS
2. **阿里云 ECS + Let's Encrypt**：免费 SSL 证书
3. **Cloudflare**：免费 SSL 和 CDN

详见 [DEPLOY.md](./DEPLOY.md)

## 常见问题

### Q: 为什么 localhost 可以但 IP 地址不行？

A: 浏览器将 `localhost` 视为"安全上下文"，但普通 HTTP + IP 地址被视为不安全。

### Q: 可以关闭这个限制吗？

A: Chrome 提供了 `--unsafely-treat-insecure-origin-as-secure` 标志，但不推荐：

```bash
# 不推荐，仅供开发测试
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --unsafely-treat-insecure-origin-as-secure="http://192.168.31.86:5173" \
  --user-data-dir=/tmp/chrome-dev
```

### Q: 手机如何测试？

A: 
1. 使用方案 B（HTTPS + mkcert），手机需要信任根证书
2. 使用方案 C（ngrok），直接访问 HTTPS URL
3. 在电脑上用浏览器的设备模拟器测试

## 推荐工作流程

**开发阶段：**
1. 使用 `localhost:5173` 本地测试
2. 打开多个标签页模拟多人

**跨设备测试：**
1. 配置 mkcert + HTTPS（一次性设置）
2. 或使用 ngrok 快速分享

**生产部署：**
1. 部署到 Vercel/Netlify（自动 HTTPS）
2. 或配置 Let's Encrypt 证书
