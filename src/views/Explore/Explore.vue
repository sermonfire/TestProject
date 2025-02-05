<template>
	<div class="explore-container">
		<!-- 搜索栏 -->
		<div class="search-bar">
			<div class="search-input-wrapper">
				<el-icon>
					<Search />
				</el-icon>
				<input type="text" v-model="searchQuery" placeholder="搜索目的地、景点、主题..." class="search-input"
					@input="handleSearch" />
			</div>
		</div>

		<!-- 内容区域 -->
		<div class="content-wrapper" v-infinite-scroll="loadMore" :infinite-scroll-disabled="!hasMore || isLoading"
			:infinite-scroll-distance="20">
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
				<PersonalizedRecommendations 
					:recommendations="recommendations.personalized"
					@destination-click="handleDestinationClick"
				/>
				<!-- 热门推荐 -->
				<PopularDestinations 
					:recommendations="recommendations.popular"
					@destination-click="handleDestinationClick"
				/>

				<!-- 加载更多 -->
				<div v-if="hasMore" class="load-more">
					<span v-if="isLoading">加载中...</span>
					<span v-else>上拉加载更多</span>
				</div>
			</div>
		</div>

		<!-- 目的地详情弹窗 -->
		<DestinationDetailDialog
			v-model="showDetailDialog"
			:destination="selectedDestination"
			:similar-destinations="similarDestinations"
			@close="closeDetailDialog"
			@similar-click="handleDestinationClick"
		/>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Loading, CircleClose } from '@element-plus/icons-vue';
import { getAllRecommendationsAPI, getSimilarDestinations } from '@/api/api';
import PersonalizedRecommendations from './Personalization/PersonalizedRecommendations.vue';
import PopularDestinations from './Popular/PopularDestinations.vue';
import DestinationDetailDialog from './popUp/DestinationDetailDialog.vue';

// 基础状态
const searchQuery = ref('');
const showDetailDialog = ref(false);
const hasMore = ref(true);
const isLoading = ref(false);
const loading = ref(false);
const error = ref(null);
const selectedDestination = ref(null);
const similarDestinations = ref([]);

// 推荐数据
const recommendations = ref({
	personalized: [],
	seasonal: [],
	popular: []
});

// 获取所有推荐数据
const fetchAllRecommendations = async () => {
	loading.value = true;
	error.value = null;
	try {
		const { data } = await getAllRecommendationsAPI();
		if (data) {
			recommendations.value = data;
		} else {
			throw new Error('获取推荐失败');
		}
	} catch (err) {
		error.value = err.message || '网络错误，请稍后重试';
		ElMessage.error(error.value);
	} finally {
		loading.value = false;
	}
};

// 处理目的地点击
const handleDestinationClick = async (destination) => {
	if (!destination.bestSeasons) {
		destination.bestSeasons = [];
	}
	selectedDestination.value = destination;

	try {
		const { data } = await getSimilarDestinations(destination.id);
		if (data) {
			similarDestinations.value = data;
		} else {
			similarDestinations.value = [];
			ElMessage.warning('暂无相似推荐');
		}
	} catch (err) {
		console.error('获取相似推荐失败:', err);
		similarDestinations.value = [];
		ElMessage.error('获取相似推荐失败');
	}

	showDetailDialog.value = true;
};

// 关闭详情弹窗
const closeDetailDialog = () => {
	showDetailDialog.value = false;
	selectedDestination.value = null;
	similarDestinations.value = [];
};

// 处理搜索
const handleSearch = () => {
	// TODO: 实现搜索逻辑
	console.log('Searching for:', searchQuery.value);
};

// 加载更多数据
const loadMore = async () => {
	if (!hasMore.value || isLoading.value) return;

	isLoading.value = true;
	try {
		// TODO: 实现加载更多逻辑
		await new Promise(resolve => setTimeout(resolve, 1000));
		hasMore.value = false;
	} catch (err) {
		ElMessage.error('加载更多失败');
	} finally {
		isLoading.value = false;
	}
};

// 页面加载时获取数据
onMounted(() => {
	fetchAllRecommendations();
});
</script>

<style lang="scss" scoped>
// 基础布局
.explore-container {
	background-color: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 50px;
}

// 搜索栏
.search-bar {
	background-color: #fff;
	padding: 10px 20px;
	position: sticky;
	top: 0;
	z-index: 10;

	.search-input-wrapper {
		background-color: #f5f5f5;
		border-radius: 20px;
		padding: 10px 15px;
		display: flex;
		align-items: center;
		gap: 10px;

		.search-input {
			flex: 1;
			border: none;
			background: transparent;
			font-size: 16px;
			outline: none;

			&::placeholder {
				color: #999;
			}
		}
	}
}

// 内容区域
.content-wrapper {
	padding: 20px;
	height: calc(100vh - 140px);
	overflow-y: auto;

	&::-webkit-scrollbar {
		display: none;
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
</style>