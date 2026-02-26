import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 检查 HTTPS 证书是否存在
const certPath = path.resolve(__dirname, '../.cert/localhost+1.pem')
const keyPath = path.resolve(__dirname, '../.cert/localhost+1-key.pem')
const hasHttpsCert = fs.existsSync(certPath) && fs.existsSync(keyPath)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 .env.web 文件中的环境变量
  const envWebPath = path.resolve(__dirname, '../.env.web')
  const env = fs.existsSync(envWebPath)
    ? loadEnv(mode, path.resolve(__dirname, '..'), '')
    : {}

  // 构建 CDN 完整路径
  const cdnBaseUrl = env.CDN_BASE_URL || process.env.CDN_BASE_URL || 'https://us-withjesus.oss-us-west-1.aliyuncs.com/'
  const ossBasePath = env.OSS_BASE_PATH || process.env.OSS_BASE_PATH || 'daily-rtc-static'

  // 生产环境使用 CDN 路径
  const base = mode === 'production' && cdnBaseUrl
    ? `${cdnBaseUrl.replace(/\/$/, '')}/${ossBasePath}/`
    : '/'

  console.log(`📍 Vite base: ${base}`)

  return {
    plugins: [react()],
    base,
    server: {
      host: true, // 允许局域网访问
      port: 5173,
      ...(hasHttpsCert && {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      }),
      proxy: {
        '/api': {
          target: 'http://localhost:3020',
          changeOrigin: true,
          secure: false,
        },
        '/api/rtc/socket.io': {
          target: 'http://localhost:3020',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})