<template>
  <div class="destination-card">
    <!-- 添加收藏按钮 -->
    <CollectionButton
      :item-id="destination.id"
      :initial-state="destination.isCollected"
    />
    <!-- 其他卡片内容 -->
  </div>
</template>

<script setup>
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';

// ... 其他代码 ...
</script> 