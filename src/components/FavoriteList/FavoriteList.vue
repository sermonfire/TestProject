<template>
  <div class="favorite-list">
    <!-- 工具栏优化 -->
    <div class="toolbar">
      <div class="left">
        <el-button-group class="action-group">
          <el-button 
            type="primary" 
            :disabled="!selectedItems.length"
            @click="handleBatchMove"
            class="batch-button"
          >
            <el-icon><FolderAdd /></el-icon>
            移动到 {{ selectedItems.length ? `(${selectedItems.length})` : '' }}
          </el-button>
          <el-button 
            type="danger" 
            :disabled="!selectedItems.length"
            @click="handleBatchDelete"
            class="batch-button"
          >
            <el-icon><Delete /></el-icon>
            取消收藏 {{ selectedItems.length ? `(${selectedItems.length})` : '' }}
          </el-button>
        </el-button-group>
      </div>
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索收藏..."
          clearable
          class="search-input"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 网格视图内容区域 -->
    <div class="list-content" v-loading="loading">
      <div class="grid-view" :class="{ 'is-empty': !processedFavorites.length }">
        <TransitionGroup 
          name="grid-fade" 
          tag="div"
          class="grid-container"
        >
          <div 
            v-for="item in processedFavorites" 
            :key="item.id" 
            class="grid-item"
          >
            <DestinationCard 
              :destination="item.destination"
              @collection-change="handleCollectionChange"
              class="card-wrapper"
            >
              <template #actions>
                <div class="card-actions">
                  <el-button-group>
                    <el-button 
                      type="primary" 
                      @click.stop="handleEdit(item)"
                      class="action-button"
                      title="编辑备注"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button 
                      type="danger" 
                      @click.stop="handleDelete(item)"
                      class="action-button"
                      title="取消收藏"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>
              </template>
            </DestinationCard>
          </div>
        </TransitionGroup>
      </div>

      <!-- 空状态优化 -->
      <div v-if="!loading && !processedFavorites.length" class="empty-state">
        <el-empty 
          :image="emptyImage"
          :image-size="200"
          description="暂无收藏内容"
        >
          <template #description>
            <div class="empty-text">
              <p>还没有收藏任何内容</p>
              <p class="sub-text">去发现更多精彩景点吧</p>
            </div>
          </template>
          <el-button type="primary" @click="goExplore">去探索</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页器优化 -->
    <div class="pagination-wrapper" v-if="processedFavorites.length">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @update:current-page="handlePageChange"
        @update:page-size="handleSizeChange"
        background
      />
    </div>

    <!-- 移动分类对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="移动到分类"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="目标分类">
          <el-select v-model="targetCategory" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="moveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMove" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      :title="dialogTitle"
      width="400px"
    >
      <div class="delete-confirm">
        <el-icon class="warning-icon" :size="48"><Warning /></el-icon>
        <div class="confirm-content">
          <template v-if="batchDeleteItems?.value?.length">
            <h3>确定要取消收藏选中的 {{ batchDeleteItems.value.length }} 个项目吗？</h3>
            <p class="sub-text">此操作不可恢复</p>
          </template>
          <template v-else>
            <h3>确定要取消收藏该项目吗？</h3>
            <p class="sub-text">此操作不可恢复</p>
          </template>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            @click="confirmDelete"
            :loading="loading"
          >
            确定取消
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { 
  Search, Picture, Star, Edit, Delete, Timer, 
  Money, Location, Calendar, Memo, FolderAdd,
  Grid, List, Warning
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import DestinationCard from '@/components/DestinationCard/DestinationCard.vue'
import { getFavoriteListAPI } from '@/api/favoriteApi'
import '@/styles/mixins.scss'

const props = defineProps({
  favorites: {
    type: Array,
    required: true,
    default: () => []
  },
  currentPage: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  viewMode: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:current-page',
  'update:page-size',
  'page-change',
  'size-change',
  'refresh',
  'selection-change',
  'update:viewMode',
  'update:favorites',
  'collection-change'
])

const favoriteStore = useFavoriteStore()
const router = useRouter()

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const selectedItems = ref([])
const moveDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const targetCategory = ref('')
const tableRef = ref(null)
const itemToDelete = ref(null)
const batchDeleteItems = ref([])
const localViewMode = ref(props.viewMode)

// 计算属性
const categories = computed(() => favoriteStore.categories)
const tableData = computed(() => {
  return props.favorites.map(item => ({
    ...item,
    disabled: false // 可以根据需要设置是否禁用选择
  }))
})

const processedFavorites = computed(() => {
  return props.favorites.map(item => {
    const destination = item.destination || {}
    return {
      ...item,
      destination: {
        ...destination,
        tags: destination.tags || [],
        imageUrl: destination.imageUrl || '/path/to/default-image.jpg',
        rating: destination.rating || 0,
        popularity: destination.popularity || 0,
        recommendedDuration: destination.recommendedDuration,
        averageBudget: destination.averageBudget,
        bestSeasons: destination.bestSeasons || [],
        seasonalFeatures: destination.seasonalFeatures || {},
      },
      categoryName: item.categoryName || '默认收藏'
    }
  })
})

// 监听 prop 变化更新本地变量
watch(() => props.viewMode, (newValue) => {
  localViewMode.value = newValue
})

// 方法
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

const handleSearch = async () => {
  emit('refresh')
}

const handleMove = (row) => {
  selectedItems.value = [row]
  moveDialogVisible.value = true
}

const handleBatchMove = () => {
  if (!selectedItems.value.length) {
    ElMessage.warning('请选择要移动的收藏')
    return
  }
  moveDialogVisible.value = true
}

const confirmMove = async () => {
  if (!targetCategory.value) {
    ElMessage.warning('请选择目标分类')
    return
  }

  try {
    loading.value = true
    await favoriteStore.batchUpdateCategory(
      selectedItems.value.map(item => item.id),
      targetCategory.value
    )
    moveDialogVisible.value = false
    targetCategory.value = ''
    selectedItems.value = []
    emit('refresh')
    emit('collection-change')
    ElMessage.success('移动成功')
  } catch (error) {
    console.error('Move failed:', error)
    ElMessage.error('移动失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleDelete = (item) => {
  if (!item || !item.id) {
    ElMessage.warning('无效的收藏项')
    return
  }
  itemToDelete.value = { ...item } // 创建副本
  deleteDialogVisible.value = true
}

const handleBatchDelete = () => {
  if (!selectedItems.value.length) {
    ElMessage.warning('请先选择要取消收藏的项目')
    return
  }
  batchDeleteItems.value = [...selectedItems.value] // 创建副本
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    
    if (batchDeleteItems.value.length) {
      // 批量删除
      const itemIds = batchDeleteItems.value.map(item => item.id);
      await favoriteStore.batchDeleteFavorites(itemIds);
      
      ElMessage({
        message: `已取消收藏 ${batchDeleteItems.value.length} 个项目`,
        type: 'success',
        duration: 2000
      });
      
      // 清空选中项
      selectedItems.value = [];
      batchDeleteItems.value = [];
      
      // 清空表格选择
      if (tableRef.value) {
        tableRef.value.clearSelection();
      }
    } else if (itemToDelete.value && itemToDelete.value.id) {
      // 单个删除
      await favoriteStore.removeFavorite(itemToDelete.value.id);
      
      ElMessage({
        message: '已取消收藏',
        type: 'success',
        duration: 2000
      });
    }
    
    // 刷新列表数据
    await favoriteStore.refreshFavoriteData();
    
    // 关闭对话框
    deleteDialogVisible.value = false;
    itemToDelete.value = null;
    
    // 触发刷新事件
    emit('refresh');
    
  } catch (error) {
    console.error('Delete failed:', error);
    ElMessage.error('取消收藏失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleNotesUpdate = async (row) => {
  try {
    loading.value = true
    await favoriteStore.updateFavorite(row.id, {
      notes: row.notes
    })
    ElMessage.success('更新备注成功')
  } catch (error) {
    console.error('Update notes failed:', error)
    ElMessage.error('更新备注失败，请重试')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  emit('update:current-page', page)
  emit('page-change', page)
}

const handleSizeChange = (size) => {
  emit('update:page-size', size)
  emit('size-change', size)
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const handleRowSelect = (row, selected) => {
  if (selected) {
    selectedItems.value.push(row)
  } else {
    selectedItems.value = selectedItems.value.filter(item => item.id !== row.id)
  }
}

const clearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

// 修改刷新方法
const refreshData = async (silent = false) => {
  try {
    loading.value = true
    await Promise.all([
      loadFavoriteList(),
      favoriteStore.getFavoriteStats()
    ])
  } catch (error) {
    console.error('刷新数据失败:', error)
    if (!silent) {
      ElMessage.error('刷新数据失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 修改 emit 方法
const handleRefresh = (silent = false) => {
  emit('refresh', silent)
}

// 获取当前季节
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const handleCardClick = (destination) => {
  // 处理卡片点击事件
  // 可以跳转到详情页等
}

const favoriteList = ref([])

const loadFavoriteList = async () => {
  try {
    const res = await getFavoriteListAPI()
    if (res.code === 0) {
      favoriteList.value = res.data.list
      // 同步到 processedFavorites
      emit('update:favorites', res.data.list)
    } else {
      ElMessage.error(res.message || '获取收藏列表失败')
    }
  } catch (error) {
    console.error('Failed to load favorite list:', error)
    ElMessage.error('获取收藏列表失败')
  }
}

const handleCollectionChange = () => {
  loadFavoriteList()
}

// 添加空状态图片
const emptyImage = `data:image/svg+xml;base64,${btoa(`
  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 180c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" fill="#f5f7fa"/>
    <path d="M100 140c22.091 0 40-17.909 40-40s-17.909-40-40-40-40 17.909-40 40 17.909 40 40 40z" fill="#e4e7ed"/>
  </svg>
`)}`

// 添加跳转方法
const goExplore = () => {
  router.push({
    name: 'explore'  // 确保路由中定义了这个名称
  })
}

// 修改删除对话框的标题计算属性
const dialogTitle = computed(() => {
  return (batchDeleteItems.value && batchDeleteItems.value.length > 0) 
    ? '批量取消收藏' 
    : '取消收藏'
})

onMounted(() => {
  loadFavoriteList()
})
</script>

<style lang="scss" scoped>
.favorite-list {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;
    
    .left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .action-group {
        .batch-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          
          .el-icon {
            margin-right: 4px;
          }
          
          &:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
        }
      }
    }

    .search-input {
      width: 300px;
    }
  }

  .grid-view {
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      padding: 8px;
    }

    .grid-item {
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-4px);
      }
    }
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;
    
    .empty-text {
      margin-top: 16px;
      
      p {
        margin: 8px 0;
        color: var(--el-text-color-primary);
        
        &.sub-text {
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }
      }
    }
  }

  .pagination-wrapper {
    margin-top: 32px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
  }
}

// 添加网格动画
.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: all 0.3s ease;
}

.grid-fade-enter-from,
.grid-fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

// 响应式布局
@media screen and (max-width: 768px) {
  .favorite-list {
    padding: 16px;
    
    .toolbar {
      flex-direction: column;
      gap: 12px;
      
      .right {
        width: 100%;
        
        .search-input {
          width: 100%;
        }
      }
    }
    
    .grid-view .grid-container {
      grid-template-columns: 1fr;
    }
  }
}

.delete-confirm {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
  
  .warning-icon {
    color: var(--el-color-warning);
  }
  
  .confirm-content {
    flex: 1;
    
    h3 {
      margin: 0 0 8px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
    
    .sub-text {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>