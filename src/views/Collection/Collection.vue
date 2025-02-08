<template>
  <div class="collection-page" v-loading="loading" element-loading-text="加载中...">
    <Breadcrumb />
    
    <div class="collection-container">
      <!-- 左侧分类栏 -->
      <div class="category-sidebar">
        <FavoriteCategory @select="handleCategorySelect" />
      </div>
      
      <!-- 右侧收藏列表 -->
      <div class="favorite-content">
        <div class="content-header">
          <h2 class="title">
            {{ currentCategory?.name || '全部收藏' }}
            <span class="count" v-if="currentCategory">
              ({{ currentCategoryCount }})
            </span>
          </h2>
          
          <div class="stats" v-if="favoriteStats">
            <el-tooltip content="今日收藏数" placement="top">
              <div class="stat-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ favoriteStats.todayCount || 0 }}</span>
              </div>
            </el-tooltip>
            <el-tooltip content="本月收藏数" placement="top">
              <div class="stat-item">
                <el-icon><DataLine /></el-icon>
                <span>{{ favoriteStats.monthCount || 0 }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
        
        <FavoriteList ref="listRef" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { Calendar, DataLine } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import FavoriteCategory from '@/components/FavoriteCategory/FavoriteCategory.vue'
import FavoriteList from '@/components/FavoriteList/FavoriteList.vue'
import { ElMessage } from 'element-plus'

const favoriteStore = useFavoriteStore()
const listRef = ref(null)

// 计算属性
const currentCategory = computed(() => {
  const categoryId = favoriteStore.selectedCategory
  return favoriteStore.categories.find(c => c.id === categoryId)
})

const favoriteStats = computed(() => favoriteStore.favoriteStats)

// 添加加载状态
const loading = computed(() => favoriteStore.loading)

// 添加计算属性
const currentCategoryCount = computed(() => favoriteStore.currentCategoryCount)

// 方法
const handleCategorySelect = async (category) => {
  // 切换分类时重新加载列表
  await favoriteStore.getFavoriteList(1, favoriteStore.pageSize, category.id)
}

// 添加刷新方法
const refreshData = async () => {
  try {
    await Promise.all([
      favoriteStore.getFavoriteStats(),
      favoriteStore.getFavoriteList(
        favoriteStore.currentPage,
        favoriteStore.pageSize,
        favoriteStore.selectedCategory
      )
    ])
  } catch (error) {
    console.error('Refresh failed:', error)
  }
}

// 定期刷新数据
let refreshTimer = null

// 生命周期钩子
onMounted(async () => {
  try {
    // 先获取分类列表
    await favoriteStore.getCategories()
    
    // 如果没有选中分类，默认选中默认分类
    if (!favoriteStore.selectedCategory && favoriteStore.categories.length) {
      const defaultCategory = favoriteStore.categories.find(c => c.isDefault)
      if (defaultCategory) {
        favoriteStore.selectedCategory = defaultCategory.id
        // 获取默认分类的收藏列表
        await favoriteStore.getFavoriteList(1, favoriteStore.pageSize, defaultCategory.id)
      }
    }
    
    // 获取统计信息
    await favoriteStore.getFavoriteStats()
  } catch (error) {
    ElMessage.error('初始化数据失败，请刷新页面重试')
    console.error('Initialize failed:', error)
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style lang="scss" scoped>
.collection-page {
  height: 100%;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  position: relative;
  
  // 自定义 loading 样式
  :deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.9);
    .el-loading-spinner {
      .el-loading-text {
        color: var(--el-color-primary);
        font-size: 14px;
        margin-top: 8px;
      }
    }
  }
  
  .collection-container {
    margin-top: 20px;
    height: calc(100% - 80px);
    display: flex;
    gap: 20px;
    
    .category-sidebar {
      width: 280px;
      background-color: var(--el-bg-color);
      border-radius: 8px;
      padding: 16px;
      box-shadow: var(--el-box-shadow-light);
    }
    
    .favorite-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background-color: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: var(--el-box-shadow-light);
        
        .title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          
          .count {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin-left: 8px;
          }
        }
        
        .stats {
          display: flex;
          gap: 24px;
          
          .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background-color: var(--el-color-primary-light-9);
            border-radius: 20px;
            
            .el-icon {
              font-size: 18px;
              color: var(--el-color-primary);
            }
            
            span {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-color-primary);
            }
          }
        }
      }
    }
  }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .collection-page {
    padding: 12px;
    
    .collection-container {
      flex-direction: column;
      height: auto;
      
      .category-sidebar {
        width: 100%;
      }
    }
  }
}
</style>