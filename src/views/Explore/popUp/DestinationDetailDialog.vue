<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="destination?.name" 
    width="35%"
    class="destination-detail-dialog" 
    :before-close="handleClose"
  >
    <div class="detail-content">
      <el-image :src="destination?.imageUrl" fit="cover" class="detail-image" />

      <div class="detail-info-section">
        <div class="detail-meta">
          <div class="meta-item">
            <el-icon color="#FFB800">
              <Star />
            </el-icon>
            <span>{{ destination?.rating }} 分</span>
          </div>
          <div class="meta-item">
            <el-icon>
              <Calendar />
            </el-icon>
            <span>建议游玩 {{ destination?.recommendedDuration }}</span>
          </div>
          <div class="meta-item">
            <el-icon>
              <Wallet />
            </el-icon>
            <span>人均 ¥{{ destination?.averageBudget }}/天</span>
          </div>
        </div>

        <div class="detail-tags">
          <span 
            v-for="(tag, index) in destination?.tags" 
            :key="index" 
            class="tag"
          >{{ tag }}</span>
        </div>

        <div class="detail-description">
          <h3 class="section-title">目的地简介</h3>
          <p class="description-text">{{ destination?.description }}</p>
        </div>

        <div class="best-seasons">
          <h3 class="section-title">最佳游玩季节</h3>
          <div class="seasons-list">
            <template v-if="destination?.bestSeasons?.length">
              <span 
                v-for="(season, index) in destination.bestSeasons" 
                :key="index"
                class="season-tag"
              >{{ season }}</span>
            </template>
            <template v-else>
              <span class="season-tag all-season">全年适宜</span>
              <span class="season-desc">该目的地四季皆宜，可根据个人喜好选择出行时间</span>
            </template>
          </div>
        </div>

        <!-- 季节特色 -->
        <div v-if="destination?.seasonalFeatures" class="seasonal-features">
          <h3 class="section-title">季节特色</h3>
          <div class="features-list">
            <div 
              v-for="(feature, season) in destination.seasonalFeatures" 
              :key="season"
              class="feature-item"
            >
              <span class="feature-season">{{ season }}</span>
              <span class="feature-desc">{{ feature }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 相似推荐 -->
      <div v-if="similarDestinations.length" class="similar-destinations">
        <div class="section-header">
          <span class="section-title">相似推荐</span>
          <span class="section-subtitle">你可能也会喜欢</span>
        </div>
        <el-scrollbar>
          <div class="similar-grid">
            <div 
              v-for="dest in similarDestinations" 
              :key="dest.id" 
              class="similar-item"
              @click="handleSimilarClick(dest)"
            >
              <el-image :src="dest.imageUrl" fit="cover" class="similar-image" />
              <div class="similar-info">
                <span class="similar-name">{{ dest.name }}</span>
                <div class="similar-meta">
                  <span class="similar-rating">{{ dest.rating }}分</span>
                  <span class="similar-price">¥{{ dest.averageBudget }}/天</span>
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { Star, Calendar, Wallet } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  destination: {
    type: Object,
    default: () => ({})
  },
  similarDestinations: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'similar-click']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleClose = () => {
  emit('close');
};

const handleSimilarClick = (destination) => {
  emit('similar-click', destination);
};
</script>

<style lang="scss" scoped>
.destination-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }

  .detail-content {
    max-height: 70vh;
    overflow-y: auto;

    .detail-image {
      width: 100%;
      height: 240px;
      object-fit: cover;
    }

    .detail-info-section {
      padding: 24px;

      .detail-meta {
        display: flex;
        justify-content: space-between;
        background: #f8f9fa;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 24px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
        }
      }

      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;

        .tag {
          background: rgba(33, 150, 243, 0.1);
          color: #2196f3;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
        }
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
        position: relative;
        padding-left: 12px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          background: #2196f3;
          border-radius: 2px;
        }
      }

      .description-text {
        color: #666;
        line-height: 1.8;
        margin-bottom: 24px;
      }

      .seasons-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;

        .season-tag {
          background: #e3f2fd;
          color: #1976d2;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;

          &.all-season {
            background: #e8f5e9;
            color: #2e7d32;
          }
        }

        .season-desc {
          color: #666;
          font-size: 14px;
          margin-left: 8px;
        }
      }

      .features-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .feature-item {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;

          .feature-season {
            color: #1976d2;
            font-weight: 500;
            display: block;
            margin-bottom: 4px;
          }

          .feature-desc {
            color: #666;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.similar-destinations {
  padding: 24px;
  background: #f8f9fa;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .section-subtitle {
      font-size: 14px;
      color: #666;
    }
  }

  .similar-grid {
    display: flex;
    gap: 16px;
    padding: 4px;

    .similar-item {
      flex: 0 0 160px;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }

      .similar-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
      }

      .similar-info {
        padding: 12px;

        .similar-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .similar-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;

          .similar-rating {
            color: #ff9800;
          }

          .similar-price {
            color: #f44336;
          }
        }
      }
    }
  }
}
</style> 