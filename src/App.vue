<script setup>

</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <div class="view-wrapper">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>
  </div>
</template>

<style scoped lang="scss">
.view-wrapper {
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
