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
import { ref, onMounted, watch, computed } from 'vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
  recommendations: {
    type: Array,
    required: true
  }
});

const favoriteStore = useFavoriteStore();
const { favoriteStatus } = storeToRefs(favoriteStore);

// 添加计算收藏状态的方法
const isItemCollected = (id) => {
  return favoriteStore.getFavoriteStatus(id);
};

// 处理收藏状态变化
const handleCollectionChange = ({ id, isCollected }) => {
  favoriteStore.updateFavoriteStatus(id, isCollected);
};

// 监听推荐列表变化，更新收藏状态
watch(() => props.recommendations, async (newRecommendations) => {
  if (newRecommendations?.length) {
    const itemIds = newRecommendations.map(item => item.id);
    await favoriteStore.batchCheckFavoriteStatus(itemIds);
  }
}, { immediate: true });

onMounted(async () => {
  // 批量检查推荐项目的收藏状态
  const itemIds = props.recommendations.map(item => item.id);
  await favoriteStore.batchCheckFavoriteStatus(itemIds);
});
</script> 