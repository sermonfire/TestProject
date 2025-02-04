import { createRouter, createWebHistory } from 'vue-router'

const routes =  [
  {
    path: '/',
    name: 'home',
    alias: ['/index', '/home'],
    component: () => import('@/views/index.vue'),
    children: [
      
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/login.vue'),
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
