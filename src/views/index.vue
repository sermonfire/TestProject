<template>
    <div class="container">
        <PageTransition ref="pageTransition" />
        <!-- 侧边栏 -->
        <div class="sidebar" :class="{ 'collapsed': isCollapsed, 'expanding': isExpanding }">
            <div class="logo-area">
                <img src="@/assets/logo/favicon.ico" alt="logo" class="logo">
                <span :class="['name', { 'hide': isCollapsed, 'fade-in': isExpanding }]">TravelRec</span>
            </div>

            <!-- 导航菜单 -->
            <div class="nav-items">
                <div v-for="item in navItems" :key="item.path" class="nav-item" @click="item.onClick">
                    <div class="nav-item-content" :class="{ 'active': $route.path === item.path }">
                        <div class="nav-item-icon">
                            <el-icon :size="28" :color="$route.path === item.path ? '#ffff00' : '#ffffff'">
                                <component :is="item.icon" />
                            </el-icon>
                        </div>
                        <div :class="['nav-item-text', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
                            {{ item.text }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="spacer"></div>

            <!-- 用户信息 -->
            <router-link to="/userInfo" class="nav-item userinfo" v-slot="{ isExactActive }">
                <div class="nav-item-content" :class="{ 'active': isExactActive }">
                    <div class="user-info-container">
                        <img class="avatar" :src="userStore.getUserAvatar" :alt="userStore.isLogin ? '用户头像' : '默认头像'">
                        <div :class="['user-name', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
                            {{ userStore.getDisplayPhone }}
                        </div>
                    </div>
                </div>
            </router-link>

            <!-- 折叠按钮 -->
            <div class="sidebar-button" @click="toggleSidebar">
                <el-icon :size="24" color="#ffffff">
                    <ArrowLeft v-if="!isCollapsed" />
                    <ArrowRight v-else />
                </el-icon>
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="main-content" :class="{ 'content-expanded': isCollapsed }">
            <div class="page-wrapper">
                <Breadcrumb />
                <div class="page-content">
                    <router-view></router-view>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
    HomeFilled,
    Compass,
    StarFilled,
    HotWater,
    ArrowLeft,
    ArrowRight,
    Checked
} from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import PageTransition from '@/components/PageTransition.vue'
import { useUserStore } from '@/stores/userstore'

const pageTransition = ref(null)

// 基础状态
const isCollapsed = ref(false)
const isExpanding = ref(false)
const userStore = useUserStore()

// 导航菜单配置
const navItems = [
    {
        path: '/',
        icon: HomeFilled,
        text: '首页',
        onClick: () => handleRouteChange('/')
    },
    {
        path: '/explore',
        icon: Compass,
        text: '探索',
        onClick: () => handleRouteChange('/explore')
    },
    {
        path: '/favorites',
        icon: Checked,
        text: '偏好设置',
        onClick: () => handleRouteChange('/favorites')
    },
    {
        path: '/collection',
        icon: StarFilled,
        text: '我的收藏',
        onClick: () => handleRouteChange('/collection')
    },
    {
        path: '/about',
        icon: HotWater,
        text: '关于',
        onClick: () => handleRouteChange('/about')
    },
    {
        path: '/trip-planner',
        icon: 'Calendar',
        text: '行程规划',
        onClick: () => handleRouteChange('/trip-planner')
    }
]

// 侧边栏折叠控制
const toggleSidebar = () => {
    if (!isCollapsed.value) {
        isCollapsed.value = true
        isExpanding.value = false
    } else {
        isExpanding.value = true
        isCollapsed.value = false
        setTimeout(() => {
            isExpanding.value = false
        }, 300)
    }
}

// 修改路由跳转逻辑
const handleRouteChange = (path) => {
    if (pageTransition.value) {
        pageTransition.value.triggerTransition(path)
    }
}

// 组件加载时更新登录状态
onMounted(() => {
    userStore.setLoginState(!!userStore.token)
})
</script>

<style lang="scss">
@use '@/styles/index.scss';

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}
</style>