<template>
    <div class="search-bar">
        <div class="search-input-wrapper">
            <div class="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
                </svg>
            </div>
            <div class="tags-container">
                <div v-for="tag in selectedTags" :key="tag" class="search-tag">
                    <span>{{ tag }}</span>
                    <button class="tag-close-btn" @click="removeTag(tag)">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
                            <path fill="currentColor"
                                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
                <div class="autocomplete-container">
                    <input type="text" v-model="searchQuery" class="search-input"
                        :placeholder="selectedTags.length ? '' : '搜索景点、景点标签...'" @input="handleInput"
                        @keydown.enter="handleSearchSubmit" @keydown.down="navigateSuggestion(1)"
                        @keydown.up="navigateSuggestion(-1)" @blur="handleBlur" @focus="handleFocus"
                        ref="searchInput" />
                    <div v-if="loading" class="input-loading-indicator">
                        <svg class="loading-icon" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
                        <div class="suggestions-container">
                            <div v-for="(item, index) in filteredSuggestions" :key="index" class="suggestion-item"
                                :class="{ 'suggestion-active': index === activeSuggestionIndex }"
                                @mousedown="handleSelect(item)" @mouseover="activeSuggestionIndex = index">
                                <div class="suggestion-content">
                                    <div class="suggestion-header">
                                        <span class="suggestion-name">{{ item.name }}</span>
                                        <div class="rating-info">
                                            <div class="star-rating">
                                                <div class="stars">
                                                    <span v-for="n in 5" :key="n" class="star"
                                                        :class="{ 'star-filled': n <= Math.round(item.rating), 'star-empty': n > Math.round(item.rating) }">
                                                        ★
                                                    </span>
                                                </div>
                                                <span class="rating-score">{{ item.rating }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="meta-info">
                                        <span class="meta-item">
                                            <svg class="meta-icon" viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                                            </svg>
                                            {{ item.recommendedDuration }}
                                        </span>
                                        <span class="meta-item">
                                            <svg class="meta-icon" viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M12.5 6.9c1.78 0 3.2 1.42 3.2 3.2 0 1.78-1.42 3.2-3.2 3.2-1.78 0-3.2-1.42-3.2-3.2 0-1.78 1.42-3.2 3.2-3.2M12.5 4C9.46 4 7 6.46 7 9.5s2.46 5.5 5.5 5.5 5.5-2.46 5.5-5.5S15.54 4 12.5 4zm5.5 8.5c0 .55 .45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1zm-13 0c0 .55 .45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1z" />
                                            </svg>
                                            ¥{{ item.averageBudget }}/天
                                        </span>
                                        <span class="meta-item">
                                            <svg class="meta-icon" viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                            人气值: {{ item.popularity }}
                                        </span>
                                    </div>
                                    <div class="suggestion-tags">
                                        <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="suggestion-tag">
                                            {{ tag }}
                                        </span>
                                    </div>
                                    <div class="best-time">
                                        <svg class="calendar-icon" viewBox="0 0 24 24">
                                            <path fill="currentColor"
                                                d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
                                        </svg>
                                        最佳游玩时间: {{ item.bestTravelTime }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button class="search-button" @click="handleSearchSubmit"
                :disabled="isSearching || (!searchQuery && !selectedTags.length)">
                <span class="button-text" v-if="!isSearching">搜索</span>
                <div class="loader" v-else>
                    <svg class="loading-icon" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                    </svg>
                </div>
            </button>
        </div>

        <div class="fullscreen-loader" v-if="isSearching">
            <div class="spinner">
                <div class="cube-wrapper">
                    <div class="cube">
                        <div class="sides">
                            <div class="top"></div>
                            <div class="right"></div>
                            <div class="bottom"></div>
                            <div class="left"></div>
                            <div class="front"></div>
                            <div class="back"></div>
                        </div>
                    </div>
                </div>
                <div class="loading-text">搜索中...</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { searchDestinationsAPI } from '@/api/tripApi';

/**
 * 搜索栏组件
 * @component SearchBar
 * @description 提供景点搜索功能，支持自动完成、标签筛选等
 */

// 路由实例
const router = useRouter();

// 响应式状态
const searchQuery = ref('');
const selectedTags = ref([]);
const isSearching = ref(false);
const loading = ref(false);
const suggestions = ref([]);
const showSuggestions = ref(false);
const activeSuggestionIndex = ref(-1);
const searchInput = ref(null);
const debounceTimeout = ref(null);

// 定义emit
const emit = defineEmits(['search', 'update:tags', 'select']);

/**
 * 过滤后的建议列表
 * @type {import('vue').ComputedRef<Array>}
 */
const filteredSuggestions = computed(() => {
    return suggestions.value;
});

/**
 * 处理输入事件，使用防抖进行API调用
 * @param {Event} event - 输入事件对象
 */
const handleInput = (event) => {
    const query = event.target.value;

    // 清除之前的定时器
    if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
    }

    // 如果输入为空，清空建议并隐藏下拉框
    if (query.length < 1) {
        suggestions.value = [];
        showSuggestions.value = false;
        return;
    }

    // 设置300ms的防抖
    debounceTimeout.value = setTimeout(async () => {
        await querySearchAsync(query);
    }, 300);
};

/**
 * 异步搜索建议
 * @param {string} query - 搜索查询字符串
 */
const querySearchAsync = async (query) => {
    if (query.length < 1) {
        suggestions.value = [];
        showSuggestions.value = false;
        return;
    }

    loading.value = true;
    try {
        const res = await searchDestinationsAPI(query);
        if (res.code === 0 && res.data) {
            suggestions.value = res.data.map(item => ({
                value: item.destination.name,
                id: item.destination.id,
                name: item.destination.name,
                rating: item.destination.rating,
                recommendedDuration: item.destination.recommendedDuration,
                averageBudget: item.destination.averageBudget,
                popularity: item.destination.popularity,
                tags: item.destination.tags,
                bestTravelTime: item.bestTravelTime
            }));
            showSuggestions.value = true;
        } else {
            suggestions.value = [];
            showSuggestions.value = false;
        }
    } catch (error) {
        console.error('搜索失败:', error);
        suggestions.value = [];
        showSuggestions.value = false;
    } finally {
        loading.value = false;
    }
};

/**
 * 处理选择建议项
 * @param {Object} item - 选中的建议项
 */
const handleSelect = (item) => {
    try {
        // 跳转到搜索结果页
        router.push({
            name: 'searchResults',
            query: {
                q: item.name // 使用目的地名称作为搜索关键词
            }
        });

        searchQuery.value = '';
        showSuggestions.value = false;
        emit('select', item);
    } catch (error) {
        console.error('Navigation error:', error);
        alert('页面跳转失败');
    }
};

/**
 * 移除标签
 * @param {string} tag - 要移除的标签
 */
const removeTag = (tag) => {
    selectedTags.value = selectedTags.value.filter(t => t !== tag);
    emit('update:tags', selectedTags.value);
};

/**
 * 处理搜索提交
 */
const handleSearchSubmit = () => {
    if (!selectedTags.value.length && !searchQuery.value) {
        alert('请输入搜索内容或选择标签');
        return;
    }

    isSearching.value = true;

    // 区分标签搜索和内容搜索
    const searchParams = {
        tags: selectedTags.value,
        query: searchQuery.value
    };

    emit('search', searchParams);

    // 更新路由时区分两种搜索类型的参数
    router.push({
        name: 'searchResults',
        query: {
            ...(selectedTags.value.length ? { tags: selectedTags.value.join(',') } : {}),
            ...(searchQuery.value ? { q: searchQuery.value } : {})
        }
    });

    // 清空搜索框
    searchQuery.value = '';
    showSuggestions.value = false;

    setTimeout(() => {
        isSearching.value = false;
    }, 1000);
};

/**
 * 处理输入框失焦事件
 */
const handleBlur = () => {
    // 延迟隐藏建议，以便点击建议项时能够触发handleSelect
    setTimeout(() => {
        showSuggestions.value = false;
    }, 200);
};

/**
 * 处理输入框聚焦事件
 */
const handleFocus = () => {
    if (searchQuery.value.length > 0 && suggestions.value.length > 0) {
        showSuggestions.value = true;
    }
};

/**
 * 使用键盘导航建议列表
 * @param {number} direction - 导航方向 (1: 向下, -1: 向上)
 */
const navigateSuggestion = (direction) => {
    if (!showSuggestions.value || suggestions.value.length === 0) return;

    const newIndex = activeSuggestionIndex.value + direction;

    if (newIndex >= 0 && newIndex < suggestions.value.length) {
        activeSuggestionIndex.value = newIndex;
    } else if (newIndex < 0) {
        activeSuggestionIndex.value = suggestions.value.length - 1;
    } else {
        activeSuggestionIndex.value = 0;
    }
};

/**
 * 点击文档其他地方时关闭建议下拉框
 * @param {Event} event - 点击事件对象
 */
const handleClickOutside = (event) => {
    const searchBarElement = document.querySelector('.search-bar');
    if (searchBarElement && !searchBarElement.contains(event.target)) {
        showSuggestions.value = false;
    }
};

// 生命周期钩子
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

/**
 * 添加标签方法，供父组件调用
 * @param {string} tag - 要添加的标签
 */
const addTag = (tag) => {
    if (!selectedTags.value.includes(tag)) {
        selectedTags.value.push(tag);
    }
};

// 暴露方法给父组件
defineExpose({
    addTag
});
</script>

<style lang="scss" scoped>
.search-bar {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;

    .search-input-wrapper {
        display: flex;
        width: 50%;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 0.5rem 0.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        position: relative;

        &:hover,
        &:focus-within {
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.9);
        }

        .search-icon {
            color: #909399;
            margin-right: 0.75rem;
            font-size: 1.25rem;
            display: flex;
            align-items: center;

            svg {
                width: 20px;
                height: 20px;
            }
        }

        .tags-container {
            display: flex;
            flex-wrap: wrap;
            flex: 1;
            align-items: center;
            gap: 0.5rem;
            position: relative;

            .search-tag {
                margin: 0;
                border-radius: 8px;
                padding: 0 8px;
                height: 28px;
                display: flex;
                align-items: center;
                background-color: rgba(64, 158, 255, 0.1);
                color: #409EFF;
                transition: all 0.2s ease;

                &:hover {
                    background-color: rgba(64, 158, 255, 0.2);
                }

                .tag-close-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 4px;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: #409EFF;
                    cursor: pointer;
                    padding: 0;

                    &:hover {
                        background-color: #409EFF;
                        color: white;
                    }

                    svg {
                        width: 12px;
                        height: 12px;
                    }
                }
            }

            .autocomplete-container {
                flex: 1;
                position: relative;

                .search-input {
                    width: 100%;
                    height: 36px;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: #303133;
                    font-size: 0.95rem;

                    &::placeholder {
                        color: #909399;
                        font-weight: 300;
                    }
                }

                .input-loading-indicator {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);

                    .loading-icon {
                        width: 16px;
                        height: 16px;
                        color: #909399;
                        animation: rotate 1s linear infinite;
                    }
                }

                .suggestions-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    left: 0;
                    width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    z-index: 1000;
                    max-height: 400px;
                    overflow: hidden;
                    animation: fadeIn 0.2s ease-out;
                    transform-origin: top center;

                    &::before {
                        content: '';
                        position: absolute;
                        top: -10px;
                        left: 0;
                        width: 100%;
                        height: 10px;
                        background: transparent;
                    }

                    .suggestions-container {
                        max-height: 400px;
                        overflow-y: auto;
                        padding: 0.75rem;

                        &::-webkit-scrollbar {
                            width: 6px;
                        }

                        &::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 3px;
                        }

                        &::-webkit-scrollbar-thumb {
                            background: #c1c1c1;
                            border-radius: 3px;
                        }

                        &::-webkit-scrollbar-thumb:hover {
                            background: #a8a8a8;
                        }

                        .suggestion-item {
                            padding: 0.85rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            border-radius: 10px;
                            margin-bottom: 0.5rem;
                            border: 1px solid transparent;

                            &:last-child {
                                margin-bottom: 0;
                            }

                            &:hover,
                            &.suggestion-active {
                                background-color: rgba(64, 158, 255, 0.05);
                                border-color: rgba(64, 158, 255, 0.1);
                                transform: translateY(-1px);
                                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
                            }

                            .suggestion-content {
                                .suggestion-header {
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 0.75rem;

                                    .suggestion-name {
                                        font-weight: 600;
                                        font-size: 1.05rem;
                                        color: #303133;
                                    }

                                    .rating-info {
                                        display: flex;
                                        align-items: center;
                                        background: rgba(255, 153, 0, 0.08);
                                        padding: 2px 8px;
                                        border-radius: 12px;

                                        .star-rating {
                                            display: flex;
                                            align-items: center;

                                            .stars {
                                                display: flex;
                                                margin-right: 4px;

                                                .star {
                                                    font-size: 14px;
                                                    line-height: 1;

                                                    &.star-filled {
                                                        color: #ff9900;
                                                    }

                                                    &.star-empty {
                                                        color: #E0E0E0;
                                                    }
                                                }
                                            }

                                            .rating-score {
                                                font-size: 0.85rem;
                                                color: #ff9900;
                                                font-weight: 600;
                                                margin-left: 4px;
                                            }
                                        }
                                    }
                                }

                                .meta-info {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 1rem;
                                    margin-bottom: 0.75rem;
                                    background: rgba(0, 0, 0, 0.02);
                                    padding: 8px 12px;
                                    border-radius: 8px;

                                    .meta-item {
                                        display: flex;
                                        align-items: center;
                                        font-size: 0.85rem;
                                        color: #606266;

                                        .meta-icon {
                                            width: 14px;
                                            height: 14px;
                                            margin-right: 0.25rem;
                                            color: #409EFF;
                                        }
                                    }
                                }

                                .suggestion-tags {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 0.5rem;
                                    margin-bottom: 0.75rem;

                                    .suggestion-tag {
                                        font-size: 0.75rem;
                                        padding: 3px 10px;
                                        border-radius: 12px;
                                        background-color: rgba(64, 158, 255, 0.08);
                                        color: #409EFF;
                                        transition: all 0.2s ease;

                                        &:hover {
                                            background-color: rgba(64, 158, 255, 0.15);
                                            transform: translateY(-1px);
                                        }
                                    }
                                }

                                .best-time {
                                    display: flex;
                                    align-items: center;
                                    font-size: 0.85rem;
                                    color: #606266;
                                    background: rgba(103, 194, 58, 0.08);
                                    padding: 5px 10px;
                                    border-radius: 8px;
                                    width: fit-content;

                                    .calendar-icon {
                                        width: 14px;
                                        height: 14px;
                                        margin-right: 0.25rem;
                                        color: #67C23A;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        .search-button {
            background: linear-gradient(135deg, #409EFF, #36D1DC);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.5rem 1.25rem;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 80px;
            height: 36px;

            &:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
            }

            &:disabled {
                background: #E4E7ED;
                color: #909399;
                cursor: not-allowed;
            }

            .loader {
                display: flex;
                align-items: center;
                justify-content: center;

                .loading-icon {
                    width: 20px;
                    height: 20px;
                    animation: rotate 1s linear infinite;
                }
            }
        }
    }

    .fullscreen-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;

        .spinner {
            display: flex;
            flex-direction: column;
            align-items: center;

            .cube-wrapper {
                width: 60px;
                height: 60px;
                margin-bottom: 1rem;

                .cube {
                    transform-style: preserve-3d;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    animation: spin 2s infinite linear;

                    .sides {
                        position: absolute;
                        width: 100%;
                        height: 100%;

                        div {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(135deg, #409EFF, #36D1DC);
                            opacity: 0.8;
                        }

                        .top {
                            transform: rotateX(90deg) translateZ(30px);
                        }

                        .bottom {
                            transform: rotateX(-90deg) translateZ(30px);
                        }

                        .right {
                            transform: rotateY(90deg) translateZ(30px);
                        }

                        .left {
                            transform: rotateY(-90deg) translateZ(30px);
                        }

                        .front {
                            transform: translateZ(30px);
                        }

                        .back {
                            transform: rotateY(180deg) translateZ(30px);
                        }
                    }
                }
            }

            .loading-text {
                font-size: 1.1rem;
                color: #409EFF;
                font-weight: 500;
            }
        }
    }
}

@keyframes spin {
    0% {
        transform: rotateX(0deg) rotateY(0deg);
    }

    100% {
        transform: rotateX(360deg) rotateY(360deg);
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>