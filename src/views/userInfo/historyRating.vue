<template>
    <div class="history-rating">
        <div class="page-header">
            <h2>我的历史评价</h2>
            <el-button @click="router.go(-1)" type="primary" plain>返回</el-button>
        </div>

        <div class="rating-list" v-loading="loading">
            <template v-if="ratingList.length > 0">
                <div v-for="rating in ratingList" :key="rating.id" class="rating-item">
                    <div class="rating-header">
                        <div class="destination-info">
                            <h3 @click="goToDestination(rating.destinationId)">{{ rating.destinationName }}</h3>
                            <el-rate v-model="rating.rating" disabled />
                        </div>
                        <div class="rating-actions">
                            <el-button type="primary" link @click="handleEdit(rating)">编辑</el-button>
                            <el-button type="danger" link @click="handleDelete(rating.id)">删除</el-button>
                        </div>
                    </div>
                    <div class="rating-content">
                        <p class="comment">{{ rating.comment }}</p>
                        <div class="rating-details">
                            <div class="detail-item">
                                <span class="label">游览时间：</span>
                                <span>{{ formatDate(rating.visitTime) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">游览时长：</span>
                                <span>{{ formatDuration(rating.visitDuration) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">人均消费：</span>
                                <span>¥{{ rating.costPerPerson }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">人流量：</span>
                                <span>{{ crowdLevelMap[rating.crowdLevel] }}</span>
                            </div>
                        </div>
                        <div class="tags" v-if="rating.tags && rating.tags.length">
                            <el-tag v-for="tag in rating.tags" :key="tag" size="small" class="tag">{{ tag }}</el-tag>
                        </div>
                        <div class="rating-meta">
                            <span class="time">{{ formatDateTime(rating.createTime) }}</span>
                            <span class="likes">{{ rating.likeCount }} 人点赞</span>
                        </div>
                    </div>
                </div>
                <div class="pagination">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                        :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next"
                        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                </div>
            </template>
            <el-empty v-else description="暂无评价记录" />
        </div>

        <!-- 编辑评价对话框 -->
        <el-dialog v-model="editDialogVisible" title="编辑评价" width="600px" :close-on-click-modal="false">
            <el-form :model="editForm" label-width="100px" class="edit-form">
                <el-form-item label="评分">
                    <el-rate v-model="editForm.rating" :max="5" />
                </el-form-item>

                <el-form-item label="评价内容">
                    <el-input v-model="editForm.comment" type="textarea" :rows="4" placeholder="请输入您的评价内容" />
                </el-form-item>

                <el-form-item label="游览时间">
                    <el-date-picker v-model="editForm.visitTime" type="date" placeholder="选择游览日期" />
                </el-form-item>

                <el-form-item label="游览时长">
                    <el-input-number v-model="editForm.visitDuration" :min="1" :max="1440" placeholder="游览时长（分钟）" />
                </el-form-item>

                <el-form-item label="人均消费">
                    <el-input-number v-model="editForm.costPerPerson" :min="0" :precision="2" :step="10"
                        placeholder="人均消费（元）" />
                </el-form-item>

                <el-form-item label="人流量">
                    <el-select v-model="editForm.crowdLevel" placeholder="请选择人流量级别">
                        <el-option v-for="(label, value) in crowdLevelMap" :key="value" :label="label"
                            :value="Number(value)" />
                    </el-select>
                </el-form-item>

                <el-form-item label="标签">
                    <el-select v-model="editForm.tags" multiple filterable allow-create default-first-option
                        placeholder="请选择或输入标签">
                        <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
                    </el-select>
                </el-form-item>

                <el-form-item label="匿名评价">
                    <el-switch v-model="editForm.isAnonymous" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitEdit" :loading="submitting">
                        确认
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserRatingsAPI, deleteRatingAPI, updateRatingAPI } from '@/api/ratingApi'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const ratingList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const editDialogVisible = ref(false)
const editForm = ref({})

// 常用标签
const commonTags = [
    '风景优美', '服务周到', '性价比高', '交通便利',
    '美食天堂', '历史文化', '适合拍照', '亲子游玩',
    '环境清幽', '设施完善', '人少清净', '特色景点'
]

const crowdLevelMap = {
    1: '很少',
    2: '较少',
    3: '适中',
    4: '较多',
    5: '拥挤'
}

// 格式化日期
const formatDate = (date) => {
    if (!date) return '未知'
    return new Date(date).toLocaleDateString()
}

// 格式化日期时间
const formatDateTime = (date) => {
    if (!date) return '未知'
    return new Date(date).toLocaleString()
}

// 格式化时长
const formatDuration = (minutes) => {
    if (!minutes) return '未知'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
        return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`
    }
    return `${remainingMinutes}分钟`
}

// 获取评价列表
const fetchRatings = async () => {
    loading.value = true
    try {
        const res = await getUserRatingsAPI(currentPage.value, pageSize.value)
        if (res.code === 0) {
            ratingList.value = res.data.list
            total.value = res.data.total
        }
    } catch (error) {
        ElMessage.error('获取评价列表失败')
    } finally {
        loading.value = false
    }
}

// 跳转到目的地详情
const goToDestination = (destinationId) => {
    router.push(`/destination/${destinationId}`)
}

// 处理编辑
const handleEdit = (rating) => {
    editForm.value = {
        ...rating,
        visitTime: new Date(rating.visitTime),
        tags: rating.tags || []
    }
    editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
    submitting.value = true
    try {
        const submitData = {
            ...editForm.value,
            visitTime: editForm.value.visitTime.toISOString().split('T')[0]
        }

        const res = await updateRatingAPI(editForm.value.id, submitData)
        if (res.code === 0) {
            ElMessage.success('评价更新成功')
            editDialogVisible.value = false
            await fetchRatings()
        }
    } catch (error) {
        ElMessage.error('更新评价失败')
    } finally {
        submitting.value = false
    }
}

// 处理删除
const handleDelete = async (ratingId) => {
    try {
        await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        const res = await deleteRatingAPI(ratingId)
        if (res.code === 0) {
            ElMessage.success('删除成功')
            await fetchRatings()
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 处理页码改变
const handleCurrentChange = (page) => {
    currentPage.value = page
    fetchRatings()
}

// 处理每页条数改变
const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchRatings()
}

onMounted(() => {
    fetchRatings()
})
</script>

<style lang="scss" scoped>
.history-rating {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    min-height: calc(100vh - 136px);

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
            margin: 0;
            font-size: 24px;
            color: #333;
        }
    }

    .rating-list {
        .rating-item {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            transition: transform 0.3s, box-shadow 0.3s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .rating-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;

                .destination-info {
                    h3 {
                        margin: 0 0 8px;
                        font-size: 18px;
                        color: #409eff;
                        cursor: pointer;

                        &:hover {
                            text-decoration: underline;
                        }
                    }
                }
            }

            .rating-content {
                .comment {
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 16px;
                    line-height: 1.6;
                }

                .rating-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;

                    .detail-item {
                        .label {
                            color: #666;
                            margin-right: 8px;
                        }
                    }
                }

                .tags {
                    margin-bottom: 16px;

                    .tag {
                        margin-right: 8px;
                        margin-bottom: 8px;
                    }
                }

                .rating-meta {
                    display: flex;
                    justify-content: space-between;
                    color: #999;
                    font-size: 14px;
                }
            }
        }
    }

    .pagination {
        display: flex;
        justify-content: center;
        margin-top: 32px;
    }
}

.edit-form {
    .el-rate {
        margin-top: 8px;
    }

    .el-select {
        width: 100%;
    }

    .el-input-number {
        width: 180px;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
}
</style>