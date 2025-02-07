<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">{{ destination?.name }}</h2>
          <div class="header-actions">
            <CollectionButton
              :item-id="destination?.id"
              :initial-state="destination?.isCollected"
              class="detail-collection-btn"
            />
            <button class="close-button" @click="handleClose">×</button>
          </div>
        </div>
        
        <div class="detail-content">
          <div class="image-container">
            <el-image 
              :src="destination?.imageUrl" 
              :alt="destination?.name + ' 景区图片'"
              class="detail-image"
              fit="cover"
            >
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                  <span>加载中...</span>
                </div>
              </template>
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                  <!-- <span>图片加载失败</span> -->
                </div>
              </template>
            </el-image>
          </div>

          <div class="detail-info-section">
            <div class="detail-meta">
              <div class="meta-item">
                <el-icon class="icon">
                  <Star />
                </el-icon>
                <span>{{ destination?.rating }} 分</span>
              </div>
              <div class="meta-item">
                <el-icon class="icon">
                  <Calendar />
                </el-icon>
                <span>建议游玩 {{ destination?.recommendedDuration }}</span>
              </div>
              <div class="meta-item">
                <el-icon class="icon">
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
                @click="handleTagClick(tag)"
                :class="{ 'tag-clicked': clickedTags[index] }"
              >
                <el-icon class="tag-icon"><Plus /></el-icon>
                <span class="tag-text">{{ tag }}</span>
              </span>
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
import { 
  Picture, 
  Loading, 
  Plus, 
  Star,
  Calendar,
  Wallet
} from '@element-plus/icons-vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';

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
  border-radius: 12px;
  width: 35%;
  max-width: 800px;
  max-height: 90vh;
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  animation: dialog-fade-in 0.3s ease-out;
}

@keyframes dialog-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #fff, #f8f9fa);
}

.dialog-title {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(45deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-collection-btn {
  :deep(.el-button) {
    // background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover {
      // background-color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &.is-collected {
      background-color: #f56c6c;
      box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
      
      &:hover {
        background-color: #e64242;
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.5);
      }
    }
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    color: #f56c6c;
    background-color: rgba(245, 108, 108, 0.1);
    transform: rotate(90deg);
  }
}

.detail-content {
  max-height: calc(90vh - 60px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
    
    &:hover {
      background: #c0c4cc;
    }
  }
  
  &::-webkit-scrollbar-track {
    background: #f5f7fa;
  }
}

.image-container {
  position: relative;
  width: 100%;
  height: 280px;
  background: #f5f5f5;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.2),
      transparent 50%,
      rgba(0, 0, 0, 0.1)
    );
    pointer-events: none;
  }
  
  .detail-image {
    width: 100%;
    height: 100%;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: scale(1.05);
      filter: brightness(1.05);
    }
  }
  
  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    color: #909399;
    
    .el-icon {
      font-size: 32px;
      margin-bottom: 8px;
      
      &.is-loading {
        animation: rotating 2s linear infinite;
      }
    }
    
    span {
      font-size: 14px;
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}

.detail-info-section {
  padding: 24px;
  background: linear-gradient(to bottom, #fff, #f8f9fa);

  .detail-meta {
    display: flex;
    justify-content: space-between;
    background: linear-gradient(45deg, #f8f9fa, #fff);
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c3e50;
      font-weight: 500;
      
      .icon {
        font-size: 20px;
        color: var(--el-color-primary);
        -webkit-background-clip: initial;
        background-clip: initial;
        
        &.is-loading {
          animation: rotating 2s linear infinite;
        }
      }
    }
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: #f5f5f5;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      color: #666;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      user-select: none;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: var(--el-color-primary);
        border-radius: inherit;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.1;
        transition: transform 0.3s ease;
      }
      
      .tag-icon {
        font-size: 12px;
        transition: transform 0.3s ease;
        color: #909399;
      }
      
      .tag-text {
        position: relative;
        z-index: 1;
      }
      
      &:hover {
        background-color: #fff;
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
        
        &::before {
          transform: translate(-50%, -50%) scale(1);
        }
        
        .tag-icon {
          transform: rotate(180deg);
          color: var(--el-color-primary);
        }
      }
      
      &:active {
        transform: translateY(0) scale(0.95);
      }
      
      &.tag-clicked {
        animation: tag-pulse 0.5s ease;
        background-color: var(--el-color-primary);
        color: white;
        border-color: transparent;
        transform: scale(0.95);
        pointer-events: none;
        
        .tag-icon {
          transform: rotate(180deg) scale(0);
          opacity: 0;
        }
        
        &::before {
          display: none;
        }
      }
    }
  }

  @keyframes tag-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
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
      background: var(--el-color-primary);
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
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      
      .similar-image {
        transform: scale(1.05);
      }
    }
    
    .similar-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      transition: transform 0.3s ease;
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

.collection-message {
  background: linear-gradient(45deg, #f56c6c, #e64242) !important;
  border: none !important;
  color: white !important;
  padding: 12px 24px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3) !important;
  
  .el-message__content {
    color: white !important;
    font-weight: 500 !important;
  }
}
</style> 