<template>
	<div class="preferences-container">
		<!-- 内容区域 -->
		<div class="content-wrapper">
			<!-- 旅行风格偏好 -->
			<div class="preference-section">
				<div class="section-header">
					<div class="section-title">旅行风格</div>
					<div class="section-desc">选择最能代表你的旅行方式（可多选）</div>
				</div>
				<div class="tags-container">
					<div v-for="style in travelStyles" :key="style.value"
						:class="['tag', { active: selectedStyles.includes(style.value) }]"
						@click="toggleStyle(style.value)">
						<el-icon>
							<component :is="ElementPlusIconsVue[style.icon]" />
						</el-icon>
						<span class="tag-text">{{ style.label }}</span>
					</div>
				</div>
			</div>

			<!-- 季节性偏好 -->
			<div class="preference-section">
				<div class="section-header">
					<div class="section-title">季节偏好</div>
					<div class="section-desc">选择你喜欢的旅行季节（必选，可多选）</div>
				</div>
				<div class="season-options">
					<div v-for="season in seasons" :key="season.value"
						:class="['season-option', { active: selectedSeasons.includes(season.value) }]"
						@click="toggleSeason(season.value)">
						<span class="season-name">{{ season.label }}</span>
					</div>
				</div>
			</div>

			<!-- 目的地类型偏好 -->
			<div class="preference-section">
				<div class="section-header">
					<div class="section-title">目的地类型</div>
					<div class="section-desc">选择你感兴趣的目的地类型（可多选）</div>
				</div>
				<div class="tags-container">
					<div v-for="type in destinationTypes" :key="type.value"
						:class="['tag', { active: selectedTypes.includes(type.value) }]"
						@click="toggleType(type.value)">
						<el-icon>
							<component :is="ElementPlusIconsVue[type.icon]" />
						</el-icon>
						<span class="tag-text">{{ type.label }}</span>
					</div>
				</div>
			</div>

			<!-- 预算范围 -->
			<div class="preference-section">
				<div class="section-header">
					<div class="section-title">预算范围</div>
					<div class="section-desc">选择你的每人每天预算范围（元）</div>
				</div>
				<div class="budget-slider">
					<div class="budget-value">¥{{ budget }}</div>
					<el-slider v-model="budget" :min="100" :max="2000" :show-tooltip="true" @change="onBudgetChange" />
					<div class="budget-range">
						<span>¥100</span>
						<span>¥2000</span>
					</div>
				</div>
			</div>

			<!-- 时长偏好 -->
			<div class="preference-section">
				<div class="section-header">
					<div class="section-title">时长偏好</div>
					<div class="section-desc">选择你理想的旅行时长</div>
				</div>
				<div class="duration-options">
					<div v-for="duration in durations" :key="duration.value"
						:class="['duration-option', { active: selectedDuration === duration.value }]"
						@click="selectDuration(duration.value)">
						<el-icon>
							<component :is="ElementPlusIconsVue[duration.icon]" />
						</el-icon>
						<div class="duration-label">{{ duration.label }}</div>
					</div>
				</div>
			</div>

			<!-- 保存按钮区域 -->
			<div class="save-section" :class="{ 'saving': isSaving }">
				<!-- 验证提示信息 -->
				<div v-if="!isValid" class="validation-message">
					{{ validationMessage }}
				</div>
				
				<!-- 添加保存提示 -->
				<div class="save-hint">
					<el-icon><InfoFilled /></el-icon>
					<span>保存后将自动为您跳转到个性化推荐页面</span>
				</div>
				
				<el-button 
					class="save-preferences-btn" 
					type="primary" 
					:loading="loading" 
					:disabled="!isValid"
					@click="savePreferences">
					{{ loading ? '保存中...' : '保存偏好设置' }}
				</el-button>

				<!-- 添加动画元素 -->
				<div class="save-animation">
					<div class="animation-circle"></div>
					<div class="animation-text">正在跳转到推荐页面...</div>
				</div>
			</div>

			<!-- 提示信息 -->
			<div class="tips-section">
				<div class="tips-text">提示：您可以随时更新偏好设置，我们会根据您的偏好实时调整推荐内容。</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { getUserPreferencesAPI, saveUserPreferencesAPI } from '@/api/api';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userstore';

const router = useRouter();

// 旅行风格选项
const travelStyles = [
	{ label: '文化探索', value: 'cultural', icon: 'Collection' },
	{ label: '美食之旅', value: 'food', icon: 'Food' },
	{ label: '自然观光', value: 'nature', icon: 'Tree' },
	{ label: '购物休闲', value: 'shopping', icon: 'ShoppingBag' },
	{ label: '冒险刺激', value: 'adventure', icon: 'Flag' },
	{ label: '历史古迹', value: 'historical', icon: 'Calendar' }
];

// 目的地类型选项
const destinationTypes = [
	{ label: '海滨度假', value: 'beach', icon: 'Sunny' },
	{ label: '城市观光', value: 'city', icon: 'OfficeBuilding' },
	{ label: '山川湖泊', value: 'mountain', icon: 'Location' },
	{ label: '乡村田园', value: 'countryside', icon: 'House' },
	{ label: '主题乐园', value: 'theme-park', icon: 'Star' },
	{ label: '温泉胜地', value: 'hot-spring', icon: 'WaterCup' }
];

// 时长选项
const durations = [
	{ label: '2-3天', value: 'short', icon: 'Calendar' },
	{ label: '4-7天', value: 'medium', icon: 'Calendar' },
	{ label: '7天以上', value: 'long', icon: 'Calendar' }
];

// 季节选项
const seasons = [
	{ label: '春季', value: 'spring' },
	{ label: '夏季', value: 'summer' },
	{ label: '秋季', value: 'autumn' },
	{ label: '冬季', value: 'winter' }
];

const userPreferences = ref({
	travelStyles: [],
	destinationTypes: [],
	seasonalPreferences: [],
	budget: 500,
	duration: '3-5天'
});

// 响应式状态
const selectedStyles = ref([]);
const selectedTypes = ref([]);
const budget = ref(500);
const selectedDuration = ref('');
const selectedSeasons = ref([]);
const loading = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);

// 计算属性：表单是否有效
const isValid = computed(() => {
	return selectedStyles.value.length > 0 &&
		selectedTypes.value.length > 0 &&
		selectedSeasons.value.length > 0 &&
		budget.value >= 100 &&
		selectedDuration.value !== '';
});

// 添加一个计算属性来获取未完成项目的提示信息
const validationMessage = computed(() => {
	const messages = [];
	if (selectedStyles.value.length === 0) {
		messages.push('旅行风格');
	}
	if (selectedTypes.value.length === 0) {
		messages.push('目的地类型');
	}
	if (selectedSeasons.value.length === 0) {
		messages.push('季节偏好');
	}
	if (!selectedDuration.value) {
		messages.push('时长偏好');
	}
	if (messages.length === 0) {
		return '';
	}
	return `请完善：${messages.join('、')}`;
});

// 方法
const toggleStyle = (value) => {
	const index = selectedStyles.value.indexOf(value);
	if (index === -1) {
		selectedStyles.value.push(value);
	} else {
		selectedStyles.value.splice(index, 1);
	}
};

const toggleType = (value) => {
	const index = selectedTypes.value.indexOf(value);
	if (index === -1) {
		selectedTypes.value.push(value);
	} else {
		selectedTypes.value.splice(index, 1);
	}
};

const toggleSeason = (season) => {
	const index = selectedSeasons.value.indexOf(season);
	if (index === -1) {
		selectedSeasons.value.push(season);
	} else {
		selectedSeasons.value.splice(index, 1);
	}
};

const onBudgetChange = (value) => {
	budget.value = value;
};

const selectDuration = (value) => {
	selectedDuration.value = value;
};

const userStore = useUserStore()

// 获取用户偏好
const fetchUserPreferences = async () => {

	try {
		const res = await getUserPreferencesAPI();
		if (res.code === 0 && res.data) {
			userPreferences.value = res.data;
			selectedStyles.value = res.data.travelStyles || [];
			selectedTypes.value = res.data.destinationTypes || [];
			budget.value = res.data.budget || 500;
			selectedDuration.value = res.data.duration || '3-5天';
			selectedSeasons.value = res.data.seasonalPreferences || [];
		}
	} catch (err) {
		if (err.response?.status === 401) {
			ElMessage.error('登录已过期，即将前往登录页');
			userStore.clear()
			setTimeout(() => {
				router.push('/login');
			}, 1000)
		} else if (err.message == '请求过于频繁') {
			ElMessage.error('请求过于频繁，请稍后再试');
		} else if (err.status === 500) {
			ElMessage.error('服务器似乎出了点问题')
		} else {
			ElMessage.error('获取偏好设置失败');
		}
	}
};

// 保存用户偏好
const savePreferences = async () => {
	const loadingInstance = ElLoading.service({
		lock: true,
		text: '保存中...',
		background: 'rgba(0, 0, 0, 0.7)'
	});
	
	isSaving.value = true;

	try {
		userPreferences.value = {
			travelStyles: selectedStyles.value,
			destinationTypes: selectedTypes.value,
			seasonalPreferences: selectedSeasons.value,
			budget: budget.value,
			duration: selectedDuration.value
		};

		const res = await saveUserPreferencesAPI(userPreferences.value);
		if (res.code === 0) {
			ElMessage.success('保存成功，即将为您跳转到推荐页面...');
			document.querySelector('.save-section').classList.add('saving');
			setTimeout(() => {
				window.location.replace('/explore');
			}, 2000);
		} else {
			ElMessage.error(res.message || '保存失败');
		}
	} catch (error) {
		if (error.response?.status === 400) {
			ElMessage.error('请检查并完善所有必填项');
		} else if (error.response?.status === 401) {
			ElMessage.error('登录已过期，请重新登录');
			userStore.clear();
			router.push('/login');
		} else {
			ElMessage.error('保存失败：' + (error.message || '未知错误'));
		}
	} finally {
		loadingInstance.close();
	}
};

onMounted(() => {
	fetchUserPreferences();
});
</script>

<style lang="scss" scoped>
.preferences-container {
	min-height: 100vh;
	background-color: #f5f5f5;
	user-select: none;

	.content-wrapper {
		padding: 16px 20px;
	}

	.preference-section {
		background: #fff;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

		.section-header {
			margin-bottom: 16px;

			.section-title {
				font-size: 18px;
				font-weight: 500;
				color: #333;
				margin-bottom: 8px;
			}

			.section-desc {
				font-size: 14px;
				color: #666;
			}
		}
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		padding: 16px;

		.tag {
			display: flex;
			align-items: center;
			padding: 8px 16px;
			background: #f5f5f5;
			border-radius: 20px;
			transition: all 0.3s;
			cursor: pointer;

			.tag-text {
				margin-left: 8px;
			}

			&.active {
				background: #2196F3;
				color: white;
			}
		}
	}

	.budget-slider {
		padding: 0 10px;

		.budget-value {
			font-size: 24px;
			font-weight: 500;
			color: #2196F3;
			text-align: center;
			margin-bottom: 16px;
		}

		.budget-range {
			display: flex;
			justify-content: space-between;
			margin-top: 8px;
			color: #999;
			font-size: 12px;
		}

		:deep(.el-slider__runway) {
			margin: 16px 0;
		}
	}

	.duration-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;

		.duration-option {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 16px;
			background: #f5f5f5;
			border-radius: 12px;
			transition: all 0.3s ease;
			cursor: pointer;

			.duration-label {
				margin-top: 8px;
				font-size: 14px;
				color: #666;
			}

			&.active {
				background: #E3F2FD;

				.duration-label {
					color: #2196F3;
				}
			}
		}
	}

	.season-options {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 12px;

		.season-option {
			padding: 8px 16px;
			border-radius: 20px;
			background: #f5f5f5;
			transition: all 0.3s ease;
			cursor: pointer;

			&.active {
				background: #2196F3;
				color: white;
			}

			.season-name {
				font-size: 14px;
			}
		}
	}

	.save-section {
		position: relative;
		margin: 20px 0;
		text-align: center;
		
		.save-hint {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 16px;
			color: #606266;
			font-size: 14px;
			gap: 8px;
			
			.el-icon {
				color: #409EFF;
				font-size: 16px;
			}
		}
		
		.validation-message {
			margin-bottom: 12px;
			color: #f56c6c;
			font-size: 14px;
		}
		
		.save-preferences-btn {
			position: relative;
			width: 280px;
			height: 45px;
			border-radius: 5px;
			font-size: 18px;
			font-weight: 500;
			transition: all 0.3s ease;
			
			&:active {
				transform: scale(0.95);
			}
		}
		
		.save-animation {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			opacity: 0;
			visibility: hidden;
			transition: all 0.5s ease;
			
			.animation-circle {
				width: 60px;
				height: 60px;
				border: 3px solid #409EFF;
				border-top-color: transparent;
				border-radius: 50%;
				margin-bottom: 16px;
				animation: spin 1s linear infinite;
			}
			
			.animation-text {
				color: #409EFF;
				font-size: 16px;
				font-weight: 500;
			}
		}
		
		&.saving {
			.save-preferences-btn {
				opacity: 0;
				transform: translateY(20px);
			}
			
			.save-animation {
				opacity: 1;
				visibility: visible;
			}
		}
	}

	.tips-section {
		padding: 20px 0;
		text-align: center;

		.tips-text {
			font-size: 14px;
			color: #999;
			line-height: 1.5;
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

// 添加淡出动画
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>