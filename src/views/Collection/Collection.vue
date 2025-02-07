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
      <div v-for="item in collections" :key="item.id" class="collection-card">
        <div class="card-image">
          <img :src="item.imageUrl" :alt="item.name" />
          <div class="card-overlay">
            <el-button type="danger" size="small" @click="removeFromCollection(item.id)">
              <el-icon><Delete /></el-icon>
              取消收藏
            </el-button>
          </div>
        </div>
        <div class="card-content">
          <h3>{{ item.name }}</h3>
          <div class="card-info">
            <el-rate v-model="item.rating" disabled show-score text-color="#ff9900" />
            <span class="collection-time">收藏于 {{ formatDate(item.collectedAt) }}</span>
          </div>
          <p class="description">{{ item.description }}</p>
          <div class="card-tags">
            <el-tag v-for="tag in item.tags" :key="tag" size="small">{{ tag }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无收藏的景点">
        <el-button type="primary" @click="goToExplore">去发现景点</el-button>
      </el-empty>
    </div>

    <el-dialog
      v-model="showConfirmDialog"
      title="确认取消收藏"
      width="30%"
      center
    >
      <span>确定要取消收藏该景点吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConfirmDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmRemove">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue';

const router = useRouter();
const sortBy = ref('time-desc');
const showConfirmDialog = ref(false);
const selectedItemId = ref(null);

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

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const removeFromCollection = (id) => {
  selectedItemId.value = id;
  showConfirmDialog.value = true;
};

const confirmRemove = () => {
  collections.value = collections.value.filter(item => item.id !== selectedItemId.value);
  showConfirmDialog.value = false;
  ElMessage.success('已取消收藏');
};

const goToExplore = () => {
  router.push('/explore');
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

.collection-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    
    .card-overlay {
      opacity: 1;
    }
  }
  
  .card-image {
    position: relative;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
  
  .card-content {
    padding: 16px;
    
    h3 {
      margin: 0 0 12px;
      font-size: 18px;
      color: #333;
    }
    
    .card-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .collection-time {
        font-size: 12px;
        color: #999;
      }
    }
    
    .description {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .el-tag {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }
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