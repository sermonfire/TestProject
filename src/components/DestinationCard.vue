<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleCardClick = (destination) => {
  if (!destination?.id) return
  
  router.push({
    name: 'DestinationDetail',
    params: { 
      id: destination.id.toString() // 确保ID是字符串类型
    }
  }).catch(err => {
    console.error('Navigation failed:', err)
    // 如果导航失败，可以提供后备方案
    window.location.href = `/destination/${destination.id}`
  })
}
</script>

<template>
  <div 
    class="card-wrapper" 
    @click="handleCardClick(destination)"
  >
    <!-- 卡片内容 -->
  </div>
</template> 