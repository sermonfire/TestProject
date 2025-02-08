<template>
  <div class="favorite-list" :class="{ 'is-grid': viewMode === 'grid' }">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left">
        <el-button-group>
          <el-button 
            type="primary" 
            :disabled="!selectedItems.length"
            @click="handleBatchMove"
          >
            移动到
          </el-button>
          <el-button 
            type="warning" 
            :disabled="!selectedItems.length"
            @click="handleBatchDelete"
          >
            取消收藏
          </el-button>
        </el-button-group>
      </div>
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索收藏..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon class="el-input__icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 列表内容 -->
    <div class="list-content" v-loading="loading">
      <template v-if="viewMode === 'grid'">
        <div class="grid-view">
          <div v-for="item in processedFavorites" :key="item.id" class="grid-item">
            <DestinationCard 
              :destination="item.destination"
              @collection-change="handleCollectionChange"
            >
              <template #actions>
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
              </template>
            </DestinationCard>
          </div>
        </div>
      </template>
      
      <template v-else>
        <div class="list-view">
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            @selection-change="handleSelectionChange"
            row-key="id"
            v-bind="$attrs"
          >
            <el-table-column
              type="selection"
              width="55"
              :selectable="(row) => !row.disabled"
            />
            <el-table-column label="景点信息" min-width="300">
              <template #default="{ row }">
                <div class="destination-info">
                  <div class="destination-image">
                    <el-image 
                      :src="row.imageUrl" 
                      fit="cover"
                      :preview-src-list="[row.imageUrl]"
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                  </div>
                  <div class="info">
                    <h3 class="name">{{ row.name }}</h3>
                    <div class="tags">
                      <el-tag 
                        v-for="tag in row.tags" 
                        :key="tag"
                        size="small"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <el-input
                  v-model="row.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="添加备注..."
                  @blur="handleNotesUpdate(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="收藏时间" width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-button 
                    link 
                    type="primary" 
                    @click="handleMove(row)"
                  >
                    移动
                  </el-button>
                  <el-button 
                    link 
                    type="warning" 
                    @click="handleDelete(row)"
                  >
                    取消收藏
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && (!favorites || !favorites.length)"
        description="暂无收藏"
      >
        <template #image>
          <el-icon :size="60"><Star /></el-icon>
        </template>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @update:current-page="handlePageChange"
        @update:page-size="handleSizeChange"
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

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="取消收藏"
      width="30%"
    >
      <p>确定要取消收藏选中的景点吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button 
            type="warning" 
            @click="confirmDelete"
            :loading="loading"
          >
            确定
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
  Money, Location, Calendar, Memo 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFavoriteStore } from '@/stores/favoriteStore'
import dayjs from 'dayjs'
import DestinationCard from '@/components/DestinationCard/DestinationCard.vue'
import { getFavoriteListAPI } from '@/api/favoriteApi'

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
  'selection-change'
])

const favoriteStore = useFavoriteStore()

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const selectedItems = ref([])
const moveDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const targetCategory = ref('')
const tableRef = ref(null)

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

// 方法
const handleSelectionChange = (selection) => {
  favoriteStore.selectedItems = selection
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
    ElMessage.success('移动成功')
  } catch (error) {
    console.error('Move failed:', error)
    ElMessage.error('移动失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消收藏这个景点吗？',
      '取消收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '保留',
        type: 'warning'
      }
    )
    
    loading.value = true
    const success = await favoriteStore.removeFavorite(row.destinationId)
    
    if (success) {
      await emit('refresh')
      ElMessage({
        type: 'success',
        message: '已取消收藏',
        customClass: 'collection-message'
      })
    } else {
      ElMessage({
        type: 'error',
        message: '取消收藏失败，请重试',
        customClass: 'collection-error-message'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      ElMessage({
        type: 'error',
        message: '取消收藏失败，请重试',
        customClass: 'collection-error-message'
      })
    }
  } finally {
    loading.value = false
  }
}

const handleBatchDelete = async () => {
  if (!selectedItems.value.length) {
    ElMessage.warning('请先选择要取消收藏的景点')
    return
  }

  try {
    const count = selectedItems.value.length
    await ElMessageBox.confirm(
      `确定要取消收藏选中的 ${count} 个景点吗？`,
      '批量取消收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '保留',
        type: 'warning'
      }
    )
    
    loading.value = true
    const ids = selectedItems.value.map(item => item.destinationId)
    const success = await favoriteStore.batchDeleteFavorites(ids)
    
    if (success) {
      deleteDialogVisible.value = false
      clearSelection()
      selectedItems.value = []
      emit('refresh')
      ElMessage({
        type: 'success',
        message: `已取消收藏 ${count} 个景点`,
        customClass: 'collection-message'
      })
    } else {
      ElMessage({
        type: 'error',
        message: '批量取消收藏失败，请重试',
        customClass: 'collection-error-message'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量取消收藏失败:', error)
      ElMessage({
        type: 'error',
        message: '批量取消收藏失败，请重试',
        customClass: 'collection-error-message'
      })
    }
  } finally {
    loading.value = false
  }
}

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
    await Promise.all([
      getFavoriteList(currentPage.value, pageSize.value),
      favoriteStore.getFavoriteStats()
    ])
  } catch (error) {
    console.error('刷新数据失败:', error)
    if (!silent) {
      ElMessage.error('刷新数据失败，请重试')
    }
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

onMounted(() => {
  loadFavoriteList()
})
</script>

<style lang="scss" scoped>
.favorite-list {
  padding: 24px 32px;
  
  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    padding: 16px;
  }

  .grid-item {
    position: relative;
  }

  .toolbar {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  
  :deep(.el-pagination) {
    --el-pagination-button-bg-color: #f8fafc;
    
    .el-pagination__sizes {
      margin-right: 16px;
    }
    
    button {
      background: #f8fafc;
      border-radius: 8px;
      
      &:hover {
        background: #f1f5f9;
      }
      
      &.is-active {
        background: #4f46e5;
        color: white;
      }
    }
  }
}

:deep(.el-empty) {
  padding: 40px 0;
  
  .el-empty__image {
    .el-icon {
      color: var(--el-text-color-secondary);
    }
  }
  
  .el-empty__description {
    margin-top: 20px;
    color: var(--el-text-color-secondary);
  }
}

:deep(.collection-message) {
  min-width: 120px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  
  &.el-message--success {
    background-color: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-7);
  }
  
  &.el-message--warning {
    background-color: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning-light-7);
  }
  
  &.el-message--error {
    background-color: var(--el-color-error-light-9);
    border-color: var(--el-color-error-light-7);
  }
}
</style>