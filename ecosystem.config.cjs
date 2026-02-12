// PM2 配置文件 - 生产环境进程管理
module.exports = {
  apps: [
    {
      name: 'voice-chat-api',
      script: './server/src/index.js',
      instances: 2, // 启动 2 个实例（可根据 CPU 核心数调整）
      exec_mode: 'cluster', // 集群模式，提高并发能力
      node_args: '--max-old-space-size=512', // Node.js 内存限制
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
      },
      
      // 日志
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // 自动重启策略
      max_memory_restart: '500M', // 内存超过 500M 自动重启
      min_uptime: '10s', // 最小运行时间
      max_restarts: 10, // 最大重启次数
      autorestart: true, // 自动重启
      watch: false, // 生产环境不建议开启文件监听
      
      // 优雅重启
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    },
  ],
};
