<template>
	<view class="overlay">
		<view class="register" @click.stop>
			<button class="close-btn" @click="closeOverlay">×</button>
			<view class="layout">
				<view class="register_form">
					<view class="title_container">
						<uni-title type="h1" title="欢迎注册TravelRec" align="center" class="title_1"></uni-title>
						<uni-title type="h5" title="Welcome!" align="center" class="title_2"></uni-title>
					</view>

					<view class="register-error" v-if="registerError">
						<view class="register-error-msg">
							{{registerErrorMsg}}
						</view>
					</view>
					<view class="register-error" v-else>
						<div style="visibility: hidden;">占位符</div>
					</view>

					<view class="verfy">
						<view class="input-container">
							<t-tooltip content="用户名必须大于等于4位，且只能包含字母、数字、下划线和点" theme="warning" placement="bottom">
								<uni-icons type="help" size="24" color="#000"></uni-icons>
							</t-tooltip>
							<uni-easyinput v-model="username" focus placeholder="请输入用户名" class="input-field"
								maxlength="12" prefixIcon="person" @input="registerChange">
							</uni-easyinput>
						</view>
						<view class="icon-right">
							<uni-icons v-if="username.length > 0" :type="verifyUsername ? iconActive : iconInactive"
								:color="verifyUsername ? iconActiveColor : iconInactiveColor" size="24">
							</uni-icons>
						</view>
					</view>

					<view class="verfy">
						<view class="input-container">
							<t-tooltip content="密码必须为8-16位，且包含数字和字母" theme="warning" placement="bottom">
								<uni-icons type="help" size="24" color="#000"></uni-icons>
							</t-tooltip>
							<uni-easyinput type="password" v-model="password" placeholder="请输入密码" class="input-field"
								maxlength="16" prefixIcon="locked" @input="registerChange">
							</uni-easyinput>
						</view>
						<view class="icon-right">
							<uni-icons v-if="password.length > 0" :type="verifyPassword ? iconActive : iconInactive"
								size="24" :color="verifyPassword ? iconActiveColor : iconInactiveColor"></uni-icons>
						</view>
					</view>

					<view class="verfy">
						<view class="input-container">
							<t-tooltip content="密码需与上次一致" theme="warning" placement="bottom">
								<uni-icons type="help" size="24" color="#000"></uni-icons>
							</t-tooltip>
							<uni-easyinput type="password" v-model="confirmPassword" placeholder="请再次输入密码"
								class="input-field" maxlength="16" prefixIcon="locked" @input="registerChange">
							</uni-easyinput>
						</view>
						<view class="icon-right">
							<uni-icons v-if="confirmPassword.length"
								:type="verifyConfirmPassword ? iconActive : iconInactive" size="24"
								:color="verifyConfirmPassword ? iconActiveColor : iconInactiveColor"></uni-icons>
						</view>
					</view>

					<view class="verfy">
						<view class="input-container">
							<t-tooltip content="输入中国大陆手机号" theme="warning" placement="bottom">
								<uni-icons type="help" size="24" color="#000"></uni-icons>
							</t-tooltip>
							<uni-easyinput v-model="phone" placeholder="请输入手机号" class="input-field" maxlength="11"
								prefixIcon="phone" @input="registerChange">
							</uni-easyinput>
						</view>
						<view class="icon-right">
							<uni-icons v-if="phone.length" :type="verifyPhone ? iconActive : iconInactive" size="24"
								:color="verifyPhone ? iconActiveColor : iconInactiveColor"></uni-icons>
						</view>
					</view>

					<button class="register-button" @click="handleSubmit">点击注册</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, watch } from 'vue';
import { clientUserRegisterAPI } from '@/api/api.js';
// import { useUserStore } from '@/stores/userstore.js';

const emit = defineEmits(['close']);

// 初始化所有响应式变量
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const phone = ref('');
const registerError = ref(false);
const registerErrorMsg = ref('注册失败');

// 验证状态
const verifyUsername = ref(false);
const verifyPassword = ref(false);
const verifyConfirmPassword = ref(false);
const verifyPhone = ref(false);

// 图标状态
const iconActive = ref('checkmarkempty');
const iconInactive = ref('closeempty');
const iconActiveColor = ref('#4cd964');
const iconInactiveColor = ref('#dd524d');

// 修改错误处理相关的函数
const setError = (message) => {
	registerError.value = true;
	registerErrorMsg.value = message;
};

const clearError = () => {
	registerError.value = false;
	registerErrorMsg.value = '';
};

// 修改输入变化处理函数
const registerChange = () => clearError();

// 用户名验证
const validateUsername = (value) => {
	if (!value) {
		verifyUsername.value = false;
		return;
	}
	const usernameRegex = /^[a-zA-Z0-9_.]{4,16}$/;
	verifyUsername.value = usernameRegex.test(value);
};

// 密码验证
const validatePassword = (value) => {
	if (!value) {
		verifyPassword.value = false;
		return;
	}
	const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
	verifyPassword.value = passwordRegex.test(value);
};

// 确认密码验证
const validateConfirmPassword = () => {
	if (!confirmPassword.value) {
		verifyConfirmPassword.value = false;
		return;
	}
	verifyConfirmPassword.value = confirmPassword.value === password.value;
};

// 手机号验证
const validatePhone = (value) => {
	if (!value) {
		verifyPhone.value = false;
		return;
	}
	const phoneRegex = /^1[3-9]\d{9}$/;
	verifyPhone.value = phoneRegex.test(value);
};

// 监听输入变化
watch(username, validateUsername);
watch(password, (newValue) => {
	validatePassword(newValue);
	if (confirmPassword.value) {
		validateConfirmPassword();
	}
});
watch(confirmPassword, validateConfirmPassword);
watch(phone, validatePhone);

// 修改表单验证函数
const validateForm = () => {
	validateUsername(username.value);
	validatePassword(password.value);
	validateConfirmPassword();
	validatePhone(phone.value);

	if (!verifyUsername.value) {
		setError('用户名必须为4-16位，且只能包含字母、数字、下划线和点');
		return false;
	}
	if (!verifyPassword.value) {
		setError('密码必须为8-16位，且包含数字和字母');
		return false;
	}
	if (!verifyConfirmPassword.value) {
		setError('两次输入的密码不一致');
		return false;
	}
	if (!verifyPhone.value) {
		setError('请输入有效的中国大陆手机号');
		return false;
	}

	return true;
};

// 添加 showToast 辅助函数
const showToast = (title, icon = 'none', duration = 2000) => {
	uni.showToast({
		title,
		icon,
		duration
	});
};

// 修改表单提交处理函数
const handleSubmit = async () => {
	if (!validateForm()) return;
	
	clearError();
	try {
		const response = await clientUserRegisterAPI({
			username: username.value,
			password: password.value,
			phone: phone.value
		});
		
		if (response.code === 0) { // 假设0是成功状态码
			showToast('注册成功');
			
			setTimeout(() => {
				emit('close');
			}, 2000);
		} else {
			// 显示服务器返回的错误信息
			setError(response.message || '注册失败');
		}
	} catch (error) {
		console.error('Register error:', error);
		// 显示服务器返回的错误信息,如果没有则显示网络错误
		setError(error.data?.message || '网络错误,请稍后重试');
	}
};

const closeOverlay = () => {
	emit('close');
};
</script>

<style lang="scss" scoped>
	.register-error {
		text-align: center;
		height: 16px;
		line-height: 16px;
	}

	.register-error-msg {
		font-size: 12px;
		color: red;
	}

	.icon-active {
		color: red;
	}

	.title_1 {
		margin: 0;
		padding: 0;
	}

	.title_2 {
		margin: 0;
		padding: 0;
		margin-top: 5px;
	}

	.title_container {
		text-align: center;
		margin-bottom: 20px;
		margin-top: 40px;
	}

	.layout {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.register-button {
		position: absolute;
		bottom: 20px;
		margin-top: 20px;
		// padding: 10px 20px;
		background-color: #007AFF;
		color: white;
		border: none;
		border-radius: 5px;
		width: 250px;
		height: 37px;
		cursor: pointer;
		align-items: center;
		line-height: 37px;
		text-align: center;

		&:hover {
			background-color: #0056b3; // Darker shade of blue on hover
		}

		&:active {
			transform: scale(0.95); // Slightly decrease size when clicked
		}
	}

	.icon-right {
		position: absolute;
		right: 5px;
	}

	.verfy {
		position: relative;
		display: flex;
		width: 80%;
		margin-left: 10px;
		max-width: 250px;
		margin-top: 20px;
		align-items: center;
	}

	.input-container {
		display: flex;
		align-items: center;
		width: 85%;
		padding-left: 10px;
	}

	.input-field {
		margin-left: 5px;
	}

	.register_form {
		width: 350px;
		height: 450px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}


	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
		opacity: 0;
		animation: fadeIn 0.5s ease-out forwards;
	}

	.register {
		position: relative; // 添加相对定位
		background-color: #fff;
		width: 350px;
		height: 450px;
		border-radius: 10px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0;
		transform: translateY(20px);
		animation: slideUp 0.5s ease-out 0.3s forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.close-btn {
		position: absolute;
		top: 0px;
		right: -45px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.3);
		border: none;
		color: #fff;
		font-size: 24px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: background-color 0.3s ease;
		z-index: 1000; // 确保按钮在最上层

		&:hover {
			background-color: rgba(255, 255, 255, 0.5);
		}

		&:focus {
			outline: none;
		}
	}
</style>