import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import http from 'http';
import { Server } from 'socket.io';
import tokenGenerator from '@dingrtc/token-generator';

const { produce } = tokenGenerator;

// 加载环境变量
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // 监听所有网络接口

// 中间件
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 生成 RTC Token
app.post('/api/token', (req, res) => {
  try {
    const { channelId, userId } = req.body;
    
    // 参数验证
    if (!channelId || !userId) {
      return res.status(400).json({
        error: 'Missing required parameters: channelId and userId'
      });
    }
    
    // 获取配置
    const appId = process.env.ALIYUN_APP_ID;
    const appKey = process.env.ALIYUN_APP_KEY;
    
    if (!appId || !appKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing ALIYUN_APP_ID or ALIYUN_APP_KEY'
      });
    }
    
    // 使用阿里云官方 Token 生成器
    const timestamp = Math.floor(Date.now() / 1000);
    const token = produce(appId, appKey, channelId, userId);
    
    // 返回 Token
    res.json({
      token,
      appId,
      channelId,
      userId,
      timestamp,
      expireTime: timestamp + 24 * 3600
    });
    
    console.log(`Token generated for channel: ${channelId}, user: ${userId}`);
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

// Socket.io 信令服务器（用于 WebRTC 备用方案）
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log(`✅ Token server running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${localIP}:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/token`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io ready for signaling`);
  
  // 检查环境变量
  if (!process.env.ALIYUN_APP_ID || !process.env.ALIYUN_APP_KEY) {
    console.warn('⚠️  Warning: ALIYUN_APP_ID or ALIYUN_APP_KEY not configured');
    console.warn('   Please create a .env file based on .env.example');
  }
});

// 获取本机局域网IP
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
