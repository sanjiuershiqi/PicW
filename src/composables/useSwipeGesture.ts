import { ref } from 'vue'

/**
 * 手势类型
 */
export type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'double-tap' | 'long-press'

/**
 * 手势配置
 */
export interface SwipeGestureOptions {
  threshold?: number // 滑动阈值（像素）
  timeout?: number // 长按超时（毫秒）
  doubleTapDelay?: number // 双击延迟（毫秒）
  preventScroll?: boolean // 阻止滚动
}

/**
 * 手势事件处理器
 */
export interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
}

/**
 * 触摸点信息
 */
interface TouchPoint {
  x: number
  y: number
  time: number
}

/**
 * 使用滑动手势
 */
export const useSwipeGesture = (target: HTMLElement | null, handlers: GestureHandlers, options: SwipeGestureOptions = {}) => {
  const { threshold = 50, timeout = 500, doubleTapDelay = 300, preventScroll = false } = options

  const touchStart = ref<TouchPoint | null>(null)
  const touchEnd = ref<TouchPoint | null>(null)
  const longPressTimer = ref<number | null>(null)
  const lastTapTime = ref<number>(0)
  const isLongPress = ref(false)

  /**
   * 处理触摸开始
   */
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchStart.value = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    touchEnd.value = null
    isLongPress.value = false

    // 设置长按定时器
    if (handlers.onLongPress) {
      longPressTimer.value = window.setTimeout(() => {
        isLongPress.value = true
        handlers.onLongPress?.()
      }, timeout)
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }

  /**
   * 处理触摸移动
   */
  const handleTouchMove = (e: TouchEvent) => {
    // 如果移动了，取消长按
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    if (preventScroll) {
      e.preventDefault()
    }
  }

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = (e: TouchEvent) => {
    // 清除长按定时器
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    // 如果是长按，不处理其他手势
    if (isLongPress.value) {
      return
    }

    if (!touchStart.value) {
      return
    }

    const touch = e.changedTouches[0]
    touchEnd.value = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    handleGesture()

    if (preventScroll) {
      e.preventDefault()
    }
  }

  /**
   * 处理手势
   */
  const handleGesture = () => {
    if (!touchStart.value || !touchEnd.value) {
      return
    }

    const deltaX = touchEnd.value.x - touchStart.value.x
    const deltaY = touchEnd.value.y - touchStart.value.y
    const deltaTime = touchEnd.value.time - touchStart.value.time

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // 判断是否是点击（移动距离很小）
    if (absDeltaX < 10 && absDeltaY < 10) {
      handleTap()
      return
    }

    // 判断是否是滑动
    if (absDeltaX > threshold || absDeltaY > threshold) {
      // 判断滑动方向
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (deltaX > 0) {
          handlers.onSwipeRight?.()
        } else {
          handlers.onSwipeLeft?.()
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          handlers.onSwipeDown?.()
        } else {
          handlers.onSwipeUp?.()
        }
      }
    }
  }

  /**
   * 处理点击
   */
  const handleTap = () => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.value

    if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
      // 双击
      handlers.onDoubleTap?.()
      lastTapTime.value = 0
    } else {
      // 单击
      lastTapTime.value = now
      setTimeout(() => {
        if (lastTapTime.value === now) {
          handlers.onTap?.()
        }
      }, doubleTapDelay)
    }
  }

  /**
   * 绑定事件
   */
  const bind = () => {
    if (!target) {
      return
    }

    target.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll })
    target.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll })
    target.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll })
  }

  /**
   * 解绑事件
   */
  const unbind = () => {
    if (!target) {
      return
    }

    target.removeEventListener('touchstart', handleTouchStart)
    target.removeEventListener('touchmove', handleTouchMove)
    target.removeEventListener('touchend', handleTouchEnd)

    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
    }
  }

  return {
    bind,
    unbind
  }
}

/**
 * 使用捏合缩放手势
 */
export const usePinchZoom = (
  target: HTMLElement | null,
  onZoom: (scale: number) => void,
  options: {
    minScale?: number
    maxScale?: number
  } = {}
) => {
  const { minScale = 0.5, maxScale = 3 } = options

  let initialDistance = 0
  let currentScale = 1

  const getDistance = (touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()

      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / initialDistance

      currentScale = Math.max(minScale, Math.min(maxScale, scale))
      onZoom(currentScale)
    }
  }

  const handleTouchEnd = () => {
    initialDistance = 0
  }

  const bind = () => {
    if (!target) {
      return
    }

    target.addEventListener('touchstart', handleTouchStart, { passive: false })
    target.addEventListener('touchmove', handleTouchMove, { passive: false })
    target.addEventListener('touchend', handleTouchEnd)
  }

  const unbind = () => {
    if (!target) {
      return
    }

    target.removeEventListener('touchstart', handleTouchStart)
    target.removeEventListener('touchmove', handleTouchMove)
    target.removeEventListener('touchend', handleTouchEnd)
  }

  return {
    bind,
    unbind,
    currentScale: () => currentScale
  }
}

/**
 * 检测是否是移动设备
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

/**
 * 检测是否支持触摸
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
