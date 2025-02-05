import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userstore'

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
        children: [
          {
            path: 'exploredetail',
            name: 'exploredetail',
            component: () => import('@/views/Explore/ExploreDetail/ExploreDetail.vue'),
          },
          {
            path: 'exploredetail2',
            name: 'exploredetail2',
            component: () => import('@/views/Explore/ExploreDetail/ExploreDetail2.vue'),
          },
        ],
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
        meta: {
          requiresAuth: true,
        },
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
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 判断该路由是否需要登录权限
  if (to.meta.requiresAuth) {
    if (userStore.isLogin && userStore.token) {
      next()
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    next()
  }
})

export default router
