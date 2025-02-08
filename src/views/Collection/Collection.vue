<template>
  <div class="collection-page" v-loading="loading" element-loading-text="加载中...">
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
        
        <FavoriteList
          ref="listRef"
          :favorites="favorites"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
          @refresh="refreshData"
          @selection-change="handleSelectionChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Calendar, DataLine } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import FavoriteCategory from '@/components/FavoriteCategory/FavoriteCategory.vue'
import FavoriteList from '@/components/FavoriteList/FavoriteList.vue'
import { ElMessage } from 'element-plus'
import { getFavoriteListAPI } from '@/api/api'

const favoriteStore = useFavoriteStore()
const listRef = ref(null)
const selectedItems = ref([])

// 添加收藏列表状态
const favorites = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 计算属性
const currentCategory = computed(() => {
  const categoryId = favoriteStore.selectedCategory
  return favoriteStore.categories.find(c => c.id === categoryId)
})

const favoriteStats = computed(() => favoriteStore.favoriteStats)
const currentCategoryCount = computed(() => favoriteStore.currentCategoryCount)

// 添加获取收藏列表方法
const getFavoriteList = async (page = currentPage.value, size = pageSize.value) => {
  try {
    loading.value = true
    // console.log('获取收藏列表:', { page, size, categoryId: favoriteStore.selectedCategory })
    const res = await getFavoriteListAPI(page, size, favoriteStore.selectedCategory)
    if (res.code === 0) {
      // console.log('获取收藏列表成功:', res.data)
      favorites.value = res.data.list
      total.value = res.data.total
      currentPage.value = page
      pageSize.value = size
      
      // 更新store中的计数
      await favoriteStore.getCategories()
    } else {
      console.error('获取收藏列表失败:', res.message)
      ElMessage.error(res.message || '获取收藏列表失败')
    }
  } catch (error) {
    console.error('获取收藏列表异常:', error)
    ElMessage.error('获取收藏列表失败')
  } finally {
    loading.value = false
  }
}

// 修改分类选择处理方法
const handleCategorySelect = async (category) => {
  try {
    // console.log('选择分类:', category)
    favoriteStore.selectedCategory = category.id
    // 切换分类时重置页码并重新加载列表
    currentPage.value = 1
    await getFavoriteList(1, pageSize.value)
  } catch (error) {
    console.error('切换分类失败:', error)
    ElMessage.error('切换分类失败，请重试')
  }
}

// 添加分页处理方法
const handlePageChange = async (page) => {
  await getFavoriteList(page, pageSize.value)
}

const handleSizeChange = async (size) => {
  await getFavoriteList(1, size)
}

// 修改刷新方法
const refreshData = async () => {
  try {
    // console.log('刷新收藏列表数据') // 添加日志
    await Promise.all([
      getFavoriteList(currentPage.value, pageSize.value),
      favoriteStore.getFavoriteStats()
    ])
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败，请重试')
  }
}

// 生命周期钩子
onMounted(async () => {
  try {
    await favoriteStore.getCategories()
    
    if (!favoriteStore.selectedCategory && favoriteStore.categories.length) {
      // console.log('未选中分类，寻找默认分类...')
      const defaultCategory = favoriteStore.categories.find(c => c.isDefault)
      if (defaultCategory) {
        // console.log('找到默认分类:', defaultCategory)
        favoriteStore.selectedCategory = defaultCategory.id
      }
    }

    // 获取收藏列表和统计信息
    await Promise.all([
      getFavoriteList(),
      favoriteStore.getFavoriteStats()
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败，请刷新页面重试')
  }
})

// 提供给子组件的方法
defineExpose({
  refreshData,
  getFavoriteList
})

// 修改批量删除处理
const handleBatchDelete = async () => {
  try {
    const success = await favoriteStore.batchDeleteFavorites(selectedItems.value)
    if (success) {
      // 清空选中项
      selectedItems.value = []
      // 通知列表组件清空选择
      if (listRef.value) {
        listRef.value.clearSelection()
      }
      // 刷新列表数据
      currentPage.value = 1
      await getFavoriteList()
    }
  } catch (error) {
    console.error('Batch delete failed:', error)
  }
}

// 添加选择变化处理方法
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

// 清理函数
const cleanup = () => {
  if (listRef.value) {
    listRef.value.clearSelection()
  }
  selectedItems.value = []
  favorites.value = []
}

// 组件卸载前清理
onBeforeUnmount(() => {
  cleanup()
})

// 修改路由离开守卫
const beforeRouteLeave = (to, from, next) => {
  cleanup()
  next()
}
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