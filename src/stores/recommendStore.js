// 在 src/stores 下新建 recommendStore.js
import { defineStore } from 'pinia'
import { saveUserPreferencesAPI, getUserPreferencesAPI, getRecommendationsAPI, getDestinationsAPI } from '@/api/api'

export const useRecommendStore = defineStore('recommend', {
  state: () => ({
    userPreferences: {
      travelStyles: [], // 旅行风格
      destinationTypes: [], // 目的地类型  
      budget: 500, // 预算
      duration: 'short' // 时长偏好
    },
    recommendResults: [],
    loading: false,
    error: null
  }),
  
  actions: {
    // 保存用户偏好
    async savePreferences(preferences) {
      try {
        this.loading = true
        await saveUserPreferencesAPI(preferences)
        this.userPreferences = preferences
        // 保存成功后立即获取新的推荐
        await this.getRecommendations()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取用户偏好
    async getUserPreferences() {
      try {
        this.loading = true
        const response = await getUserPreferencesAPI()
        if (response.data) {
          this.userPreferences = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取推荐结果
    async getRecommendations() {
      try {
        this.loading = true
        const response = await getRecommendationsAPI()
        if (response.data) {
          this.recommendResults = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新用户偏好
    updatePreferences(preferences) {
      this.userPreferences = {
        ...this.userPreferences,
        ...preferences
      }
    },

    // 生成推荐结果
    async generateRecommendations() {
      try {
        // 基于用户偏好计算推荐分数
        const recommendations = await this.calculateRecommendations()
        this.recommendResults = recommendations
        return recommendations
      } catch (error) {
        console.error('推荐计算失败:', error)
        return []
      }
    },

    // 计算推荐得分
    async calculateRecommendations() {
      // 1. 获取目的地数据
      const destinations = await this.fetchDestinations()
      
      // 2. 计算每个目的地的匹配度分数
      const scoredDestinations = destinations.map(dest => {
        let score = 0
        
        // 旅行风格匹配度
        const styleMatch = this.userPreferences.travelStyles.filter(style => 
          dest.styles.includes(style)
        ).length
        score += styleMatch * 2
        
        // 目的地类型匹配度
        const typeMatch = this.userPreferences.destinationTypes.filter(type =>
          dest.types.includes(type)
        ).length
        score += typeMatch * 2
        
        // 预算匹配度 (0-1的匹配系数)
        const budgetDiff = Math.abs(dest.avgCost - this.userPreferences.budget)
        const budgetScore = Math.max(0, 1 - budgetDiff / this.userPreferences.budget)
        score += budgetScore * 3
        
        // 时长匹配度
        if(dest.recommendDuration === this.userPreferences.duration) {
          score += 2
        }
        
        return {
          ...dest,
          matchScore: score
        }
      })
      
      // 3. 排序并返回推荐结果
      return scoredDestinations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)
    },

    // 获取目的地数据
    async fetchDestinations() {
      try {
        const response = await getDestinationsAPI()
        return response.data
      } catch (error) {
        console.error('获取目的地数据失败:', error)
        return []
      }
    }
  }
})