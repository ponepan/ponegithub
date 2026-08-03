import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/fc-api': {
        target: 'https://www.cwl.gov.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/fc-api/, ''),
        headers: {
          Referer: 'https://www.cwl.gov.cn/'
        }
      },
      '/tc-api': {
        target: 'https://webapi.sporttery.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tc-api/, ''),
        headers: {
          Referer: 'https://www.lottery.gov.cn/'
        }
      }
    }
  }
})
