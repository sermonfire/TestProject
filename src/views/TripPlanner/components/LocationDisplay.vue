<template>
    <div class="location-display-wrapper" @mouseenter="handleLocationEnter" @mouseleave="handleLocationLeave">
        <el-button class="location-trigger" circle :class="{ active: showLocation }">
            <el-icon>
                <Location />
            </el-icon>
        </el-button>

        <Transition name="fade-slide">
            <div v-show="showLocation" class="location-popup" @mouseenter="handlePopupEnter"
                @mouseleave="handlePopupLeave">
                <CurrentLocation />
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Location } from '@element-plus/icons-vue'
import CurrentLocation from '@/components/LocationDisplay/CurrentLocation.vue'

const showLocation = ref(false)
let hideTimer = null
let isOverButton = ref(false)
let isOverPopup = ref(false)

const handleLocationEnter = () => {
    isOverButton.value = true
    showLocation.value = true
    clearHideTimer()
}

const handleLocationLeave = () => {
    isOverButton.value = false
    if (!isOverPopup.value) {
        startHideTimer()
    }
}

const handlePopupEnter = () => {
    isOverPopup.value = true
    clearHideTimer()
}

const handlePopupLeave = () => {
    isOverPopup.value = false
    if (!isOverButton.value) {
        startHideTimer()
    }
}

const startHideTimer = () => {
    clearHideTimer()
    hideTimer = setTimeout(() => {
        showLocation.value = false
    }, 300)
}

const clearHideTimer = () => {
    if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
    }
}

onBeforeUnmount(() => {
    clearHideTimer()
})
</script>

<style lang="scss" scoped>
// ... 保持原有样式 ...</style>