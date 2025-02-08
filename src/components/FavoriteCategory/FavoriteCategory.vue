<template>
  <div class="favorite-category">
    <!-- 分类列表 -->
    <div class="category-list">
      <div class="scrollbar-wrapper">
        <VueDraggable 
          v-model="sortedCategories" 
          :disabled="loading"
          item-key="id"
          handle=".drag-handle"
          @end="handleDragEnd"
          :animation="200"
          :group="{ name: 'categories' }"
          :removeOnSpill="false"
          :sort="true"
        >
          <template #item="{ element }">
            <div class="category-item" 
              :class="{ 
                'is-active': selectedCategory === element.id,
                'is-default': element.isDefault 
              }"
            >
              <div class="item-content" @click="handleCategorySelect(element)">
                <el-icon class="drag-handle" v-if="!element.isDefault">
                  <Rank />
                </el-icon>
                <el-icon class="category-icon">
                  <component :is="element.isDefault ? 'Star' : 'Folder'" />
                </el-icon>
                <span class="category-name">{{ element.name }}</span>
                <span class="category-count">({{ element.count || 0 }})</span>
              </div>
              
              <div class="item-actions" v-if="!element.isDefault">
                <el-button 
                  link
                  size="small" 
                  @click.stop="handleEdit(element)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  link
                  size="small" 
                  @click.stop="handleDelete(element)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
        </VueDraggable>
      </div>
    </div>

    <!-- 添加分类按钮 -->
    <div class="category-actions">
      <el-button 
        type="primary" 
        @click="handleAdd"
        :loading="loading"
      >
        <el-icon><Plus /></el-icon>
        新建分类
      </el-button>
    </div>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="categoryForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            placeholder="请输入分类描述"
            maxlength="255"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除分类"
      width="30%"
    >
      <p>确定要删除分类"{{ categoryToDelete?.name }}"吗？</p>
      <p class="delete-warning">该分类下的收藏将移至默认分类</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="confirmDelete"
            :loading="loading"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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

// 方法
const handleCategorySelect = async (category) => {
  try {
    // console.log('选择分类:', category)
    favoriteStore.selectedCategory = category.id
    emit('select', category)
  } catch (error) {
    // console.error('分类选择失败:', error)
    ElMessage.error('分类选择失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  categoryForm.value = {
    name: '',
    description: ''
  }
  dialogVisible.value = true
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

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      await favoriteStore.updateCategory(categoryForm.value.id, categoryForm.value)
    } else {
      await favoriteStore.createCategory(categoryForm.value)
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('Form validation failed:', error)
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
</script>

<style lang="scss" scoped>
.favorite-category {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .category-list {
    flex: 1;
    overflow: hidden;
    
    .scrollbar-wrapper {
      height: calc(100vh - 280px);
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
  
  .category-actions {
    padding: 16px;
    border-top: 1px solid var(--el-border-color-light);
    
    .el-button {
      width: 100%;
    }
  }
}

.delete-warning {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 8px;
}
</style>