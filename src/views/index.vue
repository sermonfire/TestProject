<template>
  <div class="container">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'collapsed': isCollapsed, 'expanding': isExpanding }">
      <div class="logo-area">
        <img src="@/static/logo/favicon.ico" alt="logo" class="logo">
        <span :class="['name', { 'hide': isCollapsed, 'fade-in': isExpanding }]">TravelRec</span>
      </div>

      <!-- 导航菜单 -->
      <div class="nav-items">
        <router-link v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          v-slot="{ isExactActive }">
          <div class="nav-item-content" :class="{ 'active': isExactActive }">
            <div class="nav-item-icon">
              <el-icon :size="28" :color="isExactActive ? '#ffff00' : '#ffffff'">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div :class="['nav-item-text', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
              {{ item.text }}
            </div>
          </div>
        </router-link>
      </div>

      <div class="spacer"></div>

      <!-- 用户信息 -->
      <router-link to="/userInfo" class="nav-item userinfo" v-slot="{ isExactActive }">
        <div class="nav-item-content" :class="{ 'active': isExactActive }">
          <div class="user-info-container">
            <img class="avatar" :src="defaultAvatar" alt="avatar">
            <div :class="['user-name', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
                未登录
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
      <Breadcrumb />
      <div class="page-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Star, Compass, InfoFilled, User, House, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import defaultAvatarImg from '@/static/default_avatar/avatar(unlogin).png'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'

const isCollapsed = ref(false)
const isExpanding = ref(false)
const defaultAvatar = defaultAvatarImg

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

const navItems = [
  {
    path: '/',
    icon: House,
    text: '首页'
  },
  {
    path: '/explore',
    icon: Compass,
    text: '探索'
  },
  {
    path: '/favorites',
    icon: Star,
    text: '偏好设置'
  },
  {
    path: '/about',
    icon: InfoFilled,
    text: '关于'
  }
]
</script>

<style lang="scss" scoped>
@import '@/styles/index.scss';
</style>