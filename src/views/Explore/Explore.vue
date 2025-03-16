<template>
    <div class="explore-container">
        <!-- 搜索栏 -->
        <SearchBar ref="searchBarRef" :initial-tags="initialTags" @search="handleSearch" />

        <!-- 内容区域 -->
        <div class="content-wrapper">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-state">
                <el-icon class="icon-spin">
                    <Loading />
                </el-icon>
                <span>加载推荐中...</span>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-state">
                <el-icon>
                    <CircleClose />
                </el-icon>
                <span>{{ error }}</span>
                <el-button @click="fetchAllRecommendations" class="retry-btn">重试</el-button>
            </div>

            <!-- 推荐内容 -->
            <div v-else class="recommendations-container">
                <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="demo-tabs">
                    <el-tab-pane label="个性化推荐" name="personalized">
                        <!-- 个性化推荐 -->
                        <PersonalizedRecommendations :recommendations="recommendations"
                            :subtitle="getSubtitleForTab('personalized')" :title="getTitleForTab('personalized')"
                            @destination-click="handleDestinationClick" />
                        <!-- 加载更多触发器 -->
                        <div ref="loadTrigger" class="load-trigger">
                            <div v-if="isLoading" class="load-more loading">
                                <el-icon class="icon-spin">
                                    <Loading />
                                </el-icon>
                                <span>加载中...</span>
                            </div>
                            <div v-else-if="hasMore" class="load-more">
                                <span>更多推荐加载中...</span>
                            </div>
                            <div v-else class="no-more">
                                没有更多推荐了
                            </div>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="猜你喜欢" name="collaborative">
                        <div v-if="loadingCollaborative" class="loading-state">
                            <el-icon class="icon-spin">
                                <Loading />
                            </el-icon>
                            <span>加载推荐中...</span>
                        </div>
                        <div v-else-if="collaborativeRecommendations && collaborativeRecommendations.length > 0">
                            <!-- 协同过滤推荐 -->
                            <PersonalizedRecommendations :recommendations="collaborativeRecommendations"
                                :subtitle="getSubtitleForTab('collaborative')" :title="getTitleForTab('collaborative')"
                                @destination-click="handleDestinationClick" />
                        </div>
                        <div v-else class="empty-state">
                            <el-empty description="暂无推荐数据" />
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="相似用户喜欢" name="similarUsers">
                        <div v-if="loadingSimilarUsers" class="loading-state">
                            <el-icon class="icon-spin">
                                <Loading />
                            </el-icon>
                            <span>加载推荐中...</span>
                        </div>
                        <div v-else-if="similarUsersRecommendations && similarUsersRecommendations.length > 0">
                            <!-- 相似用户推荐 -->
                            <PersonalizedRecommendations :recommendations="similarUsersRecommendations"
                                :subtitle="getSubtitleForTab('similarUsers')" :title="getTitleForTab('similarUsers')"
                                @destination-click="handleDestinationClick" />
                        </div>
                        <div v-else class="empty-state">
                            <el-empty description="暂无推荐数据" />
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>

        <!-- 目的地详情弹窗 -->
        <DestinationDetailDialog v-model="showDetailDialog" :destination="selectedDestination"
            @close="closeDetailDialog" @similar-click="handleDestinationClick" @tag-click="handleTagClick" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, CircleClose } from '@element-plus/icons-vue';
import {
    getPersonalizedRecommendationsAPI,
    getCollaborativeFilteringRecommendationsAPI,
    getSimilarUsersRecommendationsAPI
} from '@/api/recommendApi';
import SearchBar from '@/components/Search/SearchBar.vue';
import PersonalizedRecommendations from './Personalization/PersonalizedRecommendations.vue';
import DestinationDetailDialog from './popUp/DestinationDetailDialog.vue';
import { useUserStore } from '@/stores/userstore'
import { useRouter, useRoute } from 'vue-router'

// 基础状态
const showDetailDialog = ref(false);
const hasMore = ref(true);
const isLoading = ref(false);
const loading = ref(false);
const error = ref(null);
const selectedDestination = ref(null);
const { push, replace } = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 添加缺失的状态变量
const activeTab = ref('personalized');

// 推荐数据
const recommendations = ref([]);
const collaborativeRecommendations = ref([]);
const similarUsersRecommendations = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 加载状态
const loadingCollaborative = ref(false);
const loadingSimilarUsers = ref(false);

// 加载触发器
const loadTrigger = ref(null);
let observer = null;

const searchBarRef = ref(null);

/**
 * 处理标签页点击事件
 * @param {Object} tab - 被点击的标签页对象
 */
const handleTabClick = (tab) => {
    // 调用原有的 handleTabChange 方法
    handleTabChange(tab.props.name);
};

/**
 * 处理标签页切换事件
 * @param {string} tab - 当前激活的标签页名称
 */
const handleTabChange = async (tab) => {
    switch (tab) {
        case 'personalized':
            if (recommendations.value.length === 0) {
                await fetchAllRecommendations();
            }
            break;
        case 'collaborative':
            if (collaborativeRecommendations.value.length === 0) {
                await fetchCollaborativeRecommendations();
            }
            break;
        case 'similarUsers':
            if (similarUsersRecommendations.value.length === 0) {
                await fetchSimilarUsersRecommendations();
            }
            break;
        default:
            console.log('未知标签页:', tab);
    }
};

// 获取协同过滤推荐
const fetchCollaborativeRecommendations = async () => {
    if (loadingCollaborative.value) return;

    loadingCollaborative.value = true;
    try {
        // 直接调用 API 而不是通过 store
        const response = await getCollaborativeFilteringRecommendationsAPI();
        if (response?.code === 0 && response?.data) {
            // 修改这里，使用 response.data.list 而不是 response.data
            collaborativeRecommendations.value = response.data.list || [];
        } else {
            console.error('协同过滤推荐数据格式错误:', response);
        }
    } catch (err) {
        console.error('获取协同过滤推荐失败:', err);
        handleError(err);
    } finally {
        loadingCollaborative.value = false;
    }
};

// 获取相似用户推荐
const fetchSimilarUsersRecommendations = async () => {
    if (loadingSimilarUsers.value) return;

    loadingSimilarUsers.value = true;
    try {
        // 直接调用 API 而不是通过 store
        const response = await getSimilarUsersRecommendationsAPI();
        if (response?.code === 0 && response?.data) {
            // 修改这里，使用 response.data.list 而不是 response.data
            similarUsersRecommendations.value = response.data.list || [];
        } else {
            console.error('相似用户推荐数据格式错误:', response);
        }
    } catch (err) {
        console.error('获取相似用户推荐失败:', err);
        handleError(err);
    } finally {
        loadingSimilarUsers.value = false;
    }
};

// 从路由获取初始标签
const initialTags = computed(() => {
    const tagString = route.query.tags;
    return tagString ? tagString.split(',').filter(Boolean) : [];
});

// 获取推荐数据的函数
const fetchAllRecommendations = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
        await nextTick();

        // 添加 forceRefresh 参数，当有 refresh 查询参数时强制刷新
        const forceRefresh = route.query.refresh === 'true';
        const response = await getPersonalizedRecommendationsAPI(1, pageSize.value, forceRefresh);

        if (response?.code === 0 && response?.data?.list) {
            recommendations.value = response.data.list;
            total.value = response.data.total || 0;
            hasMore.value = recommendations.value.length < (response.data.total || 0);
            currentPage.value = response.data.pageNum || 1;

            // 重新设置观察器
            nextTick(() => {
                createObserver();
                if (loadTrigger.value && hasMore.value) {
                    observer?.observe(loadTrigger.value);
                }
            });
        } else {
            throw new Error('数据格式错误');
        }
    } catch (err) {
        console.error('Fetch error:', err);

        // 处理401错误
        if (handleError(err)) return;

        // 处理重试逻辑
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
            loading.value = false; // 重置loading状态
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return fetchAllRecommendations(retryCount + 1);
        }

        // 设置错误信息
        error.value = err.message || '获取推荐失败，请稍后重试';
        ElMessage.error(error.value);

        // 清理数据
        recommendations.value = [];
        total.value = 0;
        hasMore.value = false;
        currentPage.value = 1;
    } finally {
        loading.value = false;
    }
};

// 路由参数监听
watch(
    () => route.query.refresh,
    async (newVal) => {
        if (newVal === 'true') {
            // 先滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            await fetchAllRecommendations();
            // 清除 refresh 参数，但不触发新的路由跳转
            replace({
                ...route,
                query: {}
            });
            // 确保在清除参数后重新设置观察器
            nextTick(() => {
                if (loadTrigger.value && hasMore.value) {
                    createObserver();
                    observer?.observe(loadTrigger.value);
                }
            });
        }
    },
    { immediate: true }
);

// 创建观察器的函数
const createObserver = () => {
    // 先清理旧的观察器
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    observer = new IntersectionObserver(
        (entries) => {
            const triggerEntry = entries[0];
            if (triggerEntry.isIntersecting && !isLoading.value && hasMore.value) {
                // console.log('触发加载更多'); // 添加日志
                loadMore();
            }
        },
        {
            root: null, // 使用视口作为根
            rootMargin: '50px', // 减小预加载距离
            threshold: 0 // 只要有一点进入视口就触发
        }
    );
};

// 处理目的地点击
const handleDestinationClick = (destination) => {
    selectedDestination.value = destination;
    showDetailDialog.value = true;
};

// 关闭详情弹窗
const closeDetailDialog = () => {
    showDetailDialog.value = false;
    selectedDestination.value = null;
};

// 处理标签点击
const handleTagClick = (tag) => {
    if (searchBarRef.value) {
        searchBarRef.value.addTag(tag);
    }
};

// 处理搜索函数
const handleSearch = ({ tags }) => {

    const formattedTags = Array.isArray(tags) ? tags.join(',') : tags;

    push({
        name: 'searchResults',
        query: {
            tags: formattedTags
        }
    });
};

// 优化错误处理逻辑
const handleError = (err) => {
    if (err.status === 401) {
        ElMessage.error('登录已过期，即将前往登录页');
        userStore.clear();
        setTimeout(() => {
            push('/login');
        }, 1000);
        return true;
    }
    return false;
};

// 优化加载更多函数
const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return;

    isLoading.value = true;
    try {
        const nextPage = currentPage.value + 1;
        const response = await getPersonalizedRecommendationsAPI(nextPage, pageSize.value, false);

        if (response.code === 0 && response.data?.list?.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 800));

            await nextTick(() => {
                recommendations.value = [...recommendations.value, ...response.data.list];
                hasMore.value = recommendations.value.length < total.value;
                currentPage.value = response.data.pageNum;
                total.value = response.data.total;
            });

            if (loadTrigger.value && hasMore.value) {
                createObserver();
                observer?.observe(loadTrigger.value);
            }
        } else {
            hasMore.value = false;
        }
    } catch (err) {
        if (err.response?.status === 401) {
            ElMessage.error('登录似乎过期了!');
            hasMore.value = false;
        }
    } finally {
        setTimeout(() => {
            isLoading.value = false;
        }, 300);
    }
};

// 监听 activeTab 的变化
watch(activeTab, (newTab, oldTab) => {
    handleTabChange(newTab);
});

// 组件挂载逻辑
onMounted(async () => {
    try {
        // 组件挂载时也滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        await nextTick();
        await fetchAllRecommendations();

        // 预加载其他推荐数据
        fetchCollaborativeRecommendations();
        fetchSimilarUsersRecommendations();

        if (!error.value) {
            nextTick(() => {
                createObserver();
                if (loadTrigger.value && hasMore.value) {
                    observer?.observe(loadTrigger.value);
                }
            });
        }
    } catch (err) {
        console.error('Mount error:', err);
    }
});

// 组件卸载时清理观察器
onUnmounted(() => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    // 重置相关状态
    hasMore.value = true;
    currentPage.value = 1;
    recommendations.value = [];
});

// 计算属性：根据不同标签页生成不同的副标题
const getSubtitleForTab = (tabName) => {
    switch (tabName) {
        case 'personalized':
            return `根据你的偏好精选(${recommendations.value.length})`;
        case 'collaborative':
            return `基于你的浏览历史推荐(${collaborativeRecommendations.value.length})`;
        case 'similarUsers':
            return `与你相似的用户也喜欢(${similarUsersRecommendations.value.length})`;
        default:
            return '';
    }
};

// 计算属性：根据不同标签页生成不同的标题
const getTitleForTab = (tabName) => {
    switch (tabName) {
        case 'personalized':
            return '为你推荐';
        case 'collaborative':
            return '猜你喜欢';
        case 'similarUsers':
            return '相似用户喜欢';
        default:
            return '为你推荐';
    }
};
</script>

<style lang="scss" scoped>
// 基础布局
.explore-container {
    background-color: #f5f5f5;
    min-height: 100vh;
    padding-bottom: 50px;
    user-select: none;
    position: relative; // 确保相对定位
}

// 内容区域
.content-wrapper {
    padding: 16px 20px;
    overflow-y: auto;
    position: relative; // 确保相对定位
    z-index: 1; // 降低内容区域的z-index，确保不会遮挡搜索栏的下拉菜单

    &::-webkit-scrollbar {
        display: none;
    }

    // 添加内容区域的过渡效果
    transition: all 0.3s ease;
    max-width: 1600px;
    margin: 0 auto;

    // 添加响应式内边距
    @media (max-width: 768px) {
        padding: 16px 10px;
    }
}

// 加载和错误状态
.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    gap: 12px;
    color: #666;

    .icon-spin {
        animation: spin 1s linear infinite;
    }

    .retry-btn {
        margin-top: 12px;
    }
}

// 推荐容器样式
.recommendations-container {
    transition: all 0.3s ease;
    width: 100%;

    // 添加子元素的过渡效果
    :deep(.recommendation-item) {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.5s ease forwards;

        @for $i from 1 through 10 {
            &:nth-child(#{$i}) {
                animation-delay: #{$i * 0.1}s;
            }
        }
    }
}

// 加载触发器样式
.load-trigger {
    padding: 20px 0;
    text-align: center;
    transition: all 0.3s ease;
}

.load-more,
.no-more {
    color: #666;
    font-size: 14px;
    padding: 10px 0;
    text-align: center;
    transition: all 0.3s ease;

    &.loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .icon-spin {
            animation: spin 1s linear infinite;
        }
    }
}

// 添加淡入上移动画
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 添加过渡组
.fade-move,
.fade-enter-active,
.fade-leave-active {
    transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

.fade-leave-active {
    position: absolute;
}

// 动画
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

// 添加空状态样式
.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.demo-tabs>.el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
}
</style>