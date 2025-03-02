<template>
    <div class="favorite-category">
        <!-- 分类列表头部 -->
        <div class="category-header">
            <div class="header-title">分类列表</div>
            <el-button type="primary" link class="add-button" @click="handleAdd" :loading="loading">
                <el-icon>
                    <Plus />
                </el-icon>
                新建分类
            </el-button>
        </div>

        <!-- 分类列表 -->
        <div class="category-list">
            <div class="scrollbar-wrapper">
                <VueDraggable v-model="sortedCategories" :disabled="loading || isSearching" item-key="id"
                    handle=".drag-handle" @end="handleDragEnd" :animation="200" :group="{ name: 'categories' }"
                    :removeOnSpill="false" :sort="true">
                    <template #item="{ element }">
                        <div class="category-item" :class="{
                            'is-active': selectedCategory === element.id,
                            'is-default': element.isDefault,
                            'has-search-results': hasSearchResults(element)
                        }">
                            <div class="item-content" @click="handleCategorySelect(element)">
                                <el-icon class="drag-handle" v-if="!element.isDefault && !isSearching">
                                    <Rank />
                                </el-icon>
                                <el-icon class="category-icon">
                                    <component :is="element.isDefault ? 'Star' : 'Folder'" />
                                </el-icon>
                                <span class="category-name">{{ element.name }}</span>
                                <span class="category-count">
                                    ({{ isSearching ? searchCategoryStats[element.id] || 0 : element.count || 0 }})
                                </span>
                                <el-tag v-if="isSearching && hasSearchResults(element)" size="small" type="success"
                                    class="search-tag">
                                    匹配
                                </el-tag>
                            </div>

                            <div class="item-actions" v-if="!element.isDefault && !isSearching">
                                <el-button link size="small" @click.stop="handleEdit(element)">
                                    <el-icon>
                                        <Edit />
                                    </el-icon>
                                </el-button>
                                <el-button link size="small" @click.stop="handleDelete(element)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>
                    </template>
                </VueDraggable>
            </div>
        </div>

        <!-- 修改分类表单对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建分类'" width="400px" :close-on-click-modal="false"
            :append-to-body="true" destroy-on-close class="category-dialog" @opened="handleDialogOpened">
            <el-form ref="formRef" :model="categoryForm" :rules="formRules" label-width="80px"
                @submit.prevent="handleSubmit" status-icon>
                <el-form-item label="分类名称" prop="name">
                    <el-input ref="nameInputRef" v-model="categoryForm.name" placeholder="请输入分类名称" maxlength="50"
                        show-word-limit clearable />
                </el-form-item>
                <el-form-item label="分类描述" prop="description">
                    <el-input v-model="categoryForm.description" type="textarea" placeholder="请输入分类描述（选填）"
                        maxlength="255" show-word-limit :rows="3" resize="none" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeDialog">取消</el-button>
                    <el-button type="primary" @click="handleSubmit" :loading="loading" :disabled="!categoryForm.name">
                        {{ isEdit ? '保存' : '创建' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="删除分类" width="30%">
            <p>确定要删除分类"{{ categoryToDelete?.name }}"吗？</p>
            <p class="delete-warning">该分类下的收藏将移至默认分类</p>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="confirmDelete" :loading="loading">
                        确定
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, Folder, Edit, Delete, Plus, Rank } from '@element-plus/icons-vue'
import { useFavoriteStore } from '@/stores/favoriteStore'
import VueDraggable from 'vuedraggable'

const emit = defineEmits(['select'])
const favoriteStore = useFavoriteStore()

// 状态
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const categoryToDelete = ref(null)
const formRef = ref(null)
const draggableInstance = ref(null)
const nameInputRef = ref(null)

const categoryForm = ref({
    name: '',
    description: ''
})

// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入分类名称', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
    ],
    description: [
        { max: 255, message: '长度不能超过 255 个字符', trigger: 'blur' }
    ]
}

// 计算属性
const loading = computed(() => favoriteStore.loading)
const selectedCategory = computed(() => favoriteStore.selectedCategory)
const sortedCategories = computed(() => favoriteStore.sortedCategories)

// 添加搜索相关的计算属性和方法
const props = defineProps({
    searchCategoryStats: {
        type: Object,
        default: () => ({})
    },
    isSearching: {
        type: Boolean,
        default: false
    }
})

const hasSearchResults = (category) => {
    return props.isSearching && props.searchCategoryStats[category.id] > 0
}

// 方法
const handleCategorySelect = async (category) => {
    try {
        favoriteStore.selectedCategory = category.id
        emit('select', category)
    } catch (error) {
        ElMessage.error('分类选择失败')
    }
}

const handleAdd = () => {
    isEdit.value = false
    categoryForm.value = {
        name: '',
        description: ''
    }
    nextTick(() => {
        if (formRef.value) {
            formRef.value.resetFields()
        }
        dialogVisible.value = true
    })
}

const handleEdit = (category) => {
    isEdit.value = true
    categoryForm.value = {
        id: category.id,
        name: category.name,
        description: category.description
    }
    dialogVisible.value = true
}

const handleDelete = (category) => {
    categoryToDelete.value = category
    deleteDialogVisible.value = true
}

const closeDialog = () => {
    dialogVisible.value = false
    if (formRef.value) {
        formRef.value.resetFields()
    }
    categoryForm.value = {
        name: '',
        description: ''
    }
}

const handleSubmit = async () => {
    if (!formRef.value) return

    try {
        await formRef.value.validate()

        if (isEdit.value) {
            await favoriteStore.updateCategory(categoryForm.value.id, categoryForm.value)
            ElMessage.success('分类修改成功')
        } else {
            await favoriteStore.createCategory(categoryForm.value)
            ElMessage.success('分类创建成功')
        }

        closeDialog()
    } catch (error) {
        console.error('Form validation failed:', error)
        if (error.message) {
            ElMessage.error(error.message)
        }
    }
}

const confirmDelete = async () => {
    if (!categoryToDelete.value) return

    const success = await favoriteStore.deleteCategory(categoryToDelete.value.id)
    if (success) {
        deleteDialogVisible.value = false
        categoryToDelete.value = null

        // 如果删除的是当前选中的分类,切换到默认分类
        if (selectedCategory.value === categoryToDelete.value.id) {
            const defaultCategory = sortedCategories.value.find(c => c.isDefault)
            if (defaultCategory) {
                handleCategorySelect(defaultCategory)
            }
        }
    }
}

const handleDragEnd = async ({ oldIndex, newIndex }) => {
    if (oldIndex === newIndex) return

    const category = sortedCategories.value[newIndex]
    if (!category || category.isDefault) return

    await favoriteStore.updateCategorySort(category.id, newIndex)
}

// 监听分类变化
watch(() => favoriteStore.categories, (newCategories) => {
    //   console.log('分类列表发生变化:', newCategories)
}, { deep: true })

// 在组件卸载前清理 Sortable 实例
onBeforeUnmount(() => {
    if (draggableInstance.value?.$el?.sortable) {
        draggableInstance.value.$el.sortable.destroy()
    }
})

// 添加对话框打开后的处理方法
const handleDialogOpened = () => {
    nextTick(() => {
        if (nameInputRef.value?.$el?.querySelector('input')) {
            nameInputRef.value.$el.querySelector('input').focus()
        }
    })
}
</script>

<style lang="scss" scoped>
.favorite-category {
    display: flex;
    flex-direction: column;
    height: 100%;

    // 添加分类头部样式
    .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color-light);
        background-color: var(--el-bg-color);

        .header-title {
            font-size: 14px;
            font-weight: 500;
            color: blue;
        }

        .add-button {
            padding: 4px 8px;
            font-size: 13px;
            color: blue;

            .el-icon {
                margin-right: 4px;
                font-size: 14px;
            }

            &:hover {
                background-color: rgb(235, 217, 217);
            }

            &:active {
                background-color: var(--el-color-primary-light-8);
            }
        }
    }

    .category-list {
        flex: 1;
        overflow: hidden;

        .scrollbar-wrapper {
            height: calc(100vh - 240px);
            overflow-y: auto;

            // 自定义滚动条样式
            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-thumb {
                background-color: var(--el-border-color-lighter);
                border-radius: 3px;

                &:hover {
                    background-color: var(--el-border-color);
                }
            }

            &::-webkit-scrollbar-track {
                background-color: transparent;
            }
        }

        .category-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            margin: 4px 0;
            border-radius: 8px;
            background-color: var(--el-bg-color);
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
                background-color: var(--el-color-primary-light-9);

                .item-actions {
                    opacity: 1;
                }
            }

            &.is-active {
                background-color: var(--el-color-primary-light-8);

                .category-name {
                    color: var(--el-color-primary);
                    font-weight: 500;
                }
            }

            &.is-default {
                background-color: var(--el-color-primary-light-9);

                .category-icon {
                    color: var(--el-color-warning);
                }

                &:hover {
                    background-color: var(--el-color-primary-light-8);
                }

                &.is-active {
                    background-color: var(--el-color-primary-light-7);
                }
            }

            &.has-search-results {
                background-color: var(--el-color-success-light-9);

                &:hover {
                    background-color: var(--el-color-success-light-8);
                }

                &.is-active {
                    background-color: var(--el-color-success-light-7);
                }
            }

            .item-content {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;

                .drag-handle {
                    cursor: move;
                    color: var(--el-text-color-secondary);

                    &:hover {
                        color: var(--el-color-primary);
                    }
                }

                .category-icon {
                    font-size: 18px;
                    color: var(--el-color-primary);
                }

                .category-name {
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                }

                .category-count {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                }

                .search-tag {
                    margin-left: 8px;
                    font-size: 12px;
                }
            }

            .item-actions {
                opacity: 0;
                transition: opacity 0.3s ease;
                display: flex;
                gap: 4px;

                .el-button {
                    padding: 4px;

                    .el-icon {
                        font-size: 16px;
                    }
                }
            }
        }
    }
}

.delete-warning {
    color: var(--el-color-danger);
    font-size: 12px;
    margin-top: 8px;
}

// 添加对话框样式
:deep(.category-dialog) {
    .el-dialog__header {
        margin: 0;
        padding: 20px 24px;
        border-bottom: 1px solid var(--el-border-color-light);

        .el-dialog__title {
            font-size: 16px;
            font-weight: 600;
        }
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-light);

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
    }

    .el-form {
        .el-form-item {
            margin-bottom: 20px;

            &:last-child {
                margin-bottom: 0;
            }

            .el-form-item__label {
                font-weight: 500;
            }

            .el-input__wrapper,
            .el-textarea__inner {
                box-shadow: none;
                border: 1px solid var(--el-border-color);
                transition: all 0.3s ease;

                &:hover,
                &:focus {
                    border-color: var(--el-color-primary);
                    box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
                }
            }

            .el-input__count {
                background: transparent;
            }
        }
    }
}

// 暗色主题适配
:root[data-theme='dark'] {
    .favorite-category {
        .category-header {
            border-color: var(--el-border-color-darker);

            .header-title {
                color: var(--el-text-color-primary);
            }

            .add-button {
                &:hover {
                    background-color: var(--el-color-primary-light-9);
                }

                &:active {
                    background-color: var(--el-color-primary-light-8);
                }
            }
        }
    }
}

// 搜索状态下禁用拖拽样式
.category-item.is-searching {
    .drag-handle {
        cursor: default;
        opacity: 0.5;
    }
}
</style>