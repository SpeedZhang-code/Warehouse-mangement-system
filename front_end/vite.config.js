import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // 👈 這裡改為你的後端埠號
        changeOrigin: true,
        // 如果你的後端 API 路徑本身就包含 /api，則不需要 rewrite
        // 如果後端路由是直接寫 router.get('/analyze')，則需要 rewrite
      }
    }
  }
})
