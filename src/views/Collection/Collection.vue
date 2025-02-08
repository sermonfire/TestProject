<template>
  <div class="collection-container">
    <div class="collection-header">
      <h2>我的收藏</h2>
      <div class="filter-section">
        <!-- 分类过滤 -->
        <el-select v-model="filterCategory" placeholder="按分类筛选" clearable class="filter-select">
          <el-option label="全部" value="" />
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>

        <!-- 排序方式 -->
        <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
          <el-option label="收藏时间 - 最新" value="time-desc" />
          <el-option label="收藏时间 - 最早" value="time-asc" />
          <el-option label="评分 - 从高到低" value="rating-desc" />
          <el-option label="评分 - 从低到高" value="rating-asc" />
        </el-select>

        <!-- 清空收藏按钮 -->
        <el-button 
          type="danger" 
          :icon="Delete"
          @click="showClearConfirm"
          :disabled="!collections.length"
        >
          清空收藏
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="icon-spin">
        <Loading />
      </el-icon>
      <span>加载收藏中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-icon><CircleClose /></el-icon>
      <span>{{ error }}</span>
      <el-button @click="fetchCollections" class="retry-btn">重试</el-button>
    </div>

    <!-- 收藏列表 -->
    <div v-else-if="collections.length" class="collections-grid">
      <DestinationCard
        v-for="item in sortedCollections"
        :key="item.id"
        :destination="{ ...item.destination, isCollected: true }"
        @card-click="handleCardClick"
        @collection-change="handleCollectionChange"
      >
        <template #actions>
          <!-- 分类标签 -->
          <el-tag size="small" :type="getCategoryTagType(item.category)">
            {{ item.category || '未分类' }}
          </el-tag>
          
          <!-- 编辑按钮 -->
          <el-button
            size="small"
            type="primary"
            text
            @click.stop="showEditDialog(item)"
          >
            编辑
          </el-button>
        </template>
      </DestinationCard>

      <!-- 分页器 -->
      <el-pagination
        v-if="total > pageSize"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无收藏的景点">
        <el-button type="primary" @click="goToExplore">去发现景点</el-button>
      </el-empty>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="isEditDialogVisible"
      title="编辑收藏信息"
      width="30%"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select
            v-model="editForm.category"
            placeholder="选择分类"
            allow-create
            filterable
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            :rows="3"
            placeholder="添加备注..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 清空确认弹窗 -->
    <el-dialog
      v-model="showClearDialog"
      title="确认清空"
      width="30%"
    >
      <span>确定要清空所有收藏吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showClearDialog = false">取消</el-button>
          <el-button type="danger" @click="handleClearAll">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 景点详情弹窗 -->
    <destination-detail-dialog
      v-if="selectedDestination"
      v-model="showDetailDialog"
      :destination="selectedDestination"
      :similar-destinations="similarDestinations"
      @close="closeDetailDialog"
      @similar-click="handleDestinationClick"
      @tag-click="handleTagClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Delete, Loading, CircleClose } from '@element-plus/icons-vue';
import DestinationCard from '@/components/DestinationCard/DestinationCard.vue';
import DestinationDetailDialog from '@/views/Explore/popUp/DestinationDetailDialog.vue';
import { useFavoriteStore } from '@/stores/favoriteStore';

const router = useRouter();
const favoriteStore = useFavoriteStore();

// 状态管理
const collections = ref([]);
const loading = ref(false);
const error = ref(null);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const filterCategory = ref('');
const sortBy = ref('time-desc');
const showDetailDialog = ref(false);
const isEditDialogVisible = ref(false);
const showClearDialog = ref(false);
const selectedDestination = ref(null);
const similarDestinations = ref([]);
const editForm = ref({
  id: null,
  category: '',
  notes: ''
});

// 计算属性
const categories = computed(() => {
  const categorySet = new Set(collections.value.map(item => item.category).filter(Boolean));
  return Array.from(categorySet);
});

const sortedCollections = computed(() => {
  let filtered = [...collections.value];
  
  // 应用分类筛选
  if (filterCategory.value) {
    filtered = filtered.filter(item => item.category === filterCategory.value);
  }
  
  // 应用排序
  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'time-desc':
        return new Date(b.createTime) - new Date(a.createTime);
      case 'time-asc':
        return new Date(a.createTime) - new Date(b.createTime);
      case 'rating-desc':
        return b.destination.rating - a.destination.rating;
      case 'rating-asc':
        return a.destination.rating - b.destination.rating;
      default:
        return 0;
    }
  });
});

// 生命周期钩子
onMounted(() => {
  fetchCollections();
});

// 方法
const fetchCollections = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await favoriteStore.getFavoriteList(currentPage.value, pageSize.value);
    if (response) {
      collections.value = response.list;
      total.value = response.total;
    }
  } catch (err) {
    error.value = err.message || '获取收藏列表失败';
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchCollections();
};

const handleCardClick = (destination) => {
  selectedDestination.value = destination;
  showDetailDialog.value = true;
};

const handleCollectionChange = async ({ id, isCollected }) => {
  if (!isCollected) {
    const success = await favoriteStore.removeFavorite(id);
    if (success) {
      await fetchCollections();
    }
  }
};

const showEditDialog = (item) => {
  editForm.value = {
    id: item.id,
    category: item.category || '',
    notes: item.notes || ''
  };
  isEditDialogVisible.value = true;
};

const handleEditSubmit = async () => {
  try {
    const success = await favoriteStore.updateFavorite(
      editForm.value.id,
      editForm.value.category,
      editForm.value.notes
    );
    
    if (success) {
      ElMessage.success('更新成功');
      isEditDialogVisible.value = false;
      await fetchCollections();
    }
  } catch (err) {
    ElMessage.error(err.message || '更新失败');
  }
};

const showClearConfirm = () => {
  showClearDialog.value = true;
};

const handleClearAll = async () => {
  try {
    const success = await favoriteStore.removeAllFavorites();
    if (success) {
      showClearDialog.value = false;
      await fetchCollections();
    }
  } catch (err) {
    ElMessage.error(err.message || '清空收藏失败');
  }
};

const closeDetailDialog = () => {
  showDetailDialog.value = false;
  selectedDestination.value = null;
  similarDestinations.value = [];
};

const handleDestinationClick = (destination) => {
  selectedDestination.value = destination;
};

const handleTagClick = (tag) => {
  router.push({
    name: 'searchResults',
    query: { tags: tag }
  });
};

const getCategoryTagType = (category) => {
  const types = ['', 'success', 'warning', 'danger', 'info'];
  const hash = category?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return types[hash % types.length];
};

const goToExplore = () => {
  router.push('/explore');
};
</script>

<style lang="scss" scoped>
.collection-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 200px);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
    font-weight: 600;
  }
  
  .filter-section {
    display: flex;
    gap: 12px;
    align-items: center;
    
    .filter-select,
    .sort-select {
      width: 180px;
    }
  }
}

// 加载状态
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: #666;
  
  .icon-spin {
    font-size: 32px;
    animation: spin 1s linear infinite;
  }
  
  .retry-btn {
    margin-top: 12px;
  }
}

// 收藏列表网格
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px 0;
  
  .destination-card {
    position: relative;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
    }
  }
}

// 分页器
.pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  
  :deep(.el-pagination) {
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// 空状态
.empty-state {
  padding: 60px 0;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  :deep(.el-empty) {
    padding: 40px;
  }
}

// 弹窗样式
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
  
  .el-dialog__header {
    margin: 0;
    padding: 20px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 20px;
    background: #f5f7fa;
    border-top: 1px solid #e4e7ed;
  }
}

// 分类标签样式
.el-tag {
  margin-right: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
}

// 编辑按钮
.edit-button {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

// 动画
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .collection-container {
    padding: 12px;
  }
  
  .collection-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    
    .filter-section {
      width: 100%;
      flex-wrap: wrap;
      
      .filter-select,
      .sort-select {
        width: 100%;
      }
    }
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .collection-header,
  .empty-state,
  :deep(.el-dialog) {
    background: #1a1a1a;
    
    h2 {
      color: #fff;
    }
  }
  
  .el-tag {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style> 