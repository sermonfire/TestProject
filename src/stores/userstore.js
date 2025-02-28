import {
    defineStore
} from 'pinia';
import loginAvatar from '@/assets/default_avatar/avatar-login.png'
import unloginAvatar from '@/assets/default_avatar/avatar-unlogin.png'
import { useLocalServiceStore } from './localServiceStore'

/**
 * 用户状态管理Store
 */
export const useUserStore = defineStore('user', {
    state: () => ({
        /**
         * 用户认证令牌
         * @type {string}
         */
        token: localStorage.getItem('token') || '',

        /**
         * 用户信息对象
         * @type {Object|null}
         */
        userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}') || null,

        /**
         * 登录状态
         * @type {boolean}
         */
        isLogin: false,

        /**
         * 默认登录头像
         * @type {string}
         */
        defaultLoginAvatar: loginAvatar,

        /**
         * 默认未登录头像
         * @type {string}
         */
        defaultUnloginAvatar: unloginAvatar
    }),
    actions: {
        /**
         * 设置用户信息
         * @param {Object} info - 用户信息对象
         */
        setUserInfo(info) {
            if (!info) return
            this.userInfo = info
            localStorage.setItem('userInfo', JSON.stringify(info))
        },

        /**
         * 设置认证令牌
         * @param {string} token - 认证令牌
         */
        setToken(token) {
            if (!token) return
            this.token = token
            localStorage.setItem('token', token)
        },

        /**
         * 移除认证令牌
         */
        removeToken() {
            this.token = ''
            this.userInfo = null
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
        },

        /**
         * 更新用户信息
         * @param {Object} userInfo - 用户信息对象
         */
        updateUserInfo(userInfo) {
            if (!userInfo) return
            this.userInfo = userInfo
            localStorage.setItem('userInfo', JSON.stringify(userInfo))
        },

        /**
         * 清除所有用户相关数据
         */
        clear() {
            // 清除状态
            this.token = ''
            this.userInfo = null
            this.isLogin = false

            // 清除本地存储
            const keysToRemove = [
                'token',
                'userInfo',
                'user',
                'user-storage',
                'carousel_images_cache'
            ]
            keysToRemove.forEach(key => localStorage.removeItem(key))

            // 清除服务数据缓存
            const localServiceStore = useLocalServiceStore()
            localServiceStore.clearAllCache()
        },

        /**
         * 设置登录状态
         * @param {boolean} state - 登录状态
         */
        setLoginState(state) {
            this.isLogin = state
        },

        /**
         * 处理登录成功
         * @param {string} token - 认证令牌
         * @param {Object} userInfo - 用户信息
         */
        async loginSuccess(token, userInfo) {
            this.setToken(token)
            this.setUserInfo(userInfo)
            this.setLoginState(true)
            localStorage.removeItem('carousel_images_cache')
        },

        /**
         * 用户退出登录
         */
        logout() {
            const localServiceStore = useLocalServiceStore()

            // 清除用户信息
            this.userInfo = null
            this.token = ''
            this.isLogin = false

            // 清除本地存储
            localStorage.removeItem('userInfo')
            localStorage.removeItem('token')
            localStorage.removeItem('user-storage')

            // 清除服务数据缓存
            localServiceStore.clearAllCache()
        }
    },
    persist: {
        enabled: true,
        strategies: [{
            storage: localStorage,
            paths: ['token', 'userInfo'],
            key: 'user-storage'
        }]
    },
    getters: {
        /**
         * 获取认证令牌
         * @returns {string} 认证令牌
         */
        getToken: (state) => state.token,

        /**
         * 获取用户信息
         * @returns {Object} 用户信息对象
         */
        getUserInfo: (state) => state.userInfo || {},

        /**
         * 获取用户头像
         * @returns {string} 用户头像URL
         */
        getUserAvatar: (state) => {
            if (!state.token) {
                return state.defaultUnloginAvatar
            }
            return state.userInfo?.userPic || state.defaultLoginAvatar
        },

        /**
         * 获取显示用的电话号码
         * @returns {string} 显示用的电话号码或用户名
         */
        getDisplayPhone: (state) => {
            if (!state.token) return '未登录'
            return state.userInfo?.phone || state.userInfo?.username
        }
    }
});