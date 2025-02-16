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
  background: rgba(255, 255, 255, 0.95);  // 略微透明的背景
  border-radius: 8px;  // 增加圆角
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);  // 更柔和的阴影
  margin-bottom: 16px;
  backdrop-filter: blur(10px);  // 毛玻璃效果
  border: 1px solid rgba(0, 0, 0, 0.05);  // 细边框
  transition: all 0.3s ease;  // 添加过渡效果

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);  // 悬停时加深阴影
  }

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      display: flex;
      align-items: center;
      user-select: none;
      cursor: pointer;
      font-weight: 500;  // 稍微加粗字体
      color: #606266;  // 默认颜色
      transition: color 0.2s ease;  // 颜色过渡效果

      &:hover {
        color: #409EFF;
        transform: translateY(-1px);  // 悬停时轻微上浮
      }

      &.is-link {
        color: #909399;  // 链接颜色

        &:hover {
          color: #409EFF;
        }
      }
    }

    &:last-child {
      .el-breadcrumb__inner {
        color: #303133;  // 最后一项颜色加深
        font-weight: 600;
      }
    }
  }
}

.breadcrumb-icon {
  margin-right: 6px;  // 增加图标间距
  font-size: 16px;
  pointer-events: none;
  user-select: none;
  color: #909399;  // 图标颜色
  transition: color 0.2s ease;  // 图标颜色过渡效果

  :deep(.el-breadcrumb__item:hover) & {
    color: #409EFF;  // 悬停时图标变色
  }
}
</style>