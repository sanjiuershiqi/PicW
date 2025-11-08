import { ref, Ref } from 'vue'

export interface DragSortItem {
  id: string
  [key: string]: any
}

export interface DragSortOptions {
  onSort?: (items: DragSortItem[]) => void
  animation?: number
  disabled?: boolean
}

export const useDragSort = <T extends DragSortItem>(items: Ref<T[]>, options: DragSortOptions = {}) => {
  const { onSort, disabled = false } = options

  const draggedItem = ref<T | null>(null)
  const draggedIndex = ref<number>(-1)
  const dragOverIndex = ref<number>(-1)

  // 开始拖拽
  const handleDragStart = (event: DragEvent, item: T, index: number) => {
    if (disabled) {
      return
    }

    draggedItem.value = item as any
    draggedIndex.value = index

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', (event.target as HTMLElement).innerHTML)
    }

    // 添加拖拽样式
    setTimeout(() => {
      ;(event.target as HTMLElement).classList.add('dragging')
    }, 0)
  }

  // 拖拽结束
  const handleDragEnd = (event: DragEvent) => {
    if (disabled) {
      return
    }
    ;(event.target as HTMLElement).classList.remove('dragging')

    draggedItem.value = null
    draggedIndex.value = -1
    dragOverIndex.value = -1
  }

  // 拖拽进入
  const handleDragEnter = (event: DragEvent, index: number) => {
    if (disabled) {
      return
    }

    event.preventDefault()
    dragOverIndex.value = index
  }

  // 拖拽经过
  const handleDragOver = (event: DragEvent, index: number) => {
    if (disabled) {
      return
    }

    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    dragOverIndex.value = index
  }

  // 拖拽离开
  const handleDragLeave = (event: DragEvent) => {
    if (disabled) {
      return
    }

    event.preventDefault()
  }

  // 放置
  const handleDrop = (event: DragEvent, dropIndex: number) => {
    if (disabled) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (draggedIndex.value === -1 || draggedIndex.value === dropIndex) {
      return
    }

    // 重新排序
    const newItems = [...items.value]
    const [removed] = newItems.splice(draggedIndex.value, 1)
    newItems.splice(dropIndex, 0, removed)

    items.value = newItems as T[]

    // 触发回调
    if (onSort) {
      onSort(newItems)
    }

    dragOverIndex.value = -1
  }

  // 获取拖拽样式类
  const getDragClass = (index: number) => {
    const classes: string[] = []

    if (index === draggedIndex.value) {
      classes.push('dragging')
    }

    if (index === dragOverIndex.value && index !== draggedIndex.value) {
      classes.push('drag-over')
    }

    return classes.join(' ')
  }

  // 是否正在拖拽
  const isDragging = (index: number) => {
    return index === draggedIndex.value
  }

  // 是否拖拽经过
  const isDragOver = (index: number) => {
    return index === dragOverIndex.value && index !== draggedIndex.value
  }

  return {
    draggedItem,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getDragClass,
    isDragging,
    isDragOver
  }
}

// 触摸设备支持
export const useTouchDragSort = <T extends DragSortItem>(items: Ref<T[]>, options: DragSortOptions = {}) => {
  const { onSort, disabled = false } = options

  const touchedItem = ref<T | null>(null)
  const touchedIndex = ref<number>(-1)
  const touchStartY = ref<number>(0)
  const currentY = ref<number>(0)
  const isTouching = ref(false)

  // 触摸开始
  const handleTouchStart = (event: TouchEvent, item: T, index: number) => {
    if (disabled) {
      return
    }

    touchedItem.value = item as any
    touchedIndex.value = index
    touchStartY.value = event.touches[0].clientY
    currentY.value = event.touches[0].clientY
    isTouching.value = true

    // 添加触摸样式
    ;(event.target as HTMLElement).classList.add('touching')
  }

  // 触摸移动
  const handleTouchMove = (event: TouchEvent) => {
    if (disabled || !isTouching.value) {
      return
    }

    event.preventDefault()
    currentY.value = event.touches[0].clientY

    // 计算移动距离
    const deltaY = currentY.value - touchStartY.value

    // 更新元素位置
    const target = event.target as HTMLElement
    target.style.transform = `translateY(${deltaY}px)`
  }

  // 触摸结束
  const handleTouchEnd = (event: TouchEvent) => {
    if (disabled || !isTouching.value) {
      return
    }

    const target = event.target as HTMLElement
    target.classList.remove('touching')
    target.style.transform = ''

    // 计算放置位置
    const deltaY = currentY.value - touchStartY.value
    const itemHeight = target.offsetHeight
    const moveCount = Math.round(deltaY / itemHeight)
    const newIndex = Math.max(0, Math.min(items.value.length - 1, touchedIndex.value + moveCount))

    if (newIndex !== touchedIndex.value) {
      // 重新排序
      const newItems = [...items.value]
      const [removed] = newItems.splice(touchedIndex.value, 1)
      newItems.splice(newIndex, 0, removed)

      items.value = newItems as T[]

      // 触发回调
      if (onSort) {
        onSort(newItems)
      }
    }

    // 重置状态
    touchedItem.value = null
    touchedIndex.value = -1
    touchStartY.value = 0
    currentY.value = 0
    isTouching.value = false
  }

  return {
    touchedItem,
    touchedIndex,
    isTouching,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}
