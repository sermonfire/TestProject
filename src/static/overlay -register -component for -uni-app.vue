<template>
  <view class="overlay">
    <view class="register">
      <!-- Your register form content goes here -->
    </view>
  </view>
</template>

<script setup>
// Your script logic goes here
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); // 半透明黑色背景
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; // 确保在最上层
}

.register {
  background-color: #fff;
  width: 350px;
  height: 450px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>