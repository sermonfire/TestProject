import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  addFavoriteAPI, 
  removeFavoriteAPI, 
  getFavoriteListAPI,
  checkIsFavoriteAPI,
  createCategoryAPI,
  deleteCategoryAPI,
  getCategoryListAPI,
  updateCategoryAPI,
  getFavoriteStatsAPI,
  searchFavoritesAPI,
  batchUpdateCategoryAPI,
  batchDeleteFavoritesAPI,
  updateCategorySortAPI,
  updateFavoriteAPI
} from '@/api/api'

export const useFavoriteStore = defineStore('favorite', () => {
  // 状态
  const favorites = ref([])
  const categories = ref([])
  const favoriteStats = ref(null)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const selectedCategory = ref(null)

  // 计算属性
  const hasDefaultCategory = computed(() => {
    return categories.value.some(cat => cat.isDefault)
  })

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => {
      // 默认分类始终排在第一位
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      // 其他按照sortOrder排序
      return a.sortOrder - b.sortOrder
    })
  })

  // 添加一个计算属性来获取当前分类的收藏数量
  const currentCategoryCount = computed(() => {
    const category = categories.value.find(c => c.id === selectedCategory.value)
    return category?.count || 0
  })

  // 方法
  // 添加收藏
  const addFavorite = async (destinationId, category = '', notes = '') => {
    try {
      loading.value = true
      const res = await addFavoriteAPI(destinationId, category, notes)
      if (res.code === 0) {
        ElMessage.success('收藏成功')
        await getFavoriteStats()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '收藏失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 取消收藏
  const removeFavorite = async (destinationId) => {
    try {
      loading.value = true
      const res = await removeFavoriteAPI(destinationId)
      if (res.code === 0) {
        ElMessage.success('已取消收藏')
        await getFavoriteStats()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '取消收藏失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 检查是否已收藏
  const checkIsFavorite = async (destinationId) => {
    try {
      const res = await checkIsFavoriteAPI(destinationId)
      return res.code === 0 && res.data
    } catch (error) {
      console.error('Check favorite status failed:', error)
      return false
    }
  }

  // 获取收藏列表
  const getFavoriteList = async (page = 1, size = 10, categoryId = null) => {
    try {
      loading.value = true
      currentPage.value = page
      pageSize.value = size
      
      // 如果没有指定分类ID，则获取所有收藏
      const res = await getFavoriteListAPI(page, size, categoryId)
      if (res.code === 0) {
        favorites.value = res.data.list
        total.value = res.data.total
      }
    } catch (error) {
      ElMessage.error(error.message || '获取收藏列表失败')
    } finally {
      loading.value = false
    }
  }

  // 创建收藏分类
  const createCategory = async (categoryData) => {
    try {
      loading.value = true
      const res = await createCategoryAPI(categoryData)
      if (res.code === 0) {
        ElMessage.success('创建分类成功')
        await getCategories()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '创建分类失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 删除收藏分类
  const deleteCategory = async (categoryId) => {
    try {
      loading.value = true
      const res = await deleteCategoryAPI(categoryId)
      if (res.code === 0) {
        ElMessage.success('删除分类成功')
        await getCategories()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '删除分类失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取分类列表
  const getCategories = async () => {
    try {
      loading.value = true
      const res = await getCategoryListAPI()
      if (res.code === 0) {
        categories.value = res.data
      }
    } catch (error) {
      ElMessage.error(error.message || '获取分类列表失败')
    } finally {
      loading.value = false
    }
  }

  // 更新分类信息
  const updateCategory = async (categoryId, categoryData) => {
    try {
      loading.value = true
      const res = await updateCategoryAPI(categoryId, categoryData)
      if (res.code === 0) {
        ElMessage.success('更新分类成功')
        await getCategories()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '更新分类失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新分类排序
  const updateCategorySort = async (categoryId, sortOrder) => {
    try {
      loading.value = true
      const res = await updateCategorySortAPI(categoryId, sortOrder)
      if (res.code === 0) {
        await getCategories()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '更新排序失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取收藏统计
  const getFavoriteStats = async () => {
    try {
      const res = await getFavoriteStatsAPI()
      if (res.code === 0) {
        favoriteStats.value = res.data
      }
    } catch (error) {
      console.error('Get favorite stats failed:', error)
    }
  }

  // 搜索收藏
  const searchFavorites = async (keyword, page = 1, size = 10) => {
    try {
      loading.value = true
      const res = await searchFavoritesAPI(keyword, page, size)
      if (res.code === 0) {
        favorites.value = res.data.list
        total.value = res.data.total
        currentPage.value = page
        pageSize.value = size
      }
    } catch (error) {
      ElMessage.error(error.message || '搜索失败')
    } finally {
      loading.value = false
    }
  }

  // 批量更新分类
  const batchUpdateCategory = async (favoriteIds, category) => {
    try {
      loading.value = true
      const res = await batchUpdateCategoryAPI(favoriteIds, category)
      if (res.code === 0) {
        ElMessage.success('批量更新成功')
        await getFavoriteList(currentPage.value, pageSize.value, selectedCategory.value)
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '批量更新失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 批量删除收藏
  const batchDeleteFavorites = async (favoriteIds) => {
    try {
      loading.value = true
      const res = await batchDeleteFavoritesAPI(favoriteIds)
      if (res.code === 0) {
        ElMessage.success('批量删除成功')
        await getFavoriteList(currentPage.value, pageSize.value, selectedCategory.value)
        await getFavoriteStats()
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '批量删除失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新收藏
  const updateFavorite = async (favoriteId, data) => {
    try {
      loading.value = true
      const res = await updateFavoriteAPI(favoriteId, data)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        await getFavoriteList(currentPage.value, pageSize.value, selectedCategory.value)
        return true
      }
      return false
    } catch (error) {
      ElMessage.error(error.message || '更新失败')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    favorites,
    categories,
    favoriteStats,
    loading,
    currentPage,
    pageSize,
    total,
    selectedCategory,
    
    // 计算属性
    hasDefaultCategory,
    sortedCategories,
    currentCategoryCount,
    
    // 方法
    addFavorite,
    removeFavorite,
    checkIsFavorite,
    getFavoriteList,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    updateCategorySort,
    getFavoriteStats,
    searchFavorites,
    batchUpdateCategory,
    batchDeleteFavorites,
    updateFavorite
  }
}, {
  persist: {
    key: 'favorite-store',
    paths: ['categories', 'selectedCategory']
  }
}) 