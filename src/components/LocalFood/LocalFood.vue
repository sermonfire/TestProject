<template>
    <div class="local-food">
        <div v-loading="loading" class="local-food-content">
            <div v-if="!loading && (!localFoodList || localFoodList.length === 0)" class="empty-state glass-card">
                <el-empty description="暂无餐饮服务信息">
                    <template #image>
                        <el-icon :size="60" class="empty-icon">
                            <Food />
                        </el-icon>
                    </template>
                    <template #description>
                        <p class="empty-text">暂无餐饮服务信息</p>
                        <p class="empty-subtext">该地区暂时没有找到相关餐饮服务信息</p>
                    </template>
                </el-empty>
            </div>

            <div v-else class="local-food-list">
                <el-card v-for="item in localFoodList" :key="item.id" class="food-card glass-card"
                    :body-style="{ padding: '0px' }">
                    <div class="food-card-content">
                        <div class="food-image">
                            <el-image :src="item.photos?.[0] || '/src/assets/images/food-default.jpg'" fit="cover">
                                <template #error>
                                    <div class="image-slot">
                                        <el-icon>
                                            <Picture />
                                        </el-icon>
                                    </div>
                                </template>
                            </el-image>
                            <div class="image-overlay">
                                <span class="view-details" @click="handleViewDetails(item)">
                                    查看详情
                                </span>
                            </div>
                        </div>
                        <div class="food-info">
                            <h3 class="food-name">{{ item.name }}</h3>
                            <div class="food-type">
                                <el-tag v-for="(type, index) in getFoodTypes(item.type)" :key="index" size="small"
                                    effect="plain" class="type-tag">
                                    {{ type }}
                                </el-tag>
                            </div>
                            <div class="food-address">
                                <el-icon>
                                    <Location />
                                </el-icon>
                                <span>{{ (item.pname) + (item.cityname) + (item.adname) + (item.address) }}</span>
                            </div>
                            <div class="food-distance">
                                <el-icon>
                                    <Position />
                                </el-icon>
                                <span>距离：{{ getDistance(item.distance) }}</span>
                            </div>
                            <div class="food-actions">
                                <el-button type="primary" @click="handleViewMap(item)">
                                    <el-icon>
                                        <MapLocation />
                                    </el-icon>
                                    查看地图
                                </el-button>
                            </div>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 分页器 -->
            <div class="pagination-container glass-card">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[12, 16, 20, 24]" :total="Number(total)" :disabled="total === 0" :background="true"
                    layout="total, sizes" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                <div class="adPage">
                    <el-icon class="prevPage-icon" :class="{ 'disabled': currentPage <= 1 }" @click="handlePrevPage">
                        <ArrowLeft />
                    </el-icon>
                    <div class="currentPage">
                        {{ currentPage }} / {{ totalPages }}
                    </div>
                    <el-icon class="nextPage-icon" :class="{ 'disabled': currentPage >= 25 }" @click="handleNextPage">
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>
        </div>

        <el-dialog v-model="mapDialogVisible" :title="currentFood?.name" width="90%" :destroy-on-close="true"
            class="map-dialog" top="5vh">
            <div class="map-container">
                <div class="food-info-panel">
                    <div class="food-detail">
                        <h3>{{ currentFood?.name }}</h3>
                        <div class="info-item">
                            <el-icon>
                                <Location />
                            </el-icon>
                            <span>{{ currentFood?.pname }}{{ currentFood?.cityname }}{{ currentFood?.adname }}{{
                                currentFood?.address }}</span>
                        </div>
                        <div class="info-item">
                            <el-icon>
                                <Position />
                            </el-icon>
                            <span>距离：{{ getDistance(currentFood?.distance) }}</span>
                        </div>
                        <div class="food-tags">
                            <el-tag v-for="(type, index) in getFoodTypes(currentFood?.type)" :key="index" size="small"
                                effect="plain" class="type-tag">
                                {{ type }}
                            </el-tag>
                        </div>
                    </div>
                </div>
                <div class="map-wrapper">
                    <AMapContainer v-if="mapDialogVisible && currentFood"
                        :longitude="Number(currentFood.location?.split(',')[0])"
                        :latitude="Number(currentFood.location?.split(',')[1])" :zoom="15" />
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Picture, Location, Position, MapLocation, Food, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AMapContainer from '@/components/map/AMapContainer.vue'
import { useLocalServiceStore } from '@/stores/localServiceStore'

const localServiceStore = useLocalServiceStore()
const localFoodList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const destinationAddressData = defineProps({
    destinationData: {
        type: Object,
        default: () => ({})
    },
    locationInfo: {
        type: Object,
        default: () => ({})
    }
})

const getDistance = (distance) => {
    if (distance) {
        if (distance < 1000) {
            return distance + '米'
        } else {
            return (distance / 1000).toFixed(2) + '千米'
        }
    } else {
        return '未知'
    }
}

const getLocalFoodList = async () => {
    if (!destinationAddressData.locationInfo?.province ||
        !destinationAddressData.locationInfo?.city ||
        !destinationAddressData.destinationData?.destination?.name) {
        return
    }
    loading.value = true
    try {
        const { province, city } = destinationAddressData.locationInfo
        const name = destinationAddressData.destinationData.destination.name
        const keyword = `${province}${city}${name}`
        const result = await localServiceStore.getFoods(keyword, currentPage.value, pageSize.value)
        localFoodList.value = result.data
        total.value = Number(result.total)
    } catch (error) {
        console.error('获取餐饮服务列表失败:', error)
        ElMessage.error('获取餐饮服务列表失败')
        localFoodList.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

const handleSizeChange = (newSize) => {
    if (newSize > 25) {
        ElMessage.warning('每页显示数量不能超过25条')
        return
    }
    pageSize.value = newSize
    currentPage.value = 1  // 切换每页数量时重置为第一页
    getLocalFoodList()
}

const handleCurrentChange = (newPage) => {
    if (newPage > 100) {
        ElMessage.warning('页码不能超过100')
        return
    }
    currentPage.value = newPage
    window.scrollTo({ top: 0, behavior: 'smooth' })
    getLocalFoodList()
}

const tp = ref(2)

// 计算总页数
const totalPages = computed(() => {
    return tp.value
})

// 下一页处理函数
const handleNextPage = () => {
    if (currentPage.value < 25) {
        currentPage.value++
        tp.value++
        window.scrollTo({ top: 0, behavior: 'smooth' })
        getLocalFoodList()
    }
}

// 上一页处理函数
const handlePrevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--
        window.scrollTo({ top: 0, behavior: 'smooth' })
        getLocalFoodList()
    }
}

// 监听目的地信息变化
watch(
    () => [
        destinationAddressData.locationInfo?.province,
        destinationAddressData.locationInfo?.city,
        destinationAddressData.destinationData?.destination?.name
    ],
    () => {
        currentPage.value = 1
        pageSize.value = 12
        getLocalFoodList()
    },
    { immediate: true, deep: true }
)

/**
 * 处理餐饮服务类型标签
 * @param {string} typeString - 原始类型字符串，格式如："餐饮服务;中餐厅;中餐厅"
 * @returns {string[]} 去重后的类型数组
 */
const getFoodTypes = (typeString) => {
    if (!typeString) return []
    // 使用分号分割字符串，并去重
    return [...new Set(typeString.split(';'))].filter(Boolean)
}

// 添加查看详情处理函数
const handleViewDetails = (food) => {
    ElMessage({
        message: '餐饮服务详情功能开发中，敬请期待...',
        type: 'info',
        duration: 2000,
        showClose: true
    })
}

const mapDialogVisible = ref(false)
const currentFood = ref(null)

// 修改查看地图按钮的点击处理函数
const handleViewMap = (food) => {
    currentFood.value = food
    mapDialogVisible.value = true
    // 添加自动滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style lang="scss" scoped>
.local-food {
    .local-food-content {
        min-height: 200px;
    }

    .empty-state {
        padding: 40px;
        text-align: center;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 12px;
        margin-bottom: 24px;

        .empty-icon {
            color: var(--el-color-primary);
            opacity: 0.7;
        }

        .empty-text {
            color: var(--el-text-color-primary);
            font-size: 16px;
            margin: 16px 0 8px;
        }

        .empty-subtext {
            color: var(--el-text-color-secondary);
            font-size: 14px;
            margin: 0;
        }
    }

    .local-food-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 40px;
        margin-bottom: 24px;
        margin-left: auto;
        margin-right: auto;
        max-width: 1300px;

        .food-card {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 15px;
            transition: transform 0.3s ease;
            overflow: hidden;

            &:hover {
                transform: translateY(-5px);
            }

            .food-card-content {
                .food-image {
                    position: relative;
                    height: 200px;
                    overflow: hidden;

                    .image-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0;
                        transition: all 0.3s ease;
                        cursor: pointer;

                        .view-details {
                            color: white;
                            font-size: 15px;
                            padding: 8px 20px;
                            background: rgba(255, 255, 255, 0.15);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            border-radius: 20px;
                            backdrop-filter: blur(8px);
                            transform: translateY(20px);
                            opacity: 0;
                            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

                            &:hover {
                                background: rgba(255, 255, 255, 0.25);
                                transform: translateY(0) scale(1.05);
                            }
                        }

                        &:hover {
                            opacity: 1;

                            .view-details {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    }

                    .el-image {
                        width: 100%;
                        height: 100%;
                    }

                    .image-slot {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100%;
                        background: var(--el-fill-color-light);

                        .el-icon {
                            font-size: 30px;
                            color: var(--el-text-color-secondary);
                        }
                    }
                }

                .food-info {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;

                    .food-name {
                        margin: 0 0 12px;
                        font-size: 18px;
                        font-weight: 600;
                        color: var(--el-text-color-primary);
                    }

                    .food-type {
                        display: flex;
                        flex-wrap: wrap;
                        align-content: flex-start;
                        gap: 6px;
                        min-height: 46px;
                        margin-bottom: 15px;

                        .type-tag {
                            margin: 0;
                        }
                    }

                    .food-address,
                    .food-distance {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: var(--el-text-color-regular);
                        font-size: 14px;

                        .el-icon {
                            color: var(--el-color-primary);
                        }
                    }

                    .food-distance {
                        margin-bottom: 40px;
                    }

                    .food-actions {
                        position: absolute;
                        right: 15px;
                        bottom: 15px;
                        justify-content: flex-end;
                    }
                }
            }
        }
    }

    .pagination-container {
        display: flex;
        justify-content: center;
        margin-top: 24px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;

        :deep(.el-pagination) {
            --el-pagination-hover-color: var(--el-color-primary);

            .el-pagination__total {
                margin-right: 16px;
            }

            .el-pagination__sizes {
                margin-right: 16px;
            }

            &.is-disabled {
                opacity: 0.7;
            }
        }

        .adPage {
            display: flex;
            margin-left: 16px;
            cursor: pointer;
            justify-content: center;
            align-items: center;
            gap: 12px;

            .prevPage-icon,
            .nextPage-icon {
                font-size: 24px;
                color: var(--el-color-primary);
                transition: all 0.3s ease;
                border-radius: 50%;

                &:hover:not(.disabled) {
                    background-color: #b7f7ee;
                    transform: scale(1.2);
                }

                &.disabled {
                    color: var(--el-text-color-disabled);
                    cursor: not-allowed;
                    opacity: 0.5;

                    &:hover {
                        background-color: transparent;
                        transform: none;
                    }
                }
            }

            .currentPage {
                font-size: 16px;
                color: var(--el-color-primary);
                font-weight: bold;
                min-width: 80px;
                text-align: center;
                padding: 0 12px;
                background-color: rgba(183, 247, 238, 0.3);
                border-radius: 20px;
                height: 32px;
                line-height: 32px;
                transition: all 0.3s ease;

                &:hover {
                    background-color: rgba(183, 247, 238, 0.5);
                }
            }
        }
    }

    @media screen and (max-width: 1200px) {
        .local-food-list {
            grid-template-columns: repeat(2, 1fr);
            max-width: 900px;
        }
    }

    @media screen and (max-width: 768px) {
        .local-food-list {
            grid-template-columns: 1fr;
            max-width: 100%;
        }
    }
}

.map-dialog {
    :deep(.el-dialog) {
        max-width: 1400px;
        border-radius: 16px;
        overflow: hidden;

        .el-dialog__header {
            margin: 0;
            padding: 20px 24px;
            border-bottom: 1px solid var(--el-border-color-lighter);

            .el-dialog__title {
                font-size: 18px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
        }

        .el-dialog__body {
            padding: 0;
        }
    }

    .map-container {
        display: flex;
        height: 80vh;
        max-height: 800px;

        .food-info-panel {
            width: 300px;
            padding: 24px;
            border-right: 1px solid var(--el-border-color-lighter);
            overflow-y: auto;

            .food-detail {
                h3 {
                    margin: 0 0 16px;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                }

                .info-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 12px;
                    color: var(--el-text-color-regular);

                    .el-icon {
                        margin-top: 3px;
                        color: var(--el-color-primary);
                    }

                    span {
                        flex: 1;
                        line-height: 1.5;
                    }
                }

                .food-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 16px;

                    .type-tag {
                        margin: 0;
                    }
                }
            }
        }

        .map-wrapper {
            flex: 1;
            height: 100%;

            :deep(.map-container) {
                height: 100% !important;
            }
        }
    }
}

@media screen and (max-width: 768px) {
    .map-dialog {
        :deep(.el-dialog) {
            width: 95% !important;
            margin: 0 auto;
        }

        .map-container {
            flex-direction: column;
            height: calc(100vh - 120px);

            .food-info-panel {
                width: 100%;
                max-height: 200px;
                border-right: none;
                border-bottom: 1px solid var(--el-border-color-lighter);
            }

            .map-wrapper {
                height: calc(100% - 200px);
            }
        }
    }
}
</style>