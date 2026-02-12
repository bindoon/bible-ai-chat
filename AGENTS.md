# 项目概览

## 项目目的

基于阿里云 RTC 的在线语音聊天 MVP，支持链接分享快速加入通话。

## 目录结构

```
voice-chat-app/
├── client/                 # React 前端 (TypeScript)
│   ├── src/
│   │   ├── components/    # VoiceCall 组件
│   │   ├── hooks/         # useRTC Hook (核心)
│   │   ├── pages/         # Home, Room 页面
│   │   ├── services/      # API 调用
│   │   └── main.tsx       # 入口
│   ├── dist/              # 构建产物 (npm run build)
│   └── vite.config.ts     # Vite 配置
├── server/                 # Node.js 后端
│   └── src/
│       └── index.js       # Express + Socket.io + Token
├── scripts/                # 部署脚本
│   ├── nginx.conf         # Nginx 配置
│   └── deploy.sh          # 自动化部署脚本
├── ecosystem.config.cjs    # PM2 配置
├── package.json            # Monorepo 配置
└── DEPLOY_ECS.md          # ECS 部署指南
```

## 核心技术方案

### 架构
- **Monorepo**: npm workspaces + concurrently 并行开发
- **前端**: React 18 + TypeScript + Vite + React Router
- **后端**: Express + Socket.io (信令备份)
- **部署**: Nginx + PM2 集群模式

### RTC 集成
- **SDK**: `dingrtc` (阿里云 RTC Web SDK)
- **Token**: `@dingrtc/token-generator` 官方鉴权
- **音频订阅**: MCU 音频合流 (`client.subscribe('mcu', 'audio')`)
- **事件驱动**: `user-published` 触发远端用户检测

### 核心流程
```
用户进入房间 → 获取 Token → 加入频道 
→ 发布本地音频 → 监听远端用户 → 订阅 MCU 音频
```

### 稳定性保障
- ✅ 官方 SDK + 官方 Token 生成器
- ✅ MCU 服务端合流（无需 P2P 穿透）
- ✅ Socket.io 信令降级备份
- ✅ 完整资源清理（leave/close）
- ✅ HTTPS 安全上下文支持

### 关键文件ts](client/src/hooks/useRTC.ts) - RTC 核心逻辑
- [server/src/index.js](server/src/index.js) - Token 服务 + 信令
- [client/vite.config.ts](client/vite.config.ts) - 网络配置
- [scripts/nginx.conf](scripts/nginx.conf) - Nginx 配置
- [ecosystem.config.cjs](ecosystem.config.cjs) - PM2 配置

## 开发
## 快速启动

```bash
npm run dev  # 启动前后端
# 前端: https://localhost:5173
# 后端: http://localhost:3001
```

## 生产部署

### 前端编译

```bash
npm run build  # 输出到 client/dist/
```

### ECS 部署（Nginx + PM2）

详见 [DEPLOY_ECS.md](DEPLOY_ECS.md)

**快速部署：**
```bash
# 1. 编译前端
npm run build

# 2. 自动部署到服务器
./scripts/deploy.sh user@your-ecs-ip

# 3. 或手动部署
# - 上传 client/dist、server、ecosystem.config.cjs、scripts/nginx.conf
# - 配置 Nginx: sudo ln -sf /path/to/nginx.conf /etc/nginx/sites-enabled/
# - 启动 PM2: pm2 start ecosystem.config.cjs
```

**PM2 管理：**
```bash
npm run pm2:start    # 启动服务
npm run pm2:logs     # 查看日志
npm run pm2:restart  # 重启服务
npm run pm2:stop     # 停止服务
```

## 功能特性

- ✅ 用户昵称设置（首次进入或通过链接加入）
- ✅ 房间链接分享
- ✅ 实时语音通话（阿里云 RTC）
- ✅ 静音/取消静音
- ✅ 参与者列表实时更新
- ✅ 错误提示优化（自动清除临时错误）
- ✅ 响应式 UI 设计

**配置要求**: `server/.env` 需配置 `ALIYUN_APP_ID` 和 `ALIYUN_APP_KEY`
