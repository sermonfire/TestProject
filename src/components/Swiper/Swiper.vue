<template>
	<div class="swiper-container">
		<swiper
			:modules="modules"
			:effect="'coverflow'"
			:grabCursor="true"
			:centeredSlides="true"
			:slidesPerView="3"
			:coverflowEffect="{
				rotate: 30,
				stretch: 0,
				depth: 100,
				modifier: 1,
				slideShadows: true,
			}"
			:pagination="{
				clickable: true,
				dynamicBullets: true,
			}"
			:navigation="true"
			:loop="true"
			:autoplay="{
				delay: 3000,
				disableOnInteraction: false,
				pauseOnMouseEnter: true
			}"
			:spaceBetween="30"
			class="mySwiper"
			@swiper="onSwiperInit"
		>
			<swiper-slide v-for="(slide, index) in slides" :key="index">
				<div class="slide-content">{{ slide }}</div>
			</swiper-slide>
		</swiper>
	</div>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';
	// 导入 Swiper Vue.js 组件
	import {
		Swiper,
		SwiperSlide
	} from 'swiper/vue';
	// 导入需要的 Swiper 模块
	import {
		EffectCoverflow,
		Pagination,
		Navigation,
		Autoplay
	} from 'swiper/modules';

	// 导入 Swiper 样式
	import 'swiper/css';
	import 'swiper/css/effect-coverflow';
	import 'swiper/css/pagination';
	import 'swiper/css/navigation';

	const modules = [EffectCoverflow, Pagination, Navigation, Autoplay];
	const slides = ref(['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5']);
	let swiperInstance = null;

	const onSwiperInit = (swiper) => {
		swiperInstance = swiper;
	};
</script>

<style scoped lang="scss">
	.swiper-container {
		width: 90%;
		margin: 0 auto;
		padding: 10px 0 40px;
		position: relative;
	}

	:deep(.swiper) {
		width: 100%;
		padding: 20px 0;
		
		.swiper-slide {
			width: 300px;
			height: 250px;
			opacity: 0.4;
			transition: opacity 0.3s ease;
			
			&-active {
				opacity: 1;
			}
			
			.slide-content {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 100%;
				height: 100%;
				font-size: 24px;
				background: linear-gradient(45deg, #45a6e7, #49df87, #f0786b, #e0a94f, #ae4dd4);
				color: #fff;
				border-radius: 8px;
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				transition: all 0.3s ease;
				
				&:hover {
					transform: scale(1.1);
					box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
				}
			}
		}

		.swiper-button-prev,
		.swiper-button-next {
			width: 44px;
			height: 44px;
			background-color: rgba(255, 255, 255, 0.9);
			border-radius: 50%;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
			
			&::after {
				font-size: 20px;
				color: #333;
				font-weight: bold;
			}
			
			&:hover {
				background-color: #fff;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				transform: scale(1.05);
			}
		}

		.swiper-pagination-bullet {
			width: 8px;
			height: 8px;
			margin: 0 6px;
			background-color: #ccc;
			opacity: 0.6;
			
			&-active {
				background: linear-gradient(45deg, #49df87, #e0a94f);
				opacity: 1;
				transform: scale(1.05);
			}
		}
	}
</style>