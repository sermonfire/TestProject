<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbItems" 
        :key="index"
        :to="item.path"
      >
        <el-icon v-if="item.icon" class="breadcrumb-icon">
          <component :is="markRaw(item.icon)" />
        </el-icon>
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { ref, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House } from '@element-plus/icons-vue'

const route = useRoute()

// 面包屑数据
const breadcrumbItems = ref([])

// 路由映射表
const routeMap = {
  home: { title: '首页', icon: markRaw(House) },
  explore: { title: '探索' },
  exploredetail: { title: '探索详情1' },
  exploredetail2: { title: '探索详情2' },
  favorites: { title: '偏好设置' },
  about: { title: '关于' },
  userInfo: { title: '用户信息' }
}

// 监听路由变化更新面包屑
watch(() => route.matched, (newMatched) => {
  const items = []
  
  // 始终添加首页
  items.push({
    title: '首页',
    path: '/',
    icon: markRaw(House)
  })
  
  // 添加其他路由层级
  newMatched.forEach((match) => {
    if (match.name && match.name !== 'home') {
      const routeInfo = routeMap[match.name]
      if (routeInfo) {
        items.push({
          title: routeInfo.title,
          path: match.path,
          icon: routeInfo.icon ? markRaw(routeInfo.icon) : undefined
        })
      }
    }
  })
  
  breadcrumbItems.value = items
}, { immediate: true })
</script>

<style lang="scss" scoped>
.breadcrumb {
  padding: 16px 24px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  user-select: none;
  
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      display: flex;
      align-items: center;
      user-select: none;
      cursor: pointer;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
}

.breadcrumb-icon {
  margin-right: 4px;
  font-size: 16px;
  pointer-events: none;
  user-select: none;
}
</style> 