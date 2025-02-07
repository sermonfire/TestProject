<template>
  <div class="search-results">
    <div class="search-info">
      <h2>搜索结果</h2>
      <p v-if="searchQuery">搜索关键词: {{ searchQuery }}</p>
      <p v-if="searchTags.length">标签: {{ searchTags.join(', ') }}</p>
    </div>

    <div class="results-container">
      <!-- 这里添加搜索结果展示逻辑 -->
      <p v-if="loading">加载中...</p>
      <p v-else-if="error">{{ error }}</p>
      <p v-else-if="!results.length">暂无搜索结果</p>
      <div v-else class="results-grid">
        <!-- 搜索结果列表 -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSearchResultsAPI } from '@/api/recommendApi';
import { ElMessage } from 'element-plus';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const results = ref([]);

const searchQuery = ref('');
const searchTags = ref([]);

// 获取搜索结果
const fetchSearchResults = async () => {
  if (!searchQuery.value && !searchTags.value.length) {
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await getSearchResultsAPI({
      query: searchQuery.value,
      tags: searchTags.value,
      pageNum: 1,
      pageSize: 10
    });
    
    if (response.code === 0) {
      results.value = response.data.list || [];
    } else {
      throw new Error(response.message || '获取搜索结果失败');
    }
  } catch (err) {
    error.value = err.message;
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// 监听路由参数变化
watch(
  () => route.query,
  (newQuery) => {
    searchQuery.value = newQuery.q || '';
    searchTags.value = newQuery.tags ? newQuery.tags.split(',') : [];
    fetchSearchResults();
  },
  { immediate: true }
);

onMounted(() => {
  if (route.query.q || route.query.tags) {
    fetchSearchResults();
  }
});
</script>

<style lang="scss" scoped>
.search-results {
  padding: 20px;

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

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px 0;
  }
}
</style> 