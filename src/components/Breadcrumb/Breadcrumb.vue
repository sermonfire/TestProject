<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbItems" 
        :key="index"
        :to="item.path"
      >
        <el-icon v-if="item.icon" class="breadcrumb-icon">
          <component :is="item.icon" />
        </el-icon>
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 面包屑数据
const breadcrumbItems = ref([])

// 路由映射表
const routeMap = {
  home: { title: '首页', icon: House },
  explore: { title: '探索' },
  exploreDetail: { title: '探索详情' },
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
    icon: House
  })
  
  // 添加其他路由层级
  newMatched.forEach((match) => {
    if (match.name && match.name !== 'home') {
      const routeInfo = routeMap[match.name]
      if (routeInfo) {
        items.push({
          title: routeInfo.title,
          path: match.path,
          icon: routeInfo.icon
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
  margin-bottom: 16px;
  
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      display: flex;
      align-items: center;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
}

.breadcrumb-icon {
  margin-right: 4px;
  font-size: 16px;
}
</style> 