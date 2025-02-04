import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { markRaw } from 'vue'

import App from './App.vue'
import router from './router'

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// TDesign
import { Button as TButton, Input as TInput } from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';

const app = createApp(App)

app.use(createPinia().use(createPersistedState()))
app.use(router)
app.use(ElementPlus)

// 按需注册 TDesign 组件
app.component('t-button', TButton)
app.component('t-input', TInput)

// 注册所有图标，使用 markRaw 包装
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, markRaw(component))
}

app.mount('#app')
