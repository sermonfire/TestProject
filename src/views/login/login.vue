<template>
	<div class="login-page">
		<div class="index" @keyup.enter="handleEnterKey">
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
						<el-input ref="phoneInput" v-model="phone" placeholder="请输入手机号" maxlength="11" :prefix-icon="Phone"
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
							<el-checkbox v-for="item in range_1" :key="item.value" 
								:value="item.value" :disabled="item.disabled">
								{{ item.text }}
							</el-checkbox>
						</el-checkbox-group>
					</div>

					<div class="checkbox_2">
						<el-checkbox-group v-model="checkbox_2" @change="handleAgreementChange">
							<el-checkbox v-for="item in range_2" :key="item.value" :value="item.value">
								{{ item.text }}
							</el-checkbox>
						</el-checkbox-group>
					</div>

					<el-button type="primary" class="login-button" :loading="isLoading" @click="clientLogin">
						{{ isLoading ? '登录中...' : '点击登录' }}
					</el-button>
				</div>
			</div>
		</div>

		<el-dialog v-model="showDialog" title="通知" width="400px" align-center @keyup.enter="dialogConfirm">
			<span>请勾选协议!</span>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="dialogClose">关闭</el-button>
					<el-button type="primary" @click="dialogConfirm">同意</el-button>
				</div>
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
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

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

// 修改所有 localStorage 操作，使用定义的常量
const STORAGE_KEY_PHONE = 'savedPhone';
const STORAGE_KEY_PASSWORD = 'savedPassword';
const STORAGE_KEY_REMEMBER = 'rememberMe';

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
	const savedPhone = localStorage.getItem(STORAGE_KEY_PHONE)
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

		// 1. 调用登录接口
		const loginRes = await clientUserLoginAPI({
			phone: phone.value,
			password: password.value
		});

		// 处理登录成功
		if (loginRes.code === 0) {
			const { token, userInfo } = loginRes.data;

			// 2. 保存token和用户信息
			userStore.setToken(token);
			userStore.updateUserInfo(userInfo);
			userStore.setLoginState(true);

			// 3. 验证token是否保存成功
			if (!userStore.token) {
				handleLoginFailure('token保存失败');
				return;
			}

			// 4. 处理记住密码逻辑
			if (rememberMe.value) {
				saveCredentials();
			} else {
				clearStoredCredentials();
			}

			try {
				// 5. 验证登录状态
				const checkResponse = await checkLoginAPI();
				if (checkResponse.code !== 0) {
					throw new Error('登录状态验证失败');
				}

				// 6. 获取最新的用户信息
				const userInfoResponse = await getUserInfoAPI();
				if (userInfoResponse.code === 0) {
					userStore.updateUserInfo(userInfoResponse.data);
				} else {
					throw new Error('获取用户信息失败');
				}

				// 7. 所有接口调用成功后，显示成功提示
				ElMessage({
					message: '登录成功',
					type: 'success'
				});

				// 8. 最后进行路由跳转
				const redirect = route.query.redirect;
				if (redirect) {
					router.push(redirect);
				} else {
					router.push('/');
				}

			} catch (error) {
				console.error('登录后续操作失败:', error);
				handleLoginFailure(error.message || '登录验证失败');
				// 清理已保存的状态
				userStore.clear();
				return;
			}
		} else {
			handleLoginFailure(loginRes.message || '登录失败');
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

// 清除存储凭证的辅助函数
const clearStoredCredentials = () => {
	try {
		localStorage.removeItem(STORAGE_KEY_REMEMBER);
		localStorage.removeItem(STORAGE_KEY_PHONE);
		localStorage.removeItem(STORAGE_KEY_PASSWORD);

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

const handleCheckboxChange = (value) => {
	const currentValues = value;
	const previousValues = checkbox_1.value;

	// 更新状态
	checkbox_1.value = currentValues;
	isRegister.value = currentValues.includes(2);

	// 处理记住密码选项的变化
	const wasRememberPasswordChecked = previousValues.includes(1);
	const isRememberPasswordChecked = currentValues.includes(1);

	if (!isRememberPasswordChecked && wasRememberPasswordChecked) {
		// 取消勾选记住密码
		clearStoredCredentials();
		ElMessage({
			message: '已取消记住密码',
			type: 'info'
		});
	}

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
			localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
			localStorage.setItem(STORAGE_KEY_PHONE, phone.value);
			localStorage.setItem(STORAGE_KEY_PASSWORD, encryptedPassword);
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

// 添加处理回车键的函数
const handleEnterKey = (event) => {
	if (showDialog.value) {
		// 如果对话框打开，按回车键触发确认
		dialogConfirm();
	} else {
		// 如果对话框未打开，按回车键触发登录
		clientLogin();
	}
};

// 添加ref用于获取输入框实例
const phoneInput = ref(null);

// 修改mounted钩子，处理自动聚焦逻辑
onMounted(() => {
	try {
		// 检查是否有保存的登录信息
		const rememberMe = localStorage.getItem(STORAGE_KEY_REMEMBER);
		const savedPhone = localStorage.getItem(STORAGE_KEY_PHONE);
		const savedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD);

		if (rememberMe && savedPhone && savedPassword) {
			try {
				const decryptedPassword = decryptPassword(savedPassword);
				if (decryptedPassword) {
					phone.value = savedPhone;
					password.value = decryptedPassword;
					checkbox_1.value = [1]; // 自动勾选记住密码

					ElMessage({
						message: '已自动填充保存的账号',
						type: 'info'
					});
				} else {
					clearStoredCredentials();
				}
			} catch (decryptError) {
				console.error('密码解密失败:', decryptError);
				clearStoredCredentials();
			}
		}
	} catch (error) {
		console.error('读取存储数据失败:', error);
		clearStoredCredentials();
	}
});
</script>

<style lang="scss" scoped>
.login-page {
	width: 100%;
	height: 100%;
	position: relative;
}

.index {
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	outline: none; // 添加这行以移除focus时的轮廓
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
	top: 230px;
	right: 310px;
	transform: none;
	z-index: 9999;
	background: rgba(255, 153, 0, 0.08);
	border: 1px solid rgba(255, 153, 0, 0.15);
	border-radius: 12px;
	padding: 6px 12px;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	max-width: 320px;
	opacity: 0;
	pointer-events: none;
	user-select: none;
	
	// 修改显示动画
	animation: tipShow 2.5s ease-in-out forwards;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 153, 0, 0.1), rgba(255, 153, 0, 0.05));
		border-radius: inherit;
		z-index: -1;
	}

	.tip-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;

		.tip-icon {
			font-size: 18px;
			color: #ff9900;
			margin-top: 2px;
		}

		.tip-message {
			color: #d68100;
			font-size: 14px;
			line-height: 1.6;
			font-weight: 500;
			letter-spacing: 0.3px;
		}
	}
}

// 重新定义动画，包含显示和消失的过程
@keyframes tipShow {
	0% {
		opacity: 0;
		transform: translateY(-20px);
	}
	10% {
		opacity: 1;
		transform: translateY(0);
	}
	80% {
		opacity: 1;
		transform: translateY(0);
	}
	100% {
		opacity: 0;
		transform: translateY(-10px);
	}
}

.checkbox_1,
.checkbox_2 {
	width: 80%;
	max-width: 280px;
	margin-top: 20px;
	display: flex;
	min-height: 30px;
	position: relative;

	:deep(.el-checkbox) {

		// 调整复选框大小
		.el-checkbox__input {
			transform: scale(1.4); // 增大复选框的整体大小

			// 调整选中状态的样式
			&.is-checked {
				.el-checkbox__inner {
					background-color: #409EFF; // 选中时的背景色
					border-color: #409EFF; // 选中时的边框色
				}
			}

			// 调整复选框本身的样式
			.el-checkbox__inner {
				// border-width: 2px;             // 增加边框宽度
				border-color: #DCDFE6; // 默认边框颜色
				border-radius: 4px; // 圆角大小
				transition: all 0.3s; // 添加过渡效果

				&:hover {
					border-color: #409EFF; // 悬停时的边框颜色
				}
			}
		}

		// 调整文字大小和样式
		.el-checkbox__label {
			font-size: 16px; // 文字大小
			padding-left: 12px; // 文字和复选框的间距
			line-height: 1.5; // 行高
			color: #333; // 文字颜色
			font-weight: 500; // 文字粗细
			margin-right: 0 !important; // 移除右侧边距

			&:hover {
				color: #409EFF; // 悬停时文字颜色
			}
		}

		// 禁用状态的样式
		&.is-disabled {
			.el-checkbox__input {
				.el-checkbox__inner {
					background-color: #F5F7FA;
					border-color: #E4E7ED;
				}
			}

			.el-checkbox__label {
				color: #C0C4CC;
				margin-right: 0 !important; // 确保禁用状态下也没有右边距
			}
		}
	}

	// 修改复选框组的布局
	:deep(.el-checkbox-group) {
		display: flex;
		justify-content: space-between; // 将复选框分布在两端
		width: 100%; // 确保占满容器宽度
		align-items: center; // 垂直居中对齐

		.el-checkbox {
			margin-right: 0 !important;
		}
	}
}

.login-button {
	position: absolute;
	bottom: 60px;
	margin-top: 20px;
	width: 300px;
	height: 50px;
	font-size: 18px; // 增大字体大小
	font-weight: 500; // 适当加粗

	&:active {
		transform: scale(0.95);
	}
}

.input-container {
	display: flex;
	align-items: center;
	width: 80%;
	max-width: 300px;
	margin-top: 20px;

	:deep(.el-input) {
		.el-input__wrapper {
			height: 45px;

			// 调整输入框内的文字大小
			input {
				font-size: 19px; // 调整输入文字大小

				&::placeholder {
					font-size: 17px; // 调整placeholder文字大小
					color: #999; // 可选：调整placeholder颜色
				}
			}

			// 调整所有输入框相关图标的大小
			.el-icon,
			.el-input__icon {
				font-size: 20px; // 增大图标尺寸
			}
		}

		// 调整后缀图标容器和图标大小
		.el-input-group__append {
			.el-icon {
				font-size: 27px; // 调整后缀图标大小
			}
		}
	}
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
	user-select: none;
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
