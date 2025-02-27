import {
    defineStore
} from 'pinia';
import loginAvatar from '@/assets/default_avatar/avatar-login.png'
import unloginAvatar from '@/assets/default_avatar/avatar-unlogin.png'
import { useHotelStore } from './hotelStore'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: localStorage.getItem('token') || '',
        userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}') || null,
        isLogin: false,
        defaultLoginAvatar: loginAvatar,
        defaultUnloginAvatar: unloginAvatar
    }),
    actions: {
        setUserInfo(info) {
            this.userInfo = info;
            localStorage.setItem('userInfo', JSON.stringify(info));
        },
        setToken(token) {
            if (!token) return;
            this.token = token;
            localStorage.setItem('token', token);
        },
        removeToken() {
            this.token = '';
            this.userInfo = null;
            localStorage.removeItem('token');
        },
        updateUserInfo(userInfo) {
            if (!userInfo) return;
            this.userInfo = userInfo;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        },
        clear() {
            this.token = '';
            this.userInfo = null;
            this.isLogin = false;
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('user');
            // 清除轮播图缓存
            localStorage.removeItem('carousel_images_cache');
        },
        setLoginState(state) {
            this.isLogin = state;
        },
        // 添加登录成功后的处理
        async loginSuccess(token, userInfo) {
            this.setToken(token);
            this.setUserInfo(userInfo);
            this.setLoginState(true);
            // 清除旧的轮播图缓存
            localStorage.removeItem('carousel_images_cache');
        },
        /**
         * 用户退出登录
         */
        logout() {
            const hotelStore = useHotelStore()
            // 清除用户信息
            this.userInfo = {}
            this.token = ''
            // 清除酒店缓存
            hotelStore.clearCache()
            // 清除本地存储
            localStorage.removeItem('userInfo')
            localStorage.removeItem('token')
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['token', 'userInfo'],
                key: 'user-storage'
            }
        ]
    },
    getters: {
        getToken: (state) => state.token,
        getUserInfo: (state) => state.userInfo || {},
        getUserAvatar: (state) => {
            if (!state.token) {
                return state.defaultUnloginAvatar;
            }
            return state.userInfo?.userPic || state.defaultLoginAvatar;
        },
        getDisplayPhone: (state) => {
            if (!state.token) return '未登录';
            return state.userInfo?.phone || state.userInfo?.username;
        }
    }
});