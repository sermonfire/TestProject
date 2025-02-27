import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
    },
    server: {
        port: 9876,
        open: true,
        proxy: {
            '/dev-api': {
                target: 'http://localhost:8081',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/dev-api/, '')
            },
            '/amap-api': {
                target: 'https://restapi.amap.com/v5',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/amap-api/, '')
            }
        }
    }
})
