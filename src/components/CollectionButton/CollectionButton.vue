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
import { ref } from 'vue';
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

const isCollected = ref(props.initialState);

const toggleCollection = () => {
  isCollected.value = !isCollected.value;
  ElMessage({
    type: 'success',
    message: isCollected.value ? '已添加到收藏' : '已取消收藏',
    duration: 2000
  });
};
</script>

<style lang="scss" scoped>
.collection-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  
  .el-button {
    width: 36px;
    height: 36px;
    padding: 8px;
    transition: all 0.3s ease;
    
    &.is-collected {
      transform: scale(1.1);
      
      &:hover {
        transform: scale(1.05);
      }
    }
    
    &:hover {
      transform: scale(1.1);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}
</style> 