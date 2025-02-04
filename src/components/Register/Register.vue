<template>
	<div class="overlay" @click="closeOverlay">
		<div class="register" @click.stop>
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
						@click="handleSubmit"
					>
						点击注册
					</el-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
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

// 表单提交
const handleSubmit = async () => {
	if (!validateForm()) return;
	
	clearError();
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
	}
};

const closeOverlay = () => {
	emit('close');
};
</script>

<style lang="scss" scoped>
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
	position: relative;
	background-color: #fff;
	width: 450px;
	height: 550px;
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	opacity: 0;
	transform: translateY(20px);
	animation: slideUp 0.5s ease-out 0.3s forwards;

	&_form {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
}

.close-btn {
	position: absolute;
	top: 0;
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
	z-index: 1000;

	&:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}

	&:focus {
		outline: none;
	}
}

.title {
	&_container {
		text-align: center;
		margin: 20px 0 20px;
	}

	&_1 {
		margin: 0;
		font-size: 24px;
		font-weight: bold;
	}

	&_2 {
		margin: 5px 0 0;
		font-size: 18px;
	}
}

.register-error {
	text-align: center;
	height: 20px;
	line-height: 20px;

	&-msg {
		font-size: 15px;
		color: red;
	}
}

.verfy {
	position: relative;
	display: flex;
	width: 250px;
	margin-top: 20px;
	align-items: center;
}

.input-container {
	display: flex;
	align-items: center;
	width: 100%;
	gap: 8px;

	:deep(.el-tooltip__trigger) {
		.el-icon {
			font-size: 22px;
			color: #909399;
			cursor: pointer;
			
			&:hover {
				color: #409EFF;
			}
		}
	}
}

.input-field {
	:deep(.el-input__wrapper) {
		padding-left: 5px;
		height: 45px;
		line-height: 45px;
	}
	
	:deep(.el-input__inner) {
		font-size: 18px;
	}
	
	:deep(.el-input__prefix) {
		margin-right: 4px;
		
		.el-icon {
			font-size: 20px;
			vertical-align: middle;
		}
	}
}

.register-button {
	position: absolute;
	bottom: 40px;
	width: 280px;
	height: 45px;
	border-radius: 5px;

	&:active {
		transform: scale(0.95);
	}
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
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
</style>