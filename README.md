# 在线语音聊天应用

基于阿里云 RTC 的双人语音通话 MVP 应用。

## 技术栈

- **前端**: React + Vite + 阿里云 RTC Web SDK
- **后端**: Node.js + Express (Token 服务)
- **架构**: Monorepo

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置阿里云 RTC

在 `server/.env` 文件中配置：

```env
ALIYUN_APP_ID=your_app_id
ALIYUN_APP_KEY=your_app_key
PORT=3001
```

### 3. 启动开发环境

```bash
npm run dev
```

前端地址：http://localhost:5173  
后端地址：http://localhost:3001

## ⚠️ 重要提示

**通过局域网 IP 访问需要 HTTPS！**

由于浏览器安全限制，使用麦克风等媒体设备时：
- ✅ `http://localhost:5173` - 可以正常使用
- ❌ `http://192.168.x.x:5173` - 会报错（需要 HTTPS）

**测试方案：**
1. **本地测试**（推荐）：在同一台电脑打开多个标签页，使用 `localhost:5173`
2. **跨设备测试**：配置 HTTPS 开发环境，详见 [HTTPS_SETUP.md](./HTTPS_SETUP.md)

## 使用方式

1. 打开应用，点击"开始通话"
2. 复制生成的链接
3. 发送给对方，对方点击链接即可加入通话

## 项目结构

```
├── client/          # React 前端
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── components/  # UI 组件
│   │   ├── hooks/   # 自定义 Hooks
│   │   └── services/    # API 服务
├── server/          # Node.js 后端
│   └── src/
│       ├── index.js     # 服务器入口
│       └── token.js     # Token 生成
└── package.json     # Monorepo 配置
```

## 开发说明

- WebRTC 需要安全上下文（HTTPS 或 localhost）
- 麦克风权限需要用户授权
- 阿里云 RTC 有免费额度（每月 10,000 分钟）
