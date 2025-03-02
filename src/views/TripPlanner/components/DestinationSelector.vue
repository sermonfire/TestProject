<template>
    <el-dialog v-model="visible" title="选择目的地" width="70%" :close-on-click-modal="false" destroy-on-close>
        <div class="destination-selector">
            <!-- 搜索栏 -->
            <div class="search-bar">
                <el-input v-model="searchKeyword" placeholder="搜索目的地..." clearable @input="handleSearch">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>

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
                                    <el-tag v-for="tag in item.destination.tags" :key="tag" size="small" class="tag">
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

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="!selectedDestination">
                    确定
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getFavoriteListAPI } from '@/api/favoriteApi'
import { Search, Picture } from '@element-plus/icons-vue'
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
.destination-selector {
    padding: 20px;

    .search-bar {
        margin-bottom: 20px;
    }

    .destination-list {
        min-height: 400px;
    }

    .destination-card {
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            transform: translateY(-5px);
        }

        &.is-selected {
            border: 2px solid var(--el-color-primary);
        }

        .destination-image {
            width: 100%;
            height: 200px;
            border-radius: 4px;
            overflow: hidden;
        }

        .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f7fa;
            color: #909399;
            font-size: 24px;
        }

        .destination-info {
            padding: 12px;

            .destination-name {
                margin: 0 0 8px;
                font-size: 16px;
                font-weight: 500;
                color: var(--el-text-color-primary);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .destination-rating {
                margin-bottom: 8px;
            }

            .destination-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;

                .tag {
                    margin-right: 4px;
                    margin-bottom: 4px;
                }
            }
        }
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: center;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>