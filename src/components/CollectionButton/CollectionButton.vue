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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
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
  }
});

const emit = defineEmits(['collection-change']);
const favoriteStore = useFavoriteStore();

const isCollected = ref(props.initialState);
const loading = ref(false);

// 监听 initialState 的变化
watch(() => props.initialState, (newValue) => {
  isCollected.value = newValue;
});

// 组件挂载时检查收藏状态
onMounted(async () => {
  try {
    const status = await favoriteStore.checkIsFavorite(props.itemId);
    isCollected.value = status;
  } catch (error) {
    console.error('Failed to check favorite status:', error);
  }
});

const handleCollectionClick = async () => {
  if (loading.value || props.disabled) return;
  
  loading.value = true;
  try {
    const success = isCollected.value 
      ? await favoriteStore.removeFavorite(props.itemId)
      : await favoriteStore.addFavorite(props.itemId, props.category, props.notes);

    if (success) {
      isCollected.value = !isCollected.value;
      emit('collection-change', isCollected.value);
    }
  } catch (error) {
    console.error('Collection operation failed:', error);
    ElMessage.error('操作失败，请稍后重试');
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