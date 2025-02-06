<template>
	<div class="explore-container">
		<!-- 搜索栏 -->
		<SearchBar @search="handleSearch" />

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
			@similar-click="handleDestinationClick" />
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, CircleClose } from '@element-plus/icons-vue';
import { getPersonalizedRecommendationsAPI, getPreviewRecommendationsAPI } from '@/api/api';
import SearchBar from '@/components/Search/SearchBar.vue';
import PersonalizedRecommendations from './Personalization/PersonalizedRecommendations.vue';
import PopularDestinations from './Popular/PopularDestinations.vue';
import DestinationDetailDialog from './popUp/DestinationDetailDialog.vue';
import { useUserStore } from '@/stores/userstore'
import { useRouter } from 'vue-router'

// 基础状态
const showDetailDialog = ref(false);
const hasMore = ref(true);
const isLoading = ref(false);
const loading = ref(false);
const error = ref(null);
const selectedDestination = ref(null);
const similarDestinations = ref([]);
const { push } = useRouter()
const userStore = useUserStore()

// 推荐数据
const recommendations = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 新增 loadTrigger ref
const loadTrigger = ref(null);
let observer = null;

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

// 获取所有推荐数据
const fetchAllRecommendations = async () => {
	loading.value = true;
	error.value = null;
	try {
		const response = await getPersonalizedRecommendationsAPI(1, pageSize.value);
		if (response.code === 0 && response.data) {
			recommendations.value = response.data.list;
			total.value = response.data.total;
			hasMore.value = recommendations.value.length < response.data.total;
			currentPage.value = response.data.pageNum;
		} else {
			throw new Error('获取推荐失败');
		}
	} catch (err) {
		if (err.status === 401) {
			ElMessage.error('登录已过期，即将前往登录页')
			userStore.clear()
			setTimeout(() => {
				push('/login')
			}, 1000)
		} else if (err.message == '请求过于频繁') {
			ElMessage.error('请求过于频繁,请稍后再尝试')
		} else if (err.status === 500) {
			ElMessage.error('服务器似乎出了点问题')
		} else {
			ElMessage.error('获取推荐失败')
		}
	} finally {
		loading.value = false;
	}
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

// 处理搜索
const handleSearch = (query) => {
	// TODO: 实现搜索逻辑
	console.log('Searching for:', query);
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
			
			// 使用 nextTick 确保 DOM 更新后再添加新数据
			await nextTick(() => {
				recommendations.value = [...recommendations.value, ...response.data.list];
				hasMore.value = recommendations.value.length < total.value;
				currentPage.value = response.data.pageNum;
				total.value = response.data.total;
			});

			// 重新设置观察器
			nextTick(() => {
				if (loadTrigger.value && hasMore.value) {
					observer.observe(loadTrigger.value);
				}
			});
		} else {
			hasMore.value = false;
		}
	} catch (err) {
		ElMessage.error('加载更多失败');
		hasMore.value = false;
	} finally {
		// 添加延迟以平滑过渡加载状态
		setTimeout(() => {
			isLoading.value = false;
		}, 300);
	}
};

// 修改组件挂载时的初始化
onMounted(() => {
	fetchAllRecommendations().then(() => {
		// 数据加载完成后再初始化观察器
		nextTick(() => {
			createObserver();
			if (loadTrigger.value && hasMore.value) {
				observer.observe(loadTrigger.value);
			}
		});
	});
});

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