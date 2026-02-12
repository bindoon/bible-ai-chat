# 项目概览

## 项目目的

基于阿里云 RTC 的在线语音聊天 MVP，支持链接分享快速加入通话。

## 目录结构

```
voice-chat-app/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/    # VoiceCall 组件
│   │   ├── hooks/         # useRTC Hook (核心)
│   │   ├── pages/         # Home, Room 页面
│   │   ├── services/      # API 调用
│   │   └── main.jsx       # 入口
│   └── vite.config.js     # Vite 配置 (HTTPS/LAN)
├── server/                 # Node.js 后端
│   └── src/
│       ├── index.js       # Express + Socket.io + Token
│       └── token.js       # 旧实现（已弃用）
├── package.json            # Monorepo 配置
└── start.sh                # 启动脚本
```

## 核心技术方案

### 架构
- **Monorepo**: npm workspaces + concurrently 并行开发
- **前端**: React 18 + Vite + React Router
- **后端**: Express + Socket.io (信令备份)

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

### 关键文件
- [client/src/hooks/useRTC.js](client/src/hooks/useRTC.js) - RTC 核心逻辑
- [server/src/index.js](server/src/index.js) - Token 服务 + 信令
- [client/vite.config.js](client/vite.config.js) - 网络配置

## 快速启动

```bash
npm run dev  # 启动前后端
# 前端: https://localhost:5173
# 后端: http://localhost:3001
```

**配置要求**: `server/.env` 需配置 `ALIYUN_APP_ID` 和 `ALIYUN_APP_KEY`
