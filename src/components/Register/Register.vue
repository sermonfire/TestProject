<template>
	<div class="overlay" @click="closeOverlay" @keyup.enter="handleRegisterEnter" tabindex="-1">
		<div class="register" @click.stop tabindex="0" @keyup.enter.stop="handleRegisterEnter">
			<button class="close-btn" @click="closeOverlay">×</button>
			<div class="layout">
				<div class="register_form">
					<div class="title_container">
						<h1 class="title_1">欢迎注册TravelRec</h1>
						<h5 class="title_2">Welcome!</h5>
					</div>

					<div class="register-error" v-if="registerError">
						<div class="register-error-msg">
							{{registerErrorMsg}}
						</div>
					</div>
					<div class="register-error" v-else>
						<div style="visibility: hidden;">占位符</div>
					</div>

					<div class="verfy" v-for="(field, index) in fields" :key="index">
						<div class="input-container">
							<el-tooltip
								:content="field.tooltip"
								placement="bottom"
								effect="light"
							>
								<el-icon><QuestionFilled /></el-icon>
							</el-tooltip>
							
							<el-input
								v-model="field.value"
								:type="field.type"
								:placeholder="field.placeholder"
								:maxlength="field.maxlength"
								class="input-field"
								@input="registerChange"
								@keyup.enter.stop="handleRegisterEnter"
							>
								<template #prefix>
									<el-icon>
										<component :is="field.icon" />
									</el-icon>
								</template>
							</el-input>
						</div>
						<div class="icon-right" v-if="field.value.length">
							<el-icon 
								:color="field.verify ? iconActiveColor : iconInactiveColor"
								:size="20"
							>
								<component :is="field.verify ? 'Select' : 'Close'" />
							</el-icon>
						</div>
					</div>

					<el-button 
						type="primary" 
						class="register-button"
						:loading="isLoading"
						@click="handleSubmit"
						ref="registerButton"
					>
						{{ isLoading ? '注册中...' : '点击注册' }}
					</el-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, Phone, QuestionFilled, Select, Close } from '@element-plus/icons-vue';
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

// 图标颜色
const iconActiveColor = '#4cd964';
const iconInactiveColor = '#dd524d';

// 添加loading状态
const isLoading = ref(false);

const registerButton = ref(null);

// 字段配置
const fields = reactive([
	{
		value: username,
		type: 'text',
		placeholder: '请输入用户名',
		maxlength: 12,
		icon: User,
		tooltip: '用户名必须大于等于4位，且只能包含字母、数字、下划线和点',
		verify: verifyUsername
	},
	{
		value: password,
		type: 'password',
		placeholder: '请输入密码',
		maxlength: 16,
		icon: Lock,
		tooltip: '密码必须为8-16位，且包含数字和字母',
		verify: verifyPassword
	},
	{
		value: confirmPassword,
		type: 'password',
		placeholder: '请再次输入密码',
		maxlength: 16,
		icon: Lock,
		tooltip: '密码需与上次一致',
		verify: verifyConfirmPassword
	},
	{
		value: phone,
		type: 'text',
		placeholder: '请输入手机号',
		maxlength: 11,
		icon: Phone,
		tooltip: '输入中国大陆手机号',
		verify: verifyPhone
	}
]);

// 错误处理
const setError = (message) => {
	registerError.value = true;
	registerErrorMsg.value = message;
};

const clearError = () => {
	registerError.value = false;
	registerErrorMsg.value = '';
};

const registerChange = () => clearError();

// 验证函数
const validateUsername = (value) => {
	const usernameRegex = /^[a-zA-Z0-9_.]{4,16}$/;
	verifyUsername.value = value ? usernameRegex.test(value) : false;
};

const validatePassword = (value) => {
	const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
	verifyPassword.value = value ? passwordRegex.test(value) : false;
};

const validateConfirmPassword = () => {
	verifyConfirmPassword.value = confirmPassword.value ? confirmPassword.value === password.value : false;
};

const validatePhone = (value) => {
	const phoneRegex = /^1[3-9]\d{9}$/;
	verifyPhone.value = value ? phoneRegex.test(value) : false;
};

// 监听输入变化
watch(username, validateUsername);
watch(password, (newValue) => {
	validatePassword(newValue);
	if (confirmPassword.value) validateConfirmPassword();
});
watch(confirmPassword, validateConfirmPassword);
watch(phone, validatePhone);

// 表单验证
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

// 修改回车键处理函数
const handleRegisterEnter = (event) => {
	// 阻止事件冒泡
	event?.stopPropagation();
	
	// 如果正在加载中，不处理回车事件
	if (isLoading.value) return;
	
	handleSubmit();
};

// 修改表单提交函数
const handleSubmit = async () => {
	if (!validateForm() || isLoading.value) return;
	
	clearError();
	isLoading.value = true;
	
	try {
		const response = await clientUserRegisterAPI({
			username: username.value,
			password: password.value,
			phone: phone.value
		});
		
		if (response.code === 0) {
			ElMessage.success('注册成功');
			setTimeout(() => {
				emit('close');
			}, 2000);
		} else {
			setError(response.message || '注册失败');
		}
	} catch (error) {
		console.error('Register error:', error);
		setError(error.data?.message || '网络错误,请稍后重试');
	} finally {
		isLoading.value = false;
	}
};

const closeOverlay = () => {
	emit('close');
};

// 添加mounted钩子
onMounted(() => {
	// 延迟执行以确保组件完全渲染
	nextTick(() => {
		// 找到第一个输入框并聚焦
		const firstInput = document.querySelector('.register .input-field input');
		if (firstInput) {
			firstInput.focus();
		}
	});
});
</script>

<style lang="scss" scoped>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 999;
	opacity: 0;
	animation: fadeIn 0.5s ease-out forwards;

	&:focus {
		outline: none;
	}
}

.register {
	position: relative;
	background: rgba(255, 255, 255, 0.98);
	width: 460px;
	height: 580px;
	border-radius: 24px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	padding: 32px;
	display: flex;
	flex-direction: column;
	align-items: center;
	opacity: 0;
	transform: translateY(20px);
	animation: slideUp 0.5s ease-out 0.3s forwards;
	border: 1px solid rgba(0, 0, 0, 0.05);

	&_form {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&:focus {
		outline: none;
	}
}

.close-btn {
	position: absolute;
	top: 16px;
	right: -56px;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.15);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: #fff;
	font-size: 24px;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	transition: all 0.3s ease;
	z-index: 1000;

	&:hover {
		background-color: rgba(255, 255, 255, 0.25);
		transform: rotate(90deg);
	}

	&:focus {
		outline: none;
	}
}

.title {
	&_container {
		text-align: center;
		margin: 12px 0 24px;
	}

	&_1 {
		margin: 0;
		font-size: 28px;
		font-weight: 600;
		background: linear-gradient(135deg, var(--el-color-primary), #36cfc9);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		letter-spacing: 0.5px;
	}

	&_2 {
		margin: 8px 0 0;
		font-size: 16px;
		color: var(--el-text-color-secondary);
		letter-spacing: 1px;
	}
}

.register-error {
	text-align: center;
	height: 24px;
	line-height: 24px;
	margin-bottom: 8px;

	&-msg {
		font-size: 14px;
		color: var(--el-color-danger);
		padding: 4px 12px;
		border-radius: 4px;
		background-color: var(--el-color-danger-light-9);
		display: inline-block;
		transition: all 0.3s ease;
	}
}

.verfy {
	position: relative;
	display: flex;
	width: 320px;
	margin-top: 20px;
	align-items: center;
}

.input-container {
	display: flex;
	align-items: center;
	width: 100%;
	gap: 12px;

	:deep(.el-tooltip__trigger) {
		.el-icon {
			font-size: 20px;
			color: var(--el-text-color-secondary);
			cursor: pointer;
			transition: all 0.3s ease;
			
			&:hover {
				color: var(--el-color-primary);
				transform: scale(1.1);
			}
		}
	}
}

.input-field {
	:deep(.el-input__wrapper) {
		padding-left: 8px;
		height: 48px;
		line-height: 48px;
		border-radius: 12px;
		transition: all 0.3s ease;
		background: var(--el-fill-color-light);
		border: 1px solid transparent;
		
		&:hover {
			background: var(--el-fill-color);
		}
		
		&:focus-within {
			background: #fff;
			border-color: var(--el-color-primary);
			box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
		}
	}
	
	:deep(.el-input__inner) {
		font-size: 16px;
		color: var(--el-text-color-primary);
		
		&::placeholder {
			font-size: 15px;
			transition: all 0.3s ease;
		}
	}
	
	:deep(.el-input__prefix) {
		margin-right: 8px;
		
		.el-icon {
			font-size: 20px;
			color: var(--el-text-color-secondary);
			transition: all 0.3s ease;
		}
	}

	&:focus-within {
		:deep(.el-input__prefix) .el-icon {
			color: var(--el-color-primary);
			transform: scale(1.1);
		}
	}
}

.icon-right {
	margin-left: 8px;
	transition: all 0.3s ease;
	
	.el-icon {
		transition: all 0.3s ease;
		
		&:hover {
			transform: scale(1.1);
		}
	}
}

.register-button {
	position: absolute;
	bottom: 40px;
	width: 320px;
	height: 48px;
	border-radius: 12px;
	font-size: 18px;
	font-weight: 500;
	letter-spacing: 1px;
	background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
	border: none;
	transition: all 0.3s ease;

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		background: var(--el-color-info-light-5);
	}
}

@keyframes fadeIn {
	from { 
		opacity: 0;
		backdrop-filter: blur(0);
	}
	to { 
		opacity: 1;
		backdrop-filter: blur(8px);
	}
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(40px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>