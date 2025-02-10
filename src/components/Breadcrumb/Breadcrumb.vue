<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path">
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
import { HomeFilled, StarFilled, Search, UserFilled, HotWater, Compass, Checked, Location, Calendar } from '@element-plus/icons-vue'

const route = useRoute()

// 面包屑数据
const breadcrumbItems = ref([])

// 路由映射表
const routeMap = {
  home: { title: '首页', icon: markRaw(HomeFilled) },
  explore: { title: '探索', icon: markRaw(Compass) },
  favorites: { title: '偏好设置', icon: markRaw(Checked) },
  about: { title: '关于', icon: markRaw(HotWater) },
  userInfo: { title: '用户信息', icon: markRaw(UserFilled) },
  searchResults: { title: '搜索结果', icon: markRaw(Search) },
  collection: { title: '我的收藏', icon: markRaw(StarFilled) },
  DestinationDetail: { title: '目的地详情', icon: markRaw(Location) },
  TripPlanner: { title: '行程规划', icon: markRaw(Calendar) }
}

// 监听路由变化更新面包屑
watch(() => route.matched, (newMatched) => {
  const items = []

  // 始终添加首页
  items.push({
    title: '首页',
    path: '/',
    icon: markRaw(HomeFilled)
  })

  // 添加其他路由层级
  newMatched.forEach((match) => {
    if (match.name && match.name !== 'home') {
      const routeInfo = routeMap[match.name]
      if (routeInfo) {
        // 如果是目的地详情页，尝试从路由参数中获取目的地名称
        if (match.name === 'DestinationDetail' && route.params.name) {
          items.push({
            title: route.params.name,
            path: match.path,
            icon: routeInfo.icon
          })
        } else {
          items.push({
            title: routeInfo.title,
            path: match.path,
            icon: routeInfo.icon
          })
        }
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