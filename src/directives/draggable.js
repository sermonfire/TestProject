/**
 * 拖拽指令
 * @example v-draggable="{ onDrag: handleDrag, data: itemData }"
 */
export const vDraggable = {
  mounted(el, binding) {
    if (!binding.value?.onDrag) return

    const handleDragStart = (e) => {
      el.classList.add('dragging')
      e.dataTransfer.effectAllowed = 'move'
      // 存储拖拽的数据
      e.dataTransfer.setData('text/plain', JSON.stringify(binding.value.data))
    }

    const handleDragEnd = () => {
      el.classList.remove('dragging')
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e) => {
      e.preventDefault()
      try {
        // 获取拖拽的数据
        const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'))
        const targetData = binding.value.data
        
        // 如果拖拽对象和目标对象不同，则触发回调
        if (draggedData.id !== targetData.id) {
          binding.value.onDrag({
            dragged: draggedData,
            target: targetData
          })
        }
      } catch (error) {
        console.error('拖拽处理失败:', error)
      }
    }

    // 添加拖拽相关属性和事件监听
    el.setAttribute('draggable', 'true')
    el.addEventListener('dragstart', handleDragStart)
    el.addEventListener('dragend', handleDragEnd)
    el.addEventListener('dragover', handleDragOver)
    el.addEventListener('drop', handleDrop)

    // 存储事件处理函数，用于清理
    el._dragHandlers = {
      dragstart: handleDragStart,
      dragend: handleDragEnd,
      dragover: handleDragOver,
      drop: handleDrop
    }
  },

  beforeUnmount(el) {
    // 清理事件监听
    if (el._dragHandlers) {
      Object.entries(el._dragHandlers).forEach(([event, handler]) => {
        el.removeEventListener(event, handler)
      })
      delete el._dragHandlers
    }
  }
} 