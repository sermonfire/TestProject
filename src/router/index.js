import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'index',
    alias: ['/index'],
    component: () => import('@/views/index.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/Home/Home.vue'),
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: () => import('@/views/Favorites/Favorites.vue'),
      },
      {
        path: 'explore',
        name: 'explore',
        component: () => import('@/views/Explore/Explore.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/About/About.vue'),
      },
      {
        path: 'userInfo',
        name: 'userInfo',
        component: () => import('@/views/userInfo/userInfo.vue'),
      },
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
