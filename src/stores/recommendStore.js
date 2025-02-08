// 在 src/stores 下新建 recommendStore.js
import { defineStore } from 'pinia'
import { 
  saveUserPreferencesAPI, 
  getUserPreferencesAPI, 
  getPersonalizedRecommendationsAPI,
  getPreviewRecommendationsAPI,
  getSearchResultsAPI,
  clearRecommendationsCache
} from '@/api/recommendApi'
import { ElMessage } from 'element-plus'

export const useRecommendStore = defineStore('recommend', {
  state: () => ({
    userPreferences: {
      travelStyles: [], // 旅行风格
      destinationTypes: [], // 目的地类型  
      budget: 500, // 预算
      duration: 'short' // 时长偏好
    },
    recommendResults: {
      list: [],
      total: 0
    },
    currentPage: 1,
    pageSize: 10,
    loading: false,
    error: null
  }),
  
  actions: {
    // 保存用户偏好
    async savePreferences(preferences) {
      try {
        this.loading = true
        const res = await saveUserPreferencesAPI(preferences)
        if (res.code === 0) {
          this.userPreferences = preferences
          // 保存成功后清除推荐缓存并重新获取推荐
          clearRecommendationsCache()
          await this.getPersonalizedRecommendations(true)
          ElMessage.success('偏好设置保存成功')
        } else {
          throw new Error(res.message || '保存失败')
        }
      } catch (error) {
        this.error = error.message
        ElMessage.error(error.message || '保存偏好设置失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取用户偏好
    async getUserPreferences() {
      try {
        this.loading = true
        const res = await getUserPreferencesAPI()
        if (res.code === 0 && res.data) {
          this.userPreferences = res.data
        }
        return res.data
      } catch (error) {
        this.error = error.message
        ElMessage.error('获取偏好设置失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取个性化推荐
    async getPersonalizedRecommendations(forceRefresh = false) {
      try {
        this.loading = true
        const res = await getPersonalizedRecommendationsAPI(
          this.currentPage,
          this.pageSize,
          forceRefresh
        )
        if (res.code === 0 && res.data) {
          this.recommendResults = {
            list: res.data.list,
            total: res.data.total
          }
        }
        return res.data
      } catch (error) {
        this.error = error.message
        ElMessage.error('获取推荐失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取推荐预览
    async getPreviewRecommendations() {
      try {
        this.loading = true
        const res = await getPreviewRecommendationsAPI()
        if (res.code === 0 && res.data) {
          return res.data
        }
        return []
      } catch (error) {
        this.error = error.message
        ElMessage.error('获取推荐预览失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 搜索目的地
    async searchDestinations({ tags, page = 1, pageSize = 10 }) {
      try {
        this.loading = true
        const res = await getSearchResultsAPI({ tags, pageNum: page, pageSize })
        if (res.code === 0 && res.data) {
          return res.data
        }
        return { list: [], total: 0 }
      } catch (error) {
        this.error = error.message
        ElMessage.error('搜索失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新分页
    updatePagination(page, size) {
      this.currentPage = page
      this.pageSize = size
    },

    // 更新用户偏好（本地更新，不调用API）
    updatePreferences(preferences) {
      this.userPreferences = {
        ...this.userPreferences,
        ...preferences
      }
    },

    // 清除状态
    clearState() {
      this.userPreferences = {
        travelStyles: [],
        destinationTypes: [],
        budget: 500,
        duration: 'short'
      }
      this.recommendResults = {
        list: [],
        total: 0
      }
      this.currentPage = 1
      this.pageSize = 10
      this.error = null
      clearRecommendationsCache()
    }
  },

  persist: {
    key: 'recommend-store',
    paths: ['userPreferences', 'currentPage', 'pageSize']
  }
})