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
]


const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
