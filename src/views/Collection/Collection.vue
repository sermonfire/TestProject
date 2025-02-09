<template>
  <div class="collection-page">
    <div class="collection-container">
      <!-- 左侧分类栏 -->
      <div class="category-panel">
        <div class="panel-header">
          <h3 class="title">我的收藏</h3>
          <div class="stats">
            <div class="stat-item">
              <span class="value">{{ favoriteStats?.totalCount || 0 }}</span>
              <span class="label">总收藏</span>
            </div>
            <div class="stat-item">
              <span class="value">{{ favoriteStats?.todayCount || 0 }}</span>
              <span class="label">今日</span>
            </div>
          </div>
        </div>
        <FavoriteCategory @select="handleCategorySelect" />
      </div>

      <!-- 右侧收藏列表 -->
      <div class="content-panel">
        <div class="content-header">
          <div class="header-left">
            <h2>{{ currentCategory?.name || '全部收藏' }}</h2>
            <span class="item-count">{{ total }} 个收藏</span>
          </div>
          <div class="header-right">
            <div class="search-box">
              <el-input
                v-model="searchQuery"
                placeholder="搜索收藏..."
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="view-options">
              <el-radio-group v-model="viewMode" size="large">
                <el-radio-button :value="'grid'">
                  <el-icon><Grid /></el-icon>
                </el-radio-button>
                <el-radio-button :value="'list'">
                  <el-icon><List /></el-icon>
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>
        
        <FavoriteList
          ref="favoriteListRef"
          :favorites="processedFavorites"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :view-mode="viewMode"
          :loading="loading"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
          @refresh="handleRefresh"
          @collection-change="loadFavorites"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Grid, List, Search } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import FavoriteCategory from '@/components/FavoriteCategory/FavoriteCategory.vue'
import FavoriteList from '@/components/FavoriteList/FavoriteList.vue'
import { ElMessage } from 'element-plus'
import { getFavoriteListAPI } from '@/api/api'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'

const favoriteStore = useFavoriteStore()
const favoriteListRef = ref(null)
const selectedItems = ref([])

// 添加收藏列表状态
const favorites = ref([])
const currentPage = ref(1)
const pageSize = ref(9)
const total = ref(0)
const loading = ref(false)

// 添加视图模式状态
const viewMode = ref('grid')

// 计算属性
const currentCategory = computed(() => {
  const categoryId = favoriteStore.selectedCategory
  return favoriteStore.categories.find(c => c.id === categoryId)
})

const favoriteStats = computed(() => favoriteStore.favoriteStats)
const currentCategoryCount = computed(() => favoriteStore.currentCategoryCount)

// 修改加载收藏列表方法
const loadFavorites = async (silent = false) => {
  try {
    loading.value = true
    
    // 验证分页参数
    if (currentPage.value < 1) currentPage.value = 1
    if (pageSize.value !== 9) pageSize.value = 9  // 确保每页显示9条数据
    
    const categoryId = favoriteStore.selectedCategory
    const res = await getFavoriteListAPI(currentPage.value, pageSize.value, categoryId)
    
    if (res.code === 0) {
      favorites.value = res.data.list || []
      total.value = res.data.total || 0
      
      // 如果当前页没有数据且不是第一页，则自动跳转到最后一页
      if (favorites.value.length === 0 && currentPage.value > 1) {
        const lastPage = Math.ceil(total.value / pageSize.value)
        currentPage.value = lastPage
        await loadFavorites()
        return
      }
      
      favoriteStore.favorites = res.data.list
      await favoriteStore.getFavoriteStats()
      await favoriteStore.getCategories()
    } else {
      if (!silent) {
        ElMessage.error(res.message || '加载收藏列表失败')
      }
    }
  } catch (error) {
    console.error('Failed to load favorites:', error)
    if (!silent) {
      ElMessage.error('加载收藏列表失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 修改刷新方法
const handleRefresh = async () => {
  try {
    loading.value = true
    // 重置页码
    currentPage.value = 1
    // 重新加载数据
    await loadFavorites()
  } catch (error) {
    console.error('刷新收藏列表失败:', error)
    ElMessage.error('刷新失败，请重试')
  } finally {
    loading.value = false
  }
}

// 监听收藏状态变化
watch(
  () => favoriteStore.favorites,
  () => {
    loadFavorites(true)
  },
  { deep: true }
)

// 修改分类选择处理方法
const handleCategorySelect = async (category) => {
  try {
    favoriteStore.selectedCategory = category.id
    currentPage.value = 1
    await loadFavorites()
  } catch (error) {
    console.error('切换分类失败:', error)
    ElMessage.error('切换分类失败，请重试')
  }
}

// 修改分页处理方法，添加更多的错误处理
const handlePageChange = async (page) => {
  try {
    currentPage.value = page
    await loadFavorites()
  } catch (error) {
    console.error('切换页码失败:', error)
    ElMessage.error('切换页码失败，请重试')
  }
}

const handleSizeChange = async (size) => {
  try {
    pageSize.value = size
    currentPage.value = 1  // 切换每页数量时重置为第一页
    await loadFavorites()
  } catch (error) {
    console.error('切换每页数量失败:', error)
    ElMessage.error('切换每页数量失败，请重试')
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
      loadFavorites(),
      favoriteStore.getFavoriteStats()
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败，请刷新页面重试')
  }
})

// 提供给子组件的方法
defineExpose({
  loadFavorites
})

// 修改批量删除处理
const handleBatchDelete = async () => {
  try {
    const success = await favoriteStore.batchDeleteFavorites(selectedItems.value)
    if (success) {
      // 清空选中项
      selectedItems.value = []
      // 通知列表组件清空选择
      if (favoriteListRef.value) {
        favoriteListRef.value.clearSelection()
      }
      // 刷新列表数据
      currentPage.value = 1
      await loadFavorites()
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
  // 如果需要清理选中状态，应该通过 ref 调用子组件的方法
  // 或者通过状态管理来处理
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

const searchQuery = ref('')

const handleSearch = () => {
  // Implement search functionality
}

// 添加数据预处理
const processedFavorites = computed(() => {
  return favorites.value.map(item => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    imageUrl: item.imageUrl || '/path/to/default-image.jpg',
    categoryName: item.categoryName || '未分类'
  }))
})
</script>

<style lang="scss" scoped>
.collection-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 32px;
  
  .collection-container {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 32px;
    max-width: 1600px;
    margin: 0 auto;
    
    .category-panel {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      height: fit-content;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      .panel-header {
        padding: 32px;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        position: relative;
        overflow: hidden;
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/path/to/pattern.svg') center/cover;
          opacity: 0.1;
        }
        
        .title {
          margin: 0 0 24px;
          font-size: 28px;
          font-weight: 700;
          color: white;
          position: relative;
        }
        
        .stats {
          display: flex;
          gap: 32px;
          position: relative;
          
          .stat-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            
            .value {
              font-size: 32px;
              font-weight: 700;
              background: linear-gradient(to right, #fff, rgba(255,255,255,0.8));
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            
            .label {
              font-size: 14px;
              font-weight: 500;
              color: rgba(255,255,255,0.9);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }
      }
    }
    
    .content-panel {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      .content-header {
        padding: 24px 32px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
          
          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
          }
          
          .item-count {
            color: #64748b;
            font-size: 14px;
          }
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .search-box {
            width: 240px;
            
            :deep(.el-input) {
              .el-input__wrapper {
                background: #f8fafc;
                border: none;
                box-shadow: none;
                transition: all 0.3s ease;
                
                &:hover, &:focus-within {
                  background: #f1f5f9;
                }
                
                .el-input__inner {
                  color: #1e293b;
                  
                  &::placeholder {
                    color: #94a3b8;
                  }
                }
              }
            }
          }
          
          .view-options {
            :deep(.el-radio-group) {
              background: #f8fafc;
              padding: 4px;
              border-radius: 8px;
              
              .el-radio-button__inner {
                border: none;
                background: transparent;
                padding: 8px 16px;
                border-radius: 6px;
                transition: all 0.3s ease;
                
                &:hover {
                  color: #4f46e5;
                  background: #f1f5f9;
                }
              }
              
              .el-radio-button__original-radio:checked + .el-radio-button__inner {
                background: white;
                color: #4f46e5;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
              }
            }
          }
        }
      }
    }
  }
}

// 响应式布局优化
@media screen and (max-width: 1400px) {
  .collection-container {
    grid-template-columns: 280px 1fr !important;
  }
}

@media screen and (max-width: 1200px) {
  .collection-page {
    padding: 24px;
  }
  
  .collection-container {
    gap: 24px;
  }
}

@media screen and (max-width: 768px) {
  .collection-page {
    padding: 16px;
  }
  
  .collection-container {
    grid-template-columns: 1fr !important;
    gap: 16px;
    
    .category-panel {
      position: sticky;
      top: 16px;
      z-index: 10;
      
      .panel-header {
        padding: 20px;
        
        .title {
          font-size: 20px;
          margin-bottom: 12px;
        }
        
        .stats .stat-item .value {
          font-size: 20px;
        }
      }
    }
  }
}

// 暗色主题优化
:root[data-theme='dark'] {
  .collection-page {
    background-color: #0f172a;
    
    .category-panel,
    .content-panel {
      background-color: #1e293b;
      border: none;
      
      .panel-header {
        background: linear-gradient(135deg, #3730a3, #4f46e5);
      }
      
      .content-header {
        border-color: #334155;
        
        h2 {
          color: #f8fafc;
        }
      }
    }
  }
}

// 动画效果优化
.collection-container {
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 添加过渡效果
.category-panel,
.content-panel {
  will-change: transform;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 添加hover效果
.content-panel {
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
}
</style>