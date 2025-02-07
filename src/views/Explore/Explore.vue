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
				<!-- 个性化推荐 -->
				<PersonalizedRecommendations :recommendations="recommendations"
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
			</div>
		</div>

		<!-- 目的地详情弹窗 -->
		<DestinationDetailDialog v-model="showDetailDialog" :destination="selectedDestination"
			:similar-destinations="similarDestinations" @close="closeDetailDialog"
			@similar-click="handleDestinationClick" @tag-click="handleTagClick" />
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, CircleClose } from '@element-plus/icons-vue';
import { getPersonalizedRecommendationsAPI, getPreviewRecommendationsAPI } from '@/api/api';
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
const similarDestinations = ref([]);
const { push, replace } = useRouter()
const route = useRoute()
const userStore = useUserStore()
const router = useRouter()

// 推荐数据
const recommendations = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 新增 loadTrigger ref
const loadTrigger = ref(null);
let observer = null;

const searchBarRef = ref(null);

// 从路由获取初始标签
const initialTags = computed(() => {
	const tagString = route.query.tags;
	return tagString ? tagString.split(',').filter(Boolean) : [];
});

// 修改获取推荐数据的函数
const fetchAllRecommendations = async (retryCount = 0) => {
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 1000;
	
	if (loading.value) return; // 防止重复请求
	
	loading.value = true;
	error.value = null;
	
	try {
		// 等待组件挂载
		await nextTick();
		
		const response = await getPersonalizedRecommendationsAPI(1, pageSize.value);
		
		// 处理响应数据
		if (response?.code === 0 && response?.data?.list) {
			recommendations.value = response.data.list;
			total.value = response.data.total || 0;
			hasMore.value = recommendations.value.length < (response.data.total || 0);
			currentPage.value = response.data.pageNum || 1;
		} else {
			console.warn('Invalid response structure:', response);
			throw new Error('数据格式错误');
		}
	} catch (err) {
		console.error('Fetch error:', err);
		
		// 处理401错误
		if (err.status === 401) {
			ElMessage.error('登录已过期，即将前往登录页');
			userStore.clear();
			setTimeout(() => {
				push('/login');
			}, 1000);
			return;
		}
		
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

// 添加路由参数监听
watch(
	() => route.query.refresh,
	async (newVal) => {
		if (newVal === 'true') {
			await fetchAllRecommendations();
			// 清除 refresh 参数，但不触发新的路由跳转
			replace({ 
				...route,
				query: {} 
			});
		}
	},
	{ immediate: true }
);

// 修改创建观察器的函数
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
	similarDestinations.value = [];
};

// 处理标签点击
const handleTagClick = (tag) => {
	if (searchBarRef.value) {
		searchBarRef.value.addTag(tag);
	}
};

// 修改处理搜索函数
const handleSearch = ({ tags }) => {
	
	if (!tags || !tags.length) {
		ElMessage.warning('本项目暂不支持自定义搜索，只支持预设标签搜索');
		return;
	}
	
	const formattedTags = Array.isArray(tags) ? tags.join(',') : tags;
	
	router.push({
		name: 'searchResults',
		query: {
			tags: formattedTags
		}
	});
};

// 修改加载更多函数
const loadMore = async () => {
	if (!hasMore.value || isLoading.value) return;
	
	isLoading.value = true;
	try {
		const nextPage = currentPage.value + 1;
		const response = await getPersonalizedRecommendationsAPI(nextPage, pageSize.value);
		
		if (response.code === 0 && response.data && response.data.list.length > 0) {
			// 添加最小加载时间
			await new Promise(resolve => setTimeout(resolve, 800));
			
			await nextTick(() => {
				recommendations.value = [...recommendations.value, ...response.data.list];
				hasMore.value = recommendations.value.length < total.value;
				currentPage.value = response.data.pageNum;
				total.value = response.data.total;
			});
			
			// 重新设置观察器
			nextTick(() => {
				if (loadTrigger.value && hasMore.value) {
					observer?.observe(loadTrigger.value);
				}
			});
		} else {
			hasMore.value = false;
		}
	} catch (err) {
		// console.error('Load more error:', err);
		if(err.response.status === 401){
			// ElMessage.error('登录已过期，即将前往登录页');
			ElMessage.error('登录似乎过期了!');
			hasMore.value = false;
		}
		
	} finally {
		setTimeout(() => {
			isLoading.value = false;
		}, 300);
	}
};

// 修改组件挂载逻辑
onMounted(async () => {
	try {
		await nextTick();
		await fetchAllRecommendations();
		
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

// 添加错误重试按钮的处理函数
const handleRetry = async () => {
	await fetchAllRecommendations();
};

// 组件卸载时清理观察器
onUnmounted(() => {
	if (observer) {
		observer.disconnect();
		observer = null;
	}
});
</script>

<style lang="scss" scoped>
// 基础布局
.explore-container {
	background-color: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 50px;
	user-select: none;
}

// 内容区域
.content-wrapper {
	padding: 16px 20px;
	// height: calc(100vh - 140px);
	overflow-y: auto;

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

// 动画
@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

// 修改推荐容器样式
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

// 修改加载触发器样式
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
			transition: all 0.3s ease;
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

// 优化加载图标动画
@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
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
</style>