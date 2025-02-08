<template>
  <div class="destination-detail">
    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template v-else>
      <div class="detail-header">
        <el-image :src="destinationData?.destination?.imageUrl" fit="cover">
          <template #error>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        
        <div class="header-content">
          <h1>{{ destinationData?.destination?.name }}</h1>
          <div class="rating-row">
            <el-rate 
              :model-value="destinationData?.destination?.rating || 0"
              disabled 
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </div>
          <div class="tags">
            <el-tag 
              v-for="tag in destinationData?.destination?.tags" 
              :key="tag"
              effect="plain"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <el-tabs>
          <el-tab-pane label="概览">
            <div class="overview-section">
              <h3>目的地介绍</h3>
              <p>{{ destinationData?.content || '暂无介绍' }}</p>
              
              <h3>最佳旅行时间</h3>
              <p>{{ destinationData?.bestTravelTime || '暂无信息' }}</p>
              
              <h3>气候信息</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item v-for="(desc, season) in destinationData?.climateInfo || {}"
                  :key="season" :label="season">
                  {{ desc }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>

          <el-tab-pane label="景点">
            <div class="attractions-section">
              <el-card v-for="attraction in destinationData?.attractions || []"
                :key="attraction.name" class="attraction-card">
                <template #header>
                  <h4>{{ attraction.name }}</h4>
                </template>
                <el-carousel v-if="attraction.images?.length" height="200px">
                  <el-carousel-item v-for="img in attraction.images" :key="img">
                    <el-image :src="img" fit="cover" />
                  </el-carousel-item>
                </el-carousel>
                <p>{{ attraction.description || '暂无描述' }}</p>
              </el-card>
            </div>
          </el-tab-pane>

          <el-tab-pane label="交通住宿">
            <div class="info-section">
              <h3>交通信息</h3>
              <p>{{ destinationData?.trafficInfo || '暂无交通信息' }}</p>
              
              <h3>住宿信息</h3>
              <p>{{ destinationData?.accommodationInfo || '暂无住宿信息' }}</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="美食购物">
            <div class="info-section">
              <h3>美食信息</h3>
              <p>{{ destinationData?.foodInfo || '暂无美食信息' }}</p>
              
              <h3>购物信息</h3>
              <p>{{ destinationData?.shoppingInfo || '暂无购物信息' }}</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="旅行贴士">
            <div class="tips-section">
              <h3>旅行建议</h3>
              <p>{{ destinationData?.travelTips || '暂无旅行建议' }}</p>
              
              <h3>当地风俗</h3>
              <p>{{ destinationData?.localCustoms || '暂无风俗信息' }}</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { getDestinationDetailAPI } from '@/api/recommendApi'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const destinationData = ref(null)
const loading = ref(true)

const loadDestinationDetail = async () => {
  try {
    const destinationId = route.params.id
    if (!destinationId) {
      ElMessage.error('目的地ID不能为空')
      router.push('/')
      return
    }

    const res = await getDestinationDetailAPI(destinationId)
    if (res.code === 0) {
      destinationData.value = res.data
    } else {
      ElMessage.error(res.message || '获取目的地详情失败')
    }
  } catch (error) {
    console.error('Failed to load destination detail:', error)
    ElMessage.error('获取目的地详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDestinationDetail()
})
</script>

<style lang="scss" scoped>
.destination-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .loading-wrapper {
    padding: 40px;
  }

  .detail-header {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;
    
    .el-image {
      width: 100%;
      height: 400px;
      
      .image-placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        
        .el-icon {
          font-size: 48px;
          color: #999;
        }
      }
    }

    .header-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      color: white;

      h1 {
        margin: 0 0 12px;
        font-size: 32px;
      }

      .rating-row {
        margin-bottom: 12px;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag-item {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
        }
      }
    }
  }

  .detail-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }

    h3 {
      color: var(--el-color-primary);
      margin: 24px 0 16px;
      font-size: 20px;
      
      &:first-child {
        margin-top: 0;
      }
    }

    p {
      color: #666;
      line-height: 1.8;
      margin: 0 0 16px;
    }

    .attractions-section {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;

      .attraction-card {
        .el-carousel {
          margin-bottom: 16px;
        }

        h4 {
          margin: 0;
          color: var(--el-color-primary);
        }
      }
    }

    .info-section, .tips-section {
      max-width: 800px;
      margin: 0 auto;
    }
  }
}
</style> 