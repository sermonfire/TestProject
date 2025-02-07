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
        </div>
        <div class="destination-info">
          <h3>{{ destination.name }}</h3>
          <div class="rating-row">
            <el-rate 
              v-model="destination.rating" 
              disabled 
              show-score 
              text-color="#ff9900"
              score-template="{value}"
            />
          </div>
          <div class="tags">
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
          <h3>{{ destination.name }}</h3>
          <p class="description">{{ destination.description || '暂无描述' }}</p>
          <div class="action-btn">了解更多</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Picture } from '@element-plus/icons-vue';

const props = defineProps({
  destination: {
    type: Object,
    required: true
  }
});

defineEmits(['cardClick']);

const isRotating = ref(false);

const startRotation = () => {
  isRotating.value = true;
};

const stopRotation = () => {
  isRotating.value = false;
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

        h3 {
          font-size: 24px;
          color: var(--el-color-primary);
          margin-bottom: 20px;
        }

        .description {
          flex: 1;
          color: #666;
          margin: 20px 0;
          font-size: 16px;
          line-height: 1.6;
          overflow-y: auto;
          padding: 0 10px;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
        }

        .action-btn {
          margin-top: 20px;
          padding: 12px 30px;
          background: var(--el-color-primary);
          color: white;
          border-radius: 25px;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
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
</style> 