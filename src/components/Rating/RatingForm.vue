<template>
    <div class="rating-form glass-card">
        <h3 class="form-title">发表评价</h3>

        <el-form ref="ratingFormRef" :model="ratingForm" :rules="rules" label-position="top">
            <el-form-item label="评分" prop="rating">
                <el-rate v-model="ratingForm.rating" allow-half show-score score-template="{value}" />
                <div class="rating-tip">您可以点击星星或半星进行评分</div>
            </el-form-item>

            <el-form-item label="评价内容" prop="comment">
                <el-input v-model="ratingForm.comment" type="textarea" :rows="4" placeholder="分享您的游览体验..." />
            </el-form-item>

            <el-form-item label="标签">
                <el-select v-model="ratingForm.tags" multiple filterable allow-create default-first-option
                    placeholder="选择或创建标签" style="width: 100%">
                    <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
                </el-select>
            </el-form-item>

            <div class="form-row">
                <el-form-item label="游览时间" prop="visitTime">
                    <el-date-picker v-model="ratingForm.visitTime" type="month" placeholder="选择游览月份" format="YYYY-MM"
                        value-format="YYYY-MM" />
                </el-form-item>

                <el-form-item label="游览时长(分钟)" prop="visitDuration">
                    <el-input-number v-model="ratingForm.visitDuration" :min="30" :max="1440" :step="30" />
                </el-form-item>
            </div>

            <div class="form-row">
                <el-form-item label="人流量级别" prop="crowdLevel">
                    <el-rate v-model="ratingForm.crowdLevel" :max="5" :texts="crowdLevelTexts" show-text />
                </el-form-item>

                <el-form-item label="人均消费(元)" prop="costPerPerson">
                    <el-input-number v-model="ratingForm.costPerPerson" :min="0" :precision="0" :step="50" />
                </el-form-item>
            </div>

            <el-form-item>
                <el-checkbox v-model="ratingForm.isAnonymous">匿名发表</el-checkbox>
            </el-form-item>

            <div class="form-actions">
                <el-button @click="resetForm">重置</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">
                    提交评价
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { submitRatingAPI } from '@/api/ratingApi'

const props = defineProps({
    destinationId: {
        type: [Number, String],
        required: true
    }
})

const emit = defineEmits(['submit-success'])

const ratingFormRef = ref(null)
const submitting = ref(false)

// 人流量级别文本
const crowdLevelTexts = ['空旷', '稀少', '适中', '拥挤', '非常拥挤']

// 标签选项
const tagOptions = [
    '风景优美', '服务好', '性价比高', '交通便利',
    '美食丰富', '设施完善', '适合拍照', '人少清净',
    '文化底蕴', '亲子友好', '适合情侣', '夜景漂亮'
]

// 表单数据
const ratingForm = reactive({
    rating: 5,
    comment: '',
    tags: [],
    visitTime: '',
    visitDuration: 120,
    crowdLevel: 3,
    costPerPerson: 200,
    isAnonymous: false
})

// 表单验证规则
const rules = {
    rating: [
        { required: true, message: '请给出评分', trigger: 'change' }
    ],
    comment: [
        { required: true, message: '请填写评价内容', trigger: 'blur' },
        { min: 10, message: '评价内容至少10个字符', trigger: 'blur' }
    ],
    visitTime: [
        { required: true, message: '请选择游览时间', trigger: 'change' }
    ],
    visitDuration: [
        { required: true, message: '请填写游览时长', trigger: 'change' }
    ],
    crowdLevel: [
        { required: true, message: '请选择人流量级别', trigger: 'change' }
    ]
}

/**
 * @description 提交表单
 */
const submitForm = async () => {
    if (!props.destinationId) {
        ElMessage.error('目的地ID不能为空')
        return
    }

    await ratingFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                submitting.value = true
                const { code, message, data } = await submitRatingAPI(props.destinationId, ratingForm)

                if (code === 0) {
                    ElMessage.success('评价提交成功')
                    resetForm()
                    emit('submit-success')
                } else {
                    ElMessage.error(message || '评价提交失败')
                }
            } catch (error) {
                console.error('提交评价失败:', error)
                ElMessage.error(error.message || '评价提交失败')
            } finally {
                submitting.value = false
            }
        }
    })
}

/**
 * @description 重置表单
 */
const resetForm = () => {
    ratingFormRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.rating-form {
    padding: 24px;
    margin-bottom: 24px;

    .form-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 24px;
        color: var(--el-color-primary);
    }

    .rating-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            gap: 0;
        }
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 24px;
        gap: 12px;
    }
}
</style>