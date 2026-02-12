# 🎉 项目创建完成！

在线语音聊天应用已经成功搭建完成。现在你需要配置阿里云 RTC 并启动应用。

## 📋 下一步操作

### 1. 配置阿里云 RTC（约 10 分钟）

参考详细的 [配置指南](./SETUP.md)，主要步骤：

1. **注册阿里云账号**并完成实名认证
2. **开通音视频通信 RTC 服务**（有免费额度）
3. **创建应用**并获取 **AppID**
4. **获取 AccessKey**（保存好 AccessKey Secret）

### 2. 配置服务器环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑配置文件
code server/.env
```

在 `server/.env` 中填入你的配置：

```env
ALIYUN_APP_ID=your_app_id_here
ALIYUN_APP_KEY=your_access_key_secret_here
PORT=3001
NODE_ENV=development
```

### 3. 启动开发服务器

```bash
# 在项目根目录执行
npm run dev
```

这会同时启动：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3001

### 4. 测试应用

⚠️ **重要：请使用 localhost 访问，不要使用局域网 IP！**

由于浏览器安全限制，使用 `http://192.168.x.x:5173` 会报错：
> TypeError: Cannot read properties of undefined (reading 'getUserMedia')

**正确的测试方式：**

1. 打开浏览器访问 **http://localhost:5173** （不是 192.168.x.x）
2. 点击"开始通话"按钮
3. 允许浏览器访问麦克风权限
4. 复制生成的房间链接
5. **在同一台电脑的另一个标签页/窗口**粘贴链接
6. 开始语音通话！

**如果需要跨设备测试：**
- 查看 [HTTPS_SETUP.md](./HTTPS_SETUP.md) 配置 HTTPS 开发环境
- 或使用 ngrok 等工具提供 HTTPS 隧道

## 🛠️ 其他命令

```bash
# 仅启动前端
npm run client

# 仅启动后端
npm run server

# 构建生产版本
npm run build
```

## 📚 相关文档

- [SETUP.md](./SETUP.md) - 详细的阿里云 RTC 配置指南
- [HTTPS_SETUP.md](./HTTPS_SETUP.md) - HTTPS 开发环境配置（跨设备测试必看）
- [DEPLOY.md](./DEPLOY.md) - 生产环境部署指南
- [README.md](./README.md) - 项目概览和技术栈

## ⚠️ 当前限制

目前代码使用了**临时的 WebRTC 原生实现**进行演示。要使用真正的阿里云 RTC 服务，需要：

1. 安装阿里云 RTC SDK：
```bash
cd client
npm install alivc-rtc  # 注意：需要确认正确的 SDK 包名
```

2. 在 `client/src/hooks/useRTC.js` 中：
   - 替换标记为 `TODO` 的部分
   - 参考 [阿里云 RTC Web SDK 文档](https://help.aliyun.com/document_detail/xxx.html)
   - 集成真实的 SDK API

临时实现可以：
- ✅ 测试 UI 和路由
- ✅ 验证 Token 服务器
- ✅ 获取麦克风权限
- ❌ 无法实现真正的远程音频通话

## 💡 提示

- 首次打开需要允许麦克风权限
- 建议使用耳机避免回音
- WebRTC 需要 HTTPS（localhost 除外）
- 查看控制台日志了解连接状态

## 🐛 遇到问题？

1. 检查 `server/.env` 配置是否正确
2. 确认后端服务器正在运行（http://localhost:3001/health）
3. 查看浏览器控制台错误信息
4. 查看服务器终端日志
5. 参考 [SETUP.md](./SETUP.md) 的"常见问题"章节

---

**祝开发顺利！🚀**
