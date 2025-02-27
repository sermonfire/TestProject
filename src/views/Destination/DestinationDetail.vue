<template>
    <div class="destination-detail">
        <template v-if="loading">
            <div class="loading-wrapper glass-card">
                <el-skeleton :rows="10" animated />
            </div>
        </template>

        <template v-else>
            <div class="detail-header glass-card">
                <div class="nav-actions" @click="handleBack">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                    返回上页
                </div>

                <div class="cover-image">
                    <el-image :src="destinationData?.destination?.imageUrl" fit="cover">
                        <template #error>
                            <div class="image-placeholder">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                            </div>
                        </template>
                    </el-image>

                    <div class="header-content glass-effect">
                        <h1 class="title">{{ destinationData?.destination?.name }}</h1>
                        <div class="rating-row">
                            <el-rate :model-value="destinationData?.destination?.rating || 0" disabled show-score
                                text-color="#ff9900" score-template="{value}" />
                        </div>
                        <div class="tags">
                            <el-tag v-for="tag in destinationData?.destination?.tags" :key="tag" effect="plain"
                                class="tag-item glass-tag">
                                {{ tag }}
                            </el-tag>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-content glass-card">
                <el-tabs class="custom-tabs">
                    <el-tab-pane label="概览">
                        <div class="overview-section content-card">
                            <div v-if="locationInfo" class="info-block location-info">
                                <h3>地理位置</h3>
                                <el-descriptions :column="1" border>
                                    <el-descriptions-item label="所在地区">
                                        {{ locationInfo.province }} {{ locationInfo.city }}
                                    </el-descriptions-item>
                                    <el-descriptions-item label="行政区划">
                                        {{ locationInfo.cityInfo.shortName }}（{{ locationInfo.cityCode }}）
                                    </el-descriptions-item>
                                </el-descriptions>
                            </div>

                            <WeatherCard v-if="locationInfo?.city" :city="locationInfo.cityInfo.shortName"
                                class="weather-card" />

                            <div class="info-block">
                                <h3>目的地介绍</h3>
                                <p>{{ destinationData?.content || '暂无介绍' }}</p>
                            </div>

                            <div class="info-block">
                                <h3>最佳旅行时间</h3>
                                <p>{{ destinationData?.bestTravelTime || '暂无信息' }}</p>
                            </div>

                            <div class="info-block">
                                <h3>气候信息</h3>
                                <el-descriptions :column="2" border class="custom-descriptions">
                                    <el-descriptions-item v-for="(desc, season) in destinationData?.climateInfo || {}"
                                        :key="season" :label="season">
                                        {{ desc }}
                                    </el-descriptions-item>
                                </el-descriptions>
                            </div>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="景点">
                        <div class="attractions-section">
                            <el-card v-for="attraction in destinationData?.attractions || []" :key="attraction.name"
                                class="attraction-card glass-card" :body-style="{ padding: '0px' }">
                                <el-carousel v-if="attraction.images?.length" height="240px">
                                    <el-carousel-item v-for="img in attraction.images" :key="img">
                                        <el-image :src="img" fit="cover" class="carousel-image" />
                                    </el-carousel-item>
                                </el-carousel>
                                <div class="attraction-info">
                                    <h4>{{ attraction.name }}</h4>
                                    <p>{{ attraction.description || '暂无描述' }}</p>
                                </div>
                            </el-card>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="交通住宿">
                        <div class="info-section">
                            <h3>交通信息</h3>
                            <p>{{ destinationData?.trafficInfo || '暂无交通信息' }}</p>

                            <h3>住宿信息</h3>
                            <p>{{ destinationData?.accommodationInfo || '暂无住宿信息' }}</p>

                            <h3>本地酒店</h3>
                            <p>为您推荐附近的优质酒店</p>
                            <LocalHotel :destination-data="destinationData" :location-info="locationInfo" />
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

                    <el-tab-pane label="用户评价">
                        <RatingList :destination-id="route.params.id" v-if="route.params.id" />
                    </el-tab-pane>
                </el-tabs>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Picture, ArrowLeft } from '@element-plus/icons-vue'
import { getDestinationDetailAPI } from '@/api/recommendApi'
import { getLocationFromDestination } from '@/utils/cityMapping'
import WeatherCard from '@/components/Weather/WeatherCard.vue'
import RatingList from '@/components/Rating/RatingList.vue'
import LocalHotel from '@/components/LocalHotel/LocalHotel.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const destinationData = ref(null)
const locationInfo = ref(null)

/**
 * @description 获取目的地详情
 */
const fetchDestinationDetail = async () => {
    if (!route.params.id) {
        ElMessage.error('目的地ID不能为空')
        router.push('/explore')
        return
    }

    loading.value = true
    try {
        const { code, data } = await getDestinationDetailAPI(route.params.id)
        if (code === 0 && data) {
            destinationData.value = data
            // 获取位置信息
            locationInfo.value = getLocationFromDestination(data.destination)

            if (!locationInfo.value) {
                ElMessage.warning('无法获取目的地位置信息')
            }
        } else {
            throw new Error('获取目的地详情失败')
        }
    } catch (error) {
        console.error('获取目的地详情失败:', error)
        ElMessage.error(error.message || '获取目的地详情失败')
        router.push('/explore')
    } finally {
        loading.value = false
    }
}

// 监听路由参数变化，重新获取数据
watch(() => route.params.id, (newId) => {
    if (newId) {
        fetchDestinationDetail()
    }
})

/**
 * 处理返回按钮点击事件
 * 如果有历史记录则返回上一页，否则跳转到探索页面
 */
const handleBack = () => {
    if (window.history.length > 1) {
        router.back()
    } else {
        router.push('/explore')
    }
}

onMounted(() => {
    fetchDestinationDetail()
})
</script>

<style lang="scss" scoped>
.destination-detail {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;

    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
    }

    .glass-effect {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 16px;
    }

    .detail-header {
        position: relative;
        margin-bottom: 24px;
        overflow: hidden;

        .nav-actions {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            color: rgba(69, 156, 236, 0.95);
            font: 700;

            .el-icon {
                font-size: 20px;
                font-weight: 700;
            }

            &:hover {
                background: rgba(173, 239, 248, 0.95);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
                transform: scale(1.05);
                cursor: pointer;
            }
        }

        .cover-image {
            position: relative;
            height: 480px;

            .el-image {
                width: 100%;
                height: 100%;
            }

            .header-content {
                position: absolute;
                bottom: 32px;
                left: 32px;
                right: 32px;
                padding: 32px;
                color: white;

                .title {
                    font-size: 42px;
                    font-weight: 600;
                    margin: 0 0 16px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .rating-row {
                    margin-bottom: 16px;
                }

                .tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;

                    .glass-tag {
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        backdrop-filter: blur(4px);
                        padding: 8px 16px;
                        border-radius: 20px;
                        color: white;
                        font-weight: 500;
                    }
                }
            }
        }
    }

    .detail-content {
        padding: 32px;

        .custom-tabs {
            :deep(.el-tabs__nav-wrap::after) {
                height: 2px;
                background-color: rgba(0, 0, 0, 0.05);
            }

            :deep(.el-tabs__item) {
                font-size: 16px;
                padding: 0 24px;
                height: 48px;
                line-height: 48px;

                &.is-active {
                    font-weight: 600;
                }
            }
        }

        .content-card {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            padding: 24px;
            margin-top: 24px;
        }

        .info-block {
            margin-bottom: 32px;

            h3 {
                color: var(--el-color-primary);
                font-size: 24px;
                margin-bottom: 16px;
                font-weight: 600;
            }

            p {
                color: #4a5568;
                line-height: 1.8;
                font-size: 16px;
            }
        }

        .attractions-section {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
            gap: 24px;
            padding: 24px 0;

            .attraction-card {
                overflow: hidden;
                transition: transform 0.3s ease;

                &:hover {
                    transform: translateY(-4px);
                }

                .carousel-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .attraction-info {
                    padding: 20px;

                    h4 {
                        font-size: 20px;
                        color: var(--el-color-primary);
                        margin: 0 0 12px;
                    }

                    p {
                        color: #4a5568;
                        line-height: 1.6;
                        margin: 0;
                    }
                }
            }
        }

        .info-section,
        .tips-section {
            padding: 24px;

            h3 {
                color: var(--el-color-primary);
                font-size: 24px;
                margin-bottom: 16px;
                font-weight: 600;
            }

            p {
                color: #4a5568;
                line-height: 1.8;
                font-size: 16px;
                margin-bottom: 32px;
            }
        }
    }
}

@media screen and (max-width: 768px) {
    .destination-detail {
        padding: 12px;

        .detail-header {
            .nav-actions {
                top: 12px;
                right: 12px;
                padding: 6px 12px;

                .back-button {
                    font-size: 14px;
                    padding: 6px 0;
                }
            }
        }

        .detail-header {
            margin-top: 32px;

            .cover-image {
                height: 320px;

                .header-content {
                    padding: 20px;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;

                    .title {
                        font-size: 32px;
                    }
                }
            }
        }

        .detail-content {
            padding: 20px;

            .attractions-section {
                grid-template-columns: 1fr;
            }
        }
    }
}
</style>