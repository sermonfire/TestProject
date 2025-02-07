<template>
  <div class="search-results">
    <div class="search-info">
      <h2>搜索结果</h2>
      <div class="search-tags" v-if="searchTags.length">
        <el-tag v-for="tag in searchTags" :key="tag">{{ tag }}</el-tag>
      </div>
    </div>
    
    <PersonalizedRecommendations 
      :recommendations="searchResults"
      @destination-click="handleDestinationClick"
    />
    
    <el-empty 
      v-if="!searchResults.length" 
      description="暂无相关推荐"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSearchResultsAPI } from '@/api/recommendApi';
import PersonalizedRecommendations from '../Personalization/PersonalizedRecommendations.vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const searchResults = ref([]);
const searchTags = ref([]);
const isLoading = ref(false);

// 获取搜索结果
const fetchSearchResults = async () => {
  try {
    isLoading.value = true;
    const query = route.query.q;
    const tags = route.query.tags ? route.query.tags.split(',') : [];
    searchTags.value = tags;
    
    const response = await getSearchResultsAPI({
      query,
      tags,
      pageNum: 1,
      pageSize: 10
    });
    
    if (response.code === 0) {
      searchResults.value = response.data.list || [];
    } else {
      ElMessage.error(response.message || '获取搜索结果失败');
    }
  } catch (error) {
    console.error('Search error:', error);
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 处理目的地点击
const handleDestinationClick = (destination) => {
  // 处理目的地点击逻辑
};

// 监听路由参数变化
watch(
  () => route.query,
  () => {
    fetchSearchResults();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.search-results {
  padding: 20px;
  
  .search-info {
    margin-bottom: 24px;
    
    h2 {
      margin-bottom: 16px;
      font-size: 24px;
      color: #333;
    }
    
    .search-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
}
</style> 