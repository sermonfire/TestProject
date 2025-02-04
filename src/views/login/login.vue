<template>
	<div class="index">
		<div class="layout">
			<div class="lbg">
				<img src="@/static/背景（左）.png" alt="">
			</div>
			<div class="rbg">
				<img src="@/static/背景（底）.jpg" alt="">
			</div>
			<div class="login">
				<div class="title_container">
					<h1 class="title_1">欢迎登录TravelRec</h1>
					<h5 class="title_2">Welcome!</h5>
				</div>

				<div class="login-error" v-if="loginError">
					<div class="login-error-msg">
						{{ loginErrorMsg }}
					</div>
				</div>
				<div class="login-error" v-else>
					<div style="visibility: hidden;">占位符</div>
				</div>

				<div class="input-container">
					<el-input v-model="phone" placeholder="请输入手机号" maxlength="11" :prefix-icon="Phone"
						@input="loginChange">
						<template #append>
							<el-tooltip v-if="phone.length > 0" content="请输入中国大陆手机号" placement="top">
								<el-icon>
									<InfoFilled />
								</el-icon>
							</el-tooltip>
						</template>
					</el-input>
				</div>

				<div class="input-container">
					<el-input v-model="password" type="password" placeholder="请输入密码" maxlength="16" :prefix-icon="Lock"
						@input="loginChange">
						<template #append>
							<el-tooltip v-if="password.length > 0" content="密码必须为8-16位，且包含数字和字母" placement="top">
								<el-icon>
									<InfoFilled />
								</el-icon>
							</el-tooltip>
						</template>
					</el-input>
				</div>

				<div class="checkbox_1">
					<el-checkbox-group v-model="checkbox_1" @change="handleCheckboxChange">
						<el-checkbox :label="1" :disabled="!password || !PASSWORD_REGEX.test(password)">
							记住密码
						</el-checkbox>
						<el-checkbox :label="2">立即注册</el-checkbox>
					</el-checkbox-group>
				</div>

				<div class="checkbox_2">
					<el-checkbox-group v-model="checkbox_2" @change="handleAgreementChange">
						<el-checkbox :label="0">
							我已阅读并同意《用户协议》和《隐私政策》
						</el-checkbox>
					</el-checkbox-group>
				</div>

				<el-button type="primary" class="login-button" :loading="isLoading" @click="clientLogin">
					{{ isLoading ? '登录中...' : '点击登录' }}
				</el-button>
			</div>
		</div>
	</div>

	<el-dialog v-model="showDialog" title="通知" width="30%">
		<span>请勾选协议!</span>
		<template #footer>
			<span class="dialog-footer">
				<el-button @click="dialogClose">关闭</el-button>
				<el-button type="primary" @click="dialogConfirm">同意</el-button>
			</span>
		</template>
	</el-dialog>

	<div class="top-security-tip" v-if="checkbox_1.includes(1)">
		<div class="tip-content">
			<span class="tip-icon">⚠️</span>
			<span class="tip-message">密码将加密存储在本地，建议勿在公共设备使用此功能</span>
		</div>
	</div>

	<div class="register" v-if="isRegister">
		<Register @close="closeRegister"></Register>
	</div>
</template>

<script setup>
import {
	ref,
	computed,
	nextTick,
	watch
} from 'vue';
import {
	useUserStore
} from '@/stores/userstore.js';
import Register from '@/components/Register/Register.vue';
import { onMounted } from 'vue'
import { encryptPassword, decryptPassword } from '@/utils/encrypt'
import { clientUserLoginAPI, checkLoginAPI, getUserInfoAPI } from '@/api/api.js';
import { ElMessage } from 'element-plus';
import { Phone, Lock, InfoFilled } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const phone = ref('');
const password = ref('');
const isRegister = ref(false);
const isLoading = ref(false);
const showDialog = ref(false);
const rememberMe = computed(() => checkbox_1.value.includes(1));

// 添加正则表达式常量
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

const checkbox_1 = ref([]);
const checkbox_2 = ref([]);
const loginError = ref(false);
const loginErrorMsg = ref('');

// Store
const userStore = useUserStore();

// UI Config
const range_1 = computed(() => [{
	text: '记住密码',
	value: 1,
	disabled: !password.value || !PASSWORD_REGEX.test(password.value)
},
{
	text: '立即注册',
	value: 2
}]);

const range_2 = [{
	text: '我已阅读并同意《用户协议》和《隐私政策》',
	value: 0
}];

// Helper Functions
const setError = (message) => {
	loginError.value = true;
	loginErrorMsg.value = message;
};

const clearError = () => {
	loginError.value = false;
	loginErrorMsg.value = '';
};

// Event Handlers
const loginChange = () => {
	clearError();

	if (checkbox_1.value.includes(1) && (!password.value || !PASSWORD_REGEX.test(password.value))) {
		checkbox_1.value = checkbox_1.value.filter(item => item !== 1);
		nextTick(() => {
			ElMessage({
				message: '密码无效,已取消记住密码',
				type: 'warning'
			});
		});
	}
};

// 修改登录失败的处理
const handleLoginFailure = (errorMessage) => {
	setError(errorMessage);

	// 登录失败时，如果手机号与存储的相同，则清除该手机号对应的存储信息
	const savedPhone = localStorage.getItem('savedPhone')
	if (savedPhone === phone.value) {
		clearStoredCredentials();
	}
};

// 重命名本地的验证函数
const validateLoginInput = () => {
	if (checkbox_2.value[0] !== 0) {
		showDialog.value = true;
		return false;
	}

	if (!PHONE_REGEX.test(phone.value)) {
		setError('请输入有效的中国大陆手机号');
		return false;
	}

	if (!PASSWORD_REGEX.test(password.value)) {
		setError('密码必须为8-16位，且包含数字和字母');
		return false;
	}

	return true;
};

// 登录函数
const clientLogin = async () => {
	try {
		// 表单验证
		if (!validateLoginInput()) return;

		// 显示加载状态
		isLoading.value = true;

		// 调用登录接口
		const res = await clientUserLoginAPI({
			phone: phone.value,
			password: password.value
		});

		// 处理登录成功
		if (res.code === 0) {
			// 保存token前先检查
			if (!res.data?.token || !res.data?.userInfo) {
				handleLoginFailure('登录响应数据不完整');
				return;
			}

			const { token, userInfo } = res.data;

			// 保存token和用户信息
			userStore.setToken(token);
			userStore.updateUserInfo(userInfo);

			// 立即验证token是否保存成功
			if (!userStore.token) {
				handleLoginFailure('token保存失败');
				return;
			}

			// 如果勾选了记住密码
			if (checkbox_1.value.includes(1)) {
				saveCredentials();
			} else {
				clearStoredCredentials();
			}

			// 立即验证登录状态
			try {
				const checkResponse = await checkLoginAPI();
				if (checkResponse.code !== 0) {
					throw new Error('登录状态验证失败');
				}
			} catch (error) {
				console.error('登录状态验证失败:', error);
				handleLoginFailure('登录状态验证失败');
				return;
			}

			// 立即获取用户信息
			try {
				const userInfoResponse = await getUserInfoAPI();
				if (userInfoResponse.code === 0) {
					userStore.updateUserInfo(userInfoResponse.data);
				}
			} catch (error) {
				console.error('获取用户信息失败:', error);
			}

			// 显示成功提示
			ElMessage({
				message: '登录成功',
				type: 'success'
			});

			// 延迟跳转
			setTimeout(() => {
				router.replace('/');
			}, 1500);
		} else {
			handleLoginFailure(res.message || '登录失败');
		}
	} catch (error) {
		console.error('Login error:', error);
		handleLoginFailure(error.message || '网络错误,请稍后重试');
	} finally {
		isLoading.value = false;
	}
};

// 修改 checkbox_2 的处理方式，将其独立出来
const handleAgreementChange = (value) => {
	checkbox_2.value = value;
};

const handleCheckboxChange = (value) => {
	const currentValues = value;
	isRegister.value = currentValues.includes(2);

	const wasRememberPasswordChecked = checkbox_1.value.includes(1);
	const isRememberPasswordChecked = currentValues.includes(1);

	if (isRememberPasswordChecked && !wasRememberPasswordChecked) {
		if (!password.value || !PASSWORD_REGEX.test(password.value)) {
			checkbox_1.value = checkbox_1.value.filter((item) => item !== 1);
			ElMessage({
				message: '密码格式无效，无法启用记住密码',
				type: 'warning'
			});
		} else if (!phone.value || !PHONE_REGEX.test(phone.value)) {
			checkbox_1.value = checkbox_1.value.filter((item) => item !== 1);
			ElMessage({
				message: '手机号格式无效，无法启用记住密码',
				type: 'warning'
			});
		} else {
			ElMessage({
				message: '已记住密码',
				type: 'success'
			});
		}
	} else if (!isRememberPasswordChecked && wasRememberPasswordChecked) {
		ElMessage({
			message: '已取消记住密码',
			type: 'info'
		});
	}
};

// 清除存储凭证的辅助函数
const clearStoredCredentials = () => {
	try {
		localStorage.removeItem('rememberMe');
		localStorage.removeItem('savedPhone');
		localStorage.removeItem('savedPassword');

		// 移除复选框的选中状态
		checkbox_1.value = checkbox_1.value.filter(item => item !== 1);
	} catch (error) {
		console.error('清除存储数据失败:', error);
		ElMessage({
			message: '清除存储数据失败',
			type: 'error'
		});
	}
};

const closeRegister = () => {
	checkbox_1.value = checkbox_1.value.filter(item => item !== 2);
	isRegister.value = false;
};

const dialogConfirm = () => {
	checkbox_2.value = [0]; // 勾选协议
	showDialog.value = false;
};

const dialogClose = () => {
	showDialog.value = false;
};

// 禁用 Ctrl + 滚轮 的缩放
window.addEventListener('wheel', (event) => {
	if (event.ctrlKey) {
		event.preventDefault();
	}
}, {
	passive: false
});

// 修改登录成功后保存密码的逻辑
const saveCredentials = () => {
	try {
		if (checkbox_1.value.includes(1)) {
			// 在保存前验证密码格式
			if (!password.value || !PASSWORD_REGEX.test(password.value)) {
				checkbox_1.value = checkbox_1.value.filter(item => item !== 1);
				ElMessage({
					message: '密码格式无效，无法保存',
					type: 'warning'
				});
				return;
			}

			// 验证手机号格式
			if (!phone.value || !PHONE_REGEX.test(phone.value)) {
				checkbox_1.value = checkbox_1.value.filter(item => item !== 1);
				ElMessage({
					message: '手机号格式无效，无法保存',
					type: 'warning'
				});
				return;
			}

			const encryptedPassword = encryptPassword(password.value);
			localStorage.setItem('rememberMe', 'true');
			localStorage.setItem('savedPhone', phone.value);
			localStorage.setItem('savedPassword', encryptedPassword);
		} else {
			clearStoredCredentials();
		}
	} catch (error) {
		console.error('保存凭证失败:', error);
		clearStoredCredentials();
		ElMessage({
			message: '保存凭证失败',
			type: 'error'
		});
	}
};

// 添加 watch 来监听密码和手机号的变化
watch([password, phone], ([newPassword, newPhone]) => {
	if (checkbox_1.value.includes(1)) {
		if (!newPassword || !PASSWORD_REGEX.test(newPassword) || !newPhone || !PHONE_REGEX.test(newPhone)) {
			checkbox_1.value = checkbox_1.value.filter(item => item !== 1);
			nextTick(() => {
				ElMessage({
					message: '输入无效，已取消记住密码',
					type: 'warning'
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.index {
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.layout {
	position: relative;
	width: 85%;
	height: 95%;
	border-radius: 10px;
	overflow: hidden;
}

.rbg {
	position: absolute;
	width: 100%;
	height: 100%;
	z-index: 0;
	
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.lbg {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	z-index: 1;
	
	img {
		height: 100%;
		width: auto;
		object-fit: contain;
	}
}

.login-error {
	text-align: center;
	height: 16px;
	line-height: 16px;
}

.login-error-msg {
	font-size: 12px;
	color: red;
}

.top-security-tip {
	position: fixed;
	top: 20px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 9999;
	background-color: rgba(255, 153, 0, 0.1);
	border: 1px solid #ff9900;
	border-radius: 4px;
	padding: 8px 16px;
	backdrop-filter: blur(4px);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	pointer-events: none;
}

.tip-content {
	display: flex;
	align-items: center;
	gap: 8px;
}

.tip-icon {
	font-size: 14px;
}

.tip-message {
	color: #ff9900;
	font-size: 12px;
	line-height: 1.4;
}

.checkbox_1,
.checkbox_2 {
	width: 80%;
	max-width: 250px;
	margin-top: 20px;
	display: flex;
	min-height: 30px;
	position: relative;
}

.login-button {
	position: absolute;
	bottom: 60px;
	margin-top: 20px;
	width: 300px;
	height: 50px;
}

.input-container {
	display: flex;
	align-items: center;
	width: 100%;
	max-width: 250px;
	margin-top: 20px;
}

.login {
	position: absolute;
	top: 50%;
	left: 80%;
	transform: translate(-50%, -50%);
	background-color: #fff;
	width: 450px;
	height: 550px;
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	z-index: 1;
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.title_1 {
	margin: 0;
	padding: 0;
	font-size: 26px;
	font-weight: bold;
}

.title_2 {
	margin: 0;
	padding: 0;
	margin-top: 5px;
	font-size: 18px;
	color: #666;
}

.title_container {
	text-align: center;
	margin-bottom: 24px;
	margin-top: 40px;
}
</style>
