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
            <div class="destination-card">
              <div class="card-image">
                <el-image 
                  :src="item.imageUrl" 
                  fit="cover"
                  loading="lazy"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="image-overlay">
                  <div class="overlay-content">
                    <h3 class="overlay-title">{{ item.name }}</h3>
                    <div class="overlay-info">
                      <span v-if="item.recommendedDuration" class="duration">
                        <el-icon><Timer /></el-icon>
                        建议游玩: {{ item.recommendedDuration }}
                      </span>
                      <span v-if="item.averageBudget" class="budget">
                        <el-icon><Money /></el-icon>
                        人均: ¥{{ item.averageBudget }}
                      </span>
                    </div>
                    <div class="overlay-tags">
                      <el-tag 
                        v-for="tag in (item.tags || []).slice(0, 3)" 
                        :key="tag"
                        size="small"
                        effect="plain"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
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
              </div>
              <div class="card-content">
                <div class="content-header">
                  <span class="category-tag">{{ item.categoryName }}</span>
                  <span class="date">收藏于 {{ formatDate(item.createTime) }}</span>
                </div>
                <div class="destination-info">
                  <div class="rating-popularity">
                    <el-rate 
                      v-model="item.rating" 
                      disabled 
                      show-score
                      text-color="#ff9900"
                      score-template="{value}分"
                    />
                    <span class="popularity">
                      <el-icon><Star /></el-icon>
                      热度: {{ item.popularity || 0 }}
                    </span>
                  </div>
                  <div class="notes" v-if="item.notes">
                    <el-icon><Memo /></el-icon>
                    <span>{{ item.notes }}</span>
                  </div>
                </div>
                <div class="seasonal-info">
                  <div class="best-seasons" v-if="item.bestSeasons?.length">
                    <span class="label">最佳季节:</span>
                    <el-tag 
                      v-for="season in item.bestSeasons" 
                      :key="season"
                      size="small"
                      type="success"
                      effect="light"
                    >
                      {{ season }}
                    </el-tag>
                  </div>
                  <div class="seasonal-features" v-if="item.seasonalFeatures">
                    <span class="label">当季特色:</span>
                    <p>{{ item.seasonalFeatures[getCurrentSeason()] || '暂无特色信息' }}</p>
                  </div>
                </div>
              </div>
            </div>
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
import { batchGetDestinationDetailsAPI } from '@/api/recommendApi'
import dayjs from 'dayjs'

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

// 添加目的地详情缓存
const destinationDetails = ref(new Map())

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
    const destinationDetail = destinationDetails.value.get(item.destinationId) || {}
    return {
      ...item,
      ...destinationDetail,
      tags: destinationDetail.tags || [],
      imageUrl: destinationDetail.imageUrl || '/path/to/default-image.jpg',
      rating: destinationDetail.rating || 0,
      popularity: destinationDetail.popularity || 0,
      recommendedDuration: destinationDetail.recommendedDuration,
      averageBudget: destinationDetail.averageBudget,
      bestSeasons: destinationDetail.bestSeasons || [],
      seasonalFeatures: destinationDetail.seasonalFeatures || {},
      categoryName: item.categoryName || '默认收藏'
    }
  })
})

// 方法
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
  emit('selection-change', selection)
  if (tableRef.value && selection.length === 0) {
    tableRef.value.clearSelection()
  }
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

// 添加获取目的地详情的方法
const fetchDestinationDetails = async (destinationIds) => {
  try {
    const uniqueIds = [...new Set(destinationIds)].filter(id => !destinationDetails.value.has(id))
    if (!uniqueIds.length) return

    const response = await batchGetDestinationDetailsAPI(uniqueIds)
    if (response.code === 0 && response.data) {
      response.data.forEach(detail => {
        destinationDetails.value.set(detail.id, detail)
      })
    }
  } catch (error) {
    console.error('获取目的地详情失败:', error)
  }
}

// 监听收藏列表变化，获取目的地详情
watch(() => props.favorites, async (newFavorites) => {
  if (newFavorites?.length) {
    const destinationIds = newFavorites.map(item => item.destinationId)
    await fetchDestinationDetails(destinationIds)
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  refreshData,
  clearSelection
})

// 在组件卸载前清理表格实例
onBeforeUnmount(() => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
    tableRef.value = null
  }
})

// 获取当前季节
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}
</script>

<style lang="scss" scoped>
.favorite-list {
  padding: 24px 32px;
  
  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    padding: 16px;
    
    .destination-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 100%;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        
        .card-image {
          .image-overlay {
            opacity: 1;
          }
          
          .card-actions {
            opacity: 1;
            transform: translateY(0);
          }
          
          .el-image {
            transform: scale(1.05);
          }
        }
      }
      
      .card-image {
        position: relative;
        padding-top: 66.67%;
        overflow: hidden;
        
        .el-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to top, 
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.4) 50%,
            rgba(0, 0, 0, 0) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          padding: 24px;
          
          .overlay-content {
            color: white;
            width: 100%;
            
            .overlay-title {
              font-size: 20px;
              font-weight: 600;
              margin: 0 0 12px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .overlay-info {
              display: flex;
              gap: 16px;
              margin: 8px 0;
              font-size: 14px;
              
              .duration, .budget {
                display: flex;
                align-items: center;
                gap: 4px;
                color: rgba(255, 255, 255, 0.9);
                
                .el-icon {
                  font-size: 16px;
                }
              }
            }
            
            .overlay-tags {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              
              .el-tag {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                backdrop-filter: blur(4px);
              }
            }
          }
        }
        
        .card-actions {
          position: absolute;
          top: 16px;
          right: 16px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          
          .action-button {
            width: 36px;
            height: 36px;
            padding: 8px;
            border: none;
            backdrop-filter: blur(4px);
            
            &:hover {
              transform: translateY(-2px);
            }
            
            &.el-button--primary {
              background: rgba(64, 158, 255, 0.9);
            }
            
            &.el-button--danger {
              background: rgba(245, 108, 108, 0.9);
            }
          }
        }
      }
      
      .card-content {
        padding: 20px;
        
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .category-tag {
            color: #4f46e5;
            font-weight: 500;
            font-size: 14px;
          }
          
          .date {
            color: #94a3b8;
            font-size: 14px;
          }
        }
        
        .destination-info {
          margin-bottom: 16px;
          
          .rating-popularity {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            
            .popularity {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #fb923c;
              font-size: 14px;
              
              .el-icon {
                font-size: 16px;
              }
            }
          }
          
          .notes {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            
            .el-icon {
              margin-top: 3px;
              flex-shrink: 0;
            }
          }
        }
        
        .seasonal-info {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          
          .best-seasons {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            
            .label {
              color: #64748b;
              font-size: 14px;
            }
            
            .el-tag {
              background: #f0fdf4;
              border-color: #bbf7d0;
              color: #16a34a;
            }
          }
          
          .seasonal-features {
            .label {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 4px;
              display: block;
            }
            
            p {
              color: #64748b;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
            }
          }
        }
      }
    }
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