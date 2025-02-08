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
    return [...categories.value].map(category => ({
      ...category,
      // 计算每个分类下的收藏数量
      count: favorites.value.filter(item => 
        category.isDefault ? 
          !item.category || item.category === category.id : // 默认分类包含未分类的收藏
          item.category === category.id
      ).length
    })).sort((a, b) => {
      // 默认分类始终排在第一位
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      // 其他按照sortOrder排序
      return a.sortOrder - b.sortOrder
    })
  })

  // 修改当前分类收藏数量的计算属性
  const currentCategoryCount = computed(() => {
    const currentCategory = categories.value.find(c => c.id === selectedCategory.value)
    if (!currentCategory) return 0

    return favorites.value.filter(item => 
      currentCategory.isDefault ? 
        !item.category || item.category === currentCategory.id :
        item.category === currentCategory.id
    ).length
  })

  // 方法
  // 添加刷新方法
  const refreshFavoriteData = async () => {
    try {
      // 如果当前在收藏页面，刷新收藏列表
      if (selectedCategory.value) {
        await getFavoriteList(currentPage.value, pageSize.value, selectedCategory.value)
      }
      // 刷新分类列表和统计信息
      await Promise.all([
        getCategories(),
        getFavoriteStats()
      ])
    } catch (error) {
      console.error('Refresh favorite data failed:', error)
    }
  }

  // 修改添加收藏方法
  const addFavorite = async (destinationId, category = '', notes = '') => {
    try {
      loading.value = true
      const res = await addFavoriteAPI(destinationId, category, notes)
      if (res.code === 0) {
        ElMessage.success('收藏成功')
        // 刷新数据
        await refreshFavoriteData()
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

  // 修改取消收藏方法
  const removeFavorite = async (destinationId) => {
    try {
      loading.value = true
      const res = await removeFavoriteAPI(destinationId)
      if (res.code === 0) {
        ElMessage.success('已取消收藏')
        // 刷新数据
        await refreshFavoriteData()
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

  // 修改获取收藏列表方法
  const getFavoriteList = async (page = 1, size = 10, categoryId = null) => {
    try {
      loading.value = true
      currentPage.value = page
      pageSize.value = size
      
      const res = await getFavoriteListAPI(page, size, categoryId)
      if (res.code === 0) {
        // 更新收藏列表
        favorites.value = res.data.list.map(item => ({
          ...item,
          category: item.category || (categoryId || null) // 如果没有分类，使用当前选中的分类ID
        }))
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

  // 修改移动收藏方法
  const batchUpdateCategory = async (favoriteIds, category) => {
    try {
      loading.value = true
      const res = await batchUpdateCategoryAPI(favoriteIds, category)
      if (res.code === 0) {
        ElMessage.success('批量更新成功')
        // 更新收藏列表
        await getFavoriteList(currentPage.value, pageSize.value, selectedCategory.value)
        // 更新分类列表以刷新计数
        await getCategories()
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
    updateFavorite,
    refreshFavoriteData
  }
}, {
  persist: {
    key: 'favorite-store',
    paths: ['categories', 'selectedCategory']
  }
}) 