<template>
  <div v-if="recommendations?.length" class="section">
    <div class="section-header">
      <span class="section-title">热门目的地</span>
      <span class="section-subtitle">最受欢迎的旅行地点</span>
    </div>
    <div class="recommendations-grid">
      <div v-for="item in recommendations" :key="item.id" class="destination-card" @click="handleDestinationClick(item)">
        <el-image :src="item.imageUrl" fit="cover" class="destination-image" />
        <div class="destination-info">
          <span class="destination-name">{{ item.name }}</span>
          <div class="destination-meta">
            <div class="meta-item">
              <el-icon color="#FFB800">
                <Star />
              </el-icon>
              <span>{{ item.rating }}</span>
            </div>
            <div class="meta-item">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>{{ item.recommendedDuration }}</span>
            </div>
            <div class="meta-item">
              <el-icon>
                <Wallet />
              </el-icon>
              <span>¥{{ item.averageBudget }}/天</span>
            </div>
          </div>
          <div class="destination-tags">
            <span v-for="(tag, index) in item.tags.slice(0, 3)" :key="index" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Star, Calendar, Wallet } from '@element-plus/icons-vue';

defineProps({
  recommendations: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['destinationClick']);

const handleDestinationClick = (destination) => {
  emit('destinationClick', destination);
};
</script>

<style lang="scss" scoped>
.section {
  margin-bottom: 30px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .section-subtitle {
      font-size: 14px;
      color: #666;
    }
  }
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  transition: all 0.3s ease;

  .destination-card {
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                width 0.3s ease,
                transform 0.3s ease;
    cursor: pointer;
    will-change: transform;
    width: 100%;
    min-width: 300px;
    max-width: 450px;
    margin: 0 auto;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

      .destination-info {
        background-color: #e6f0fc;
      }
    }

    &:not(:hover) {
      transform: translateY(0);
    }

    .destination-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }

    .destination-info {
      padding: 16px;

      .destination-name {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        display: block;
      }

      .destination-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #666;
          font-size: 14px;
        }
      }

      .destination-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag {
          background-color: #f5f5f5;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}
</style> 