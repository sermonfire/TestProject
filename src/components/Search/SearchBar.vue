<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <el-icon>
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
  background-color: #fff;
  padding: 10px 20px;

  .search-input-wrapper {
    background-color: #f5f5f5;
    border-radius: 20px;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 10px;

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      outline: none;

      &::placeholder {
        color: #999;
      }
    }
  }
}
</style> 