import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        Components({
            resolvers: [AntDesignVueResolver({
                importStyle: false,
            })],
        }),
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
