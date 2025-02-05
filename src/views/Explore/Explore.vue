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
		<el-dialog v-model="showDetailDialog" :title="selectedDestination?.name" width="35%"
			class="destination-detail-dialog" :before-close="closeDetailDialog">
			<div class="detail-content">
				<el-image :src="selectedDestination?.imageUrl" fit="cover" class="detail-image" />

				<div class="detail-info-section">
					<div class="detail-meta">
						<div class="meta-item">
							<el-icon color="#FFB800">
								<Star />
							</el-icon>
							<span>{{ selectedDestination?.rating }} 分</span>
						</div>
						<div class="meta-item">
							<el-icon>
								<Calendar />
							</el-icon>
							<span>建议游玩 {{ selectedDestination?.recommendedDuration }}</span>
						</div>
						<div class="meta-item">
							<el-icon>
								<Wallet />
							</el-icon>
							<span>人均 ¥{{ selectedDestination?.averageBudget }}/天</span>
						</div>
					</div>

					<div class="detail-tags">
						<span v-for="(tag, index) in selectedDestination?.tags" :key="index" class="tag">{{ tag }}</span>
					</div>

					<div class="detail-description">
						<h3 class="section-title">目的地简介</h3>
						<p class="description-text">{{ selectedDestination?.description }}</p>
					</div>

					<div class="best-seasons">
						<h3 class="section-title">最佳游玩季节</h3>
						<div class="seasons-list">
							<template v-if="selectedDestination?.bestSeasons?.length">
								<span v-for="(season, index) in selectedDestination.bestSeasons" :key="index"
									class="season-tag">{{ season }}</span>
							</template>
							<template v-else>
								<span class="season-tag all-season">全年适宜</span>
								<span class="season-desc">该目的地四季皆宜，可根据个人喜好选择出行时间</span>
							</template>
						</div>
					</div>

					<!-- 季节特色 -->
					<div v-if="selectedDestination?.seasonalFeatures" class="seasonal-features">
						<h3 class="section-title">季节特色</h3>
						<div class="features-list">
							<div v-for="(feature, season) in selectedDestination.seasonalFeatures" :key="season"
								class="feature-item">
								<span class="feature-season">{{ season }}</span>
								<span class="feature-desc">{{ feature }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- 相似推荐 -->
				<div v-if="similarDestinations.length" class="similar-destinations">
					<div class="section-header">
						<span class="section-title">相似推荐</span>
						<span class="section-subtitle">你可能也会喜欢</span>
					</div>
					<el-scrollbar>
						<div class="similar-grid">
							<div v-for="dest in similarDestinations" :key="dest.id" class="similar-item"
								@click="handleDestinationClick(dest)">
								<el-image :src="dest.imageUrl" fit="cover" class="similar-image" />
								<div class="similar-info">
									<span class="similar-name">{{ dest.name }}</span>
									<div class="similar-meta">
										<span class="similar-rating">{{ dest.rating }}分</span>
										<span class="similar-price">¥{{ dest.averageBudget }}/天</span>
									</div>
								</div>
							</div>
						</div>
					</el-scrollbar>
				</div>
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Star, Calendar, Wallet, Loading, CircleClose } from '@element-plus/icons-vue';
import { getAllRecommendationsAPI, getSimilarDestinations } from '@/api/api';
import PersonalizedRecommendations from './Personalization/PersonalizedRecommendations.vue';
import PopularDestinations from './Popular/PopularDestinations.vue';

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

// 获取当前季节
const getCurrentSeason = () => {
	const month = new Date().getMonth() + 1;
	if (month >= 3 && month <= 5) return '春季';
	if (month >= 6 && month <= 8) return '夏季';
	if (month >= 9 && month <= 11) return '秋季';
	return '冬季';
};

// 获取季节性副标题
const getSeasonalSubtitle = () => {
	const season = getCurrentSeason();
	const subtitles = {
		'春季': '春暖花开，正是出游好时节',
		'夏季': '避暑胜地，清凉一夏',
		'秋季': '秋高气爽，赏景正当时',
		'冬季': '冰雪世界，温暖相伴'
	};
	return subtitles[season];
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

	nextTick(() => {
		const detailContent = document.querySelector('.detail-content');
		if (detailContent) {
			detailContent.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}
	});
};

// 关闭详情弹窗
const closeDetailDialog = () => {
	showDetailDialog.value = false;
	nextTick(() => {
		selectedDestination.value = null;
		similarDestinations.value = [];
	});
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

// 推荐区域
.recommendations-container {
	.section {
		margin-bottom: 30px;

		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;

			.section-title {
				font-size: 18px;
				font-weight: bold;
				color: #333;
			}

			.section-subtitle {
				font-size: 14px;
				color: #666;
			}
		}
	}
}

// 推荐卡片网格
.recommendations-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;

	.destination-card {
		background-color: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
		cursor: pointer;

		&:hover {
			transform: translateY(-5px);
		}

		.destination-image {
			width: 100%;
			height: 200px;
			object-fit: cover;
		}

		.destination-info {
			padding: 16px;

			.destination-name {
				font-size: 18px;
				font-weight: 600;
				color: #333;
				margin-bottom: 12px;
				display: block;
			}

			.destination-meta {
				display: flex;
				justify-content: space-between;
				margin-bottom: 12px;

				.meta-item {
					display: flex;
					align-items: center;
					gap: 4px;
					color: #666;
					font-size: 14px;
				}
			}

			.destination-tags {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;

				.tag {
					background-color: #f5f5f5;
					padding: 4px 12px;
					border-radius: 12px;
					font-size: 12px;
					color: #666;
				}
			}
		}
	}
}

// 详情弹窗样式
:deep(.destination-detail-dialog) {
	.el-dialog__body {
		padding: 0;
	}

	.detail-content {
		max-height: 70vh;
		overflow-y: auto;

		.detail-image {
			width: 100%;
			height: 240px;
			object-fit: cover;
		}

		.detail-info-section {
			padding: 24px;

			.detail-meta {
				display: flex;
				justify-content: space-between;
				background: #f8f9fa;
				padding: 16px;
				border-radius: 12px;
				margin-bottom: 24px;

				.meta-item {
					display: flex;
					align-items: center;
					gap: 8px;
					color: #666;
				}
			}

			.detail-tags {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
				margin-bottom: 24px;

				.tag {
					background: rgba(33, 150, 243, 0.1);
					color: #2196f3;
					padding: 6px 16px;
					border-radius: 20px;
					font-size: 14px;
				}
			}

			.section-title {
				font-size: 18px;
				font-weight: 600;
				color: #333;
				margin-bottom: 16px;
				position: relative;
				padding-left: 12px;

				&::before {
					content: '';
					position: absolute;
					left: 0;
					top: 50%;
					transform: translateY(-50%);
					width: 4px;
					height: 16px;
					background: #2196f3;
					border-radius: 2px;
				}
			}

			.description-text {
				color: #666;
				line-height: 1.8;
				margin-bottom: 24px;
			}
		}
	}
}

// 相似推荐
.similar-destinations {
	padding: 24px;
	background: #f8f9fa;

	.similar-grid {
		display: flex;
		gap: 16px;
		padding: 4px;

		.similar-item {
			flex: 0 0 160px;
			background: #fff;
			border-radius: 8px;
			overflow: hidden;
			cursor: pointer;
			transition: transform 0.3s ease;

			&:hover {
				transform: translateY(-4px);
			}

			.similar-image {
				width: 100%;
				height: 120px;
				object-fit: cover;
			}

			.similar-info {
				padding: 12px;

				.similar-name {
					font-size: 14px;
					font-weight: 500;
					color: #333;
					margin-bottom: 8px;
					display: block;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.similar-meta {
					display: flex;
					justify-content: space-between;
					font-size: 12px;

					.similar-rating {
						color: #ff9800;
					}

					.similar-price {
						color: #f44336;
					}
				}
			}
		}
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