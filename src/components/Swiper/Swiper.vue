<template>
	<div class="swiper-container">
		<swiper
			:modules="modules"
			:effect="'coverflow'"
			:grabCursor="true"
			:centeredSlides="true"
			:slidesPerView="3"
			:preloadImages="true"
			:lazy="{
				loadPrevNext: true,
				loadPrevNextAmount: 2
			}"
			:watchSlidesVisibility="true"
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
			:loopedSlides="3"
			:watchSlidesProgress="true"
			:autoplay="{
				delay: 3000,
				disableOnInteraction: false,
				pauseOnMouseEnter: true
			}"
			:speed="800"
			:spaceBetween="10"
			class="mySwiper"
			@swiper="onSwiperInit"
		>
			<swiper-slide v-for="(slide, index) in slides" :key="index">
				<div class="slide-content" :data-swiper-parallax="300">
					<div class="slide-placeholder" v-show="!imageLoaded[index]">
						<div class="loading-spinner"></div>
					</div>
					<img 
						:src="slide.image" 
						:alt="slide.text"
						class="slide-image"
						@load="onImageLoad(index)"
						@error="onImageError(index)"
						:class="{ 'image-loaded': imageLoaded[index] }"
					/>
					<div class="slide-text" :class="{ 'text-visible': imageLoaded[index] }">
						{{ slide.text }}
					</div>
				</div>
			</swiper-slide>
		</swiper>
	</div>
</template>

<script setup>
	import {
		ref,
		onMounted,
		reactive
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
	const slides = ref([
		{
			text: 'Slide 1',
			image: '/path/to/image1.jpg'  // 替换为实际的图片路径
		},
		{
			text: 'Slide 2',
			image: '/path/to/image2.jpg'
		},
		{
			text: 'Slide 3',
			image: '/path/to/image3.jpg'
		},
		{
			text: 'Slide 4',
			image: '/path/to/image4.jpg'
		},
		{
			text: 'Slide 5',
			image: '/path/to/image5.jpg'
		},
		{
			text: 'Slide 6',
			image: '/path/to/image6.jpg'
		}
	]);
	let swiperInstance = null;

	// 图片加载状态管理
	const imageLoaded = reactive(Array(slides.value.length).fill(false));
	const imageErrors = reactive(Array(slides.value.length).fill(false));
	
	const onImageLoad = (index) => {
		imageLoaded[index] = true;
	};
	
	const onImageError = (index) => {
		imageErrors[index] = true;
		imageLoaded[index] = true; // 即使加载失败也标记为已完成加载
		// console.warn(`Failed to load image for slide ${index}`);
	};
	
	const onSwiperInit = (swiper) => {
		if (!swiper) return;
		
		swiperInstance = swiper;
		swiper.$el?.classList?.add('swiper-initialized');
		
		// 预加载当前可见幻灯片的图片
		const visibleSlides = [
			swiper.activeIndex,
			(swiper.activeIndex + 1) % slides.value.length,
			(swiper.activeIndex + 2) % slides.value.length
		];
		
		visibleSlides.forEach(index => {
			preloadImage(slides.value[index].image)
				.then(() => onImageLoad(index))
				.catch(() => onImageError(index));
		});
	};

	// 修改预加载图片的逻辑
	const preloadNextImages = async (currentIndex) => {
		const nextIndex = (currentIndex + 1) % slides.value.length;
		const nextNextIndex = (currentIndex + 2) % slides.value.length;
		
		try {
			await Promise.all([
				preloadImage(slides.value[nextIndex].image),
				preloadImage(slides.value[nextNextIndex].image)
			]);
			onImageLoad(nextIndex);
			onImageLoad(nextNextIndex);
		} catch (error) {
			// 静默处理预加载失败，不影响用户体验
			console.debug('Image preload skipped');
			onImageError(nextIndex);
			onImageError(nextNextIndex);
		}
	};

	// 添加图片懒加载和预加载
	const preloadImage = (src) => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = resolve;
			img.onerror = reject;
			img.src = src;
		});
	};

	onMounted(() => {
		if (swiperInstance) {
			swiperInstance.on('slideChange', () => {
				preloadNextImages(swiperInstance.activeIndex);
			});
		}
	});
</script>

<style scoped lang="scss">
	.swiper-container {
		width: 90%;
		margin: 0 auto;
		padding: 10px 0 40px;
		position: relative;
		overflow: hidden;
		user-select: none;
	}

	:deep(.swiper) {
		width: 100%;
		padding: 20px 0;
		overflow: hidden;
		
		.swiper-slide {
			width: 300px;
			height: 250px;
			opacity: 0;
			transition: opacity 0.8s ease;
			transform-origin: center center;
			pointer-events: none;
			will-change: transform, opacity;
			
			&.swiper-slide-visible {
				opacity: 0.4;
				pointer-events: auto;
			}
			
			&.swiper-slide-active {
				opacity: 1;
				pointer-events: auto;
			}
			
			&.swiper-slide-initialized {
				opacity: 0;
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
				position: relative;
				overflow: hidden;
				
				&:hover {
					transform: scale(1.1);
					box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
				}
				
				.slide-placeholder {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 2;
	
					.loading-spinner {
						width: 40px;
						height: 40px;
						border: 3px solid #f3f3f3;
						border-top: 3px solid #3498db;
						border-radius: 50%;
						animation: spin 1s linear infinite;
					}
				}
				
				.slide-image {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					object-fit: cover;
					z-index: 1;
					opacity: 0;
					transition: opacity 0.3s ease;
					
					&.image-loaded {
						opacity: 1;
					}
				}
				
				.slide-text {
					position: relative;
					z-index: 2;
					color: #fff;
					text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
					opacity: 0;
					transform: translateY(10px);
					transition: all 0.3s ease;
					
					&.text-visible {
						opacity: 1;
						transform: translateY(0);
					}
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

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>