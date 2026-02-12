# 阿里云 RTC 集成完成说明

## ✅ 已完成的集成

### 前端 (client/)

**安装的包：**
- `dingrtc` - 阿里云 RTC Web SDK
- `socket.io-client` - 用于实时通信（备用）

**实现的功能：**
1. ✅ 使用 `DingRTC.createClient()` 创建客户端
2. ✅ 使用 `DingRTC.createMicrophoneAudioTrack()` 创建麦克风轨道
3. ✅ 通过 `client.join()` 加入频道
4. ✅ 通过 `client.publish()` 发布本地音频
5. ✅ 监听 `user-published` 事件检测远端用户
6. ✅ 订阅 MCU 音频合流 (`client.subscribe('mcu', 'audio')`)
7. ✅ 实现静音/取消静音功能
8. ✅ 实现离开房间功能

**关键文件：**
- [client/src/hooks/useRTC.js](client/src/hooks/useRTC.js) - RTC Hook，封装所有 SDK 调用
- [client/src/components/VoiceCall.jsx](client/src/components/VoiceCall.jsx) - 语音通话 UI 组件

### 后端 (server/)

**安装的包：**
- `@dingrtc/token-generator` - 阿里云官方 Token 生成器
- `socket.io` - 用于信令服务器（备用）

**实现的功能：**
1. ✅ 使用官方 `produce()` 方法生成 Token
2. ✅ 提供 `/api/token` 接口返回鉴权信息
3. ✅ 添加 Socket.io 信令服务器支持（备用方案）
4. ✅ 支持局域网访问（监听 0.0.0.0）

**关键文件：**
- [server/src/index.js](server/src/index.js) - Express 服务器 + Socket.io 信令
- [server/src/token.js](server/src/token.js) - 旧的 Token 生成逻辑（已不再使用）

## 🚀 使用方法

### 1. 配置阿里云密钥

编辑 `server/. env`：

```env
ALIYUN_APP_ID=your_actual_app_id
ALIYUN_APP_KEY=your_actual_app_key
PORT=3001
NODE_ENV=development
```

**如何获取：**
1. 登录 [阿里云 RTC 控制台](https://rtc.console.aliyun.com/)
2. 进入"应用管理"
3. 创建应用或选择现有应用
4. 获取 **AppID** 和 **AppKey**

### 2. 启动应用

```bash
# 安装依赖（如果还没安装）
npm install

# 启动前端 + 后端
npm run dev
```

### 3. 测试语音通话

**方式 A：同一台电脑**
1. 打开 https://localhost:5173 （需要HTTPS）
2. 点击"开始通话"
3. 复制房间链接
4. 在另一个浏览器标签页打开链接
5. 允许麦克风权限
6. 开始通话！

**方式 B：跨设备测试**（需要配置 HTTPS）
1. 参考 [HTTPS_SETUP.md](HTTPS_SETUP.md) 配置证书
2. 在不同设备上访问 `https://your-ip:5173`

## 📝 重要说明

### 阿里云 RTC 音频订阅机制

根据官方文档，阿里云 RTC 的音频订阅使用 **MCU 音频合流**机制：

```javascript
// ⚠️ 不是订阅单个用户的音频
// client.subscribe(userId, 'audio')  // ❌ 错误

// ✅ 正确：订阅 MCU 音频合流（包含所有远端用户的音频）
client.subscribe('mcu', 'audio')
```

**特点：**
- 只需订阅一次 `'mcu'` 音频
- 自动包含所有远端用户的音频
- 新用户发布音频时自动合入
- 用户离开时自动移除

### 视频订阅（如需添加）

视频需要单独订阅每个用户：

```javascript
client.on('user-published', async (user, mediaType) => {
  if (mediaType === 'video') {
    const track = await client.subscribe(user.userId, 'video');
    track.play(`#video-${user.userId}`);
  }
});
```

### Token 有效期

- Token 默认有效期 **24 小时**
- 超时后需要重新获取
- 生产环境建议实现 Token 刷新机制

## 🐛 常见问题

### Q: 无法听到对方声音

**检查：**
1. 确认已订阅 MCU 音频：`await client.subscribe('mcu', 'audio')`
2. 检查浏览器控制台是否有错误
3. 确认麦克风权限已授权
4. 检查 Token 是否正确生成

### Q: 提示 HTTPS 错误

**原因：** WebRTC 需要安全上下文（HTTPS 或 localhost）

**解决：**
- 本地测试使用 `localhost:5173`
- 跨设备测试配置 HTTPS（见 [HTTPS_SETUP.md](HTTPS_SETUP.md)）

### Q: Token 生成失败

**检查：**
1. `server/.env` 中的 `ALIYUN_APP_ID` 和 `ALIYUN_APP_KEY` 是否正确
2. 后端服务器是否正常运行（http://localhost:3001/health）
3. 查看服务器日志

### Q: 看不到远端用户

**检查：**
1. 查看浏览器控制台，确认 `user-published` 事件是否触发
2. 确认远端用户已成功发布音频
3. 检查网络连接

## 📚 参考文档

- [阿里云 RTC Web SDK 文档](https://help.aliyun.com/document_detail/2640100.html)
- [Token 鉴权说明](https://help.aliyun.com/document_detail/2689025.html)
- [DingRTC API 参考](https://help.aliyun.com/document_detail/2674345.html)
- [GitHub 示例代码](https://github.com/aliyun/AliRTCSample)

## 🎯 下一步优化建议

1. **错误处理增强**
   - 添加 Token 过期自动刷新
   - 网络断线重连机制
   - 更详细的错误提示

2. **功能扩展**
   - 添加视频通话支持
   - 实现屏幕共享
   - 添加聊天消息功能
   - 支持多人通话（超过2人）

3. **UI/UX  优化**
   - 显示网络质量指示器
   - 添加音量指示器
   - 优化移动端体验
   - 添加声音测试功能

4. **性能优化**
   - 实现 Token 缓存
   - 优化音频编码参数
   - 添加弱网优化

5. **生产部署**
   - 配置 CDN 加速
   - 添加监控和日志
   - 实现负载均衡
   - 配置自动扩缩容

##祝你开发顺利！🎉
