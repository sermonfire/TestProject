import { defineStore } from 'pinia'

/**
 * 社交分享功能的状态管理
 */
export const useShareStore = defineStore('share', {
    state: () => ({
        /**
         * 最近分享的内容列表
         */
        recentShares: [],

        /**
         * 分享统计数据
         */
        shareStats: {
            totalShares: 0,
            wechatShares: 0,
            weiboShares: 0,
            qqShares: 0,
            linkCopies: 0
        }
    }),

    actions: {
        /**
         * 记录一次分享行为
         * @param {Object} shareData - 分享的数据
         * @param {string} platform - 分享平台
         */
        recordShare(shareData, platform) {
            // 更新分享统计
            this.shareStats.totalShares++
            switch (platform) {
                case 'wechat':
                    this.shareStats.wechatShares++
                    break
                case 'weibo':
                    this.shareStats.weiboShares++
                    break
                case 'qq':
                    this.shareStats.qqShares++
                    break
                case 'link':
                    this.shareStats.linkCopies++
                    break
            }

            // 添加到最近分享列表
            this.recentShares.unshift({
                ...shareData,
                platform,
                timestamp: new Date().toISOString()
            })

            // 只保留最近10条记录
            if (this.recentShares.length > 10) {
                this.recentShares.pop()
            }
        },

        /**
         * 获取分享统计数据
         */
        getShareStats() {
            return this.shareStats
        },

        /**
         * 获取最近分享记录
         */
        getRecentShares() {
            return this.recentShares
        }
    },

    persist: {
        enabled: true,
        strategies: [
            {
                key: 'travel-rec-share',
                storage: localStorage,
                paths: ['shareStats', 'recentShares']
            }
        ]
    }
}) 