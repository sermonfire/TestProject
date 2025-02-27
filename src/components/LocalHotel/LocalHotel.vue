<template>
    <div class="local-hotel">

        <div v-loading="loading" class="local-hotel-content">
            <div v-if="!loading && (!localHotelList || localHotelList.length === 0)" class="empty-state glass-card">
                <el-empty description="暂无酒店信息">
                    <template #image>
                        <el-icon :size="60" class="empty-icon">
                            <House />
                        </el-icon>
                    </template>
                    <template #description>
                        <p class="empty-text">暂无酒店信息</p>
                        <p class="empty-subtext">该地区暂时没有找到相关酒店信息</p>
                    </template>
                </el-empty>
            </div>

            <div v-else class="local-hotel-list">
                <el-card v-for="item in localHotelList" :key="item.id" class="hotel-card glass-card"
                    :body-style="{ padding: '0px' }">
                    <div class="hotel-card-content">
                        <div class="hotel-image">
                            <el-image :src="item.photos?.[0] || '/src/assets/images/hotel-default.jpg'" fit="cover">
                                <template #error>
                                    <div class="image-slot">
                                        <el-icon>
                                            <Picture />
                                        </el-icon>
                                    </div>
                                </template>
                            </el-image>
                        </div>
                        <div class="hotel-info">
                            <h3 class="hotel-name">{{ item.name }}</h3>
                            <div class="hotel-type">
                                <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
                            </div>
                            <div class="hotel-address">
                                <el-icon>
                                    <Location />
                                </el-icon>
                                <span>{{ (item.pname) + (item.cityname) + (item.adname) + (item.address) }}</span>
                            </div>
                            <div class="hotel-distance">
                                <el-icon>
                                    <Position />
                                </el-icon>
                                <span>距离：{{ getDistance(item.distance) }}</span>
                            </div>
                            <div class="hotel-actions">
                                <el-button type="primary" link
                                    :href="'https://map.amap.com/search/poi?query=' + encodeURIComponent(item.name)"
                                    target="_blank">
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

            <!-- 分页器 - 修改layout移除prev, next -->
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
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useHotelStore } from '@/stores/hotelStore'
import { Picture, Location, Position, MapLocation, House, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const hotelStore = useHotelStore()
const localHotelList = ref([])
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
        return '太远了！'
    }
}

const getLocalHotelList = async () => {
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
        const result = await hotelStore.getHotels(keyword, currentPage.value, pageSize.value)
        localHotelList.value = result.data
        total.value = Number(result.total)
    } catch (error) {
        console.error('获取酒店列表失败:', error)
        ElMessage.error('获取酒店列表失败')
        localHotelList.value = []
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
    getLocalHotelList()
}

const handleCurrentChange = (newPage) => {
    if (newPage > 100) {
        ElMessage.warning('页码不能超过100')
        return
    }
    currentPage.value = newPage
    window.scrollTo({ top: 0, behavior: 'smooth' })
    getLocalHotelList()
}

const tp = ref(2)

// 修改计算总页数的逻辑
const totalPages = computed(() => {
    return tp.value
})

// 修改下一页处理函数，移除25页的硬编码限制
const handleNextPage = () => {
    if (currentPage.value < 25) {
        currentPage.value++
        tp.value++
        window.scrollTo({ top: 0, behavior: 'smooth' })
        getLocalHotelList()
    }
}

// 添加上一页处理函数
const handlePrevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--
        window.scrollTo({ top: 0, behavior: 'smooth' })
        getLocalHotelList()
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
        getLocalHotelList()
    },
    { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.local-hotel {

    .local-hotel-content {
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

    .local-hotel-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 24px;

        .hotel-card {
            height: 100%;
            transition: transform 0.3s ease;
            overflow: hidden;

            &:hover {
                transform: translateY(-5px);
            }

            .hotel-card-content {
                .hotel-image {
                    height: 200px;
                    overflow: hidden;

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

                .hotel-info {
                    padding: 16px;

                    .hotel-name {
                        margin: 0 0 12px;
                        font-size: 18px;
                        font-weight: 600;
                        color: var(--el-text-color-primary);
                    }

                    .hotel-type {
                        margin-bottom: 12px;
                    }

                    .hotel-address,
                    .hotel-distance {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 8px;
                        color: var(--el-text-color-regular);
                        font-size: 14px;

                        .el-icon {
                            color: var(--el-color-primary);
                        }
                    }

                    .hotel-actions {
                        margin-top: 16px;
                        display: flex;
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
}

// 响应式布局
@media screen and (max-width: 768px) {
    .local-hotel {
        .local-hotel-list {
            grid-template-columns: 1fr;
        }

        .hotel-card {
            margin-bottom: 16px;
        }
    }
}
</style>