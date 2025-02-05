<template>
	<div class="user-info-container">
		<!-- 个人资料头部 -->
		<div class="profile-header">
			<div class="avatar-section">
				<el-upload
					class="avatar-uploader"
					:show-file-list="false"
					:before-upload="beforeAvatarUpload"
					:http-request="handleAvatarUpload"
				>
					<img v-if="userInfo.userPic" :src="userInfo.userPic" class="avatar" />
					<img v-else :src="DEFAULT_AVATAR_LOGIN" class="avatar" />
				</el-upload>
				<span class="change-avatar-text">点击更换头像</span>
			</div>
			<div class="basic-info">
				<span class="username">{{ userInfo.username }}</span>
				<span class="user-id">UID: {{ userInfo.id }}</span>
			</div>
		</div>

		<!-- 个人信息卡片 -->
		<div class="info-card">
			<div class="card-header">
				<span class="card-title">个人信息</span>
				<div class="button-group" v-if="isEditing">
					<el-button @click="cancelEdit">取消</el-button>
					<el-button type="primary" @click="updateUserInfo">保存</el-button>
				</div>
				<el-button v-else type="primary" @click="toggleEdit">编辑</el-button>
			</div>

			<el-form :model="editForm" label-width="80px" class="info-form">
				<el-form-item label="用户名">
					<el-input v-if="isEditing" v-model="editForm.username" />
					<span v-else class="value">{{ userInfo.username }}</span>
				</el-form-item>

				<el-form-item label="手机号">
					<span class="value">{{ userInfo.phone }}</span>
				</el-form-item>

				<el-form-item label="邮箱">
					<span class="value">{{ userInfo.email || '未设置' }}</span>
				</el-form-item>

				<el-form-item label="性别">
					<el-select v-if="isEditing" v-model="editForm.gender" class="gender-select">
						<el-option
							v-for="(option, index) in genderOptions"
							:key="index"
							:label="option"
							:value="index"
						/>
					</el-select>
					<span v-else class="value">{{ genderOptions[userInfo.gender] }}</span>
				</el-form-item>
			</el-form>
		</div>

		<!-- 账号信息卡片 -->
		<div class="info-card">
			<div class="card-header">
				<span class="card-title">账号信息</span>
			</div>
			<div class="info-list">
				<div class="info-item">
					<span class="label">注册时间</span>
					<span class="value">{{ formatDate(userInfo.createTime) }}</span>
				</div>
				<div class="info-item">
					<span class="label">最后更新</span>
					<span class="value">{{ formatDate(userInfo.updateTime) }}</span>
				</div>
			</div>
		</div>

		<!-- 密码管理卡片 -->
		<div class="info-card">
			<div class="card-header">
				<span class="card-title">密码管理</span>
				<el-button 
					v-if="!showPasswordForm" 
					type="primary" 
					@click="showPasswordForm = true"
				>
					修改密码
				</el-button>
			</div>

			<el-form 
				v-if="showPasswordForm" 
				:model="passwordForm" 
				class="password-form"
			>
				<el-form-item label="原密码">
					<el-input 
						v-model="passwordForm.oldPassword" 
						type="password" 
						placeholder="请输入原密码"
					/>
				</el-form-item>

				<el-form-item label="新密码">
					<el-input 
						v-model="passwordForm.newPassword" 
						type="password" 
						placeholder="请输入新密码"
					/>
				</el-form-item>

				<el-form-item label="确认密码">
					<el-input 
						v-model="passwordForm.confirmPassword" 
						type="password" 
						placeholder="请再次输入新密码"
					/>
				</el-form-item>

				<div v-if="passwordError" class="error-message">
					{{ passwordError }}
				</div>

				<div class="button-group">
					<el-button @click="cancelUpdatePassword">取消</el-button>
					<el-button type="primary" @click="handleUpdatePassword">确认修改</el-button>
				</div>
			</el-form>
		</div>

		<!-- 退出登录按钮 -->
		<el-button class="logout-btn" type="danger" @click="logout">退出登录</el-button>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userstore'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { getUserInfoAPI, updateUserInfoAPI, uploadAvatarAPI, updatePasswordAPI } from '@/api/api'

const router = useRouter()
const userStore = useUserStore()
const DEFAULT_AVATAR_LOGIN = '/static/default_avatar/avatar(login).png'

const isEditing = ref(false)
const showPasswordForm = ref(false)
const passwordError = ref('')

const userInfo = ref({})
const editForm = ref({})
const passwordForm = ref({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})

const genderOptions = ['未知', '男', '女']

// 获取用户信息
const fetchUserInfo = async () => {
	try {
		const res = await getUserInfoAPI()
		if (res.code === 0) {
			userInfo.value = res.data
			editForm.value = { ...res.data }
		}
	} catch (error) {
		// 401 登录过期
		if(error.status === 401) {
			ElMessage.error('登录已过期，请重新登录')
			userStore.clear()
			//0.5s后
			setTimeout(() => {
				router.push('/login')
			}, 500)
		}else{
			ElMessage.error('获取用户信息失败')
		}
	}
}

// 更新用户信息
const updateUserInfo = async () => {
	try {
		const updateData = {
			id: editForm.value.id,
			username: editForm.value.username,
			gender: editForm.value.gender,
			userPic: editForm.value.userPic
		}
		
		const res = await updateUserInfoAPI(updateData)
		if (res.code === 0) {
			ElMessage.success('修改信息成功')
			await fetchUserInfo()
			userStore.updateUserInfo(userInfo.value)
			isEditing.value = false
		}
	} catch (error) {
		ElMessage.error('更新失败')
	}
}

// 头像上传前验证
const beforeAvatarUpload = (file) => {
	const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
	const isLt2M = file.size / 1024 / 1024 < 2

	if (!isImage) {
		ElMessage.error('上传头像图片只能是 JPG/PNG/GIF 格式!')
		return false
	}
	if (!isLt2M) {
		ElMessage.error('上传头像图片大小不能超过 2MB!')
		return false
	}
	return true
}

// 处理头像上传
const handleAvatarUpload = async (options) => {
	let loading = null
	try {
		loading = ElLoading.service({
			text: '头像上传中...'
		})
		
		const formData = new FormData()
		formData.append('file', options.file)
		
		// console.log('开始上传头像:', options.file)
		
		const res = await uploadAvatarAPI(formData)
		// console.log('上传响应:', res)
		
		if (res.code === 0) {
			if (typeof res.data === 'string') {
				editForm.value.userPic = res.data
				await updateUserInfo()
				const newUserInfo = {
					...userInfo.value,
					userPic: res.data
				}
				userStore.updateUserInfo(newUserInfo)
			} else if (res.code === 0) {
				await fetchUserInfo()
				userStore.updateUserInfo(userInfo.value)
			}
			
			ElMessage.success('头像更新成功')
		} else {
			throw new Error(res.message || '上传失败')
		}
	} catch (error) {
		console.error('头像上传错误:', error)
		ElMessage.error(`头像上传失败: ${error.message}`)
	} finally {
		if (loading) {
			loading.close()
		}
	}
}

// 密码相关处理
const validatePassword = (password) => {
	return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/.test(password)
}

const handleUpdatePassword = async () => {
	passwordError.value = ''
	
	if (!passwordForm.value.oldPassword) {
		passwordError.value = '请输入原密码'
		return
	}
	if (!validatePassword(passwordForm.value.newPassword)) {
		passwordError.value = '新密码必须为8-16位，且包含数字和字母'
		return
	}
	if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
		passwordError.value = '两次输入的新密码不一致'
		return
	}

	try {
		const res = await updatePasswordAPI(passwordForm.value)
		if (res.code === 0) {
			ElMessage.success('密码更新成功，请重新登录')
			userStore.clear()
			router.push('/login')
		}
	} catch (error) {
		passwordError.value = '更新失败，请重试'
	}
}

// 其他功能函数
const formatDate = (dateStr) => {
	if (!dateStr) return '未知'
	const date = new Date(dateStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const cancelEdit = () => {
	ElMessageBox.confirm('确定要取消编辑吗？未保存的修改将丢失', '提示', {
		confirmButtonText: '确定',
		cancelButtonText: '取消',
		type: 'warning'
	}).then(() => {
		isEditing.value = false
		editForm.value = { ...userInfo.value }
		ElMessage.info('已取消编辑')
	})
}

const toggleEdit = () => {
	isEditing.value = true
}

const cancelUpdatePassword = () => {
	showPasswordForm.value = false
	passwordForm.value = {
		oldPassword: '',
		newPassword: '',
		confirmPassword: ''
	}
	passwordError.value = ''
}

const logout = () => {
	ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
		confirmButtonText: '确定',
		cancelButtonText: '取消',
		type: 'warning'
	}).then(() => {
		userStore.clear()
		ElMessage.success('已退出登录')
		router.push('/login')
	})
}

onMounted(() => {
	fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.user-info-container {
	padding: 20px;
	background-color: #f5f5f5;
	min-height: calc(100vh - 96px);
}

.profile-header {
	background-color: #fff;
	border-radius: 12px;
	padding: 20px;
	display: flex;
	align-items: center;
	margin-bottom: 20px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-right: 20px;

	.avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		margin-bottom: 8px;
		cursor: pointer;
	}

	.change-avatar-text {
		font-size: 12px;
		color: #666;
	}
}

.basic-info {
	flex: 1;

	.username {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 4px;
		display: block;
	}

	.user-id {
		font-size: 14px;
		color: #666;
	}
}

.info-card {
	background-color: #fff;
	border-radius: 12px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;

		.card-title {
			font-size: 18px;
			font-weight: bold;
		}
	}

	.info-list {
		display: flex;
		flex-direction: column;

		.info-item {
			align-items: center;
			display: block;

			.label {
				display: inline-block;
				width: 100px;
			}
		}
	}
}

.info-form {
	:deep(.el-form-item) {
		margin-bottom: 16px;
	}
}

.value {
	color: #333;
	font-size: 14px;
}

.gender-select {
	width: 100%;
}

.info-list {
	.info-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;

		&:last-child {
			margin-bottom: 0;
		}
	}
}

.password-form {
	margin-top: 20px;

	.error-message {
		color: #ff3b30;
		font-size: 14px;
		margin: 16px 0;
	}
}

.button-group {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.logout-btn {
	width: 100%;
	margin-top: 30px;
	height: 44px;
	font-size: 16px;
	border-radius: 8px;
	font-weight: 500;
	transition: all 0.3s ease;
	
	&:hover {
		opacity: 0.9;
		transform: scale(0.95);
		box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
	}
}

:deep(.el-upload) {
	border: none;
	cursor: pointer;
	position: relative;
	overflow: hidden;
}

:deep(.el-form-item__label) {
	color: #666;
}
</style>