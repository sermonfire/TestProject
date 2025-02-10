<template>
  <div class="collection-button">
    <!-- 添加工具提示 -->
    <el-tooltip
      :content="isCollected ? '取消收藏' : '添加收藏'"
      placement="top"
      :show-after="500"
      :disabled="tooltipDisabled"
    >
      <el-button
        :type="isCollected ? 'danger' : 'primary'"
        circle
        @click.stop="handleCollectionClick"
        :class="{ 
          'is-collected': isCollected,
          'is-animating': isAnimating
        }"
        :loading="loading"
        :disabled="buttonDisabled"
        v-loading.fullscreen.lock="loading"
        element-loading-text="处理中..."
      >
        <template #icon>
          <el-icon :size="24">
            <component :is="isCollected ? 'Star' : 'StarFilled'" />
          </el-icon>
        </template>
      </el-button>
    </el-tooltip>

    <!-- 收藏确认对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isCollected ? '取消收藏' : '添加收藏'"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :show-close="true"
      @close="handleDialogClose"
      append-to-body
      center
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
        @submit.prevent="handleConfirm"
      >
        <el-form-item label="分类" required>
          <el-select 
            v-model="form.category"
            placeholder="请选择分类"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            >
              <div class="category-option">
                <el-icon>
                  <component :is="category.isDefault ? 'Star' : 'Folder'" />
                </el-icon>
                <span>{{ category.name }}</span>
                <span class="count">({{ category.count || 0 }})</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="添加备注（可选）"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirm" 
            :loading="loading"
          >
            确定{{ isCollected ? '取消' : '收藏' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 取消收藏确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="取消收藏"
      width="360px"
      append-to-body
      center
    >
      <div class="confirm-content">
        <el-icon class="warning-icon" :size="48"><Warning /></el-icon>
        <p>确定要取消收藏吗？</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="handleRemoveFavorite"
            :loading="loading"
          >
            确定取消
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue';
import { Star, StarFilled, Warning } from '@element-plus/icons-vue';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash-es'
import { storeToRefs } from 'pinia';
import { checkIsFavoriteAPI } from '@/api/favoriteApi';

const props = defineProps({
  itemId: {
    type: [Number, String],
    required: true
  },
  initialState: {
    type: Boolean,
    default: false
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['collection-change', 'collection-start', 'collection-end', 'collection-error']);
const favoriteStore = useFavoriteStore();
const { favoriteStatus } = storeToRefs(favoriteStore);

const loading = ref(false);
const dialogVisible = ref(false);
const confirmDialogVisible = ref(false);
const form = ref({
  category: '',
  notes: ''
});

// 获取分类列表
const categories = computed(() => favoriteStore.sortedCategories);

// 检查是否有自定义分类
const hasCustomCategories = computed(() => {
  return categories.value.some(category => !category.isDefault);
});

// 添加计算属性检查是否只有默认分类
const hasOnlyDefaultCategory = computed(() => {
  return categories.value.length === 1 && categories.value[0].isDefault;
});

// 修改收藏状态的计算属性
const isCollected = computed(() => {
  if (!props.itemId) return false;
  return Boolean(favoriteStore.getFavoriteStatus(props.itemId));
});

// 修改初始化逻辑
onMounted(async () => {
  if (!props.itemId) return;
  
  try {
    // 设置初始状态
    favoriteStore.updateFavoriteStatus(props.itemId, props.initialState);
    
    // 检查实际状态
    if (props.autoRefresh) {
      await checkFavoriteStatus();
    }
  } catch (error) {
    console.error('Failed to initialize collection status:', error);
  }
});

// 优化状态检查方法
const checkFavoriteStatus = async () => {
  if (!props.itemId) return;
  
  try {
    loading.value = true;
    const status = await favoriteStore.checkIsFavorite(props.itemId);
    if (typeof status === 'boolean') {
      favoriteStore.updateFavoriteStatus(props.itemId, status);
    }
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    emit('collection-error', error);
  } finally {
    loading.value = false;
  }
};

const isAnimating = ref(false)

const handleCollectionClick = async () => {
  if (loading.value || props.disabled) return
  
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
  
  if (isCollected.value) {
    // 显示取消确认对话框
    confirmDialogVisible.value = true
  } else {
    // 检查是否只有默认分类
    if (hasOnlyDefaultCategory.value) {
      // 直接使用默认分类收藏
      const defaultCategory = categories.value[0]
      // 直接调用 addFavorite，不再通过 debouncedAddFavorite
      await addFavorite(defaultCategory.id, '')
    } else {
      // 有多个分类时显示选择对话框
      const defaultCategory = categories.value.find(c => c.isDefault)
      if (defaultCategory) {
        form.value.category = defaultCategory.id
      }
      dialogVisible.value = true
    }
  }
}

// 修改取消收藏处理
const handleRemoveFavorite = async () => {
  // 直接调用 removeFavorite，不再通过 debouncedRemoveFavorite
  await removeFavorite()
  confirmDialogVisible.value = false
}

// 只保留一个防抖的确认操作
const handleConfirm = debounce(async () => {
  if (dialogVisible.value && !form.value.category) {
    ElMessage.warning('请选择收藏分类')
    return
  }
  
  await addFavorite(form.value.category, form.value.notes)
  dialogVisible.value = false
  form.value = { category: '', notes: '' }
}, 300)

// 添加重试机制
const MAX_RETRIES = 3
const retryDelay = 1000

const retryOperation = async (operation, retries = 0) => {
  try {
    return await operation()
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return retryOperation(operation, retries + 1)
    }
    throw error
  }
}

// 在状态变化时发出事件
const handleStatusChange = (newStatus) => {
  emit('collection-change', {
    id: props.itemId,
    isCollected: newStatus
  });
};

// 修改收藏方法
const addFavorite = async (categoryId = '', notes = '') => {
  loading.value = true;
  emit('collection-start');
  try {
    const success = await retryOperation(() => 
      favoriteStore.addFavorite(props.itemId, categoryId, notes)
    );
    if (success) {
      handleStatusChange(true);
      if (props.autoRefresh) {
        await favoriteStore.refreshFavoriteData();
      }
    }
  } catch (error) {
    console.error('Add favorite failed:', error);
    emit('collection-error', error);
    ElMessage({
      message: '收藏失败，请稍后重试',
      type: 'error',
      duration: 3000,
      showClose: true,
      customClass: 'collection-error-message'
    });
  } finally {
    loading.value = false;
    emit('collection-end');
  }
};

// 修改取消收藏方法
const removeFavorite = async () => {
  loading.value = true;
  emit('collection-start');
  try {
    // 1. 调用取消收藏接口
    const removeRes = await favoriteStore.removeFavorite(props.itemId);
    if (removeRes) {
      // 添加等待时间，确保取消收藏操作完成
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. 调用检查收藏状态接口确认
      const checkRes = await checkIsFavoriteAPI(props.itemId);
      if (checkRes.code === 0 && !checkRes.data) {
        // 取消收藏成功且确认未收藏
        handleStatusChange(false);
        ElMessage({
          message: '已取消收藏',
          type: 'success',
          duration: 2000,
          customClass: 'collection-message'
        });
        
        // 触发刷新
        if (props.autoRefresh) {
          await favoriteStore.refreshFavoriteData();
        }
        emit('collection-change', {
          id: props.itemId,
          isCollected: false
        });
      } else {
        throw new Error('取消收藏状态验证失败');
      }
    }
  } catch (error) {
    console.error('Remove favorite failed:', error);
    emit('collection-error', error);
    ElMessage({
      message: '取消收藏失败，请稍后重试',
      type: 'error',
      duration: 3000,
      customClass: 'collection-message'
    });
  } finally {
    loading.value = false;
    emit('collection-end');
  }
};

// 添加对话框关闭处理
const handleDialogClose = () => {
  form.value = { category: '', notes: '' }
}

// 组件卸载时清理
onUnmounted(() => {
  // 清理可能的定时器和监听器
  if (loading.value) {
    loading.value = false
  }
})

// 计算属性
const buttonDisabled = computed(() => props.disabled || loading.value);
const tooltipDisabled = computed(() => props.disabled || loading.value);
</script>

<style lang="scss" scoped>
.collection-button {
  .el-button {
    width: 40px;
    height: 40px;
    padding: 8px;
    transition: all 0.3s ease;
    background-color: rgba(185, 177, 177, 0.9);
    border: none;
    backdrop-filter: blur(4px);
    
    :deep(.el-icon) {
      font-size: 20px;
      transition: all 0.3s ease;
      color: #ffffff;
    }
    
    &.is-collected {
      transform: scale(1.2);
      background-color: #f56c6c;
      box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
      
      &:hover {
        background-color: #e64242;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.5);
        
        :deep(.el-icon) {
          transform: scale(1.1);
        }
      }
    }
    
    &:hover:not(:disabled) {
      transform: scale(1.1);
      background-color: #f56c6c;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      :deep(.el-icon) {
        transform: scale(1.1);
      }
    }
    
    &:active:not(:disabled) {
      transform: scale(1.05);
      background-color: #e64242;
      
      :deep(.el-icon) {
        transform: scale(0.95);
      }
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.is-animating {
      animation: pulse 0.3s ease;
    }
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }
    
    .count {
      margin-left: auto;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.confirm-content {
  text-align: center;
  padding: 20px 0;
  
  .warning-icon {
    color: var(--el-color-warning);
    margin-bottom: 16px;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
  
  .el-dialog__header {
    margin: 0;
    padding: 20px;
    text-align: center;
    background-color: var(--el-color-primary-light-9);
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>

<style>
/* 全局消息提示样式 */
.collection-message {
  background: linear-gradient(45deg, var(--el-color-success), var(--el-color-success-light-3)) !important;
  border: none !important;
  color: white !important;
  padding: 12px 24px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3) !important;
  min-width: 120px !important;
  text-align: center !important;
  
  .el-message__content {
    color: white !important;
    font-weight: 500 !important;
    font-size: 14px !important;
  }
  
  /* 取消收藏时使用警告色 */
  &.el-message--warning {
    background: linear-gradient(45deg, var(--el-color-warning), var(--el-color-warning-light-3)) !important;
    box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3) !important;
  }
  
  /* 错误提示使用错误色 */
  &.el-message--error {
    background: linear-gradient(45deg, var(--el-color-danger), var(--el-color-danger-light-3)) !important;
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3) !important;
  }
}
</style> 