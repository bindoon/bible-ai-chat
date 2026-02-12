# 阿里云 RTC 配置指南

## 1. 注册阿里云账号

访问 [阿里云官网](https://www.aliyun.com/) 注册账号并完成实名认证。

## 2. 开通音视频通信服务

1. 登录阿里云控制台
2. 搜索"音视频通信 RTC"并进入产品页面
3. 点击"立即开通"
4. 选择合适的计费方式（按量付费或包年包月）
5. 新用户通常有免费试用额度（每月 10,000 分钟）

## 3. 创建应用

1. 进入 [RTC 控制台](https://rtc.console.aliyun.com/)
2. 点击"应用管理" → "创建应用"
3. 填写应用名称（如：voice-chat-app）
4. 记录生成的 **AppID**

## 4. 获取 AccessKey

1. 点击控制台右上角头像 → "AccessKey 管理"
2. 创建新的 AccessKey（如果没有）
3. 记录 **AccessKey ID** 和 **AccessKey Secret**
4. ⚠️ **重要**：AccessKey Secret 只显示一次，请妥善保存

## 5. 配置服务器环境变量

在 `server/` 目录下创建 `.env` 文件：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
ALIYUN_APP_ID=your_app_id_here
ALIYUN_APP_KEY=your_access_key_secret_here
PORT=3001
NODE_ENV=development
```

替换：
- `your_app_id_here` → 你的 RTC AppID
- `your_access_key_secret_here` → 你的 AccessKey Secret

## 6. 安装依赖并启动

在项目根目录执行：

```bash
# 安装所有依赖
npm install

# 启动开发服务器（前端 + 后端）
npm run dev
```

## 7. 验证配置

1. 访问 http://localhost:5173
2. 点击"开始通话"
3. 如果能看到"正在连接..."说明配置正确
4. 查看浏览器控制台，确认没有错误

## 常见问题

### Q: 提示 "Server configuration error"
A: 检查 `server/.env` 文件是否正确配置了 `ALIYUN_APP_ID` 和 `ALIYUN_APP_KEY`

### Q: 浏览器提示麦克风权限
A: 点击"允许"，WebRTC 需要麦克风权限才能工作

### Q: 连接失败
A: 
1. 检查阿里云 RTC 服务是否已开通
2. 检查 AppID 和 AccessKey 是否正确
3. 查看服务器日志：`npm run server`
4. 查看浏览器控制台是否有错误

### Q: Token 生成失败
A: 确保后端服务器正在运行（http://localhost:3001）

## 安全提示

🔐 **不要将 `.env` 文件提交到 Git 仓库！**

`.env` 文件已添加到 `.gitignore`，确保不会被意外提交。

生产环境部署时，在服务器上单独配置环境变量，不要在代码中硬编码密钥。

## 下一步

- 📱 测试双人通话：用两个设备/浏览器打开应用
- 🚀 部署到生产环境：参考 [部署指南](./DEPLOY.md)
- 📊 查看使用统计：进入阿里云 RTC 控制台查看通话时长等数据
