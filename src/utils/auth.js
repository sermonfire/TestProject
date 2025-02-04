import {
	checkLoginAPI
} from '@/api/api.js'; // 使用命名导入
import {
	useUserStore
} from '@/stores/userstore.js';

export const checkLoginStatus = async () => {
	const userStore = useUserStore();
	if (!userStore.token) {
		return false;
	}

	try {
		// console.log('checkLoginStatus: 开始验证');
		const response = await checkLoginAPI();
		// console.log('checkLoginStatus: 验证响应', response);
		if (response.newToken) {
			userStore.setToken(response.newToken);
		}
		return response.data.isValid;
	} catch (error) {
		// console.error('checkLoginStatus: 验证出错', error);
		return false;
	}
};