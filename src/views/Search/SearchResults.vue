<template>
  <div class="explore-container">
    <SearchBar ref="searchBarRef" :initial-tags="searchTags" @search="handleSearch" />
    <div class="search-results">
      <div class="search-info">
        <h2>搜索结果</h2>
        <p v-if="searchTags.length">标签: {{ searchTags.join(', ') }}</p>
      </div>

      <div class="results-container">
        <div v-if="loading" class="loading-state">
          <el-icon class="icon-spin"><Loading /></el-icon>
          <span>搜索中...</span>
        </div>
        <div v-else-if="error" class="error-state">
          <el-icon><CircleClose /></el-icon>
          <span>{{ error }}</span>
          <el-button @click="fetchSearchResults" class="retry-btn">重试</el-button>
        </div>
        <div v-else-if="!results.length" class="empty-state">
          <span>暂无搜索结果</span>
        </div>
        <div v-else class="results-grid">
          <PersonalizedRecommendations 
            :recommendations="results"
            @destination-click="handleDestinationClick"
          />
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
import { Loading, CircleClose } from '@element-plus/icons-vue';
import PersonalizedRecommendations from '../Explore/Personalization/PersonalizedRecommendations.vue';
import SearchBar from '@/components/Search/SearchBar.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref('');
const results = ref([]);
const searchTags = ref([]);

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
  padding-bottom: 50px;
}

.search-results {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .search-info {
    margin-bottom: 20px;
    
    h2 {
      margin-bottom: 10px;
      font-size: 24px;
      color: #333;
    }
    
    p {
      color: #666;
      margin: 5px 0;
    }
  }

  .results-container {
    min-height: 200px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #666;
    gap: 12px;
  }

  .icon-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .retry-btn {
    margin-top: 12px;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px 0;
  }
}
</style> 