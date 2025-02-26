<template>
    <div class="rating-list">
        <div class="rating-stats glass-card" v-if="stats">
            <div class="stats-header">
                <h3 class="stats-title">目的地评价</h3>
                <div class="avg-rating">
                    <span class="rating-value">{{ formatRating(stats.avgRating) }}</span>
                    <el-rate :model-value="stats.avgRating" disabled allow-half />
                    <span class="rating-count">{{ stats.totalRatings }}条评价</span>
                </div>
            </div>

            <div class="stats-details">
                <div class="stats-item">
                    <div class="stats-label">人流量</div>
                    <div class="stats-value">
                        <el-rate :model-value="stats.avgCrowdLevel" disabled :max="5" :texts="crowdLevelTexts"
                            show-text />
                    </div>
                </div>

                <div class="stats-item">
                    <div class="stats-label">人均消费</div>
                    <div class="stats-value">¥{{ stats.avgCost }}</div>
                </div>
            </div>

            <div class="rating-distribution">
                <div class="distribution-item" v-for="(count, index) in starCounts" :key="index">
                    <div class="star-label">{{ getStarLabel(index) }}</div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: getPercentage(count) + '%' }"></div>
                        </div>
                        <div class="percentage-label">{{ getPercentage(count) }}%</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="rating-actions" v-if="!hasRated">
            <el-button type="primary" @click="showRatingForm = true">
                发表评价
            </el-button>
        </div>

        <el-dialog v-model="showRatingForm" title="发表评价" width="650px" destroy-on-close>
            <RatingForm :destination-id="destinationId" @submit-success="handleRatingSubmitted" />
        </el-dialog>

        <div class="ratings-container">
            <div v-if="loading" class="loading-wrapper">
                <el-skeleton :rows="3" animated />
            </div>

            <template v-else>
                <div v-if="ratingList.length === 0" class="empty-ratings">
                    <el-empty description="暂无评价" />
                </div>

                <div v-else class="rating-items">
                    <div v-for="rating in ratingList" :key="rating.id" class="rating-item glass-card">
                        <div class="rating-header">
                            <div class="user-info">
                                <el-avatar :src="rating.isAnonymous ? '' : rating.userInfo?.avatar" :size="40">
                                    {{ rating.isAnonymous ? '匿' : rating.userInfo?.username?.substring(0, 1) }}
                                </el-avatar>
                                <div class="user-details">
                                    <div class="username">
                                        {{ rating.isAnonymous ? '匿名用户' : rating.userInfo?.username }}
                                    </div>
                                    <div class="rating-time">{{ formatDate(rating.createTime) }}</div>
                                </div>
                            </div>

                            <div class="rating-score">
                                <el-rate :model-value="rating.rating" disabled allow-half show-score
                                    score-template="{value}" />
                            </div>
                        </div>

                        <div class="rating-content">
                            <p>{{ rating.comment }}</p>
                        </div>

                        <div class="rating-meta">
                            <div class="meta-items">
                                <div class="meta-item" v-if="rating.visitTime">
                                    <span class="meta-label">游览时间:</span>
                                    <span class="meta-value">{{ rating.visitTime }}</span>
                                </div>

                                <div class="meta-item" v-if="rating.visitDuration">
                                    <span class="meta-label">游览时长:</span>
                                    <span class="meta-value">{{ formatDuration(rating.visitDuration) }}</span>
                                </div>

                                <div class="meta-item" v-if="rating.crowdLevel">
                                    <span class="meta-label">人流量:</span>
                                    <span class="meta-value">{{ crowdLevelTexts[rating.crowdLevel - 1] }}</span>
                                </div>

                                <div class="meta-item" v-if="rating.costPerPerson">
                                    <span class="meta-label">人均消费:</span>
                                    <span class="meta-value">¥{{ rating.costPerPerson }}</span>
                                </div>
                            </div>

                            <div class="rating-tags" v-if="rating.tags && rating.tags.length > 0">
                                <el-tag v-for="tag in rating.tags" :key="tag" size="small" effect="plain"
                                    class="tag-item">
                                    {{ tag }}
                                </el-tag>
                            </div>
                        </div>

                        <div class="rating-actions">
                            <div class="like-action" @click="toggleLike(rating)"
                                :class="{ 'is-liked': rating.isLiked }">
                                <el-icon>
                                    <Promotion />
                                </el-icon>
                                <span>{{ rating.likeCount || 0 }}</span>
                            </div>

                            <div class="delete-action" v-if="canDelete(rating)" @click="deleteRating(rating.id)">
                                <el-icon>
                                    <Delete />
                                </el-icon>
                                <span>删除</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pagination-container">
                    <el-pagination v-model:current-page="currentPage" layout="prev, pager, next, jumper"
                        :total="total || 0" :page-size="10" :disabled="total === 0"
                        @current-change="handleCurrentChange" />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, Delete } from '@element-plus/icons-vue'
import { getDestinationRatingsAPI, getRatingStatsAPI, toggleRatingLikeAPI, deleteRatingAPI, checkRatedAPI, checkLikedAPI } from '@/api/ratingApi'
import { useUserStore } from '@/stores/userstore'
import RatingForm from './RatingForm.vue'
import { formatDate as formatDateUtil } from '@/utils/format'

const props = defineProps({
    destinationId: {
        type: [Number, String],
        required: true
    }
})

const userStore = useUserStore()
const loading = ref(false)
const ratingList = ref([])
const stats = ref(null)
const hasRated = ref(false)
const showRatingForm = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 人流量级别文本
const crowdLevelTexts = ['空旷', '稀少', '适中', '拥挤', '非常拥挤']

// 星级评分计数
const starCounts = computed(() => {
    if (!stats.value) return [0, 0, 0, 0, 0]

    // 将评分按照0~1、1~2、2~3、3~4、4~5分组，从高到低排列
    return [
        // 4~5星评分：5星 + 4.5星
        (stats.value.fiveStarCount || 0) + (stats.value.fourPointFiveStarCount || 0),
        // 3~4星评分：4星 + 3.5星
        (stats.value.fourStarCount || 0) + (stats.value.threePointFiveStarCount || 0),
        // 2~3星评分：3星 + 2.5星
        (stats.value.threeStarCount || 0) + (stats.value.twoPointFiveStarCount || 0),
        // 1~2星评分：2星 + 1.5星
        (stats.value.twoStarCount || 0) + (stats.value.onePointFiveStarCount || 0),
        // 0~1星评分：1星
        (stats.value.oneStarCount || 0)
    ]
})

/**
 * @description 获取评价列表
 */
const fetchRatings = async () => {
    if (!props.destinationId) return

    loading.value = true
    try {
        const { code, data } = await getDestinationRatingsAPI(
            props.destinationId,
            currentPage.value,
            pageSize.value
        )

        if (code === 0 && data) {
            ratingList.value = data.list || []
            total.value = data.total || 0

            // 检查每个评价是否已点赞
            await Promise.all(
                ratingList.value.map(async (rating) => {
                    try {
                        const { code, data } = await checkLikedAPI(rating.id)
                        if (code === 0) {
                            rating.isLiked = data
                        }
                    } catch (error) {
                        console.error('检查点赞状态失败:', error)
                    }
                })
            )
        }
    } catch (error) {
        console.error('获取评价列表失败:', error)
        ElMessage.error('获取评价列表失败')
    } finally {
        loading.value = false
    }
}

/**
 * @description 获取评分统计
 */
const fetchRatingStats = async () => {
    if (!props.destinationId) return

    try {
        const { code, data } = await getRatingStatsAPI(props.destinationId)
        if (code === 0 && data) {
            stats.value = data
        }
    } catch (error) {
        console.error('获取评分统计失败:', error)
    }
}

/**
 * @description 检查用户是否已评价
 */
const checkUserRated = async () => {
    if (!props.destinationId || !userStore.isLogin) return

    try {
        const { code, data } = await checkRatedAPI(props.destinationId)
        if (code === 0) {
            hasRated.value = data
        }
    } catch (error) {
        console.error('检查用户是否已评价失败:', error)
    }
}

/**
 * @description 点赞/取消点赞
 */
const toggleLike = async (rating) => {
    if (!userStore.isLogin) {
        ElMessage.warning('请先登录')
        return
    }

    try {
        const isLike = !rating.isLiked
        const { code, message } = await toggleRatingLikeAPI(rating.id, isLike)

        if (code === 0) {
            rating.isLiked = isLike
            rating.likeCount = isLike
                ? (rating.likeCount || 0) + 1
                : Math.max(0, (rating.likeCount || 0) - 1)

            ElMessage.success(isLike ? '点赞成功' : '已取消点赞')
        } else {
            ElMessage.error(message || (isLike ? '点赞失败' : '取消点赞失败'))
        }
    } catch (error) {
        console.error('点赞操作失败:', error)
        ElMessage.error('操作失败')
    }
}

/**
 * @description 删除评价
 */
const deleteRating = async (ratingId) => {
    try {
        await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        const { code, message } = await deleteRatingAPI(ratingId)

        if (code === 0) {
            ElMessage.success('删除成功')
            fetchRatings()
            fetchRatingStats()
            checkUserRated()
        } else {
            ElMessage.error(message || '删除失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除评价失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

/**
 * @description 判断是否可以删除评价
 */
const canDelete = (rating) => {
    if (!userStore.isLogin) return false
    return rating.userId === userStore.userInfo.id
}

/**
 * @description 处理评价提交成功
 */
const handleRatingSubmitted = () => {
    showRatingForm.value = false
    fetchRatings()
    fetchRatingStats()
    hasRated.value = true
}

/**
 * @description 获取百分比
 * @param {number} count - 评分计数
 * @returns {number} 百分比
 */
const getPercentage = (count) => {
    if (!stats.value || !stats.value.totalRatings || stats.value.totalRatings === 0) {
        return 0
    }
    return Math.round((count / stats.value.totalRatings) * 100)
}

/**
 * @description 格式化日期
 */
const formatDate = (dateString) => {
    return formatDateUtil(dateString, 'YYYY-MM-DD HH:mm')
}

/**
 * @description 格式化时长
 */
const formatDuration = (minutes) => {
    if (!minutes) return '未知'

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
        return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
    }
    return `${mins}分钟`
}

/**
 * @description 处理页码变化
 */
const handleCurrentChange = (page) => {
    currentPage.value = page
    fetchRatings()
}

/**
 * @description 格式化评分，确保显示一位小数
 * @param {number} rating - 评分值
 * @returns {string} 格式化后的评分
 */
const formatRating = (rating) => {
    if (rating === undefined || rating === null) return '0.0'
    return rating.toFixed(1)
}

/**
 * @description 获取星级标签
 * @param {number} index - 星级索引
 * @returns {string} 星级标签
 */
const getStarLabel = (index) => {
    const starRanges = ['4~5星', '3~4星', '2~3星', '1~2星', '0~1星']
    return starRanges[index]
}

/**
 * 注意: 评价列表分页功能已按照后端接口要求实现
 * 请求参数:
 * - pageNum: 当前页码
 * - pageSize: 固定为10
 * 响应数据:
 * - list: 评价列表
 * - total: 总条数
 * - pageNum: 当前页码
 * - pageSize: 每页条数
 * - pages: 总页数
 */

// 监听目的地ID变化
watch(() => props.destinationId, (newId) => {
    if (newId) {
        currentPage.value = 1
        fetchRatings()
        fetchRatingStats()
        checkUserRated()
    }
})

// 监听登录状态变化
watch(() => userStore.isLogin, (isLogin) => {
    if (isLogin && props.destinationId) {
        checkUserRated()
    }
})

onMounted(() => {
    if (props.destinationId) {
        fetchRatings()
        fetchRatingStats()
        checkUserRated()
    }
})
</script>

<style lang="scss" scoped>
.rating-list {
    margin-top: 24px;

    .rating-stats {
        padding: 24px;
        margin-bottom: 24px;

        .stats-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            @media (max-width: 768px) {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }

            .stats-title {
                font-size: 20px;
                font-weight: 600;
                color: var(--el-color-primary);
                margin: 0;
            }

            .avg-rating {
                display: flex;
                align-items: center;
                gap: 8px;

                .rating-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #ff9900;
                }

                .rating-count {
                    color: #909399;
                    margin-left: 8px;
                }
            }
        }

        .stats-details {
            display: flex;
            gap: 32px;
            margin-bottom: 20px;

            .stats-item {
                display: flex;
                align-items: center;
                gap: 12px;

                .stats-label {
                    font-weight: 500;
                    color: #606266;
                }

                .stats-value {
                    font-weight: 600;
                    color: #303133;
                }
            }
        }

        .rating-distribution {
            margin-top: 16px;

            .distribution-item {
                display: flex;
                align-items: center;
                margin-bottom: 12px;

                .star-label {
                    width: 60px;
                    text-align: right;
                    margin-right: 12px;
                    color: #606266;
                    font-size: 14px;
                }

                .progress-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    .progress-bar {
                        flex: 1;
                        height: 12px;
                        background-color: #f0f0f0;
                        border-radius: 6px;
                        overflow: hidden;

                        .progress-fill {
                            height: 100%;
                            background-color: #ff9900;
                            border-radius: 6px;
                        }
                    }

                    .percentage-label {
                        width: 40px;
                        text-align: right;
                        color: #606266;
                        font-size: 12px;
                    }
                }
            }
        }
    }

    .rating-actions {
        margin-bottom: 24px;
        display: flex;
        justify-content: flex-end;
    }

    .ratings-container {
        .loading-wrapper {
            padding: 24px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 12px;
        }

        .empty-ratings {
            padding: 40px 0;
        }

        .rating-items {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .rating-item {
                padding: 20px;

                .rating-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;

                    .user-info {
                        display: flex;
                        align-items: center;
                        gap: 12px;

                        .user-details {
                            .username {
                                font-weight: 500;
                                color: #303133;
                                margin-bottom: 4px;
                            }

                            .rating-time {
                                font-size: 12px;
                                color: #909399;
                            }
                        }
                    }
                }

                .rating-content {
                    margin-bottom: 16px;

                    p {
                        margin: 0;
                        line-height: 1.6;
                        color: #303133;
                    }
                }

                .rating-meta {

                    .meta-items {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                        margin-bottom: 12px;

                        .meta-item {
                            display: flex;
                            align-items: center;
                            gap: 4px;

                            .meta-label {
                                color: #909399;
                            }

                            .meta-value {
                                color: #606266;
                                font-weight: 500;
                            }
                        }
                    }

                    .rating-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;

                        .tag-item {
                            border-radius: 12px;
                        }
                    }
                }

                .rating-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin: 0px;

                    .like-action,
                    .delete-action {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        cursor: pointer;
                        color: #909399;
                        transition: all 0.3s;

                        &:hover {
                            color: var(--el-color-primary);
                        }

                        &.is-liked {
                            color: #ff9900;
                        }
                    }
                }
            }
        }

        .pagination-container {
            margin-top: 24px;
            margin-bottom: 24px;
            padding: 16px 0;
            display: flex;
            justify-content: center;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
        }
    }
}
</style>