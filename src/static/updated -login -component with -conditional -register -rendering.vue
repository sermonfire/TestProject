<template>
  <!-- ... other code remains the same ... -->

  <view class="checkbox_1">
    <uni-data-checkbox multiple v-model="checkbox_1" :localdata="range_1"
      @change="change"></uni-data-checkbox>
  </view>
  <view class="checkbox_2">
    <uni-data-checkbox multiple v-model="checkbox_2" :localdata="range_2" @change="change"
      mode="button"></uni-data-checkbox>
  </view>

  <button @click="dialog" class="login-button">点击登录</button>
</view>
</view>
</view>

<view class="tip">
  <!-- 提示窗示例 -->
  <uni-popup ref="alertDialog" type="dialog">
    <uni-popup-dialog :showClose="showClose" type="info" cancelText="关闭" confirmText="同意" title="通知"
      content="请勾选协议!" @confirm="dialogConfirm" @close="dialogClose"></uni-popup-dialog>
  </uni-popup>
</view>

<view class="register" v-if="isRegister">
  <Register></Register>
</view>
</template>

<script setup>
import { ref, watch } from 'vue';

const value = ref('');
const username = ref('');
const password = ref('');

const isRegister = ref(false);

const checkbox_1 = ref([]);
const checkbox_2 = ref([]);

const range_1 = ref([{
  text: '记住密码',
  value: 1,
}, {
  text: '立即注册',
  value: 2,
}]);

const range_2 = ref([{
  text: '我已阅读并同意《用户协议》和《隐私政策》',
  value: 0
}]);

const change = (e) => {
  // Update isRegister based on checkbox_1 value
  isRegister.value = checkbox_1.value.includes(2);
};

const showClose = ref(true);
const alertDialog = ref(null);
const dialog = () => {
  if (checkbox_2.value[0] !== 0) {
    alertDialog.value.open();
  } else {
    alert('登录成功');
  }
};
const dialogConfirm = () => {
  checkbox_2.value = [0];
};
const dialogClose = () => {
  alertDialog.value.close();
};

// 禁用 Ctrl + 滚轮 的缩放
window.addEventListener('wheel', (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, {
  passive: false
});
</script>

<style lang="scss" scoped>
// ... styles remain the same ...
</style>