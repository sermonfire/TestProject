import { createRouter, createWebHistory } from 'vue-router'

const routes =  [
  {
    path: '/',
    name: 'home',
    alias: ['/index', '/home'],
    component: () => import('@/views/index.vue'),
    children: [
      {
        path: '',
        name: 'content1',
        component: () => import('@/views/layout/content1.vue'),
      },
      {
        path: 'content2',
        name: 'content2',
        component: () => import('@/views/layout/content2.vue'),
      }
    ],
  },
]


const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
