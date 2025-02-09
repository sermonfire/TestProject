<template>
  <div class="recommendations">
    <div v-for="item in recommendations" :key="item.id" class="recommendation-item">
      <!-- 其他内容 -->
      <CollectionButton 
        :item-id="item.id"
        :initial-state="isItemCollected(item.id)"
        class="collection-btn"
        @collection-change="handleCollectionChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';
import { useFavoriteStore } from '@/stores/favoriteStore';

const props = defineProps({
  recommendations: {
    type: Array,
    required: true,
    default: () => []
  }
});

const favoriteStore = useFavoriteStore();

// 优化收藏状态检查方法
const isItemCollected = (id) => {
  if (!id) return false;
  return Boolean(favoriteStore.getFavoriteStatus(id));
};

// 优化收藏状态变化处理
const handleCollectionChange = ({ id, isCollected }) => {
  if (!id) return;
  favoriteStore.updateFavoriteStatus(id, isCollected);
};

// 添加批量检查状态的方法
const checkAllItemsStatus = async () => {
  if (!props.recommendations?.length) return;
  
  try {
    const itemIds = props.recommendations
      .map(item => item.id)
      .filter(Boolean);
      
    if (itemIds.length) {
      await favoriteStore.batchCheckFavoriteStatus(itemIds);
    }
  } catch (error) {
    console.error('Failed to check items status:', error);
  }
};

// 监听推荐列表变化
watch(() => props.recommendations, async (newRecommendations) => {
  if (newRecommendations?.length) {
    await checkAllItemsStatus();
  }
}, { immediate: true });

onMounted(checkAllItemsStatus);
</script> 