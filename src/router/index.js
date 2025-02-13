import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userstore'
import { ElMessage } from 'element-plus'

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
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'explore',
        name: 'explore',
        component: () => import('@/views/Explore/Explore.vue'),
        meta: {
          requiresAuth: true,
        }
      },
      {
        path: 'search',
        name: 'searchResults',
        component: () => import('@/views/Search/SearchResults.vue'),
        meta: {
          requiresAuth: true,
        },
        props: (route) => ({
          tags: route.query.tags ? route.query.tags.split(',').filter(Boolean) : []
        })
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
      {
        path: 'collection',
        name: 'collection',
        component: () => import('@/views/Collection/Collection.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'destination/:id',
        name: 'destinationDetail',
        component: () => import('@/views/Destination/DestinationDetail.vue'),
        props: true,
        meta: {
          requiresAuth: true,
        }
      },
      {
        path: 'trip-planner',
        name: 'TripPlanner',
        component: () => import('@/views/TripPlanner/TripPlanner.vue'),
        meta: {
          title: '行程规划',
          requiresAuth: true
        }
      },
      {
        path: 'explore/destination/:id',
        name: 'destinationDetail',
        component: () => import('@/views/Destination/DestinationDetail.vue'),
        props: true,
        meta: {
          requiresAuth: true,
        }
      }
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
})

// 预加载常用路由
const preloadRoutes = ['home', 'explore', 'favorites'];
preloadRoutes.forEach(route => {
  const component = routes.find(r => r.name === route)?.component;
  if (component) {
    component();
  }
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 处理从偏好设置页面到探索页面的跳转
  if (to.name === 'explore' && from.name === 'favorites' && !to.query.refresh) {
    // 只有当没有 refresh 参数时才添加，避免无限重定向
    next({
      name: 'explore',
      query: { refresh: 'true' },
      replace: true // 使用 replace 而不是 push，这样不会在历史记录中创建新条目
    })
    return
  }

  // 原有的登录验证逻辑
  if (to.meta.requiresAuth) {
    if (userStore.isLogin && userStore.token) {
      next()
    } else {
      ElMessage({
        message: '请先登录后再访问此页面，即将前往登录页',
        type: 'warning',
        duration: 2000
      })
      setTimeout(() => {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }, 1000)
    }
  } else {
    next()
  }
})

export default router
