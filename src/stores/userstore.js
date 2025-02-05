import {
	defineStore
} from 'pinia';
import loginAvatar from '@/assets/default_avatar/avatar-login.png'
import unloginAvatar from '@/assets/default_avatar/avatar-unlogin.png'

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