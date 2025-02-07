<template>
	<div class="about-container">
		<!-- 内容区域 -->
		<div class="content-wrapper">
			<!-- 项目介绍 -->
			<div class="section">
				<h2>关于TravelRec</h2>
				<div class="intro">
					<div class="logo-wrapper">
						<div class="rotate-container">
							<div class="front">
								<img 
									:src="getImageUrl('logo.png')" 
									alt="TravelRec Logo"
									@error="handleImageError"
									v-show="!imageErrors.logo"
								/>
							</div>
							<div class="back">
								<div class="content">
									智能旅游推荐系统
								</div>
							</div>
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
import { ref, onMounted } from 'vue';
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
		avatar: 'src/assets/logo/favicon.ico',
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

onMounted(() => {
	const features = document.querySelectorAll('.feature-image');
	features.forEach((feature, index) => {
		feature.style.setProperty('--index', index);
	});
	
	const techIcons = document.querySelectorAll('.tech-icon');
	techIcons.forEach((icon, index) => {
		icon.style.setProperty('--index', index);
	});

	// 添加鼠标跟踪效果
	const handleMouseMove = (e, element) => {
		const rect = element.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		element.style.setProperty('--mouse-x', `${x}%`);
		element.style.setProperty('--mouse-y', `${y}%`);
	};

	document.querySelectorAll('.feature-image, .tech-icon').forEach(element => {
		element.addEventListener('mousemove', (e) => handleMouseMove(e, element));
	});

	// 修改Logo鼠标跟踪效果
	const logoWrapper = document.querySelector('.logo-wrapper');
	const handleLogoMouseMove = (e) => {
		const rect = logoWrapper.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 到 1
		const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 到 1
		
		// 限制旋转角度在 -90 到 90 度之间
		const maxRotation = 45; // 最大旋转角度
		
		// 根据鼠标位置计算旋转角度，并限制在合理范围内
		const rotateX = y * maxRotation; // 上下移动影响X轴旋转
		const rotateY = -x * maxRotation; // 左右移动影响Y轴旋转
		const rotateZ = (x * y) * (maxRotation / 2); // 对角线移动影响Z轴旋转，减小Z轴旋转幅度
		
		// 应用旋转变换，添加透视效果
		logoWrapper.querySelector('.rotate-container').style.transform = 
			`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
	};
	
	const handleLogoMouseLeave = () => {
		// 鼠标离开时重置旋转并恢复浮动动画
		const container = logoWrapper.querySelector('.rotate-container');
		container.style.transform = '';
		container.style.animation = 'floatLogo 6s ease-in-out infinite';
	};
	
	const handleLogoMouseEnter = () => {
		// 鼠标进入时暂停浮动动画
		const container = logoWrapper.querySelector('.rotate-container');
		container.style.animation = 'none';
	};
	
	if (logoWrapper) {
		logoWrapper.addEventListener('mousemove', handleLogoMouseMove);
		logoWrapper.addEventListener('mouseleave', handleLogoMouseLeave);
		logoWrapper.addEventListener('mouseenter', handleLogoMouseEnter);
	}
});
</script>

<style lang="scss" scoped>
.about-container {
	height: 100%;
	display: flex;
	flex-direction: column;
	user-select: none;
}

.content-wrapper {
	flex: 1;
	padding: 16px 20px;
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
		width: 160px;
		height: 160px;
		perspective: 2000px;
		cursor: pointer;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			inset: -20px;
			background: radial-gradient(circle at center,
				rgba(33, 150, 243, 0.2) 0%,
				transparent 70%
			);
			border-radius: 20px;
			filter: blur(15px);
			z-index: -2;
		}
		
		.rotate-container {
			position: relative;
			width: 100%;
			height: 100%;
			transform-style: preserve-3d;
			transition: transform 0.3s ease-out;  // 修改transition
			animation: floatLogo 6s ease-in-out infinite;
			
			&:hover {
				animation-play-state: paused;  // 悬停时暂停浮动动画
			}
			
			&::before, &::after {
				content: '';
				position: absolute;
				inset: -5px;
				border-radius: 12px;
				background: conic-gradient(
					from 0deg,
					#2196F3,
					#00BCD4,
					#4CAF50,
					#FFC107,
					#FF5722,
					#2196F3
				);
				animation: spin 3s linear infinite;
				z-index: -1;
				transform: translateZ(-10px);
			}
			
			&::after {
				filter: blur(10px);
				opacity: 0.5;
				transform: translateZ(-20px);
			}
			
			.front, .back {
				position: absolute;
				width: 100%;
				height: 100%;
				backface-visibility: hidden;
				border-radius: 12px;
				overflow: hidden;
				background: rgba(255, 255, 255, 0.95);
				box-shadow: 
					0 5px 15px rgba(0, 0, 0, 0.2),
					0 0 0 1px rgba(255, 255, 255, 0.1);
				transform-style: preserve-3d;
				
				&::before {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(
						circle at var(--mouse-x, center) var(--mouse-y, center),
						rgba(255, 255, 255, 0.8) 0%,
						transparent 60%
					);
					opacity: 0;
					transition: opacity 0.3s ease;
					transform: translateZ(20px);
				}
				
				img {
					width: 90%;
					height: 90%;
					object-fit: contain;
					margin: 5%;
					transition: all 0.5s ease;
					transform: translateZ(10px);
					filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
				}
				
				.content {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%) translateZ(15px);
					width: 100%;
					text-align: center;
					background: linear-gradient(45deg, #1976D2, #2196F3);
					-webkit-background-clip: text;
					background-clip: text;
					color: transparent;
					font-size: 1.2em;
					font-weight: bold;
					text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					animation: textShine 3s linear infinite;
				}
			}
			
			.back {
				transform: rotateY(180deg);
				background: linear-gradient(135deg, #1976D2, #0D47A1);
			}
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
			position: relative;
			transform-style: preserve-3d;
			perspective: 1000px;
			animation: floatFeature 6s ease-in-out infinite;
			animation-delay: calc(var(--index) * 0.7s);
			filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
			
			&::before {
				content: '';
				position: absolute;
				inset: -5px;
				background: linear-gradient(45deg, #2196F3, #00BCD4, #4CAF50, #FFC107);
				z-index: -1;
				border-radius: 15px;
				animation: borderGlow 3s linear infinite;
				opacity: 0;
				transition: opacity 0.3s ease;
			}
			
			&:hover {
				transform: translateY(-20px) rotateX(35deg) rotateY(45deg) scale(1.2);
				
				&::before {
					opacity: 1;
				}
				
				img {
					transform: scale(1.4) rotate(12deg);
					animation: spinY 5s linear infinite;
				}
			}
			
			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 0.5s ease;
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
			position: relative;
			transform-style: preserve-3d;
			perspective: 1000px;
			animation: floatTechEnhanced 5s ease-in-out infinite,
					  rotateIcon 10s linear infinite;
			animation-delay: calc(var(--index) * 0.4s);
			transform-origin: center center;
			
			&::before {
				content: '';
				position: absolute;
				inset: -2px;
				background: linear-gradient(45deg, #2196F3, #00BCD4, #4CAF50, #FFC107);
				z-index: -1;
				border-radius: 10px;
				animation: borderGlow 3s linear infinite;
				opacity: 0;
				transition: opacity 0.3s ease;
			}
			
			&:hover {
				transform: translateY(-20px) rotateY(45deg) rotateX(30deg) scale(1.2);
				animation-play-state: paused;
				
				&::before {
					opacity: 1;
				}
				
				img {
					animation: spinFast 1s linear infinite;
				}
			}
			
			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
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

// 新增动画关键帧
@keyframes spin3D {
	0% {
		transform: rotateY(0) rotateX(0) rotateZ(0);
	}
	100% {
		transform: rotateY(360deg) rotateX(360deg) rotateZ(360deg);
	}
}

@keyframes spinY {
	0% {
		transform: rotateY(0) scale(1.4);
	}
	100% {
		transform: rotateY(360deg) scale(1.4);
	}
}

@keyframes spinFast {
	0% {
		transform: rotate(0deg) scale(1.3);
	}
	100% {
		transform: rotate(360deg) scale(1.3);
	}
}

@keyframes borderGlow {
	0%, 100% {
		filter: hue-rotate(0deg) brightness(1);
	}
	50% {
		filter: hue-rotate(180deg) brightness(1.5);
	}
}

@keyframes rainbow {
	0% {
		filter: hue-rotate(0deg);
	}
	100% {
		filter: hue-rotate(360deg);
	}
}

@keyframes rotateIcon {
	0% {
		transform: rotateY(0) rotateX(10deg);
	}
	100% {
		transform: rotateY(360deg) rotateX(10deg);
	}
}

@keyframes glow {
	0%, 100% {
		filter: drop-shadow(0 0 15px rgba(33, 150, 243, 0.2));
	}
	50% {
		filter: drop-shadow(0 0 30px rgba(33, 150, 243, 0.4));
	}
}

// 更新现有动画
@keyframes float {
	0%, 100% {
		transform: translateY(0) rotateX(0) rotateZ(0) scale(1);
	}
	25% {
		transform: translateY(-25px) rotateX(10deg) rotateZ(5deg) scale(1.05);
	}
	50% {
		transform: translateY(0) rotateX(0) rotateZ(0) scale(1);
	}
	75% {
		transform: translateY(15px) rotateX(-8deg) rotateZ(-3deg) scale(0.95);
	}
}

@keyframes floatFeature {
	0%, 100% {
		transform: translateY(0) rotateX(0) rotateY(0) translateZ(0) scale(1);
	}
	50% {
		transform: translateY(-25px) rotateX(15deg) rotateY(10deg) translateZ(20px) scale(1.05);
	}
}

@keyframes floatTechEnhanced {
	0%, 100% {
		transform: translateY(0) rotateY(0) scale(1);
	}
	50% {
		transform: translateY(-20px) rotateY(20deg) scale(1.1);
	}
}

// 添加鼠标悬停时的光晕效果
.feature-image, .tech-icon {
	&::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at var(--mouse-x, center) var(--mouse-y, center), 
					rgba(255, 255, 255, 0.8) 0%,
					rgba(255, 255, 255, 0) 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
		mix-blend-mode: overlay;
		pointer-events: none;
	}
	
	&:hover::after {
		opacity: 1;
	}
}

// 添加新的动画
@keyframes floatLogo {
	0%, 100% {
		transform: translateY(0) rotateX(0) rotateZ(0) translateZ(0);
	}
	25% {
		transform: translateY(-10px) rotateX(3deg) rotateZ(1deg) translateZ(5px);
	}
	75% {
		transform: translateY(5px) rotateX(-2deg) rotateZ(-1deg) translateZ(-5px);
	}
}

@keyframes spin {
	0% {
		transform: rotate(0deg) translateZ(-10px);
	}
	100% {
		transform: rotate(360deg) translateZ(-10px);
	}
}

@keyframes textShine {
	0% {
		filter: hue-rotate(0deg) brightness(1);
	}
	50% {
		filter: hue-rotate(180deg) brightness(1.2);
	}
	100% {
		filter: hue-rotate(360deg) brightness(1);
	}
}
</style>