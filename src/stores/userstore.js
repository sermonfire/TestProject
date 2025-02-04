import {
	defineStore
} from 'pinia';

export const useUserStore = defineStore('user', {
	state: () => ({
		token: uni.getStorageSync('token') || '',
		userInfo: uni.getStorageSync('userInfo') || null,
	}),
	actions: {
		setToken(token) {
			if (!token) return;
			this.token = token;
			uni.setStorageSync('token', token);
			// console.log('Token set:', token);
		},
		removeToken() {
			this.token = '';
			this.userInfo = null;
			uni.removeStorageSync('token');
		},
		updateUserInfo(userInfo) {
			if (!userInfo) return;
			this.userInfo = userInfo;
			uni.setStorageSync('userInfo', userInfo);
			// console.log('UserInfo updated:', userInfo);
		},
		clear() {
			this.token = '';
			this.userInfo = null;
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			// console.log('Store cleared');
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
		isLoggedIn: (state) => !!state.token && !!state.userInfo,
		getUserInfo: (state) => state.userInfo || {},
		loginStatus: (state) => !!state.token && !!state.userInfo
	}
});