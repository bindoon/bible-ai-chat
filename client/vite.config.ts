import { defineConfig } from 'vite'
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
export default defineConfig({
  plugins: [react()],
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
})