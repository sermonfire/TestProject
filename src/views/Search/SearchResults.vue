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
        <div class="search-type-info">
          <template v-if="searchTags.length">
            <div class="tags-container">
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
          </template>
          <template v-if="searchQuery">
            <div class="query-container">
              <span class="query-label">搜索内容：</span>
              <span class="query-text">"{{ searchQuery }}"</span>
            </div>
          </template>
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
          <DestinationCard
            v-for="item in results"
            :key="item.id"
            :destination="item.destination || item"
            @card-click="handleDestinationClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSearchResultsAPI } from '@/api/recommendApi';
import { searchDestinationsAPI } from '@/api/tripApi';
import { ElMessage } from 'element-plus';
import { Loading, CircleClose, ArrowLeft } from '@element-plus/icons-vue';
import DestinationCard from '@/components/DestinationCard/DestinationCard.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref('');
const results = ref([]);
const searchTags = ref([]);
const searchQuery = ref('');

/**
 * 获取搜索结果
 * @description 根据不同的搜索类型(标签/内容)调用不同的API
 */
const fetchSearchResults = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    let response;
    
    // 根据搜索类型调用不同API
    if (searchTags.value.length) {
      response = await getSearchResultsAPI({
        tags: searchTags.value,
        pageNum: 1,
        pageSize: 10
      });
    } else if (searchQuery.value) {
      response = await searchDestinationsAPI(searchQuery.value);
    } else {
      throw new Error('请输入搜索内容或选择标签');
    }
    
    if (response.code === 0) {
      if (searchTags.value.length) {
        // 标签搜索返回的数据中目的地信息在 destination 字段
        results.value = response.data.list;
      } else {
        // 内容搜索直接返回目的地数组，需要转换格式
        results.value = response.data.map(item => ({
          id: item.id,
          destination: item.destination
        }));
      }
      
      // 检查数据有效性
      if (!results.value.length) {
        error.value = '未找到相关目的地';
      } else if (!results.value.some(item => item.destination || item)) {
        error.value = '目的地数据格式错误';
        console.error('Invalid destination data:', results.value);
      }
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
  router.push({
    name: 'destinationDetail',
    params: { id: destination.id }
  });
};

// 监听路由参数变化
watch(
  () => route.query,
  (newQuery) => {
    searchTags.value = newQuery.tags ? newQuery.tags.split(',') : [];
    searchQuery.value = newQuery.q || '';
    
    if (searchTags.value.length || searchQuery.value) {
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
  padding: 20px;

  :deep(.breadcrumb) {
    margin-bottom: 20px;
  }

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
    
    .search-type-info {
      margin-top: 12px;
      
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
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

.search-type-info {
  margin-top: 12px;
  
  .query-container {
    display: flex;
    align-items: center;
    margin-top: 8px;
    
    .query-label {
      color: #666;
      font-size: 14px;
      margin-right: 8px;
    }
    
    .query-text {
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
}
</style> 