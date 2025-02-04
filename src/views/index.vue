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
              <el-icon :size="24" :color="isExactActive ? '#ffff00' : '#ffffff'">
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
          <div class="nav-item-icon">
            <img class="avatar" :src="defaultAvatar" alt="avatar">
          </div>
          <div :class="['nav-item-text', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
            未登录
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
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Star, Compass, InfoFilled, User, House, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const isCollapsed = ref(false)
const isExpanding = ref(false)
const defaultAvatar = '@/static/default_avatar/avatar(unlogin).png'

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
.container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.sidebar {
  position: fixed;
  height: 100vh;
  width: 240px;
  background: linear-gradient(-45deg, #2ecc71, #27ae60, #3498db, #2980b9);
  background-size: 400% 400%;
  animation: gradientAnimation 10s ease infinite;
  transition: all 0.3s ease;
  z-index: 100;

  &.collapsed {
    width: 80px;
  }

  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 120px;
    padding: 20px;
    margin-bottom: 30px;

    .logo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-bottom: 10px;
    }

    .name {
      color: #ffffff;
      font-size: 18px;
      font-weight: bold;
      transition: opacity 0.3s ease;

      &.hide {
        opacity: 0;
        height: 0;
        overflow: hidden;
      }

      &.fade-in {
        animation: fadeIn 0.3s ease-in;
      }
    }
  }

  .nav-items {
    .nav-item {
      text-decoration: none;
      
      .nav-item-content {
        display: flex;
        align-items: center;
        height: 60px;
        color: #ffffff;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        &.active {
          background-color: rgba(255, 255, 255, 0.3);
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: #ffff00;
          }
        }
      }
    }
  }

  .nav-item-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    min-width: 80px;
  }

  .nav-item-text {
    flex: 1;
    padding-left: 10px;
    white-space: nowrap;
    transition: opacity 0.1s ease;

    &.hide {
      opacity: 0;
    }

    &.fade-in {
      animation: fadeIn 0.3s ease-in;
    }
  }

  .spacer {
    flex-grow: 1;
  }

  .userinfo {
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }

  .sidebar-button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    border-top: 1px solid rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  padding: 24px;
  transition: all 0.3s ease;
}

.content-expanded {
  margin-left: 80px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>