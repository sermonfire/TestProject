<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">{{ destination?.name }}</h2>
          <button class="close-button" @click="handleClose">×</button>
        </div>
        
        <div class="detail-content">
          <div class="image-container">
            <img 
              :src="destination?.imageUrl" 
              :alt="destination?.name + ' 景区图片'"
              class="detail-image"
              :class="{ loading: isLoading }"
              @load="handleImageLoad"
              @error="handleImageError"
            />
            <div v-if="isLoading" class="loading-placeholder">
              图片加载中...
            </div>
          </div>

          <div class="detail-info-section">
            <div class="detail-meta">
              <div class="meta-item">
                <span class="icon">⭐</span>
                <span>{{ destination?.rating }} 分</span>
              </div>
              <div class="meta-item">
                <span class="icon">📅</span>
                <span>建议游玩 {{ destination?.recommendedDuration }}</span>
              </div>
              <div class="meta-item">
                <span class="icon">💰</span>
                <span>人均 ¥{{ destination?.averageBudget }}/天</span>
              </div>
            </div>

            <div class="detail-tags">
              <span 
                v-for="(tag, index) in destination?.tags" 
                :key="index" 
                class="tag"
                @click="handleTagClick(tag)"
                :class="{ 'tag-clicked': clickedTags[index] }"
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

          <div v-if="similarDestinations.length" class="similar-destinations">
            <div class="section-header">
              <span class="section-title">相似推荐</span>
              <span class="section-subtitle">你可能也会喜欢</span>
            </div>
            <div class="similar-container">
              <div 
                class="similar-grid" 
                ref="scrollContainer"
                @mousedown="startDrag"
                @mousemove="onDrag"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
                @scroll="handleScroll"
              >
                <div 
                  v-for="dest in similarDestinations" 
                  :key="dest.id" 
                  class="similar-item"
                  @click="handleSimilarClick(dest)"
                >
                  <div class="image-container">
                    <img 
                      :src="dest.imageUrl" 
                      :alt="dest.name + ' 缩略图'"
                      class="similar-image"
                      :class="{ loading: isLoadingMap[dest.id] }"
                      @load="handleSimilarImageLoad(dest.id)"
                      @error="handleSimilarImageError(dest.id)"
                    />
                    <div v-if="isLoadingMap[dest.id]" class="loading-placeholder">
                      加载中...
                    </div>
                  </div>
                  <div class="similar-info">
                    <span class="similar-name">{{ dest.name }}</span>
                    <div class="similar-meta">
                      <span class="similar-rating">{{ dest.rating }}分</span>
                      <span class="similar-price">¥{{ dest.averageBudget }}/天</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

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

const router = useRouter();
const emit = defineEmits(['update:modelValue', 'close', 'similar-click', 'tag-click']);

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleOverlayClick = () => {
  handleClose();
};

// 处理ESC键关闭对话框
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// 滚动相关逻辑
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);
const scrollContainer = ref(null);
const hasMoved = ref(false);
const velocity = ref(0);
const lastX = ref(0);
const lastTime = ref(0);
let animationFrame = null;

const startDrag = (e) => {
  isDragging.value = true;
  hasMoved.value = false;
  startX.value = lastX.value = e.pageX;
  lastTime.value = Date.now();
  scrollLeft.value = scrollContainer.value.scrollLeft;
  scrollContainer.value.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  
  const currentX = e.pageX;
  const currentTime = Date.now();
  const deltaX = currentX - lastX.value;
  const deltaTime = currentTime - lastTime.value;
  
  if (deltaTime > 0) {
    velocity.value = deltaX / deltaTime;
  }
  
  if (Math.abs(currentX - startX.value) > 5) {
    hasMoved.value = true;
  }
  
  const newScrollLeft = scrollLeft.value - (currentX - startX.value);
  scrollContainer.value.scrollLeft = newScrollLeft;
  
  lastX.value = currentX;
  lastTime.value = currentTime;
};

const stopDrag = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  scrollContainer.value.style.cursor = 'grab';
  document.body.style.userSelect = '';
  
  if (Math.abs(velocity.value) > 0.1) {
    const startVelocity = velocity.value * 100;
    const startTime = Date.now();
    const friction = 0.95;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentVelocity = startVelocity * Math.pow(friction, elapsed / 16);
      
      if (Math.abs(currentVelocity) > 0.1) {
        scrollContainer.value.scrollLeft -= currentVelocity;
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  velocity.value = 0;
};

const handleScroll = () => {
  if (!scrollContainer.value) return;
  
  const container = scrollContainer.value;
  const maxScroll = container.scrollWidth - container.clientWidth;
  
  if (container.scrollLeft < 0) {
    container.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
  } else if (container.scrollLeft > maxScroll) {
    container.scrollTo({
      left: maxScroll,
      behavior: 'smooth'
    });
  }
};

const handleSimilarClick = (destination) => {
  if (!hasMoved.value) {
    const detailContent = document.querySelector('.detail-content');
    detailContent?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    emit('similar-click', destination);
  }
};

// 在组件卸载时清理
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

// 监听对话框打开状态，处理body滚动
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// 添加图片加载状态管理
const isLoading = ref(true);
const isLoadingMap = ref({});
const hasError = ref(false);

const handleImageLoad = () => {
  isLoading.value = false;
};

const handleImageError = () => {
  isLoading.value = false;
  hasError.value = true;
};

const handleSimilarImageLoad = (id) => {
  isLoadingMap.value[id] = false;
};

const handleSimilarImageError = (id) => {
  isLoadingMap.value[id] = false;
};

// 监听相似推荐列表变化，初始化加载状态
watch(() => props.similarDestinations, (newVal) => {
  const loadingState = {};
  newVal.forEach(dest => {
    loadingState[dest.id] = true;
  });
  isLoadingMap.value = loadingState;
}, { immediate: true });

// 处理标签点击
const clickedTags = ref({});

const handleTagClick = (tag) => {
  emit('tag-click', tag);
  // 找到被点击的标签索引
  const index = props.destination?.tags.findIndex(t => t === tag);
  if (index !== -1) {
    clickedTags.value[index] = true;
    // 显示提示消息
    ElMessage({
      message: `已将"${tag}"添加到搜索栏`,
      type: 'success',
      duration: 2000,
      // 自定义样式
      customClass: 'tag-added-message',
      offset: 60
    });
    // 1秒后重置点击状态
    setTimeout(() => {
      clickedTags.value[index] = false;
    }, 1000);
  }
};
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  width: 35%;
  max-width: 800px;
  max-height: 90vh;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.dialog-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
}

.close-button {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #333;
  }
}

.detail-content {
  max-height: calc(90vh - 60px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 0;
    display: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.detail-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
  background: #f5f5f5;
  position: relative;
  
  &.loading {
    animation: pulse 1.5s infinite;
  }
  
  &.error {
    background: #fafafa;
    &::after {
      content: '图片加载失败';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #999;
      font-size: 14px;
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
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
      background-color: #f5f5f5;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      color: #666;
      margin: 4px;
      display: inline-block;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
      }
      
      &.tag-clicked {
        background-color: var(--el-color-primary);
        color: white;
        transform: scale(0.95);
        pointer-events: none;
      }
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
    user-select: text;
    cursor: text;
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

  .similar-container {
    overflow: hidden;
    
    .similar-grid {
      display: flex;
      gap: 16px;
      padding: 4px;
      cursor: grab;
      user-select: none;
      overflow-x: auto;
      
      &::-webkit-scrollbar {
        display: none;
      }
      
      -ms-overflow-style: none;
      scrollbar-width: none;
      
      scroll-behavior: auto;
      -webkit-overflow-scrolling: touch;
      
      &:active {
        cursor: grabbing;
        will-change: scroll-position;
      }
    }
  }
  
  .similar-item {
    flex: 0 0 160px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      .similar-info {
        background: #e6e8eb;
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 120px;
      overflow: hidden;

      .similar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
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

.image-container {
  position: relative;
  width: 100%;
  height: 240px;
  background: #f5f5f5;
  overflow: hidden;
  
  .loading-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;
    font-size: 14px;
  }
}
</style>

<style>
/* 全局样式 - 自定义 ElMessage 样式 */
.tag-added-message {
  background: rgba(var(--el-color-success-rgb), 0.9) !important;
  border-width: 0 !important;
  color: white !important;
  padding: 12px 24px !important;
  min-width: 240px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  backdrop-filter: blur(8px) !important;
  
  .el-message__content {
    color: white !important;
    font-size: 14px !important;
    font-weight: 500 !important;
  }
  
  .el-message__icon {
    color: white !important;
    font-size: 18px !important;
    margin-right: 10px !important;
  }
}
</style> 