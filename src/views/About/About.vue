<template>
	<div class="about-container">
		<!-- 内容区域 -->
		<div class="content-wrapper">
			<!-- 项目介绍 -->
			<div class="section">
				<h2>关于TravelRec</h2>
				<div class="intro">
					<div class="logo-wrapper" :style="{ backgroundColor: '#f5f5f5' }">
						<img 
							:src="getImageUrl('logo.png')" 
							alt="TravelRec Logo"
							@error="handleImageError"
							v-show="!imageErrors.logo"
						/>
						<div v-if="imageErrors.logo" class="placeholder-box">
							TravelRec
						</div>
					</div>
					<p>TravelRec是一个智能旅游推荐系统,致力于为用户提供个性化的旅行建议。</p>
				</div>
			</div>

			<!-- 核心功能 -->
			<div class="section">
				<h2>核心功能</h2>
				<div class="features">
					<div class="feature" v-for="(feature, index) in features" :key="index">
						<div class="feature-image" :style="{ backgroundColor: '#f0f0f0' }">
							<img 
								:src="getImageUrl(`feature${index + 1}.png`)"
								:alt="feature.title"
								@error="handleImageError($event, `feature${index + 1}`)"
								v-show="!imageErrors[`feature${index + 1}`]"
							/>
							<div v-if="imageErrors[`feature${index + 1}`]" class="placeholder-box">
								{{ feature.title }}
							</div>
						</div>
						<h3>{{ feature.title }}</h3>
						<p>{{ feature.description }}</p>
					</div>
				</div>
			</div>

			<!-- 技术栈 -->
			<div class="section">
				<h2>技术栈</h2>
				<div class="tech-stack">
					<div class="tech-item" v-for="(tech, index) in techStack" :key="index">
						<div class="tech-icon" :style="{ backgroundColor: '#f0f0f0' }">
							<img 
								:src="getImageUrl(`${tech.icon}.png`)"
								:alt="tech.name"
								@error="handleImageError($event, tech.icon)"
								v-show="!imageErrors[tech.icon]"
							/>
							<div v-if="imageErrors[tech.icon]" class="placeholder-box">
								{{ tech.name }}
							</div>
						</div>
						<span>{{ tech.name }}</span>
					</div>
				</div>
			</div>

			<!-- 团队介绍 -->
			<div class="section">
				<div class="section-header">
					<el-icon color="#2196F3" :size="24"><User /></el-icon>
					<span class="section-title">开发团队</span>
				</div>
				<div class="team-members">
					<div class="member-card" v-for="(member, index) in teamMembers" :key="index">
						<img :src="member.avatar" class="member-avatar" :alt="member.name" />
						<span class="member-name">{{ member.name }}</span>
						<span class="member-role">{{ member.role }}</span>
					</div>
				</div>
			</div>

			<!-- 联系我们 -->
			<div class="section">
				<div class="section-header">
					<el-icon color="#2196F3" :size="24"><Phone /></el-icon>
					<span class="section-title">联系我们</span>
				</div>
				<div class="contact-info">
					<div class="contact-item" v-for="(contact, index) in contactInfo" :key="index">
						<el-icon color="#666" :size="20"><component :is="contact.icon" /></el-icon>
						<span class="contact-text">{{ contact.value }}</span>
					</div>
				</div>
			</div>

			<!-- 版本信息 -->
			<div class="version-info">
				<span class="version-text">当前版本：v1.0.0</span>
				<span class="copyright">© 2024 TravelRec. All rights reserved.</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Location, Calendar, Medal, Wallet, Message, Phone, InfoFilled, Star, User } from '@element-plus/icons-vue';

// 用于跟踪图片加载错误状态
const imageErrors = ref({
	logo: false,
	feature1: false,
	feature2: false,
	feature3: false,
	vue: false,
	element: false,
	pinia: false
});

// 处理图片加载错误
const handleImageError = (event, imageKey = 'logo') => {
	imageErrors.value[imageKey] = true;
};

// 获取图片URL的函数
const getImageUrl = (name) => {
	return new URL(`../../static/about/${name}`, import.meta.url).href;
};

// 核心功能数据
const features = ref([
	{
		title: '智能推荐',
		description: '基于用户偏好和行为数据,提供个性化的旅游目的地推荐'
	},
	{
		title: '行程规划',
		description: '智能生成最优旅行路线,包含交通、住宿等完整建议'
	},
	{
		title: '社区互动',
		description: '用户可以分享旅行体验,互相交流获取灵感'
	}
]);

// 团队成员数据
const teamMembers = ref([
	{
		avatar: '/src/assets/about/avatar1.jpg',
		name: 'xxx',
		role: '项目前后端负责人'
	}
]);

// 联系方式数据
const contactInfo = ref([
	{
		icon: 'Message',
		value: 'contact@travelrec.com'
	},
	{
		icon: 'Phone',
		value: '400-123-4567'
	},
	{
		icon: 'Location',
		value: '北京市海淀区XX大厦'
	}
]);

const techStack = ref([
	{ name: 'Vue3', icon: 'vue' },
	{ name: 'Element Plus', icon: 'element' },
	{ name: 'Pinia', icon: 'pinia' }
]);
</script>

<style lang="scss" scoped>
.about-container {
	height: 100%;
	display: flex;
	flex-direction: column;
}

.content-wrapper {
	flex: 1;
	padding: 20px;
	background-color: #f5f5f5;
	// width: 95%;
	// margin-left: 20px;
}

.section {
	background: #fff;
	border-radius: 12px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);

	h2 {
		font-size: 28px;
		margin-bottom: 30px;
		color: #333;
	}
}

.intro {
	display: flex;
	align-items: center;
	gap: 30px;

	.logo-wrapper {
		width: 200px;
		height: 200px;
		border-radius: 10px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	p {
		font-size: 16px;
		line-height: 1.6;
		color: #666;
	}
}

.features {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 30px;

	.feature {
		text-align: center;

		.feature-image {
			width: 120px;
			height: 120px;
			margin: 0 auto 20px;
			border-radius: 10px;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		h3 {
			font-size: 20px;
			margin-bottom: 10px;
			color: #333;
		}

		p {
			color: #666;
			line-height: 1.5;
		}
	}
}

.tech-stack {
	display: flex;
	gap: 40px;
	justify-content: center;
	flex-wrap: wrap;

	.tech-item {
		text-align: center;

		.tech-icon {
			width: 80px;
			height: 80px;
			margin-bottom: 10px;
			border-radius: 8px;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}

		span {
			font-size: 14px;
			color: #666;
		}
	}
}

.placeholder-box {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #999;
	font-size: 14px;
	padding: 10px;
	text-align: center;
}

.team-members {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 20px;
}

.member-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	
	.member-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		margin-bottom: 12px;
	}
	
	.member-name {
		font-size: 16px;
		font-weight: 500;
		margin-bottom: 4px;
	}
	
	.member-role {
		font-size: 14px;
		color: #666;
	}
}

.contact-info {
	.contact-item {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.contact-text {
			margin-left: 12px;
			font-size: 15px;
			color: #666;
		}
	}
}

.version-info {
	text-align: center;
	padding: 20px 0;
	
	.version-text {
		font-size: 14px;
		color: #999;
		margin-bottom: 8px;
		display: block;
	}
	
	.copyright {
		font-size: 12px;
		color: #999;
	}
}

// 响应式布局
@media screen and (max-width: 600px) {
	.content-wrapper {
		padding: 15px;
	}
	
	.section {
		padding: 15px;
	}
	
	.features {
		grid-template-columns: 1fr;
	}
	
	.team-members {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>