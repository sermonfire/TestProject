<template>

    <!-- 子路由内容 -->
    <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>

    <div class="user-info-container" v-show="!$route.path.includes('/historyRating')" v-loading="loading">
        <!-- 个人资料头部 -->
        <div class="profile-header" v-if="userInfo">
            <div class="avatar-section">
                <el-upload class="avatar-uploader" :show-file-list="false" :before-upload="beforeAvatarUpload"
                    :http-request="handleAvatarUpload">
                    <img v-if="userInfo?.userPic" :src="userInfo.userPic" class="avatar" />
                    <img v-else :src="DEFAULT_AVATAR_LOGIN" class="avatar" />
                </el-upload>
                <span class="change-avatar-text">点击更换头像</span>
            </div>
            <div class="basic-info">
                <span class="username">{{ userInfo?.username }}</span>
                <span class="user-id">UID: {{ userInfo?.id }}</span>
            </div>
            <div class="user-stats">
                <div class="stat-item">
                    <span class="stat-value">{{ userStats?.ratingCount || 0 }}</span>
                    <span class="stat-label">评价数</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">{{ userStats?.shareCount || 0 }}</span>
                    <span class="stat-label">分享数</span>
                </div>
            </div>
        </div>

        <!-- 快捷操作卡片 -->
        <div class="quick-actions-card info-card">
            <div class="card-header">
                <span class="card-title">快捷操作</span>
            </div>
            <div class="quick-actions-grid">
                <div class="action-item" @click="router.push('userInfo/historyRating')">
                    <el-icon>
                        <ChatLineRound />
                    </el-icon>
                    <span>历史评价</span>
                </div>
                <div class="action-item" @click="router.push('/history')">
                    <el-icon>
                        <Share />
                    </el-icon>
                    <span>浏览历史</span>
                </div>
                <div class="action-item" @click="router.push('collection')">
                    <el-icon>
                        <Star />
                    </el-icon>
                    <span>我的收藏</span>
                </div>
                <div class="action-item" @click="router.push('favorites')">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    <span>偏好设置</span>
                </div>
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
                    <span v-else class="value">{{ userInfo?.username }}</span>
                </el-form-item>

                <el-form-item label="手机号">
                    <span class="value">{{ userInfo?.phone }}</span>
                </el-form-item>

                <el-form-item label="邮箱">
                    <span class="value">{{ userInfo?.email || '未设置' }}</span>
                </el-form-item>

                <el-form-item label="性别">
                    <el-select v-if="isEditing" v-model="editForm.gender" class="gender-select">
                        <el-option v-for="option in genderOptions" :key="option.value" :label="option.label"
                            :value="option.value" />
                    </el-select>
                    <span v-else class="value">{{genderOptions.find(opt => opt.value ===
                        Number(userInfo?.gender))?.label || '未知'}}</span>
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
                    <span class="value">{{ formatDate(userInfo?.createTime) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">最后更新</span>
                    <span class="value">{{ formatDate(userInfo?.updateTime) }}</span>
                </div>
            </div>
        </div>

        <!-- 密码管理卡片 -->
        <div class="info-card">
            <div class="card-header">
                <span class="card-title">密码管理</span>
                <el-button v-if="!showPasswordForm" type="primary" @click="showPasswordForm = true">
                    修改密码
                </el-button>
            </div>

            <el-form v-if="showPasswordForm" :model="passwordForm" class="password-form">
                <el-form-item label="原密码">
                    <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
                </el-form-item>

                <el-form-item label="新密码">
                    <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
                </el-form-item>

                <el-form-item label="确认密码">
                    <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
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
import { getUserRatingsAPI } from '@/api/ratingApi'
import loginAvatar from '@/assets/default_avatar/avatar-login.png'
import { ChatLineRound, Share, Star, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const DEFAULT_AVATAR_LOGIN = loginAvatar

const isEditing = ref(false)
const showPasswordForm = ref(false)
const passwordError = ref('')

const loading = ref(true)
const userInfo = ref(null)
const editForm = ref({})
const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})
const userStats = ref({
    ratingCount: 0,
    shareCount: 0
})

const genderOptions = [
    { label: '未知', value: 0 },
    { label: '男', value: 1 },
    { label: '女', value: 2 }
]

// 获取用户信息
const fetchUserInfo = async () => {
    loading.value = true
    try {
        const res = await getUserInfoAPI()
        if (res.code === 0) {
            userInfo.value = res.data
            editForm.value = {
                ...res.data,
                gender: Number(res.data.gender)
            }
        }
    } catch (error) {
        // 401 登录过期
        if (error.status === 401) {
            ElMessage.error('登录已过期，即将前往登录页')
            userStore.clear()
            setTimeout(() => {
                router.push('/login')
            }, 1000)
        } else if (error.message == '请求过于频繁') {
            ElMessage.error('请求过于频繁,请稍后再尝试')
        } else if (error.status === 500) {
            ElMessage.error('服务器似乎出了点问题')
        } else {
            ElMessage.error('获取用户信息失败')
        }
    } finally {
        loading.value = false
    }
}

// 获取用户评价统计
const fetchUserRatingStats = async () => {
    try {
        const res = await getUserRatingsAPI(1, 1) // 只获取第一页，主要是为了获取total
        if (res.code === 0 && res.data) {
            userStats.value.ratingCount = res.data.total || 0
        }
    } catch (error) {
        console.error('获取用户评价统计失败:', error)
    }
}

// 更新用户信息
const updateUserInfo = async () => {
    try {
        // console.log('更新前的表单数据:', editForm.value)
        const updateData = {
            id: editForm.value.id,
            username: editForm.value.username,
            gender: Number(editForm.value.gender),
            userPic: editForm.value.userPic
        }
        // console.log('发送到后端的数据:', updateData)

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
        if (error.message) {
            passwordError.value = error.message
        } else {
            passwordError.value = '更新失败，请重试'
        }
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
    }).catch((err) => {
        if (err !== 'cancel') {
            ElMessage.error('操作失败')
        }
    })
}

const toggleEdit = () => {
    isEditing.value = true
}

const cancelUpdatePassword = () => {
    // 如果表单有输入内容才显示确认弹窗
    if (passwordForm.value.oldPassword || passwordForm.value.newPassword || passwordForm.value.confirmPassword) {
        ElMessageBox.confirm('确定要取消修改密码吗？已输入的内容将丢失', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            resetPasswordForm()
            ElMessage.info('已取消修改密码')
        }).catch((err) => {
            if (err !== 'cancel') {
                ElMessage.error('操作失败')
            }
        })
    } else {
        resetPasswordForm()
    }
}

// 重置密码表单
const resetPasswordForm = () => {
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
    }).catch((err) => {
        if (err !== 'cancel') {
            ElMessage.error('操作失败')
        }
    })
}

onMounted(() => {
    fetchUserInfo()
    fetchUserRatingStats()
})
</script>

<style lang="scss" scoped>
.user-info-container {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: calc(100vh - 96px);
    user-select: none;
}

.profile-header {
    background-color: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .user-stats {
        display: flex;
        gap: 24px;
        margin-left: auto;

        .stat-item {
            text-align: center;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 8px;
            transition: background-color 0.3s;

            &:hover {
                background-color: #f5f7fa;
            }

            .stat-value {
                display: block;
                font-size: 20px;
                font-weight: bold;
                color: #409eff;
            }

            .stat-label {
                font-size: 12px;
                color: #666;
            }
        }
    }
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
        transition: transform 0.3s;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &:hover {
            transform: scale(1.05);
        }
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

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

.quick-actions-card {
    .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 16px 0;

        .action-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
                background-color: #f5f7fa;
                transform: translateY(-2px);
            }

            .el-icon {
                font-size: 24px;
                color: #409eff;
            }

            span {
                font-size: 14px;
                color: #333;
            }
        }
    }
}
</style>