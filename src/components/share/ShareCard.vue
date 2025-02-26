<template>
    <div class="share-card">
        <!-- 分享对话框 -->
        <div class="dialog-container">
            <div class="share-options">
                <div class="share-item" @click="shareToWeChat">
                    <el-button circle class="wechat">
                        <el-icon>
                            <ChatDotRound />
                        </el-icon>
                    </el-button>
                    <span>微信</span>
                </div>
                <div class="share-item" @click="shareToWeibo">
                    <el-button circle class="weibo">
                        <i class="fab fa-weibo"></i>
                    </el-button>
                    <span>微博</span>
                </div>
                <div class="share-item" @click="shareToQQ">
                    <el-button circle class="qq">
                        <i class="fab fa-qq"></i>
                    </el-button>
                    <span>QQ</span>
                </div>
                <div class="share-item" @click="copyLink">
                    <el-button circle class="link">
                        <el-icon>
                            <Link />
                        </el-icon>
                    </el-button>
                    <span>复制链接</span>
                </div>
            </div>

            <div class="qrcode-section" v-if="showQRCode">
                <el-image :src="qrCodeUrl" class="qrcode" />
                <p>请使用微信扫描二维码分享</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Link } from '@element-plus/icons-vue'

/**
 * 组件属性定义
 */
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    shareUrl: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['share-success'])

// 控制二维码显示
const showQRCode = ref(false)
// 二维码URL
const qrCodeUrl = ref('')

/**
 * 分享到微信
 */
const shareToWeChat = () => {
    showQRCode.value = true
    // 这里应该调用后端API生成二维码
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(props.shareUrl)}`
    emit('share-success', {
        title: props.title,
        url: props.shareUrl,
        type: 'destination'
    }, 'wechat')
}

/**
 * 分享到微博
 */
const shareToWeibo = () => {
    const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(props.shareUrl)}&title=${encodeURIComponent(props.title)}`
    window.open(weiboUrl, '_blank')
    emit('share-success', {
        title: props.title,
        url: props.shareUrl,
        type: 'destination'
    }, 'weibo')
}

/**
 * 分享到QQ
 */
const shareToQQ = () => {
    const qqUrl = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(props.shareUrl)}&title=${encodeURIComponent(props.title)}`
    window.open(qqUrl, '_blank')
    emit('share-success', {
        title: props.title,
        url: props.shareUrl,
        type: 'destination'
    }, 'qq')
}

/**
 * 复制分享链接
 */
const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(props.shareUrl)
        ElMessage.success('链接已复制到剪贴板')
        emit('share-success', {
            title: props.title,
            url: props.shareUrl,
            type: 'destination'
        }, 'link')
    } catch (err) {
        ElMessage.error('复制失败，请手动复制')
    }
}
</script>

<style scoped lang="scss">
.share-card {
    width: 100%;

    .dialog-container {
        margin-bottom: 20px;
        display: flex;

        .share-options {
            display: flex;
            gap: 16px;

            .share-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                cursor: pointer;

                .wechat {
                    background-color: #07c160;
                    color: white;
                }

                .weibo {
                    background-color: #e6162d;
                    color: white;
                }

                .qq {
                    background-color: #12b7f5;
                    color: white;
                }

                .link {
                    background-color: #666;
                    color: white;
                }
            }

            .share-item span {
                font-size: 12px;
            }
        }

        .qrcode-section {
            text-align: center;
            padding: 20px 0;

            .qrcode {
                width: 150px;
                height: 150px;
                margin-bottom: 10px;
            }

            p {
                color: #666;
                font-size: 14px;
                margin: 0;
            }
        }
    }
}
</style>