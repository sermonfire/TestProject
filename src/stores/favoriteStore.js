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
  const favoriteStatus = ref(new Map()) // 用于存储所有项目的收藏状态
  const selectedItems = ref([])

  // 添加收藏操作的状态跟踪
  const operationStatus = ref({
    type: '', 
    status: '', 
    message: '',
    timestamp: null
  })

  // 添加缓存
  const statusCache = new Map()

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

  // 添加序列化和反序列化方法
  const serializeFavoriteStatus = computed(() => {
    return Array.from(favoriteStatus.value.entries())
  })
  
  const deserializeFavoriteStatus = (data) => {
    if (Array.isArray(data)) {
      favoriteStatus.value = new Map(data)
    }
  }

  // 方法
  // 添加刷新方法
  const refreshFavoriteData = async () => {
    try {
      loading.value = true
      // 只刷新分类列表和统计信息
      await Promise.all([
        getCategories(),
        getFavoriteStats()
      ])

      // 清除可能的缓存数据
      statusCache.clear() // 清除状态缓存
      const promises = favorites.value.map(async item => {
        const isStillFavorite = await checkIsFavorite(item.id)
        return isStillFavorite ? item : null
      })
      
      const validFavorites = (await Promise.all(promises)).filter(Boolean)
      favorites.value = validFavorites

      // 触发状态更新
      favoriteStatus.value = new Map(favoriteStatus.value)
    } catch (error) {
      console.error('Refresh favorite data failed:', error)
      ElMessage.error('刷新数据失败，请重试')
    } finally {
      loading.value = false
    }
  }

  // 添加操作状态的更新方法
  const updateOperationStatus = (type, status, message = '') => {
    operationStatus.value = {
      type,
      status,
      message,
      timestamp: Date.now()
    }
  }

  // 更新收藏状态
  const updateFavoriteStatus = (id, status) => {
    if (id == null) return;
    const statusKey = String(id);
    const currentStatus = favoriteStatus.value.get(statusKey);
    const newStatus = Boolean(status);
    
    if (currentStatus !== newStatus) {
      favoriteStatus.value.set(statusKey, newStatus);
    }
  };

  // 获取收藏状态
  const getFavoriteStatus = (id) => {
    if (id == null) return false;
    return favoriteStatus.value.get(String(id)) ?? false;
  };

  // 检查收藏状态
  const checkIsFavorite = async (id) => {
    if (!id) return false;
    
    try {
      const res = await checkIsFavoriteAPI(id);
      const status = res.code === 0 && Boolean(res.data);
      updateFavoriteStatus(id, status);
      return status;
    } catch (error) {
      console.error('Check favorite status failed:', error);
      return false;
    }
  };

  // 修改添加收藏方法
  const addFavorite = async (destinationId, category = '', notes = '') => {
    updateOperationStatus('add', 'pending')
    try {
      loading.value = true
      const res = await addFavoriteAPI(destinationId, category, notes)
      if (res.code === 0) {
        // 立即更新状态
        updateFavoriteStatus(destinationId, true)
        ElMessage({
          message: '收藏成功',
          type: 'success',
          customClass: 'collection-message'
        })
        await refreshFavoriteData()
        updateOperationStatus('add', 'success', '收藏成功')
        return true
      } else {
        // 失败时也要更新状态
        updateFavoriteStatus(destinationId, false)
        ElMessage({
          message: res.message || '收藏失败',
          type: 'error',
          customClass: 'collection-message'
        })
        return false
      }
    } catch (error) {
      console.error('[收藏失败]:', error)
      updateFavoriteStatus(destinationId, false)
      ElMessage({
        message: '网络异常，请稍后重试',
        type: 'error',
        customClass: 'collection-message'
      })
      updateOperationStatus('add', 'error', error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 修改取消收藏方法
  const removeFavorite = async (id) => {
    if (!id || isNaN(Number(id))) {
      throw new Error('无效的收藏ID');
    }

    try {
      const response = await removeFavoriteAPI(Number(id)); // 确保转换为数字
      if (response.code === 0) {
        // 更新本地状态
        updateFavoriteStatus(id, false);
        // 从收藏列表中移除
        favorites.value = favorites.value.filter(item => item.id !== id);
        return true;
      }
      throw new Error(response.message || '取消收藏失败');
    } catch (error) {
      console.error('Remove favorite failed:', error);
      throw error;
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
      const res = await getCategoryListAPI()
      if (res.code === 0) {
        categories.value = res.data
        const hasDefault = categories.value.some(c => c.isDefault)
 
        if (!hasDefault) {
          await createCategory({
            name: '默认收藏',
            isDefault: true,
            sortOrder: 0
          })
        }
        
        return true
      } else {
        ElMessage.error(res.message || '获取分类列表失败')
        return false
      }
    } catch (error) {
      ElMessage.error('获取分类列表失败')
      return false
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
        // 只更新分类列表以刷新计数
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

  // 修改批量取消收藏方法
  const batchDeleteFavorites = async (ids) => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new Error('无效的收藏ID列表');
    }

    // 确保所有ID都是有效的数字
    const validIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
    if (validIds.length !== ids.length) {
      throw new Error('存在无效的收藏ID');
    }

    try {
      const response = await batchDeleteFavoritesAPI(validIds);
      if (response.code === 0) {
        // 更新本地状态
        validIds.forEach(id => updateFavoriteStatus(id, false));
        // 从收藏列表中移除
        favorites.value = favorites.value.filter(item => !validIds.includes(item.id));
        return true;
      }
      throw new Error(response.message || '批量取消收藏失败');
    } catch (error) {
      console.error('Batch delete failed:', error);
      throw error;
    }
  }

  // 优化批量检查方法
  const batchCheckFavoriteStatus = async (itemIds) => {
    if (!Array.isArray(itemIds) || !itemIds.length) return;
    
    try {
      const validIds = itemIds
        .map(id => String(id))
        .filter(Boolean);
        
      const promises = validIds.map(id => checkIsFavorite(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Batch check favorite status failed:', error);
    }
  };

  const clearSelection = () => {
    selectedItems.value = []
  }

  const deleteFavorite = async (id) => {
    try {
      const res = await removeFavoriteAPI(id)
      if (res.code === 0) {
        // 更新本地状态
        favoriteStatus.value.delete(id)
        // 从收藏列表中移除该项
        favorites.value = favorites.value.filter(item => item.id !== id)
        // 更新统计信息
        await getFavoriteStats()
        // 更新分类列表
        await getCategories()
        return true
      }
      return false
    } catch (error) {
      console.error('Delete favorite failed:', error)
      return false
    }
  }

  return {
    // 状态
    categories,
    favoriteStats,
    loading,
    selectedCategory,
    selectedItems,
    
    // 计算属性
    hasDefaultCategory,
    sortedCategories,
    currentCategoryCount,
    
    // 方法
    addFavorite,
    removeFavorite,
    checkIsFavorite,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    updateCategorySort,
    getFavoriteStats,
    searchFavorites,
    batchUpdateCategory,
    batchDeleteFavorites,
    refreshFavoriteData,
    operationStatus,
    updateOperationStatus,
    updateFavoriteStatus,
    getFavoriteStatus,
    batchCheckFavoriteStatus,
    serializeFavoriteStatus,
    deserializeFavoriteStatus,
    clearSelection,
    deleteFavorite
  }
}, {
  persist: {
    key: 'favorite-store',
    paths: ['categories', 'selectedCategory', 'serializeFavoriteStatus'],
    afterRestore: (ctx) => {
      const store = ctx.store
      store.deserializeFavoriteStatus(store.serializeFavoriteStatus)
    }
  }
}) 