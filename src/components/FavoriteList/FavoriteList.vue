<template>
  <div class="favorite-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left">
        <el-button-group v-if="selectedItems.length">
          <el-button 
            type="primary" 
            @click="handleBatchMove"
            :loading="loading"
          >
            <el-icon><FolderAdd /></el-icon>
            移动到分类
          </el-button>
          <el-button 
            type="danger" 
            @click="handleBatchDelete"
            :loading="loading"
          >
            <el-icon><Delete /></el-icon>
            批量删除
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
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 列表内容 -->
    <div class="list-content">
      <el-table
        v-loading="loading"
        :data="favorites"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="目的地" min-width="200">
          <template #default="{ row }">
            <div class="destination-info">
              <el-image
                :src="row.imageUrl"
                :preview-src-list="[row.imageUrl]"
                fit="cover"
                class="destination-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="info">
                <h3 class="name">{{ row.name }}</h3>
                <div class="tags">
                  <el-tag 
                    v-for="tag in row.tags" 
                    :key="tag"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <el-tag 
              :type="row.category === '默认收藏' ? '' : 'success'"
              effect="plain"
            >
              {{ row.category || '默认收藏' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="备注" min-width="200">
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
        
        <el-table-column label="收藏时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="primary" 
                link
                @click="handleMove(row)"
              >
                <el-icon><FolderAdd /></el-icon>
              </el-button>
              <el-button 
                type="danger" 
                link
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 移动分类对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="移动到分类"
      width="30%"
    >
      <el-form>
        <el-form-item label="选择分类">
          <el-select v-model="selectedCategory" placeholder="请选择分类">
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
          <el-button 
            type="primary" 
            @click="confirmMove"
            :loading="loading"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      :title="selectedItems.length > 1 ? '批量删除' : '删除收藏'"
      width="30%"
    >
      <p>确定要删除选中的 {{ selectedItems.length }} 个收藏吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button 
            type="danger" 
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Picture, Delete, FolderAdd } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import dayjs from 'dayjs'

const favoriteStore = useFavoriteStore()

// 状态
const searchKeyword = ref('')
const selectedItems = ref([])
const moveDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedCategory = ref(null)
const itemToMove = ref(null)

// 计算属性
const loading = computed(() => favoriteStore.loading)
const favorites = computed(() => favoriteStore.favorites)
const categories = computed(() => favoriteStore.categories)
const currentPage = computed({
  get: () => favoriteStore.currentPage,
  set: (val) => favoriteStore.currentPage = val
})
const pageSize = computed({
  get: () => favoriteStore.pageSize,
  set: (val) => favoriteStore.pageSize = val
})
const total = computed(() => favoriteStore.total)

// 监听搜索关键词变化
watch(searchKeyword, (val) => {
  if (!val) {
    handleSearch()
  }
})

// 方法
const handleSearch = async () => {
  if (searchKeyword.value) {
    await favoriteStore.searchFavorites(searchKeyword.value)
  } else {
    await favoriteStore.getFavoriteList()
  }
}

const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

const handleSizeChange = async (size) => {
  await favoriteStore.getFavoriteList(1, size)
}

const handleCurrentChange = async (page) => {
  await favoriteStore.getFavoriteList(page, pageSize.value)
}

const handleMove = (row) => {
  itemToMove.value = row
  selectedCategory.value = null
  moveDialogVisible.value = true
}

const handleBatchMove = () => {
  if (!selectedItems.value.length) {
    ElMessage.warning('请选择要移动的收藏')
    return
  }
  selectedCategory.value = null
  moveDialogVisible.value = true
}

const confirmMove = async () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请选择目标分类')
    return
  }

  try {
    if (itemToMove.value) {
      // 移动单个收藏
      await favoriteStore.updateCategory(itemToMove.value.id, {
        category: selectedCategory.value
      })
    } else {
      // 批量移动
      await favoriteStore.batchUpdateCategory(
        selectedItems.value.map(item => item.id),
        selectedCategory.value
      )
    }
    
    moveDialogVisible.value = false
    itemToMove.value = null
    selectedCategory.value = null
    await refreshList()
  } catch (error) {
    console.error('Move failed:', error)
  }
}

const handleDelete = (row) => {
  selectedItems.value = [row]
  deleteDialogVisible.value = true
}

const handleBatchDelete = () => {
  if (!selectedItems.value.length) {
    ElMessage.warning('请选择要删除的收藏')
    return
  }
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  try {
    await favoriteStore.batchDeleteFavorites(
      selectedItems.value.map(item => item.id)
    )
    deleteDialogVisible.value = false
    selectedItems.value = []
    await refreshList()
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const handleNotesUpdate = async (row) => {
  try {
    await favoriteStore.updateFavorite(row.id, {
      notes: row.notes
    })
    ElMessage.success('更新备注成功')
  } catch (error) {
    console.error('Update notes failed:', error)
  }
}

const refreshList = () => {
  return favoriteStore.getFavoriteList(
    currentPage.value,
    pageSize.value
  )
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.favorite-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .toolbar {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    margin-bottom: 16px;
    
    .right {
      width: 300px;
    }
  }
  
  .list-content {
    flex: 1;
    overflow: hidden;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    padding: 16px;
    
    .destination-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .destination-image {
        width: 80px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--el-fill-color-lighter);
          
          .el-icon {
            font-size: 24px;
            color: var(--el-text-color-secondary);
          }
        }
      }
      
      .info {
        flex: 1;
        min-width: 0;
        
        .name {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--el-text-color-primary);
          
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      }
    }
  }
  
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>