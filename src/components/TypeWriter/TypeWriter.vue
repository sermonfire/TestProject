<template>
  <span class="typewriter">{{ displayText }}</span>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 50
  },
  onComplete: {
    type: Function,
    default: () => {}
  }
});

const emit = defineEmits(['typing-complete']);

const displayText = ref('');
let currentIndex = 0;
let timer = null;

const typeText = () => {
  if (currentIndex < props.text.length) {
    displayText.value += props.text[currentIndex];
    currentIndex++;
    timer = setTimeout(typeText, props.speed);
  } else {
    props.onComplete();
    emit('typing-complete');
  }
};

watch(() => props.text, (newText) => {
  displayText.value = '';
  currentIndex = 0;
  if (timer) {
    clearTimeout(timer);
  }
  typeText();
}, { immediate: true });

onMounted(() => {
  typeText();
});

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<style scoped>
.typewriter {
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
}

.typewriter::after {
  content: '|';
  position: relative;
  display: inline-block;
  margin-left: 1px;
  animation: cursor 1s infinite;
  font-weight: 300;
  color: var(--el-color-primary);
  z-index: 2;
  height: 1.2em;
  line-height: 1;
  vertical-align: middle;
  font-size: 1.1em;
  opacity: 0.8;
}

@keyframes cursor {
  0%, 100% { 
    opacity: 0.8;
    transform: scale(1);
  }
  50% { 
    opacity: 0;
    transform: scale(0.95);
  }
}
</style> 