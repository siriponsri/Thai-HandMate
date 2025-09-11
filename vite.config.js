import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // เปิดให้เข้าถึงจาก network อื่น
    port: 5173
  }
})
