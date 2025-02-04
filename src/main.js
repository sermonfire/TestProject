import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate';

import App from './App.vue'
import router from './router'

import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
const app = createApp(App)

app.use(createPinia().use(createPersistedState()))
app.use(router)
app.use(TDesign)

app.mount('#app')
