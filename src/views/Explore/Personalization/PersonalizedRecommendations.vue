<template>
  <div v-if="recommendations?.length" class="section">
    <div class="section-header">
      <span class="section-title">为你推荐</span>
      <span class="section-subtitle">根据你的偏好精选({{ recommendations.length }})</span>
    </div>
    <div class="recommendations-grid">
      <div v-for="item in recommendations" :key="item.id" class="destination-card" @click="handleDestinationClick(item)">
        <CollectionButton
          :item-id="item.id"
          :initial-state="item.isCollected"
          class="collection-btn"
          @collection-change="handleCollectionChange(item.id, $event)"
        />
        
        <el-image :src="item.imageUrl" fit="cover" class="destination-image">
          <template #error>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        
        <div class="destination-info">
          <div class="destination-header">
            <span class="destination-name">{{ item.name }}</span>
            <div class="rating-wrapper">
              <el-rate
                v-model="item.rating"
                disabled
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </div>
          
          <p class="destination-desc">{{ item.description }}</p>
          
          <div class="destination-meta">
            <div class="meta-item">
              <el-icon>
                <Calendar />
              </el-icon>
              <span>{{ formatDuration(item.recommendedDuration) }}</span>
            </div>
            <div class="meta-item">
              <el-icon>
                <Wallet />
              </el-icon>
              <span>¥{{ item.averageBudget }}/天</span>
            </div>
          </div>
          
          <div class="destination-tags">
            <el-tag
              v-for="(tag, index) in item.tags"
              :key="index"
              size="small"
              effect="light"
              class="tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Star, Calendar, Wallet, Picture } from '@element-plus/icons-vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';
import { ElMessage } from 'element-plus';

defineProps({
  recommendations: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['destinationClick', 'collectionChange']);

const handleDestinationClick = (destination) => {
  emit('destinationClick', destination);
};

const handleCollectionChange = (itemId, isCollected) => {
  emit('collectionChange', { itemId, isCollected });
};

// 格式化推荐时长
const formatDuration = (duration) => {
  const durationMap = {
    short: '短期',
    medium: '中期',
    long: '长期'
  };
  return durationMap[duration] || duration;
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
      font-size: 20px;
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
  gap: 24px;
  transition: all 0.3s ease;

  .destination-card {
    position: relative;
    background-color: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    will-change: transform;
    width: 100%;
    min-width: 300px;
    max-width: 450px;
    margin: 0 auto;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

      .destination-image {
        transform: scale(1.05);
      }
    }

    .collection-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
    }

    .destination-image {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .destination-info {
      padding: 20px;
      background: linear-gradient(to bottom, #ffffff, #f8f9fa);

      .destination-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .destination-name {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .rating-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .destination-desc {
        font-size: 14px;
        color: #666;
        margin: 12px 0;
        line-height: 1.6;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .destination-meta {
        display: flex;
        gap: 16px;
        margin: 16px 0;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 14px;

          .el-icon {
            font-size: 16px;
            color: var(--el-color-primary);
          }
        }
      }

      .destination-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;

        .tag {
          border-radius: 12px;
          padding: 0 12px;
          height: 24px;
          line-height: 24px;
          background-color: var(--el-color-primary-light-9);
          border-color: var(--el-color-primary-light-8);
          color: var(--el-color-primary);
          
          &:hover {
            background-color: var(--el-color-primary-light-8);
          }
        }
      }
    }
  }
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #999;
  font-size: 24px;
}

@media screen and (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .destination-card {
    max-width: 100% !important;
  }
}
</style> 