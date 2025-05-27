import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ws': {
        target: "http://70.12.107.134:8080/",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/websocket': {
        target: "http://70.12.107.134:8080/",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: "http://70.12.107.134:8080/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
