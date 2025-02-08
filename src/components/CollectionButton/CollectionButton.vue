<template>
  <div class="collection-button">
    <el-button
      :type="isCollected ? 'danger' : 'primary'"
      :icon="isCollected ? 'Star' : 'StarFilled'"
      circle
      @click.stop="handleCollectionClick"
      :class="{ 'is-collected': isCollected }"
      :loading="loading"
      :disabled="disabled"
    >
      <template #icon>
        <el-icon :size="24">
          <Star v-if="isCollected" />
          <StarFilled v-else />
        </el-icon>
      </template>
    </el-button>

    <!-- 添加分类选择对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择收藏分类"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
      >
        <el-form-item label="分类">
          <el-select 
            v-model="form.category"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            >
              <span style="float: left">{{ category.name }}</span>
              <span style="float: right; color: var(--el-text-color-secondary)">
                ({{ category.count || 0 }})
              </span>
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
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { ElMessage } from 'element-plus';

const props = defineProps({
  itemId: {
    type: [Number, String],
    required: true
  },
  initialState: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['collection-change']);
const favoriteStore = useFavoriteStore();

const isCollected = ref(props.initialState);
const loading = ref(false);
const dialogVisible = ref(false);
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

// 监听 initialState 的变化
watch(() => props.initialState, (newValue) => {
  isCollected.value = newValue;
});

// 组件挂载时检查收藏状态
onMounted(async () => {
  try {
    const status = await favoriteStore.checkIsFavorite(props.itemId);
    isCollected.value = status;
    // 初始化时获取分类列表
    if (!favoriteStore.categories.length) {
      await favoriteStore.getCategories();
    }
  } catch (error) {
    console.error('Failed to check favorite status:', error);
  }
});

const handleCollectionClick = async () => {
  if (loading.value || props.disabled) return;
  
  if (isCollected.value) {
    // 如果已收藏，直接取消收藏
    await removeFavorite();
  } else {
    // 如果未收藏且有自定义分类，显示分类选择对话框
    if (hasCustomCategories.value) {
      // 设置默认分类
      const defaultCategory = categories.value.find(c => c.isDefault);
      if (defaultCategory) {
        form.value.category = defaultCategory.id;
      }
      dialogVisible.value = true;
    } else {
      // 如果没有自定义分类，直接添加到默认分类
      await addFavorite();
    }
  }
};

const handleConfirm = async () => {
  if (!form.value.category) {
    ElMessage.warning('请选择收藏分类');
    return;
  }
  
  await addFavorite(form.value.category, form.value.notes);
  dialogVisible.value = false;
  form.value = { category: '', notes: '' };
};

const addFavorite = async (categoryId = '', notes = '') => {
  loading.value = true;
  try {
    const success = await favoriteStore.addFavorite(props.itemId, categoryId, notes);
    if (success) {
      isCollected.value = true;
      emit('collection-change', true);
      
      if (props.autoRefresh) {
        await favoriteStore.refreshFavoriteData();
      }
    }
  } catch (error) {
    console.error('Add favorite failed:', error);
    ElMessage.error('收藏失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const removeFavorite = async () => {
  loading.value = true;
  try {
    const success = await favoriteStore.removeFavorite(props.itemId);
    if (success) {
      isCollected.value = false;
      emit('collection-change', false);
      
      if (props.autoRefresh) {
        await favoriteStore.refreshFavoriteData();
      }
    }
  } catch (error) {
    console.error('Remove favorite failed:', error);
    ElMessage.error('取消收藏失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
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
  }
}

// 添加对话框样式
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
  
  .el-dialog__header {
    margin: 0;
    padding: 20px;
    background-color: var(--el-color-primary-light-9);
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
  
  .el-dialog__body {
    padding: 20px;
  }
  
  .el-select {
    width: 100%;
  }
  
  .el-form-item__label {
    font-weight: 500;
  }
}
</style>

<style>
/* 全局消息提示样式 */
.collection-message {
  background: linear-gradient(45deg, #f56c6c, #e64242) !important;
  border: none !important;
  color: white !important;
  padding: 12px 24px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3) !important;
  
  .el-message__content {
    color: white !important;
    font-weight: 500 !important;
  }
}
</style> 