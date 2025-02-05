<template>
	<div class="user-info-container">
		<!-- 头像区域 -->
		<div class="avatar-section">
			<el-upload
				class="avatar-uploader"
				:show-file-list="false"
				:before-upload="beforeAvatarUpload"
				:http-request="handleAvatarUpload"
			>
				<img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
				<el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
			</el-upload>
			<p class="upload-tip">点击更换头像</p>
		</div>

		<!-- 用户信息表单 -->
		<div class="info-form">
			<el-form
				ref="formRef"
				:model="userInfo"
				:rules="rules"
				label-width="80px"
				class="user-form"
			>
				<el-form-item label="用户名" prop="username">
					<el-input v-model="userInfo.username" placeholder="请输入用户名" />
				</el-form-item>

				<el-form-item label="手机号" prop="phone">
					<el-input v-model="userInfo.phone" placeholder="请输入手机号" />
				</el-form-item>

				<el-form-item label="邮箱" prop="email">
					<el-input v-model="userInfo.email" placeholder="请输入邮箱" />
				</el-form-item>

				<el-form-item label="性别" prop="gender">
					<el-radio-group v-model="userInfo.gender">
						<el-radio :value="1">男</el-radio>
						<el-radio :value="2">女</el-radio>
						<el-radio :value="0">保密</el-radio>
					</el-radio-group>
				</el-form-item>

				<el-form-item label="生日" prop="birthday">
					<el-date-picker
						v-model="userInfo.birthday"
						type="date"
						placeholder="选择生日"
						format="YYYY-MM-DD"
						value-format="YYYY-MM-DD"
					/>
				</el-form-item>

				<el-form-item label="个性签名" prop="signature">
					<el-input
						v-model="userInfo.signature"
						type="textarea"
						:rows="3"
						placeholder="写点什么吧..."
						maxlength="200"
						show-word-limit
					/>
				</el-form-item>
			</el-form>

			<!-- 操作按钮 -->
			<div class="button-group">
				<el-button type="primary" @click="handleSave" :loading="loading">
					保存修改
				</el-button>
				<el-button @click="handleReset">重置</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userstore'
import { getUserInfoAPI, updateUserInfoAPI, uploadAvatarAPI } from '@/api/api'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

// 表单数据
const userInfo = reactive({
	username: '',
	phone: '',
	email: '',
	gender: 0,
	birthday: '',
	signature: '',
	avatar: ''
})

// 表单验证规则
const rules = {
	username: [
		{ required: true, message: '请输入用户名', trigger: 'blur' },
		{ min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
	],
	phone: [
		{ required: true, message: '请输入手机号', trigger: 'blur' },
		{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
	],
	email: [
		{ required: true, message: '请输入邮箱', trigger: 'blur' },
		{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
	]
}

// 获取用户信息
const fetchUserInfo = async () => {
	try {
		const res = await getUserInfoAPI()
		if (res.code === 0) {
			Object.assign(userInfo, res.data)
		}
	} catch (error) {
		ElMessage.error('获取用户信息失败')
	}
}

// 头像上传前的验证
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
	try {
		const formData = new FormData()
		formData.append('avatar', options.file)
		// TODO: 实现文件上传API
		const res = await uploadAvatarAPI(formData)
		if (res.code === 0) {
			userInfo.avatar = res.data.url
			ElMessage.success('头像上传成功')
		}
	} catch (error) {
		ElMessage.error('头像上传失败')
	}
}

// 保存用户信息
const handleSave = async () => {
	if (!formRef.value) return
	
	try {
		await formRef.value.validate()
		loading.value = true
		
		const res = await updateUserInfoAPI(userInfo)
		if (res.code === 0) {
			ElMessage.success('保存成功')
			userStore.updateUserInfo(userInfo)
		}
	} catch (error) {
		ElMessage.error('保存失败')
	} finally {
		loading.value = false
	}
}

// 重置表单
const handleReset = () => {
	if (formRef.value) {
		formRef.value.resetFields()
		fetchUserInfo()
	}
}

onMounted(() => {
	fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.user-info-container {
	max-width: 800px;
	margin: 20px auto;
	padding: 20px;
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar-section {
	text-align: center;
	margin-bottom: 30px;

	.avatar-uploader {
		:deep(.el-upload) {
			border: 1px dashed #d9d9d9;
			border-radius: 50%;
			cursor: pointer;
			position: relative;
			overflow: hidden;
			transition: border-color 0.3s;

			&:hover {
				border-color: var(--el-color-primary);
			}
		}
	}

	.avatar-uploader-icon {
		font-size: 28px;
		color: #8c939d;
		width: 120px;
		height: 120px;
		line-height: 120px;
		text-align: center;
	}

	.avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
	}

	.upload-tip {
		margin-top: 8px;
		font-size: 14px;
		color: #666;
	}
}

.info-form {
	max-width: 600px;
	margin: 0 auto;

	.user-form {
		margin-bottom: 20px;
	}
}

.button-group {
	text-align: center;
	margin-top: 30px;
}

@media screen and (max-width: 768px) {
	.user-info-container {
		margin: 10px;
		padding: 15px;
	}

	.info-form {
		padding: 0 10px;
	}
}
</style>