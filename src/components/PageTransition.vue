<template>
    <div class="page-transition" :class="{ 'active': isActive }">
        <div class="overlay"></div>
        <img src="@/assets/水滴动效.gif" alt="水滴过渡动画" class="water-drop-animation" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const isActive = ref(false)
const router = useRouter()

/**
 * 触发页面过渡动画
 * @param {string} path - 目标路由路径
 */
const triggerTransition = (path) => {
    isActive.value = true // 触发过渡动画
    setTimeout(() => {
        router.push(path) // 跳转页面
        setTimeout(() => isActive.value = false, 100) // 过渡动画结束后，隐藏过渡效果
    }, 500) // 过渡动画持续时间
}

defineExpose({ triggerTransition })
</script>

<style lang="scss" scoped>
.page-transition {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s;

    &.active {
        opacity: 1;
        pointer-events: all;
    }
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.6); // 白色背景，只透明一点点
}

.water-drop-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px; // 根据实际gif尺寸调整
    height: 200px; // 根据实际gif尺寸调整
    z-index: 1; // 确保gif在遮罩层上方
}
</style>