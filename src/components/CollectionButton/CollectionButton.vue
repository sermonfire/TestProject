<template>
  <div class="collection-button">
    <el-button
      :type="isCollected ? 'danger' : 'primary'"
      :icon="isCollected ? 'Star' : 'StarFilled'"
      circle
      @click.stop="toggleCollection"
      :class="{ 'is-collected': isCollected }"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

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
    duration: 2000
  });
};
</script>

<style lang="scss" scoped>
.collection-button {
  .el-button {
    width: 36px;
    height: 36px;
    padding: 8px;
    transition: all 0.3s ease;
    background-color: rgba(255, 255, 255, 0.9);
    border: none;
    backdrop-filter: blur(4px);
    
    &.is-collected {
      transform: scale(1.1);
      background-color: var(--el-color-danger-light-9);
      
      &:hover {
        background-color: var(--el-color-danger-light-8);
        transform: scale(1.05);
      }
    }
    
    &:hover {
      transform: scale(1.1);
      background-color: rgba(255, 255, 255, 1);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}
</style> 