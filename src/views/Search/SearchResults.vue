<template>
  <div class="explore-container">
    <!-- 返回按钮和搜索栏 -->
    <div class="header-section">
      <el-button 
        class="back-button" 
        @click="router.push('/explore')" 
        link
      >
        <el-icon><ArrowLeft /></el-icon>
        返回探索
      </el-button>
    </div>

    <div class="search-results">
      <!-- 搜索信息区域 -->
      <div class="search-info">
        <div class="search-header">
        <h2>搜索结果</h2>
          <span class="search-count">共找到 {{ results.length }} 个目的地</span>
        </div>
        <div v-if="searchTags.length" class="tags-container">
          <span class="tags-label">搜索标签：</span>
          <el-tag
            v-for="tag in searchTags"
            :key="tag"
            class="search-tag"
            effect="light"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 结果展示区域 -->
      <div class="results-container">
        <div v-if="loading" class="loading-state">
          <el-icon class="icon-spin"><Loading /></el-icon>
          <span>正在搜索相关目的地...</span>
        </div>
        <div v-else-if="error" class="error-state">
          <el-icon class="error-icon"><CircleClose /></el-icon>
          <span>{{ error }}</span>
          <el-button type="primary" @click="fetchSearchResults" class="retry-btn">
            重新搜索
          </el-button>
        </div>
        <div v-else-if="!results.length" class="empty-state">
          <el-empty description="暂无相关目的地" />
          <el-button type="primary" @click="router.push('/explore')" class="back-btn">
            返回探索
          </el-button>
        </div>
        <div v-else class="results-grid">
          <div 
            v-for="destination in results" 
            :key="destination.id" 
            class="destination-card"
            @click="handleDestinationClick(destination)"
            @mouseenter="startRotation(destination.id)"
            @mouseleave="stopRotation(destination.id)"
          >
            <div class="card-inner" :class="{ 'is-rotating': rotatingCards[destination.id] }">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSearchResultsAPI } from '@/api/recommendApi';
import { ElMessage } from 'element-plus';
import { Loading, CircleClose, ArrowLeft, Picture } from '@element-plus/icons-vue';
import PersonalizedRecommendations from '../Explore/Personalization/PersonalizedRecommendations.vue';
import SearchBar from '@/components/Search/SearchBar.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref('');
const results = ref([]);
const searchTags = ref([]);

// 添加旋转状态管理
const rotatingCards = ref({});

const startRotation = (id) => {
  rotatingCards.value[id] = true;
};

const stopRotation = (id) => {
  rotatingCards.value[id] = false;
};

// 获取搜索结果
const fetchSearchResults = async () => {
  if (!searchTags.value.length) {
    console.log('No tags provided for search');
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  // console.log('Fetching search results with tags:', searchTags.value);
  
  try {
    const response = await getSearchResultsAPI({
      tags: searchTags.value,
      pageNum: 1,
      pageSize: 10
    });
    
    // console.log('Search API Response:', response);
    
    if (response.code === 0) {
      results.value = response.data.list || [];
      // console.log('Search results updated:', results.value);
    } else {
      throw new Error(response.message || '获取搜索结果失败');
    }
  } catch (err) {
    console.error('Search error:', err);
    error.value = err.message;
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// 处理目的地点击
const handleDestinationClick = (destination) => {
  // 这里可以添加目的地点击处理逻辑
  console.log('Destination clicked:', destination);
};

// 添加搜索处理函数
const handleSearch = ({ tags }) => {
  // console.log('Search triggered with tags:', tags);
  
  if (!tags || !tags.length) {
    console.log('No tags provided, showing warning');
    ElMessage.warning('请选择至少一个标签');
    return;
  }
  
  const formattedTags = Array.isArray(tags) ? tags.join(',') : tags;
  // console.log('Formatted tags for route:', formattedTags);
  
  router.push({
    name: 'searchResults',
    query: {
      tags: formattedTags
    },
    replace: true // 使用 replace 避免创建新的历史记录
  });
};

// 监听路由参数变化
watch(
  () => route.query,
  (newQuery) => {
    // console.log('Route query changed:', newQuery);
    searchTags.value = newQuery.tags ? newQuery.tags.split(',') : [];
    // console.log('Updated search tags:', searchTags.value);
    if (searchTags.value.length) {
      fetchSearchResults();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.explore-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20px;

  .header-section {
    max-width: 1200px;
    margin: 0 auto 20px;
    padding: 0 20px;

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      color: var(--el-color-primary);
      padding: 0;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.search-results {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  .search-info {
    padding: 24px 32px;
    border-bottom: 1px solid #eee;
    
    .search-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h2 {
        font-size: 28px;
      color: #333;
        font-weight: 600;
        margin: 0;
      }

      .search-count {
        color: #666;
        font-size: 16px;
      }
    }
    
    .tags-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      
      .tags-label {
      color: #666;
        font-size: 14px;
      }
      
      .search-tag {
        background-color: var(--el-color-primary-light-9);
        border: none;
        color: var(--el-color-primary);
        padding: 0 16px;
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        border-radius: 16px;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: var(--el-color-primary-light-8);
          transform: translateY(-1px);
        }
      }
    }
  }

  .results-container {
    padding: 32px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: #666;
    gap: 16px;
    text-align: center;

    .icon-spin {
      font-size: 32px;
      color: var(--el-color-primary);
    }

    .error-icon {
      font-size: 48px;
      color: var(--el-color-danger);
    }
  }

  .retry-btn,
  .back-btn {
    margin-top: 16px;
    min-width: 120px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
    padding: 20px;
    animation: fadeIn 0.3s ease;
  }

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
        }

        .destination-info {
          flex: 1;
          padding: 20px;
          background: #fff;
          border-radius: 0 0 12px 12px;
        }
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

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        45deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 45%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.1) 55%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }

    &.is-rotating::before {
      opacity: 1;
      animation: shine 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

@keyframes shine {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

// 响应式布局优化
@media (max-width: 1200px) {
  .search-results {
    .results-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: 992px) {
  .search-results {
    .results-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .search-info {
      padding: 20px;
      
      .search-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  }
}

@media (max-width: 576px) {
  .explore-container {
    padding: 12px;
  }
  
  .search-results {
    .results-grid {
      grid-template-columns: 1fr;
    }
    
    .results-container {
      padding: 16px;
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
</style> 