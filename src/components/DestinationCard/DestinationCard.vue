<template>
  <div 
    class="destination-card"
    @click="$emit('cardClick', destination)"
    @mouseenter="startRotation"
    @mouseleave="stopRotation"
  >
    <div class="card-inner" :class="{ 'is-rotating': isRotating }">
      <div class="card-front">
        <div class="image-wrapper">
          <el-image 
            :src="destination.imageUrl" 
            fit="cover" 
            class="destination-image"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="image-overlay">
            <span class="view-details">查看详情</span>
          </div>
          <div class="collection-wrapper">
            <CollectionButton
              :item-id="destination.id"
              :initial-state="destination.isCollected"
              @collection-change="handleCollectionChange"
              @click.stop
            />
          </div>
          <div class="actions-wrapper">
            <slot name="actions"></slot>
          </div>
        </div>
        <div class="destination-info">
          <div class="info-header">
            <h3 class="destination-name">{{ destination.name }}</h3>
            <div class="rating-row">
              <el-rate 
                v-model="destination.rating" 
                disabled 
                show-score 
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </div>
          <div class="tags-wrapper">
            <el-tag 
              v-for="tag in destination.tags.slice(0, 3)" 
              :key="tag" 
              size="small" 
              effect="plain"
              class="destination-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      <div class="card-back">
        <div class="back-content">
          <div class="back-header">
            <h3>{{ destination.name }}</h3>
            <div class="divider"></div>
          </div>
          <div class="description-wrapper">
            <p class="description">{{ destination.description || '暂无描述' }}</p>
          </div>
          <div class="action-btn">了解更多</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Picture } from '@element-plus/icons-vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';

const props = defineProps({
  destination: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['cardClick', 'collection-change']);

const isRotating = ref(false);

const startRotation = () => {
  isRotating.value = true;
};

const stopRotation = () => {
  isRotating.value = false;
};

const handleCollectionChange = (isCollected) => {
  emit('collection-change', { id: props.destination.id, isCollected });
};
</script>

<style lang="scss" scoped>
.destination-card {
  cursor: pointer;
  perspective: 1500px;
  transform-style: preserve-3d;
  min-height: 400px;
  margin-bottom: 20px;

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
    transform-origin: center center;

    &.is-rotating {
      animation: rotate3D 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-front,
    .card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      min-height: 400px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }

    .card-front {
      transform: rotateY(0deg);
    }

    .card-back {
      transform: rotateY(180deg);
      background: linear-gradient(135deg, var(--el-color-primary-light-9), #fff);

      .back-content {
        padding: 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        text-align: center;

        .back-header {
          text-align: center;
          margin-bottom: 20px;

          h3 {
            font-size: 24px;
            font-weight: 600;
            color: var(--el-color-primary);
            margin-bottom: 12px;
          }

          .divider {
            width: 40px;
            height: 3px;
            background: var(--el-color-primary);
            margin: 0 auto;
            border-radius: 2px;
          }
        }

        .description-wrapper {
          flex: 1;
          overflow-y: auto;
          margin: 20px 0;
          padding: 0 4px;

          .description {
            color: #666;
            font-size: 14px;
            line-height: 1.8;
            text-align: justify;
            margin: 0;
            
            &::-webkit-scrollbar {
              width: 4px;
            }

            &::-webkit-scrollbar-thumb {
              background-color: var(--el-color-primary-light-5);
              border-radius: 2px;
            }
          }
        }

        .action-btn {
          margin-top: 24px;
          padding: 10px 28px;
          background: var(--el-color-primary);
          color: white;
          border-radius: 25px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
            background: var(--el-color-primary-dark-2);
          }
        }
      }
    }
  }
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  height: 220px;

  .destination-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

    .el-icon {
      font-size: 48px;
    }
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
    transform-style: preserve-3d;
    backface-visibility: hidden;

    .view-details {
      color: white;
      font-size: 16px;
      padding: 10px 24px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 25px;
      backdrop-filter: blur(8px);
      transform: translateY(20px) scale(0.9);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(0) scale(1.05);
      }
    }
  }

  .collection-wrapper {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    transition: opacity 0.3s ease;
  }

  .actions-wrapper {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 2;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }

  &:hover {
    .actions-wrapper {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

@keyframes rotate3D {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.destination-info {
  padding: 16px;
  background: #fff;
  border-radius: 0 0 12px 12px;

  .info-header {
    margin-bottom: 12px;

    .destination-name {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-color-primary-dark-2);
      margin: 0 0 8px 0;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-clamp: 2;
    }
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    :deep(.el-rate) {
      height: 20px;
      line-height: 20px;
    }
  }

  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .destination-tag {
      padding: 0 12px;
      height: 24px;
      line-height: 24px;
      border-radius: 12px;
      font-size: 12px;
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        background-color: var(--el-color-primary-light-8);
      }
    }
  }
}
</style> 