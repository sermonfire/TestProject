import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  addFavoriteAPI, 
  removeFavoriteAPI, 
  removeAllFavoritesAPI,
  getFavoriteListAPI,
  checkIsFavoriteAPI,
  updateFavoriteAPI
} from '@/api/favoriteApi'

export const useFavoriteStore = defineStore('favorite', () => {
  // 状态
  const favorites = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  const addFavorite = async (destinationId, category = '', notes = '') => {
    try {
      isLoading.value = true
      const response = await addFavoriteAPI(destinationId, category, notes)

      if (response.code === 0) {
        ElMessage.success('收藏成功')
        await getFavoriteList() // 刷新收藏列表
        return true
      }
      throw new Error(response.message || '收藏失败')
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || '收藏失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const removeFavorite = async (destinationId) => {
    try {
      isLoading.value = true
      const response = await removeFavoriteAPI(destinationId)

      if (response.code === 0) {
        ElMessage.success('已取消收藏')
        await getFavoriteList() // 刷新收藏列表
        return true
      }
      throw new Error(response.message || '取消收藏失败')
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || '取消收藏失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const removeAllFavorites = async () => {
    try {
      isLoading.value = true
      const response = await removeAllFavoritesAPI()

      if (response.code === 0) {
        ElMessage.success('已清空收藏')
        favorites.value = []
        return true
      }
      throw new Error(response.message || '清空收藏失败')
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || '清空收藏失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const getFavoriteList = async (pageNum = 1, pageSize = 10) => {
    try {
      isLoading.value = true
      const response = await getFavoriteListAPI(pageNum, pageSize)

      if (response.code === 0) {
        favorites.value = response.data.list
        return response.data
      }
      throw new Error(response.message || '获取收藏列表失败')
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || '获取收藏列表失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const checkIsFavorite = async (destinationId) => {
    try {
      const response = await checkIsFavoriteAPI(destinationId)
      return response.code === 0 && response.data
    } catch (err) {
      console.error('Check favorite status error:', err)
      return false
    }
  }

  const updateFavorite = async (id, category, notes) => {
    try {
      isLoading.value = true
      const response = await updateFavoriteAPI(id, category, notes)

      if (response.code === 0) {
        ElMessage.success('更新成功')
        await getFavoriteList() // 刷新收藏列表
        return true
      }
      throw new Error(response.message || '更新失败')
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || '更新失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    favorites,
    isLoading,
    error,
    // Actions
    addFavorite,
    removeFavorite,
    removeAllFavorites,
    getFavoriteList,
    checkIsFavorite,
    updateFavorite
  }
}, {
  persist: true
}) 