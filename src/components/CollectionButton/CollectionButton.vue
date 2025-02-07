<template>
  <div class="collection-button">
    <el-button
      :type="isCollected ? 'danger' : 'primary'"
      :icon="isCollected ? 'Star' : 'StarFilled'"
      circle
      @click.stop="toggleCollection"
      :class="{ 'is-collected': isCollected }"
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
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Star, StarFilled } from '@element-plus/icons-vue';

const props = defineProps({
  itemId: {
    type: [Number, String],
    required: true
  },
  initialState: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['collection-change']);

const isCollected = ref(props.initialState);

// 监听 initialState 的变化
watch(() => props.initialState, (newValue) => {
  isCollected.value = newValue;
});

const toggleCollection = () => {
  isCollected.value = !isCollected.value;
  emit('collection-change', isCollected.value);
  
  ElMessage({
    type: 'success',
    message: isCollected.value ? '已添加到收藏' : '已取消收藏',
    duration: 2000,
    customClass: 'collection-message'
  });
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
    
    &:hover {
      transform: scale(1.1);
      background-color: #f56c6c;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      :deep(.el-icon) {
        transform: scale(1.1);
      }
    }
    
    &:active {
      transform: scale(1.05);
      background-color: #e64242;
      
      :deep(.el-icon) {
        transform: scale(0.95);
      }
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