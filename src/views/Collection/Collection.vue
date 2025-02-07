<template>
  <div class="collection-container">
    <div class="collection-header">
      <h2>我的收藏</h2>
      <div class="filter-section">
        <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
          <el-option label="收藏时间 - 最新" value="time-desc" />
          <el-option label="收藏时间 - 最早" value="time-asc" />
          <el-option label="评分 - 从高到低" value="rating-desc" />
          <el-option label="评分 - 从低到高" value="rating-asc" />
        </el-select>
      </div>
    </div>

    <div v-if="collections.length" class="collections-grid">
      <DestinationCard
        v-for="item in collections"
        :key="item.id"
        :destination="{ ...item, isCollected: true }"
        @card-click="handleCardClick"
        @collection-change="handleCollectionChange"
      />
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无收藏的景点">
        <el-button type="primary" @click="goToExplore">去发现景点</el-button>
      </el-empty>
    </div>

    <el-dialog
      v-model="showDetailDialog"
      title="景点详情"
      width="60%"
      destroy-on-close
    >
      <destination-detail-dialog
        v-if="selectedDestination"
        :destination="selectedDestination"
        @close="showDetailDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import DestinationCard from '@/components/DestinationCard/DestinationCard.vue';
import DestinationDetailDialog from '@/views/Explore/popUp/DestinationDetailDialog.vue';

const router = useRouter();
const sortBy = ref('time-desc');
const showDetailDialog = ref(false);
const selectedDestination = ref(null);

// 模拟收藏数据
const collections = ref([
  {
    id: 1,
    name: '西湖',
    description: '西湖，位于浙江省杭州市西湖区龙井路1号，是中国大陆首个世界文化遗产湖泊...',
    imageUrl: '/path/to/image1.jpg',
    rating: 4.8,
    collectedAt: '2024-01-15T10:30:00',
    tags: ['文化遗产', '自然风光', '摄影胜地']
  },
  // 可以添加更多模拟数据
]);

const handleCardClick = (destination) => {
  selectedDestination.value = destination;
  showDetailDialog.value = true;
};

const goToExplore = () => {
  router.push('/explore');
};

const handleCollectionChange = ({ id, isCollected }) => {
  if (!isCollected) {
    collections.value = collections.value.filter(item => item.id !== id);
  }
};
</script>

<style lang="scss" scoped>
.collection-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }
  
  .sort-select {
    width: 180px;
  }
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

@media screen and (max-width: 768px) {
  .collection-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
}
</style> 