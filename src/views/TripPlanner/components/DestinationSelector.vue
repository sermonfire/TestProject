<template>
    <div v-if="visible" class="custom-dialog-overlay" @click.self="visible = false">
        <div class="custom-dialog">
            <!-- 标题栏 -->
            <div class="custom-dialog-header">
                <h2 class="custom-dialog-title">选择目的地</h2>
                <el-button class="close-btn" @click="visible = false" type="default" text>
                    <el-icon>
                        <Close />
                    </el-icon>
                </el-button>
            </div>

            <div class="destination-selector">
                <!-- 目的地列表 -->
                <div class="destination-list" v-loading="loading">
                    <el-empty v-if="destinations.length === 0" description="暂无收藏的目的地" />
                    <el-row :gutter="20">
                        <el-col v-for="item in destinations" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
                            <el-card class="destination-card"
                                :class="{ 'is-selected': selectedDestination?.id === item.destination.id }"
                                @click="handleSelect(item.destination)" shadow="hover">
                                <el-image :src="item.destination.imageUrl" fit="cover" class="destination-image">
                                    <template #error>
                                        <div class="image-placeholder">
                                            <el-icon>
                                                <Picture />
                                            </el-icon>
                                        </div>
                                    </template>
                                </el-image>
                                <div class="destination-info">
                                    <h3 class="destination-name">{{ item.destination.name }}</h3>
                                    <div class="destination-rating">
                                        <el-rate v-model="item.destination.rating" disabled text-color="#ff9900" />
                                    </div>
                                    <div class="destination-tags">
                                        <el-tag v-for="tag in item.destination.tags" :key="tag" size="small"
                                            class="tag">
                                            {{ tag }}
                                        </el-tag>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>

                <!-- 分页器 -->
                <div class="pagination">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                        :page-sizes="[8, 16, 24, 32]" layout="total, sizes, prev, pager, next"
                        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                </div>
            </div>

            <!-- 底部按钮 -->
            <div class="custom-dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="!selectedDestination">
                    确定
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getFavoriteListAPI } from '@/api/favoriteApi'
import { Search, Picture, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/**
 * @typedef {Object} Destination
 * @property {number} id - 目的地ID
 * @property {string} name - 目的地名称
 * @property {string} imageUrl - 图片URL
 * @property {number} rating - 评分
 * @property {Array<string>} tags - 标签列表
 */

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 对话框可见性
const visible = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value)
        if (!value) {
            // 关闭对话框时重置状态
            resetState()
        }
    }
})

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 分页参数
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)

// 目的地列表
const destinations = ref([])

// 选中的目的地
const selectedDestination = ref(null)

/**
 * 重置组件状态
 */
const resetState = () => {
    searchKeyword.value = ''
    currentPage.value = 1
    selectedDestination.value = null
}

/**
 * 获取收藏的目的地列表
 */
const fetchDestinations = async () => {
    try {
        loading.value = true
        const res = await getFavoriteListAPI(
            currentPage.value,
            pageSize.value,
            null,  // 不传分类ID，获取所有收藏
            searchKeyword.value || undefined  // 搜索关键词
        )
        if (res.data) {
            destinations.value = res.data.list || []
            total.value = res.data.total || 0
        } else {
            destinations.value = []
            total.value = 0
        }
    } catch (error) {
        console.error('获取目的地列表失败:', error)
        ElMessage.error('获取目的地列表失败')
        destinations.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

/**
 * 处理搜索
 */
const handleSearch = () => {
    currentPage.value = 1
    selectedDestination.value = null
    fetchDestinations()
}

/**
 * 处理页码变化
 */
const handleCurrentChange = (page) => {
    currentPage.value = page
    fetchDestinations()
}

/**
 * 处理每页条数变化
 */
const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchDestinations()
}

/**
 * 处理目的地选择
 * @param {Destination} destination - 选中的目的地
 */
const handleSelect = (destination) => {
    selectedDestination.value = destination
}

/**
 * 处理确认选择
 */
const handleConfirm = () => {
    if (selectedDestination.value) {
        emit('select', {
            id: selectedDestination.value.id,
            name: selectedDestination.value.name
        })
        visible.value = false
    }
}

// 监听对话框显示状态
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        // 显示对话框时获取数据
        fetchDestinations()
    }
})

// 监听搜索关键词变化
watch(searchKeyword, (newValue) => {
    if (newValue !== undefined) {
        handleSearch()
    }
}, { debounce: 300 })

// 组件挂载时获取目的地列表
onMounted(() => {
    fetchDestinations()
})
</script>

<style lang="scss" scoped>
.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2999;
}

.custom-dialog {
    width: 70%;
    max-width: 1200px;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    animation: dialog-fade-in 0.3s ease-out;
    position: relative;
    z-index: 3000;
}

.custom-dialog-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .custom-dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .close-btn {
        padding: 8px;
        font-size: 20px;
        color: var(--el-text-color-secondary);
        transition: all 0.3s ease;

        &:hover {
            color: var(--el-text-color-primary);
            transform: rotate(90deg);
        }
    }
}

.destination-selector {
    padding: 24px;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .destination-list {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 24px;

        &::-webkit-scrollbar {
            width: 6px;
            height: 6px;

            &-thumb {
                border-radius: 3px;
                background-color: var(--el-border-color-darker);
            }

            &-track {
                border-radius: 3px;
                background-color: var(--el-border-color-light);
            }
        }

        .el-empty {
            padding: 40px 0;
        }

        .destination-card {
            margin-bottom: 20px;
            cursor: pointer;
            height: 100%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid transparent;
            overflow: hidden;

            &:hover {
                transform: translateY(-6px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

                .destination-image {
                    transform: scale(1.05);
                }
            }

            &.is-selected {
                border-color: var(--el-color-primary);
                box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.15);

                .destination-info {
                    background-color: var(--el-color-primary-light-9);
                }
            }

            .destination-image {
                width: 100%;
                height: 200px;
                transition: transform 0.3s ease;
                border-radius: 8px 8px 0 0;
            }

            .image-placeholder {
                width: 100%;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--el-fill-color-lighter);
                color: var(--el-text-color-secondary);
                font-size: 32px;
            }

            .destination-info {
                padding: 16px;
                transition: background-color 0.3s ease;

                .destination-name {
                    margin: 0 0 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                    line-height: 1.4;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .destination-rating {
                    margin-bottom: 12px;

                    :deep(.el-rate) {
                        display: inline-flex;
                        align-items: center;

                        .el-rate__text {
                            color: var(--el-color-warning);
                            font-size: 14px;
                            margin-left: 8px;
                        }
                    }
                }

                .destination-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    min-height: 46px;

                    .tag {
                        margin: 0;
                        border-radius: 4px;
                        background-color: var(--el-color-primary-light-9);
                        border-color: var(--el-color-primary-light-8);
                        color: var(--el-color-primary);
                        transition: all 0.3s ease;

                        &:hover {
                            background-color: var(--el-color-primary-light-8);
                            transform: translateY(-2px);
                        }
                    }
                }
            }
        }
    }

    .pagination {
        padding: 24px 0 0;
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        justify-content: center;

        :deep(.el-pagination) {
            justify-content: center;
            padding: 0;
            margin: 0;

            .el-pagination__total,
            .el-pagination__sizes {
                margin-right: 16px;
            }

            .el-pagination__jump {
                margin-left: 16px;
            }

            button,
            .el-pager li {
                background-color: transparent;
                border-radius: 4px;
                transition: all 0.3s ease;

                &:hover {
                    background-color: var(--el-color-primary-light-9);
                }
            }

            button:disabled {
                background-color: transparent;
            }

            .el-pager li.is-active {
                background-color: var(--el-color-primary);
            }
        }
    }
}

.custom-dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

@keyframes dialog-fade-in {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>