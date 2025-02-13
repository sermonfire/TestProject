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
          :placeholder="selectedTags.length ? '' : '搜索目的地、景点、主题...'"
          class="search-input"
          @select="handleSelect"
          @keydown.enter="handleSearchSubmit"
          :loading="loading"
        >
          <template #default="{ item }">
            <div class="suggestion-item">
              <el-image 
                :src="item.imageUrl" 
                class="suggestion-image"
                fit="cover"
                :preview-src-list="[item.imageUrl]">
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="suggestion-content">
                <div class="suggestion-name">{{ item.name }}</div>
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
                <div class="suggestion-description">{{ item.description }}</div>
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
import { Search, Picture, Loading } from '@element-plus/icons-vue';
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
        ...item.destination,
        detail: item
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
  if (item.tags) {
    // 添加目的地相关标签
    item.tags.forEach(tag => {
      if (!selectedTags.value.includes(tag)) {
        selectedTags.value.push(tag);
      }
    });
  }
  searchQuery.value = '';
  emit('select', item);
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
  const searchParams = {
    tags: selectedTags.value,
    query: searchQuery.value
  };

  emit('search', searchParams);
  
  // 更新路由
  router.push({
    name: 'searchResults',
    query: {
      tags: selectedTags.value.join(','),
      q: searchQuery.value
    }
  });

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
  padding: 12px 20px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .search-input-wrapper {
    background-color: #ffffff;
    border-radius: 25px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover, &:focus-within {
      background-color: #fff;
      border-color: var(--el-color-primary);
      box-shadow: 0 0 10px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .search-icon {
      color: var(--el-color-primary);
      font-size: 24px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      flex: 1;
      min-height: 32px;
    }

    .search-tag {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      padding: 0 8px;
      height: 28px;
      line-height: 26px;
      border-radius: 4px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.1);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      :deep(.el-tag__close) {
        color: var(--el-color-primary);
        
        &:hover {
          background-color: var(--el-color-primary);
          color: white;
        }
      }
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      outline: none;
      color: #333;
      min-width: 100px;
      height: 32px;
      padding: 0 8px;
      transition: all 0.3s ease;

      &::placeholder {
        color: #999;
        font-weight: 300;
        transition: opacity 0.3s ease;
      }

      &:focus::placeholder {
        opacity: 0.5;
      }
    }

    .search-button {
      min-width: 80px;
      height: 40px;
      border: none;
      border-radius: 20px;
      background: linear-gradient(135deg, #007AFF, #00C6FF);
      color: white;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
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

  .suggestion-item {
    display: flex;
    padding: 8px;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
    }

    .suggestion-image {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      margin-right: 12px;
    }

    .suggestion-content {
      flex: 1;

      .suggestion-name {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .suggestion-tags {
        display: flex;
        gap: 4px;
        margin-bottom: 4px;

        .el-tag {
          font-size: 12px;
        }
      }

      .suggestion-description {
        font-size: 12px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
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