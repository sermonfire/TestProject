import {
	defineStore
} from 'pinia';

export const useUserStore = defineStore('user', {
	state: () => ({
		token: localStorage.getItem('token') || '',
		userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
		isLogin: false
	}),
	actions: {
		setToken(token) {
			if (!token) return;
			this.token = token;
			localStorage.setItem('token', token);
			// console.log('Token set:', token);
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
			// console.log('UserInfo updated:', userInfo);
		},
		clear() {
			this.token = '';
			this.userInfo = null;
			localStorage.removeItem('token');
			localStorage.removeItem('userInfo');
			// console.log('Store cleared');
		},
		setLoginState(state) {
			this.isLogin = state;
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