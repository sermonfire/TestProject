<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <el-icon class="search-icon">
        <Search />
      </el-icon>
      <div class="tags-container">
        <el-tag
          v-for="tag in selectedTags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          class="search-tag"
          effect="light"
        >
          {{ tag }}
        </el-tag>
        <el-autocomplete
          v-model="searchQuery"
          :fetch-suggestions="querySearchAsync"
          :trigger-on-focus="false"
          :placeholder="selectedTags.length ? '' : '搜索景点、景点标签...'"
          class="search-input"
          @select="handleSelect"
          @keydown.enter="handleSearchSubmit"
          :loading="loading"
        >
          <template #default="{ item }">
            <div class="suggestion-item">
              <div class="suggestion-content">
                <div class="suggestion-header">
                  <span class="suggestion-name">{{ item.name }}</span>
                  <div class="rating-info">
                    <el-rate 
                      v-model="item.rating" 
                      disabled 
                      size="small"
                      text-color="#ff9900"
                      show-score
                      score-template="{value}"
                    />
                  </div>
                </div>
                <div class="meta-info">
                  <span class="meta-item">
                    <el-icon><Timer /></el-icon>
                    {{ item.recommendedDuration }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Money /></el-icon>
                    ¥{{ item.averageBudget }}/天
                  </span>
                  <span class="meta-item">
                    <el-icon><Star /></el-icon>
                    人气值: {{ item.popularity }}
                  </span>
                </div>
                <div class="suggestion-tags">
                  <el-tag 
                    v-for="tag in item.tags.slice(0, 3)" 
                    :key="tag"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="best-time">
                  <el-icon><Calendar /></el-icon>
                  最佳游玩时间: {{ item.bestTravelTime }}
                </div>
              </div>
            </div>
          </template>
        </el-autocomplete>
      </div>
      <button 
        class="search-button" 
        @click="handleSearchSubmit"
        :disabled="isSearching || (!searchQuery && !selectedTags.length)"
      >
        <span class="button-text" v-if="!isSearching">搜索</span>
        <div class="loader" v-else>
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
      </button>
    </div>
    
    <div class="fullscreen-loader" v-if="isSearching">
      <div class="spinner">
        <div class="cube-wrapper">
          <div class="cube">
            <div class="sides">
              <div class="top"></div>
              <div class="right"></div>
              <div class="bottom"></div>
              <div class="left"></div>
              <div class="front"></div>
              <div class="back"></div>
            </div>
          </div>
        </div>
        <div class="loading-text">搜索中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Search, Picture, Loading, Timer, Money, Star, Calendar } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { searchDestinationsAPI } from '@/api/tripApi';
import debounce from 'lodash/debounce';

const router = useRouter();
const searchQuery = ref('');
const selectedTags = ref([]);
const isSearching = ref(false);
const loading = ref(false);

// 定义emit
const emit = defineEmits(['search', 'update:tags', 'select']);

// 异步搜索建议
const querySearchAsync = debounce(async (query, cb) => {
  if (query.length < 1) {
    cb([]);
    return;
  }
  
  loading.value = true;
  try {
    const res = await searchDestinationsAPI(query);
    if (res.code === 0 && res.data) {
      const suggestions = res.data.map(item => ({
        value: item.destination.name,
        id: item.destination.id,
        name: item.destination.name,
        rating: item.destination.rating,
        recommendedDuration: item.destination.recommendedDuration,
        averageBudget: item.destination.averageBudget,
        popularity: item.destination.popularity,
        tags: item.destination.tags,
        bestTravelTime: item.bestTravelTime
      }));
      cb(suggestions);
    } else {
      cb([]);
    }
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败,请重试');
    cb([]);
  } finally {
    loading.value = false;
  }
}, 300);

// 处理选择建议项
const handleSelect = (item) => {
  try {
    // 跳转到搜索结果页
    router.push({
      name: 'searchResults',
      query: {
        q: item.name // 使用目的地名称作为搜索关键词
      }
    });
    
    searchQuery.value = '';
    emit('select', item);
  } catch (error) {
    console.error('Navigation error:', error);
    ElMessage.error('页面跳转失败');
  }
};

// 移除标签
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag);
  emit('update:tags', selectedTags.value);
};

// 处理搜索提交
const handleSearchSubmit = () => {
  if (!selectedTags.value.length && !searchQuery.value) {
    ElMessage.warning('请输入搜索内容或选择标签');
    return;
  }

  isSearching.value = true;
  
  // 区分标签搜索和内容搜索
  const searchParams = {
    tags: selectedTags.value,
    query: searchQuery.value
  };

  emit('search', searchParams);
  
  // 更新路由时区分两种搜索类型的参数
  router.push({
    name: 'searchResults',
    query: {
      ...(selectedTags.value.length ? { tags: selectedTags.value.join(',') } : {}),
      ...(searchQuery.value ? { q: searchQuery.value } : {})
    }
  });

  // 清空搜索框
  searchQuery.value = '';

  setTimeout(() => {
    isSearching.value = false;
  }, 1000);
};

// 暴露方法给父组件
defineExpose({
  addTag: (tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag);
    }
  }
});
</script>

<style lang="scss" scoped>
.search-bar {
  background-color: #f5f5f5;
  padding: 16px 24px;
  border-radius: 12px;

  .search-input-wrapper {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    &:focus-within {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.1);
      transform: translateY(-1px);
    }

    .search-icon {
      color: var(--el-color-primary);
      font-size: 20px;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      flex: 1;
      min-height: 36px;
      padding: 4px 0;
    }

    .search-tag {
      background-color: var(--el-color-primary-light-9);
      border: none;
      color: var(--el-color-primary);
      padding: 0 12px;
      height: 32px;
      line-height: 32px;
      border-radius: 16px;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      :deep(.el-tag__close) {
        color: var(--el-color-primary);
        background: transparent;
        margin-left: 4px;
        
        &:hover {
          background-color: var(--el-color-primary);
          color: white;
          transform: rotate(90deg);
          transition: all 0.3s ease;
        }
      }
    }

    .search-input {
      flex: 1;
      min-width: 120px;
      
      :deep(.el-input__wrapper) {
        background-color: transparent;
        box-shadow: none !important;
        padding: 0 8px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &.is-focus {
          box-shadow: none !important;
          
          .el-input__inner {
            &::placeholder {
              transform: translateY(-2px);
              opacity: 0.7;
            }
          }
        }
        
        .el-input__inner {
          height: 40px;
          font-size: 15px;
          color: var(--el-text-color-primary);
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
          
          &::placeholder {
            color: var(--el-text-color-secondary);
            font-weight: 400;
            transform: translateY(0);
            transition: all 0.3s ease;
          }
          
          &:hover::placeholder {
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .search-button {
      min-width: 90px;
      height: 36px;
      border: none;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      color: white;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
        background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        background: var(--el-color-info-light-5);
      }

      .loader {
        display: flex;
        align-items: center;
        justify-content: center;
        
        .el-icon {
          font-size: 18px;
          animation: spin 1s linear infinite;
        }
      }
    }

    // 优化自动完成建议框样式
    :deep(.el-autocomplete-suggestion) {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(8px);
      background: rgba(255, 255, 255, 0.98);
      
      &.el-popper {
        margin-top: 8px;
        
        .el-popper__arrow {
          display: none;
        }
      }
      
      .el-scrollbar {
        .el-scrollbar__view {
          padding: 8px;
        }
        
        .el-scrollbar__bar {
          opacity: 0.6;
          
          &:hover {
            opacity: 1;
          }
        }
      }
      
      .suggestion-item {
        padding: 12px 16px;
        border-radius: 12px;
        transition: all 0.2s ease;
        margin: 4px 0;
        
        &:hover {
          background-color: rgba(var(--el-color-primary-rgb), 0.1);
          transform: translateX(4px);
        }
        
        .suggestion-content {
          .suggestion-header {
            margin-bottom: 10px;
            
            .suggestion-name {
              font-size: 16px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              transition: color 0.2s ease;
            }
            
            .rating-info {
              :deep(.el-rate__item) {
                margin-right: 4px;
              }
            }
          }
          
          .meta-info {
            .meta-item {
              background: rgba(var(--el-color-primary-rgb), 0.05);
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 13px;
              
              .el-icon {
                color: var(--el-color-primary);
              }
            }
          }
          
          .suggestion-tags {
            margin: 12px 0;
            
            .el-tag {
              margin: 0 4px 4px 0;
              border-radius: 6px;
              padding: 0 8px;
              height: 24px;
              line-height: 24px;
              background: rgba(var(--el-color-primary-rgb), 0.08);
              border-color: transparent;
              color: var(--el-color-primary);
              
              &:hover {
                background: rgba(var(--el-color-primary-rgb), 0.15);
              }
            }
          }
          
          .best-time {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            padding: 4px 8px;
            background: rgba(var(--el-color-success-rgb), 0.05);
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            
            .el-icon {
              color: var(--el-color-success);
              margin-right: 4px;
            }
          }
        }
      }
    }
  }

  .fullscreen-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(8px);
    perspective: 1000px;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, transparent 20%, rgba(0, 122, 255, 0.1) 20%, rgba(0, 122, 255, 0.1) 21%, transparent 21%);
      background-size: 20px 20px;
      animation: particleMove 20s linear infinite;
      opacity: 0.3;
    }

    .spinner {
      transform-style: preserve-3d;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(0, 122, 255, 0.2) 0%, transparent 70%);
        animation: glowPulse 2s ease-in-out infinite;
      }
    }

    .loading-text {
      color: #fff;
      font-size: 24px;
      font-weight: 500;
      margin-top: 40px;
      text-shadow: 0 0 10px rgba(0, 122, 255, 0.8);
      animation: textPulse 2s ease-in-out infinite;
    }
  }

  .cube-wrapper {
    width: 100px;
    height: 100px;
    position: relative;
    transform-style: preserve-3d;
    animation: spin 3s infinite linear;
    
    .cube {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      animation: innerSpin 8s infinite linear;
      
      .sides {
        position: absolute;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        
        div {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.9), rgba(0, 198, 255, 0.9));
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(0, 122, 255, 0.5);
          backface-visibility: visible;
          transform-style: preserve-3d;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.8) 45%, transparent 50%);
            animation: shine 3s infinite linear;
          }
        }
        
        .front  { transform: rotateY(0deg)   translateZ(50px); }
        .back   { transform: rotateY(180deg) translateZ(50px); }
        .right  { transform: rotateY(90deg)  translateZ(50px); }
        .left   { transform: rotateY(-90deg) translateZ(50px); }
        .top    { transform: rotateX(90deg)  translateZ(50px); }
        .bottom { transform: rotateX(-90deg) translateZ(50px); }
      }
    }
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    color: #909399;
  }
}

@keyframes spin {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(720deg) rotateY(720deg) rotateZ(720deg);
  }
}

@keyframes innerSpin {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(-360deg) rotateY(360deg) rotateZ(-360deg);
  }
}

@keyframes shine {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes glowPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes particleMove {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media screen and (max-width: 768px) {
  .cube-wrapper {
    width: 80px;
    height: 80px;
    
    .cube .sides div {
      &.front, &.back, &.right, &.left, &.top, &.bottom {
        transform: translateZ(40px);
      }
    }
  }
  
  .fullscreen-loader .loading-text {
    font-size: 20px;
  }
}
</style> 