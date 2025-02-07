<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <el-icon class="search-icon">
        <Search />
      </el-icon>
      <div class="tags-container">
        <el-tag
          v-for="tag in selectedTags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          class="search-tag"
          effect="light"
        >
          {{ tag }}
        </el-tag>
        <input
          type="text"
          v-model="searchQuery"
          :placeholder="selectedTags.length ? '' : '搜索目的地、景点、主题...'"
          class="search-input"
          @input="handleSearch"
          @keydown.enter="handleSearchSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const selectedTags = ref([]);

// 定义emit
const emit = defineEmits(['search', 'update:tags']);

// 添加标签
const addTag = (tag) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }
};

// 移除标签
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag);
};

// 处理搜索
const handleSearch = () => {
  emit('search', {
    query: searchQuery.value,
    tags: selectedTags.value
  });
};

// 处理搜索提交
const handleSearchSubmit = () => {
  router.push({
    name: 'searchResults',
    query: {
      q: searchQuery.value,
      tags: selectedTags.value.join(',')
    }
  });
};

// 暴露方法给父组件
defineExpose({
  addTag
});
</script>

<style lang="scss" scoped>
.search-bar {
  background-color: #f5f5f5;
  padding: 12px 20px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .search-input-wrapper {
    background-color: #ffffff;
    border-radius: 25px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover, &:focus-within {
      background-color: #fff;
      border-color: var(--el-color-primary);
      box-shadow: 0 0 10px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .search-icon {
      color: var(--el-color-primary);
      font-size: 24px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      flex: 1;
      min-height: 32px;
    }

    .search-tag {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      padding: 0 8px;
      height: 28px;
      line-height: 26px;
      border-radius: 4px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.1);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      :deep(.el-tag__close) {
        color: var(--el-color-primary);
        
        &:hover {
          background-color: var(--el-color-primary);
          color: white;
        }
      }
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      outline: none;
      color: #333;
      min-width: 100px;
      height: 32px;
      padding: 0 8px;
      transition: all 0.3s ease;

      &::placeholder {
        color: #999;
        font-weight: 300;
        transition: opacity 0.3s ease;
      }

      &:focus::placeholder {
        opacity: 0.5;
      }
    }
  }
}
</style> 