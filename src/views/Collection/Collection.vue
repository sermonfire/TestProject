<template>
    <div class="collection-page">
        <div class="collection-container">
            <!-- 左侧分类栏 -->
            <div class="category-panel">
                <!-- 面板头部 -->
                <div class="panel-header">
                    <div class="header-content">
                        <h3 class="title">我的收藏</h3>
                        <p class="subtitle">管理您的收藏内容</p>
                    </div>
                    <div class="stats">
                        <div class="stat-item">
                            <div class="stat-value">{{ favoriteStats?.totalCount || 0 }}</div>
                            <div class="stat-label">总收藏</div>
                        </div>
                        <div class="divider"></div>
                        <div class="stat-item">
                            <div class="stat-value">{{ total || 0 }}</div>
                            <div class="stat-label">{{ currentCategory?.name || '全部收藏' }}</div>
                        </div>
                    </div>
                </div>

                <!-- 分类列表区域 -->
                <div class="category-list-wrapper">
                    <FavoriteCategory @select="handleCategorySelect" :is-searching="!!searchQuery.trim()"
                        :search-category-stats="searchCategoryStats" :current-total="total" :favorites="favorites" />
                </div>
            </div>

            <!-- 右侧收藏列表 -->
            <div class="content-panel">
                <div class="content-header">
                    <div class="header-left">
                        <h2>{{ currentCategory?.name || '全部收藏' }}</h2>
                        <span class="item-count">{{ total }} 个收藏</span>
                    </div>
                    <div class="header-right">
                        <div class="search-box">
                            <el-input v-model="searchQuery" placeholder="搜索收藏..." clearable @clear="handleSearch"
                                @keyup.enter="handleSearch">
                                <template #prefix>
                                    <el-icon>
                                        <Search />
                                    </el-icon>
                                </template>
                            </el-input>
                        </div>
                    </div>
                </div>

                <FavoriteList ref="favoriteListRef" :favorites="processedFavorites" v-model:current-page="currentPage"
                    v-model:page-size="pageSize" :total="total" :view-mode="viewMode" :loading="loading"
                    @page-change="handlePageChange" @size-change="handleSizeChange" @refresh="handleRefresh"
                    @collection-change="loadFavorites" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Grid, List, Search, Plus } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import FavoriteCategory from '@/components/FavoriteCategory/FavoriteCategory.vue'
import FavoriteList from '@/components/FavoriteList/FavoriteList.vue'
import { ElMessage } from 'element-plus'
import { getFavoriteListAPI } from '@/api/api'

const favoriteStore = useFavoriteStore()
const favoriteListRef = ref(null)
const selectedItems = ref([])

// 收藏列表状态
const favorites = ref([])
const currentPage = ref(1)
const pageSize = ref(9)
const total = ref(0)
const loading = ref(false)

// 视图模式状态
const viewMode = ref('grid')

// 计算属性
const currentCategory = computed(() => {
    const categoryId = favoriteStore.selectedCategory
    return favoriteStore.categories.find(c => c.id === categoryId)
})

const favoriteStats = computed(() => favoriteStore.favoriteStats)

// 添加搜索分类统计状态
const searchCategoryStats = ref({})

// 加载收藏列表方法
const loadFavorites = async () => {
    try {
        loading.value = true
        const categoryId = favoriteStore.selectedCategory
        const res = await getFavoriteListAPI(currentPage.value, pageSize.value, categoryId)

        if (res.code === 0) {
            favorites.value = res.data.list || []
            total.value = res.data.total || 0

            // 更新收藏统计
            await favoriteStore.getFavoriteStats()
        }
    } catch (error) {
        console.error('Failed to load favorites:', error)
        ElMessage.error('获取收藏列表失败')
    } finally {
        loading.value = false
    }
}

// 刷新方法
const handleRefresh = async () => {
    try {
        loading.value = true
        // 重置页码
        currentPage.value = 1
        // 重新加载数据
        await loadFavorites()
        // 更新收藏统计
        await favoriteStore.getFavoriteStats()
    } catch (error) {
        console.error('刷新收藏列表失败:', error)
        ElMessage.error('刷新失败，请重试')
    } finally {
        loading.value = false
    }
}

// 监听逻辑
watch(
    () => favoriteStore.favorites,
    async (newVal, oldVal) => {
        if (!newVal || !oldVal) return

        // 检测到收藏数量减少（取消收藏）时
        if (newVal.length < oldVal.length) {
            loading.value = true
            try {
                // 获取被删除的项的ID
                const deletedItems = oldVal.filter(
                    oldItem => !newVal.find(newItem => newItem.id === oldItem.id)
                )

                if (deletedItems.length > 0) {
                    // 等待一小段时间确保删除请求完成
                    await new Promise(resolve => setTimeout(resolve, 300))

                    // 检查被删除项的状态
                    const statuses = await favoriteStore.batchCheckFavoriteStatus(
                        deletedItems.map(item => item.id)
                    )

                    // 如果有状态不一致，刷新页面
                    if (statuses.some(status => status)) {
                        await loadFavorites(true, true)
                    }
                }
            } catch (error) {
                console.error('Status check failed:', error)
                await loadFavorites(true, true)
            } finally {
                loading.value = false
            }
        }
    },
    { deep: true }
)

// 分类选择处理方法
const handleCategorySelect = async (category) => {
    try {
        favoriteStore.selectedCategory = category.id
        // 如果有搜索关键词，需要在新分类下重新搜索
        if (searchQuery.value.trim()) {
            await handleSearch()
        } else {
            // 重置页码并重新加载数据
            currentPage.value = 1
            await loadFavorites()
        }
    } catch (error) {
        console.error('切换分类失败:', error)
        ElMessage.error('切换分类失败，请重试')
    }
}

// 分页处理方法，添加更多的错误处理
const handlePageChange = async (page) => {
    try {
        currentPage.value = page
        await loadFavorites()
    } catch (error) {
        console.error('切换页码失败:', error)
        ElMessage.error('切换页码失败，请重试')
    }
}

const handleSizeChange = async (size) => {
    try {
        pageSize.value = size
        currentPage.value = 1  // 切换每页数量时重置为第一页
        await loadFavorites()
    } catch (error) {
        console.error('切换每页数量失败:', error)
        ElMessage.error('切换每页数量失败，请重试')
    }
}

// 生命周期钩子
onMounted(async () => {
    try {
        await favoriteStore.getCategories()

        if (!favoriteStore.selectedCategory && favoriteStore.categories.length) {
            // console.log('未选中分类，寻找默认分类...')
            const defaultCategory = favoriteStore.categories.find(c => c.isDefault)
            if (defaultCategory) {
                // console.log('找到默认分类:', defaultCategory)
                favoriteStore.selectedCategory = defaultCategory.id
            }
        }

        // 获取收藏列表和统计信息
        await loadFavorites()
    } catch (error) {
        console.error('初始化数据失败:', error)
        ElMessage.error('初始化数据失败，请刷新页面重试')
    }
})

// 提供给子组件的方法
defineExpose({
    loadFavorites
})

// 清理函数
const cleanup = () => {
    // 如果需要清理选中状态，应该通过 ref 调用子组件的方法
    // 或者通过状态管理来处理
}

// 组件卸载前清理
onBeforeUnmount(() => {
    cleanup()
})

const searchQuery = ref('')

const handleSearch = async () => {
    try {
        loading.value = true
        currentPage.value = 1 // 重置页码

        if (searchQuery.value.trim()) {
            // 如果有搜索关键词，调用搜索API
            const res = await favoriteStore.searchFavorites(
                searchQuery.value.trim(),
                currentPage.value,
                pageSize.value,
                favoriteStore.selectedCategory
            )
            if (res) {
                favorites.value = res.list || []
                total.value = res.total || 0
                searchCategoryStats.value = res.categoryStats || {}

                // 更新分类统计
                await favoriteStore.getFavoriteStats()

                // 如果当前分类下没有搜索结果，但其他分类有
                if (total.value === 0 && Object.values(res.categoryStats).some(count => count > 0)) {
                    ElMessage({
                        type: 'info',
                        message: '当前分类下没有找到相关收藏，已显示所有匹配结果'
                    })
                    // 清除分类选择，显示所有搜索结果
                    favoriteStore.selectedCategory = null
                    // 重新搜索所有分类
                    const allRes = await favoriteStore.searchFavorites(
                        searchQuery.value.trim(),
                        currentPage.value,
                        pageSize.value
                    )
                    if (allRes) {
                        favorites.value = allRes.list || []
                        total.value = allRes.total || 0
                        searchCategoryStats.value = allRes.categoryStats || {}
                    }
                }
            }
        } else {
            // 如果搜索框为空，重置搜索状态并加载正常列表
            searchCategoryStats.value = {}
            await loadFavorites()
        }
    } catch (error) {
        console.error('搜索失败:', error)
        ElMessage.error('搜索失败，请重试')
    } finally {
        loading.value = false
    }
}

// 添加防抖处理
const debounce = (fn, delay) => {
    let timer = null
    return function (...args) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), delay)
    }
}

// 创建防抖后的搜索函数
const debouncedSearch = debounce(handleSearch, 300)

// 监听搜索输入
watch(searchQuery, () => {
    debouncedSearch()
})

// 数据预处理
const processedFavorites = computed(() => {
    return favorites.value.map(item => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : [],
        imageUrl: item.imageUrl || '/path/to/default-image.jpg',
        categoryName: item.categoryName || '未分类'
    }))
})
</script>

<style lang="scss" scoped>
.collection-page {
    min-height: 100vh;
    background-color: #f8fafc;
    padding: 32px;

    .collection-container {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 32px;
        max-width: 1600px;
        margin: 0 auto;
        user-select: none;

        .category-panel {
            background: white;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            min-height: calc(100vh - 64px);
            position: sticky;
            top: 32px;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            .panel-header {
                flex-shrink: 0;
                padding: 32px;
                background: linear-gradient(135deg, #4f46e5, #6366f1);
                position: relative;
                overflow: hidden;

                // 优化背景图案
                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background:
                        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.1) 20%, transparent 20.5%),
                        radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.1) 20%, transparent 20.5%),
                        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.1) 20%, transparent 20.5%),
                        radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.1) 20%, transparent 20.5%);
                    background-size: 50% 50%;
                    background-position: 0 0;
                    opacity: 0.3;
                }

                .header-content {
                    position: relative;
                    margin-bottom: 24px;

                    .title {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                        color: white;
                        letter-spacing: -0.5px;
                        line-height: 1.2;
                    }

                    .subtitle {
                        margin: 8px 0 0;
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 400;
                    }
                }

                .stats {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(8px);

                    .stat-item {
                        flex: 1;
                        text-align: center;

                        .stat-value {
                            font-size: 32px;
                            font-weight: 700;
                            color: white;
                            line-height: 1.2;
                            margin-bottom: 4px;
                        }

                        .stat-label {
                            font-size: 13px;
                            color: rgba(255, 255, 255, 0.9);
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                    }

                    .divider {
                        width: 1px;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.2);
                    }
                }
            }

            .category-list-wrapper {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
                background: #fff;

                // 优化滚动条样式
                &::-webkit-scrollbar {
                    width: 4px;
                }

                &::-webkit-scrollbar-track {
                    background: transparent;
                }

                &::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;

                    &:hover {
                        background: #94a3b8;
                    }
                }

                // 优化渐变遮罩
                mask-image: linear-gradient(to bottom,
                    transparent,
                    black 5%,
                    black 95%,
                    transparent);
            }
        }

        .content-panel {
            background: white;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            overflow: hidden;

            .content-header {
                padding: 24px 32px;
                border-bottom: 1px solid #f1f5f9;
                display: flex;
                justify-content: space-between;
                align-items: center;

                .header-left {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;

                    h2 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 700;
                        color: #1e293b;
                    }

                    .item-count {
                        color: #64748b;
                        font-size: 14px;
                    }
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;

                    .search-box {
                        width: 240px;

                        :deep(.el-input) {
                            .el-input__wrapper {
                                background: #f8fafc;
                                border: none;
                                box-shadow: none;
                                transition: all 0.3s ease;

                                &:hover,
                                &:focus-within {
                                    background: #f1f5f9;
                                }

                                .el-input__inner {
                                    color: #1e293b;

                                    &::placeholder {
                                        color: #94a3b8;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// 优化响应式布局
@media screen and (max-width: 1400px) {
    .collection-container {
        grid-template-columns: 280px 1fr !important;
    }
}

@media screen and (max-width: 1200px) {
    .collection-page {
        padding: 24px;
    }

    .collection-container {
        gap: 24px;
    }
}

@media screen and (max-width: 768px) {
    .collection-page {
        padding: 16px;
    }

    .collection-container {
        grid-template-columns: 1fr !important;
        gap: 16px;

        .category-panel {
            min-height: auto;
            position: relative;
            top: 0;
            margin-bottom: 16px;

            .panel-header {
                padding: 24px;

                .header-content {
                    margin-bottom: 20px;

                    .title {
                        font-size: 24px;
                    }
                }

                .stats {
                    padding: 12px;
                    gap: 16px;

                    .stat-item {
                        .stat-value {
                            font-size: 24px;
                        }

                        .stat-label {
                            font-size: 12px;
                        }
                    }

                    .divider {
                        height: 32px;
                    }
                }
            }

            .category-list-wrapper {
                max-height: 300px;
                padding: 20px;
            }
        }
    }
}

// 优化暗色主题
:root[data-theme='dark'] {
    .collection-page {
        background-color: #0f172a;

        .collection-container {
            .category-panel {
                background: #1e293b;

                .panel-header {
                    background: linear-gradient(135deg, #3730a3, #4f46e5);

                    .stats {
                        background: rgba(0, 0, 0, 0.2);
                    }
                }

                .category-list-wrapper {
                    background: #1e293b;

                    &::-webkit-scrollbar-thumb {
                        background: #334155;

                        &:hover {
                            background: #475569;
                        }
                    }
                }
            }
        }
    }
}

// 动画效果优化
.collection-container {
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 添加过渡效果
.category-panel,
.content-panel {
    will-change: transform;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 添加hover效果
.content-panel {
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
}
</style>