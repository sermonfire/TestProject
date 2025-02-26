<template>
    <div class="destination-card" @mouseleave="handleCardLeave">
        <div class="card-inner" :class="{ 'is-flipped': isFlipped }">
            <div class="card-front">
                <div class="image-wrapper" @mouseenter="handleImageHover" @mouseleave="handleImageLeave"
                    @click="handleCardClick(destination)">
                    <el-image :src="destination.imageUrl" fit="cover" class="destination-image">
                        <template #error>
                            <div class="image-placeholder">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                            </div>
                        </template>
                    </el-image>
                    <div class="image-overlay" :class="{ 'hide-overlay': isHoveringButton }">
                        <span class="view-details">查看详情</span>
                    </div>
                    <div class="collection-wrapper">
                        <CollectionButton :item-id="destination.id" :initial-state="destination.isCollected"
                            :auto-refresh="true" @collection-change="handleCollectionChange"
                            @collection-error="handleCollectionError" @click.stop @mouseenter="handleButtonHover"
                            @mouseleave="handleButtonLeave" />
                    </div>
                    <div class="actions-wrapper">
                        <slot name="actions"></slot>
                    </div>
                </div>
                <div class="destination-info">
                    <div class="info-header">
                        <h3 class="destination-name" @mouseenter="handleNameHover" @mouseleave="handleNameLeave">
                            {{ destination.name }}
                            <div class="hover-tip">
                                <el-icon>
                                    <ArrowRight />
                                </el-icon>
                                <span>1s后翻转</span>
                            </div>
                        </h3>
                        <div class="rating-row">
                            <el-rate v-model="destination.rating" disabled show-score text-color="#ff9900"
                                score-template="{value}" />
                        </div>
                    </div>
                    <div class="info-content">
                        <div class="tags-wrapper">
                            <el-tag v-for="tag in destination.tags.slice(0, 3)" :key="tag" size="small" effect="plain"
                                class="destination-tag">
                                {{ tag }}
                            </el-tag>
                        </div>
                        <span class="view-more" @click="handleCardClick(destination)">查看详情</span>
                        <el-icon>
                            <Share />
                        </el-icon>
                    </div>
                </div>
                <div class="share" v-if="true" @mouseenter="handleShareHover" @mouseleave="handleShareLeave">
                    <ShareCard :title="destination.name" :share-url="shareUrl" @share-success="handleShareSuccess" />
                </div>
            </div>
            <div class="card-back">
                <div class="back-content">
                    <div class="back-header">
                        <h3>{{ destination.name }}</h3>
                        <div class="divider"></div>
                    </div>
                    <div class="description-wrapper">
                        <p class="description">{{ destination.description || '暂无描述' }}</p>
                    </div>
                    <div class="action-btn" @click="handleCardClick(destination)">了解更多</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Picture, ArrowRight } from '@element-plus/icons-vue';
import CollectionButton from '@/components/CollectionButton/CollectionButton.vue';
import { useFavoriteStore } from '@/stores/favoriteStore';
import ShareCard from '@/components/share/ShareCard.vue';
import { useShareStore } from '@/stores/shareStore';
import { Title } from 'tdesign-vue-next';

const props = defineProps({
    destination: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['cardClick', 'collection-change', 'collection-error']);

const favoriteStore = useFavoriteStore();
const shareStore = useShareStore();

const router = useRouter();

const isFlipped = ref(false);
const isHoveringButton = ref(false);
const isHoveringImage = ref(false);
const isHoveringName = ref(false);
let flipTimer = null;
let hoverStartTime = null;

const handleNameHover = () => {
    isHoveringName.value = true;
    if (isFlipped.value) return;

    hoverStartTime = Date.now();
    if (flipTimer) clearInterval(flipTimer);

    flipTimer = setInterval(() => {
        if (isHoveringName.value && Date.now() - hoverStartTime >= 1000) {
            isFlipped.value = true;
            clearInterval(flipTimer);
            flipTimer = null;
        }
    }, 100);
};

const handleNameLeave = () => {
    isHoveringName.value = false;
    if (flipTimer) {
        clearInterval(flipTimer);
        flipTimer = null;
    }
};

const handleCardLeave = () => {
    isHoveringName.value = false;
    isFlipped.value = false;
    if (flipTimer) {
        clearInterval(flipTimer);
        flipTimer = null;
    }
};

const handleCollectionChange = (event) => {
    emit('collection-change', event);
};

const handleCollectionError = (error) => {
    emit('collection-error', error);
};

const handleButtonHover = () => {
    isHoveringButton.value = true;
};

const handleButtonLeave = () => {
    isHoveringButton.value = false;
};

const handleImageHover = () => {
    isHoveringImage.value = true;
};

const handleImageLeave = () => {
    isHoveringImage.value = false;
    isHoveringButton.value = false;
};

const handleCardClick = (destination) => {
    router.push({
        name: 'destinationDetail',
        params: { id: destination.id }
    });
};

/**
 * 处理分享成功事件
 * @param {Object} shareData - 分享数据
 * @param {string} platform - 分享平台
 */
const handleShareSuccess = (shareData, platform) => {
    shareStore.recordShare(shareData, platform);
};

/**
 * 生成分享URL
 */
const shareUrl = computed(() => {
    return `${import.meta.env.VITE_APP_BASE_URL || ''}/destination/${props.destination.id}`;
});

onMounted(async () => {
    // 检查当前目的地的收藏状态
    await favoriteStore.checkIsFavorite(props.destination.id);
});

onUnmounted(() => {
    if (flipTimer) {
        clearInterval(flipTimer);
        flipTimer = null;
    }
});
</script>

<style lang="scss" scoped>
.destination-card {
    cursor: pointer;
    perspective: 1500px;
    transform-style: preserve-3d;
    min-height: 400px;
    margin-bottom: 20px;

    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 400px;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
        transform-origin: center center;

        &.is-flipped {
            transform: rotateY(180deg);
        }

        .card-front,
        .card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            min-height: 400px;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
        }

        .card-front {
            transform: rotateY(0deg);
        }

        .card-back {
            transform: rotateY(180deg);
            background: linear-gradient(135deg, var(--el-color-primary-light-9), #fff);

            .back-content {
                padding: 24px;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;

                .back-header {
                    text-align: center;
                    margin-bottom: 20px;

                    h3 {
                        font-size: 24px;
                        font-weight: 600;
                        color: var(--el-color-primary);
                        margin-bottom: 12px;
                    }

                    .divider {
                        width: 40px;
                        height: 3px;
                        background: var(--el-color-primary);
                        margin: 0 auto;
                        border-radius: 2px;
                    }
                }

                .description-wrapper {
                    flex: 1;
                    overflow-y: auto;
                    margin: 20px 0;
                    padding: 0 4px;

                    .description {
                        color: #666;
                        font-size: 14px;
                        line-height: 1.8;
                        text-align: justify;
                        margin: 0;

                        &::-webkit-scrollbar {
                            width: 4px;
                        }

                        &::-webkit-scrollbar-thumb {
                            background-color: var(--el-color-primary-light-5);
                            border-radius: 2px;
                        }
                    }
                }

                .action-btn {
                    margin-top: 24px;
                    padding: 10px 28px;
                    background: var(--el-color-primary);
                    color: white;
                    border-radius: 25px;
                    font-size: 15px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
                    cursor: pointer;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
                        background: var(--el-color-primary-dark-2);
                    }
                }
            }
        }
    }
}

.image-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 12px 12px 0 0;
    height: 220px;
    cursor: pointer;

    .destination-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        color: #999;
        font-size: 24px;

        .el-icon {
            font-size: 48px;
        }
    }

    .image-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
        transform-style: preserve-3d;
        backface-visibility: hidden;

        .view-details {
            color: white;
            font-size: 15px;
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            backdrop-filter: blur(8px);
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

            &:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(0) scale(1.05);
            }
        }

        &.hide-overlay {
            opacity: 0 !important;
            pointer-events: none;
        }
    }

    .collection-wrapper {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 2;
        transition: opacity 0.3s ease;
    }

    .actions-wrapper {
        position: absolute;
        bottom: 12px;
        right: 12px;
        z-index: 2;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    }

    &:hover {
        .image-overlay {
            opacity: 1;

            .view-details {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }
}

.destination-info {
    padding: 20px;
    background: #fff;
    border-radius: 0 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .info-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;

        .destination-name {
            position: relative;
            flex: 1;
            font-size: 18px;
            font-weight: 600;
            color: var(--el-color-primary-dark-2);
            margin: 0;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-clamp: 2;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 4px 8px;
            margin: -4px -8px;
            border-radius: 4px;

            &:hover {
                color: var(--el-color-primary);
                background-color: var(--el-color-primary-light-9);

                .hover-tip {
                    opacity: 1;
                    transform: translateX(4px) translateY(-50%);
                }
            }

            .hover-tip {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateX(-10px) translateY(-50%);
                opacity: 0;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                font-weight: normal;
                color: var(--el-color-primary);
                transition: all 0.4s ease;
                white-space: nowrap;
                pointer-events: none;
                background-color: var(--el-color-primary-light-9);
                padding: 4px 8px;
                padding-bottom: 6px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

                .el-icon {
                    font-size: 14px;
                    transition: transform 0.4s ease;
                }

                &::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 8px;
                    width: calc(100% - 16px);
                    height: 2px;
                    background: linear-gradient(to right,
                            var(--el-color-primary) 0%,
                            var(--el-color-primary) 50%,
                            var(--el-color-primary-light-7) 50%,
                            var(--el-color-primary-light-7) 100%);
                    background-size: 200% 100%;
                    border-radius: 1px;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    animation: none;
                }

                &::before {
                    content: '即将翻转';
                    position: absolute;
                    font-size: 12px;
                    color: var(--el-color-primary);
                    bottom: -18px;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    font-weight: 500;
                }
            }

            &:hover .hover-tip {
                opacity: 1;

                &::after {
                    animation: progressFlow 1s linear forwards;
                }

                &::before {
                    opacity: 1;
                }
            }
        }

        .rating-row {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 6px;

            :deep(.el-rate) {
                height: 18px;
                line-height: 18px;
            }
        }
    }

    .info-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;

        .tags-wrapper {
            flex: 1;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            min-height: 22px;

            .destination-tag {
                padding: 0 10px;
                height: 22px;
                line-height: 22px;
                border-radius: 11px;
                font-size: 12px;
                background-color: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary-light-8);
                color: var(--el-color-primary);
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-1px);
                    background-color: var(--el-color-primary-light-8);
                }
            }
        }

        .view-more {
            flex-shrink: 0;
            font-size: 13px;
            color: var(--el-color-primary);
            padding: 4px 12px;
            border-radius: 4px;
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
                background-color: var(--el-color-primary-light-9);
            }
        }
    }
}


@keyframes progressFlow {
    0% {
        background-position: 100% 0;
    }

    100% {
        background-position: 0 0;
    }
}
</style>