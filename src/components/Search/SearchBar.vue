<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <el-icon class="search-icon">
        <Search />
      </el-icon>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索目的地、景点、主题..."
        class="search-input"
        @input="handleSearch"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

const searchQuery = ref('');

// 定义emit
const emit = defineEmits(['search']);

// 处理搜索
const handleSearch = () => {
  emit('search', searchQuery.value);
};
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
      font-size: 18px;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      outline: none;
      color: #333;

      &::placeholder {
        color: #999;
        font-weight: 300;
      }
    }
  }
}
</style> 