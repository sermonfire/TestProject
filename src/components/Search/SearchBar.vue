<template>
    <div class="search-bar">
        <div class="search-input-wrapper">
            <el-icon class="search-icon">
                <Search />
            </el-icon>
            <div class="tags-container">
                <el-tag v-for="tag in selectedTags" :key="tag" closable @close="removeTag(tag)" class="search-tag"
                    effect="light">
                    {{ tag }}
                </el-tag>
                <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearchAsync" :trigger-on-focus="false"
                    :placeholder="selectedTags.length ? '' : '搜索景点、景点标签...'" class="search-input" @select="handleSelect"
                    @keydown.enter="handleSearchSubmit" :loading="loading">
                    <template #default="{ item }">
                        <div class="suggestion-item">
                            <div class="suggestion-content">
                                <div class="suggestion-header">
                                    <span class="suggestion-name">{{ item.name }}</span>
                                    <div class="rating-info">
                                        <el-rate v-model="item.rating" disabled size="small" text-color="#ff9900"
                                            show-score score-template="{value}" />
                                    </div>
                                </div>
                                <div class="meta-info">
                                    <span class="meta-item">
                                        <el-icon>
                                            <Timer />
                                        </el-icon>
                                        {{ item.recommendedDuration }}
                                    </span>
                                    <span class="meta-item">
                                        <el-icon>
                                            <Money />
                                        </el-icon>
                                        ¥{{ item.averageBudget }}/天
                                    </span>
                                    <span class="meta-item">
                                        <el-icon>
                                            <Star />
                                        </el-icon>
                                        人气值: {{ item.popularity }}
                                    </span>
                                </div>
                                <div class="suggestion-tags">
                                    <el-tag v-for="tag in item.tags.slice(0, 3)" :key="tag" size="small" effect="plain">
                                        {{ tag }}
                                    </el-tag>
                                </div>
                                <div class="best-time">
                                    <el-icon>
                                        <Calendar />
                                    </el-icon>
                                    最佳游玩时间: {{ item.bestTravelTime }}
                                </div>
                            </div>
                        </div>
                    </template>
                </el-autocomplete>
            </div>
            <button class="search-button" @click="handleSearchSubmit"
                :disabled="isSearching || (!searchQuery && !selectedTags.length)">
                <span class="button-text" v-if="!isSearching">搜索</span>
                <div class="loader" v-else>
                    <el-icon class="is-loading">
                        <Loading />
                    </el-icon>
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
import { ref, watch } from 'vue';
import { Search, Picture, Loading, Timer, Money, Star, Calendar } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { searchDestinationsAPI } from '@/api/tripApi';
import debounce from 'lodash/debounce';

const router = useRouter();
const searchQuery = ref('');
const selectedTags = ref([]);
const isSearching = ref(false);
const loading = ref(false);

// 定义emit
const emit = defineEmits(['search', 'update:tags', 'select']);

// 异步搜索建议
const querySearchAsync = debounce(async (query, cb) => {
    if (query.length < 1) {
        cb([]);
        return;
    }

    loading.value = true;
    try {
        const res = await searchDestinationsAPI(query);
        if (res.code === 0 && res.data) {
            const suggestions = res.data.map(item => ({
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
            cb(suggestions);
        } else {
            cb([]);
        }
    } catch (error) {
        console.error('搜索失败:', error);
        ElMessage.error('搜索失败,请重试');
        cb([]);
    } finally {
        loading.value = false;
    }
}, 300);

// 处理选择建议项
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
        emit('select', item);
    } catch (error) {
        console.error('Navigation error:', error);
        ElMessage.error('页面跳转失败');
    }
};

// 移除标签
const removeTag = (tag) => {
    selectedTags.value = selectedTags.value.filter(t => t !== tag);
    emit('update:tags', selectedTags.value);
};

// 处理搜索提交
const handleSearchSubmit = () => {
    if (!selectedTags.value.length && !searchQuery.value) {
        ElMessage.warning('请输入搜索内容或选择标签');
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

    setTimeout(() => {
        isSearching.value = false;
    }, 1000);
};

// 暴露方法给父组件
defineExpose({
    addTag: (tag) => {
        if (!selectedTags.value.includes(tag)) {
            selectedTags.value.push(tag);
        }
    }
});
</script>

<style lang="scss" scoped>
.search-bar {
    position: relative;
    width: 100%;
    margin-bottom: 1.5rem;

    .search-input-wrapper {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 0.5rem 0.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;

        &:hover,
        &:focus-within {
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.9);
        }

        .search-icon {
            color: #909399;
            margin-right: 0.75rem;
            font-size: 1.25rem;
        }

        .tags-container {
            display: flex;
            flex-wrap: wrap;
            flex: 1;
            align-items: center;
            gap: 0.5rem;

            .search-tag {
                margin: 0;
                border-radius: 8px;
                padding: 0 8px;
                height: 28px;
                line-height: 28px;
                background-color: rgba(64, 158, 255, 0.1);
                border: none;
                color: #409EFF;
                transition: all 0.2s ease;

                &:hover {
                    background-color: rgba(64, 158, 255, 0.2);
                }

                .el-tag__close {
                    color: #409EFF;
                    background-color: transparent;

                    &:hover {
                        background-color: #409EFF;
                        color: white;
                    }
                }
            }
        }

        .search-input {
            flex: 1;
            margin: 0;

            :deep(.el-input__wrapper) {
                background: transparent;
                box-shadow: none !important;
                padding: 0;

                &.is-focus {
                    box-shadow: none !important;
                }

                .el-input__inner {
                    height: 36px;
                    color: #303133;
                    font-size: 0.95rem;

                    &::placeholder {
                        color: #909399;
                        font-weight: 300;
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

                .is-loading {
                    font-size: 1.25rem;
                    animation: rotate 1s linear infinite;
                }
            }
        }
    }

    .suggestion-item {
        padding: 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 8px;

        &:hover {
            background-color: rgba(64, 158, 255, 0.05);
        }

        .suggestion-content {
            .suggestion-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;

                .suggestion-name {
                    font-weight: 600;
                    font-size: 1rem;
                    color: #303133;
                }

                .rating-info {
                    display: flex;
                    align-items: center;
                }
            }

            .meta-info {
                display: flex;
                gap: 1rem;
                margin-bottom: 0.5rem;

                .meta-item {
                    display: flex;
                    align-items: center;
                    font-size: 0.85rem;
                    color: #606266;

                    .el-icon {
                        margin-right: 0.25rem;
                        font-size: 0.9rem;
                    }
                }
            }

            .suggestion-tags {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.5rem;

                .el-tag {
                    border-radius: 6px;
                    border: none;
                    background-color: rgba(64, 158, 255, 0.08);
                    color: #409EFF;
                }
            }

            .best-time {
                display: flex;
                align-items: center;
                font-size: 0.85rem;
                color: #606266;

                .el-icon {
                    margin-right: 0.25rem;
                    color: #67C23A;
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

:deep(.el-autocomplete-suggestion) {
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    border: none;
    padding: 0.5rem;

    .el-scrollbar__view {
        padding: 0;
    }

    li {
        padding: 0;

        &.highlighted {
            background-color: transparent;
        }
    }
}
</style>