<template>
  <teleport to="body">
    <v-dialog v-model="isOpen" fullscreen transition="fade-transition" class="image-lightbox" @keydown.esc="close">
      <v-card color="rgba(0, 0, 0, 0.98)" class="lightbox-card">
        <!-- 顶部工具栏 -->
        <div class="lightbox-toolbar">
          <div class="toolbar-content">
            <!-- 左侧：文件名 -->
            <div class="toolbar-left">
              <v-icon icon="mdi-image" size="20" class="me-2" />
              <span class="text-subtitle-2 font-weight-medium text-truncate">
                {{ currentImage?.name || '图片预览' }}
              </span>
            </div>

            <!-- 右侧：工具按钮 -->
            <div class="toolbar-right">
              <v-btn icon="mdi-image-edit" variant="text" size="small" @click="openEditor" class="toolbar-btn" title="编辑图片" />
              <v-btn
                v-if="images.length > 1"
                icon="mdi-compare"
                variant="text"
                size="small"
                @click="openCompare"
                class="toolbar-btn"
                title="对比图片"
              />
              <v-divider vertical class="mx-2" />
              <v-btn icon="mdi-download" variant="text" size="small" @click="downloadImage" class="toolbar-btn" title="下载" />
              <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyImageUrl" class="toolbar-btn" title="复制链接" />
              <v-btn icon="mdi-open-in-new" variant="text" size="small" @click="openInNewTab" class="toolbar-btn" title="新窗口打开" />
              <v-btn icon="mdi-fullscreen" variant="text" size="small" @click="toggleFullscreen" class="toolbar-btn" title="全屏" />
              <v-divider vertical class="mx-2" />
              <v-btn icon="mdi-close" variant="text" size="small" @click="close" class="toolbar-btn close-btn" />
            </div>
          </div>
        </div>

        <!-- 主要内容区域 -->
        <v-card-text class="lightbox-content" @click="close">
          <div ref="imageContainerRef" class="image-container" @click.stop>
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
              <v-progress-circular indeterminate size="48" />
              <p class="mt-4">加载中...</p>
            </div>

            <!-- 图片显示 -->
            <img
              v-else-if="currentImageUrl"
              :src="currentImageUrl"
              :alt="currentImage?.name"
              class="preview-image"
              :class="{ zoomed: isZoomed }"
              @load="onImageLoad"
              @error="onImageError"
              @click="toggleZoom"
            />

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-container">
              <v-icon icon="mdi-image-broken" size="48" />
              <p class="mt-4">图片加载失败</p>
              <v-btn variant="outlined" @click="retryLoad">重试</v-btn>
            </div>
          </div>

          <!-- 导航按钮 -->
          <v-btn
            v-if="hasPrevious"
            icon
            variant="flat"
            size="x-large"
            class="nav-btn nav-btn--prev"
            @click.stop="previous"
            color="rgba(255, 255, 255, 0.1)"
          >
            <v-icon size="32">mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn
            v-if="hasNext"
            icon
            variant="flat"
            size="x-large"
            class="nav-btn nav-btn--next"
            @click.stop="next"
            color="rgba(255, 255, 255, 0.1)"
          >
            <v-icon size="32">mdi-chevron-right</v-icon>
          </v-btn>
        </v-card-text>

        <!-- 底部信息栏 -->
        <div v-if="currentImage" class="lightbox-info">
          <div class="info-content">
            <!-- 左侧：文件信息 -->
            <div class="info-left">
              <v-chip size="small" variant="flat" color="rgba(255, 255, 255, 0.15)" class="info-chip">
                <v-icon icon="mdi-file" size="14" class="me-1" />
                {{ formatFileSize(currentImage.size) }}
              </v-chip>
              <v-chip size="small" variant="flat" color="rgba(255, 255, 255, 0.15)" class="info-chip ml-2">
                <v-icon icon="mdi-file-image" size="14" class="me-1" />
                {{ getFileType(currentImage.name) }}
              </v-chip>
              <v-chip v-if="imageDimensions" size="small" variant="flat" color="rgba(255, 255, 255, 0.15)" class="info-chip ml-2">
                <v-icon icon="mdi-resize" size="14" class="me-1" />
                {{ imageDimensions }}
              </v-chip>
            </div>

            <!-- 右侧：图片计数 -->
            <div v-if="images.length > 1" class="info-right">
              <v-chip size="small" variant="flat" color="rgba(255, 255, 255, 0.2)" class="info-chip">
                <v-icon icon="mdi-image-multiple" size="14" class="me-1" />
                {{ currentIndex + 1 }} / {{ images.length }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- 图片编辑器 -->
    <ImageEditor v-model="showEditor" :image-url="currentImageUrl" :image-name="currentImage?.name || ''" @save="handleSaveEdit" />

    <!-- 图片对比 -->
    <ImageCompare
      v-model="showCompare"
      :left-image="currentImageUrl"
      :right-image="getCompareImageUrl()"
      left-label="当前图片"
      right-label="下一张图片"
    />
  </teleport>
</template>

<script setup lang="ts">
import filesize from '@/libs/filesize'
import { useSwipeGesture, usePinchZoom } from '@/composables/useSwipeGesture'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import ImageEditor from '@/components/ImageEditor.vue'
import ImageCompare from '@/components/ImageCompare.vue'
import { computed, nextTick, ref, watch, onUnmounted } from 'vue'

interface ImageItem {
  name: string
  path?: string
  sha?: string
  size: number
  url: string
}

interface Props {
  modelValue: boolean
  images: ImageItem[]
  currentIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentIndex: 0
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:currentIndex', index: number): void
}>()

const { showMessage } = useSnackBarStore()

// 状态
const loading = ref(false)
const error = ref(false)
const isZoomed = ref(false)
const imageDimensions = ref('')
const currentImageIndex = ref(props.currentIndex)
const imageContainerRef = ref<HTMLElement | null>(null)

// 新功能状态
const showEditor = ref(false)
const showCompare = ref(false)

// 预加载缓存
const preloadedImages = new Map<string, HTMLImageElement>()

// 计算属性
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const currentImage = computed(() => {
  return props.images[currentImageIndex.value] || null
})

const currentImageUrl = computed(() => {
  return currentImage.value?.url || ''
})

const hasPrevious = computed(() => {
  return props.images.length > 1 && currentImageIndex.value > 0
})

const hasNext = computed(() => {
  return props.images.length > 1 && currentImageIndex.value < props.images.length - 1
})

// 监听索引变化
watch(
  () => props.currentIndex,
  newIndex => {
    currentImageIndex.value = newIndex
  }
)

watch(currentImageIndex, newIndex => {
  emit('update:currentIndex', newIndex)
  loadImage()
  // 预加载相邻图片
  preloadAdjacentImages()
})

// 手势控制
let gestureCleanup: (() => void) | null = null

watch(isOpen, open => {
  if (open) {
    loadImage()
    nextTick(() => {
      setupGestures()
    })
  } else {
    cleanupGestures()
    isZoomed.value = false
  }
})

// 设置手势支持
const setupGestures = () => {
  if (!imageContainerRef.value) {
    return
  }

  // 滑动手势
  const swipeGesture = useSwipeGesture(
    imageContainerRef.value,
    {
      onSwipeLeft: () => next(),
      onSwipeRight: () => previous(),
      onSwipeDown: () => close(),
      onDoubleTap: () => toggleZoom()
    },
    {
      threshold: 50,
      doubleTapDelay: 300
    }
  )

  // 捏合缩放手势
  const pinchZoom = usePinchZoom(
    imageContainerRef.value,
    scale => {
      if (scale > 1.2) {
        isZoomed.value = true
      } else if (scale < 0.8) {
        isZoomed.value = false
      }
    },
    {
      minScale: 0.5,
      maxScale: 3
    }
  )

  gestureCleanup = () => {
    swipeGesture.unbind()
    pinchZoom.unbind()
  }
}

// 清理手势
const cleanupGestures = () => {
  if (gestureCleanup) {
    gestureCleanup()
    gestureCleanup = null
  }
}

onUnmounted(() => {
  cleanupGestures()
  // 清理预加载缓存
  preloadedImages.clear()
})

// 方法
const loadImage = async () => {
  if (!currentImage.value || !currentImageUrl.value) {
    loading.value = false
    error.value = true
    return
  }

  // 检查是否已预加载
  const cachedImage = preloadedImages.get(currentImageUrl.value)
  if (cachedImage && cachedImage.complete) {
    loading.value = false
    error.value = false
    imageDimensions.value = `${cachedImage.naturalWidth} × ${cachedImage.naturalHeight}`
    return
  }

  loading.value = true
  error.value = false
  imageDimensions.value = ''
  isZoomed.value = false

  try {
    await nextTick()

    // 添加超时机制，防止一直卡在加载状态
    const timeout = setTimeout(() => {
      if (loading.value) {
        tryFallbackUrl()
      }
    }, 5000) // 5秒超时

    // 预加载图片来检测是否能正常加载
    const img = new Image()
    img.onload = () => {
      clearTimeout(timeout)
      // 缓存已加载的图片
      preloadedImages.set(currentImageUrl.value, img)
      // 预加载成功，设置loading为false，让模板中的图片元素显示
      loading.value = false
    }
    img.onerror = () => {
      clearTimeout(timeout)
      tryFallbackUrl()
    }
    img.src = currentImageUrl.value
  } catch (err) {
    console.error('加载图片时出错:', err)
    error.value = true
    loading.value = false
  }
}

// 预加载相邻图片
const preloadAdjacentImages = () => {
  const indicesToPreload: number[] = []

  // 预加载下一张
  if (currentImageIndex.value < props.images.length - 1) {
    indicesToPreload.push(currentImageIndex.value + 1)
  }

  // 预加载上一张
  if (currentImageIndex.value > 0) {
    indicesToPreload.push(currentImageIndex.value - 1)
  }

  // 预加载下下一张（提前预加载）
  if (currentImageIndex.value < props.images.length - 2) {
    indicesToPreload.push(currentImageIndex.value + 2)
  }

  indicesToPreload.forEach(index => {
    const image = props.images[index]
    if (!image || !image.url) {
      return
    }

    // 如果已经预加载过，跳过
    if (preloadedImages.has(image.url)) {
      return
    }

    const img = new Image()
    img.onload = () => {
      preloadedImages.set(image.url, img)
    }
    img.onerror = () => {
      // 预加载失败，尝试备用URL
      if (image.path) {
        const fallbackUrl = `https://raw.githubusercontent.com/sanjiuershiqi/PicW/master${image.path}`
        const fallbackImg = new Image()
        fallbackImg.onload = () => {
          preloadedImages.set(fallbackUrl, fallbackImg)
        }
        fallbackImg.src = fallbackUrl
      }
    }
    img.src = image.url
  })
}

const tryFallbackUrl = () => {
  if (!currentImage.value) {
    return
  }

  // 尝试使用GitHub raw URL作为备用
  const fallbackUrl = `https://raw.githubusercontent.com/sanjiuershiqi/PicW/master${currentImage.value.path}`

  const img = new Image()
  img.onload = () => {
    // 更新当前图片URL为备用URL
    if (currentImage.value) {
      currentImage.value.url = fallbackUrl
    }
    loading.value = false
    error.value = false
  }
  img.onerror = () => {
    loading.value = false
    error.value = true
  }
  img.src = fallbackUrl
}

const onImageLoad = (event: Event) => {
  loading.value = false
  error.value = false
  const img = event.target as HTMLImageElement
  imageDimensions.value = `${img.naturalWidth} × ${img.naturalHeight}`
}

const onImageError = (event: Event) => {
  loading.value = false
  error.value = true
}

const retryLoad = () => {
  loadImage()
}

const close = () => {
  isOpen.value = false
}

const previous = () => {
  if (hasPrevious.value) {
    currentImageIndex.value--
  }
}

const next = () => {
  if (hasNext.value) {
    currentImageIndex.value++
  }
}

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const downloadImage = async () => {
  if (!currentImage.value) {
    return
  }

  try {
    const response = await fetch(currentImageUrl.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = currentImage.value.name
    a.click()

    URL.revokeObjectURL(url)
    showMessage('下载成功', { color: 'success' })
  } catch (error) {
    showMessage('下载失败', { color: 'error' })
  }
}

const copyImageUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentImageUrl.value)
    showMessage('链接已复制', { color: 'success' })
  } catch (error) {
    showMessage('复制失败', { color: 'error' })
  }
}

const openInNewTab = () => {
  window.open(currentImageUrl.value, '_blank')
}

// 工具函数
const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'Unknown'
}

// 新功能方法
const openEditor = () => {
  showEditor.value = true
}

const openCompare = () => {
  if (props.images.length < 2) {
    showMessage('需要至少两张图片才能对比', { color: 'warning' })
    return
  }
  showCompare.value = true
}

const getCompareImageUrl = () => {
  // 获取下一张图片的 URL，如果是最后一张则获取上一张
  const nextIndex = hasNext.value ? currentImageIndex.value + 1 : currentImageIndex.value - 1
  return props.images[nextIndex]?.url || currentImageUrl.value
}

const handleSaveEdit = async (blob: Blob, filename: string) => {
  try {
    // 这里可以实现保存编辑后的图片到 GitHub
    // 目前只是下载到本地
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    showMessage('图片已保存', { color: 'success' })
  } catch (error) {
    showMessage('保存失败', { color: 'error' })
    console.error('保存编辑失败:', error)
  }
}
</script>

<style scoped lang="scss">
.lightbox-card {
  .lightbox-toolbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
    padding: 16px 24px;
    backdrop-filter: blur(10px);

    .toolbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 100%;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      color: white;

      span {
        max-width: 400px;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-btn {
      color: rgba(255, 255, 255, 0.9);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.close-btn:hover {
        background-color: rgba(244, 67, 54, 0.2);
        color: #f44336;
      }
    }
  }

  .lightbox-content {
    height: 100vh;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
  }

  .image-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 20px 60px;
    touch-action: pan-x pan-y pinch-zoom; // 支持触摸手势
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    cursor: zoom-in;
    transition: transform 0.3s ease;
    user-select: none;
    -webkit-user-drag: none;

    &.zoomed {
      cursor: zoom-out;
      transform: scale(1.5);
    }
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
      transform: translateY(-50%) scale(1.1);
    }

    &--prev {
      left: 24px;
    }

    &--next {
      right: 24px;
    }
  }

  .lightbox-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 24px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    z-index: 10;
    backdrop-filter: blur(10px);

    .info-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-chip {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
    }
  }
}

// 平板适配
@media (max-width: 960px) {
  .lightbox-card {
    .lightbox-toolbar {
      padding: 14px 20px;

      .toolbar-left {
        span {
          max-width: 300px;
          font-size: 0.9375rem;
        }
      }

      .toolbar-right {
        gap: 2px;

        .toolbar-btn {
          width: 40px;
          height: 40px;

          .v-icon {
            font-size: 20px;
          }
        }

        .v-divider {
          margin: 0 4px;
        }
      }
    }

    .image-container {
      padding: 70px 16px 50px;
    }

    .nav-btn {
      width: 48px;
      height: 48px;

      .v-icon {
        font-size: 28px;
      }

      &--prev {
        left: 16px;
      }

      &--next {
        right: 16px;
      }
    }

    .lightbox-info {
      padding: 16px 20px;

      .info-chip {
        font-size: 0.8125rem;
        height: 26px;

        .v-icon {
          font-size: 16px;
        }
      }
    }
  }
}

// 手机适配
@media (max-width: 600px) {
  .lightbox-card {
    .lightbox-toolbar {
      padding: 10px 12px;

      .toolbar-content {
        gap: 8px;
      }

      .toolbar-left {
        min-width: 0;
        flex: 1;

        .v-icon {
          font-size: 18px;
          margin-right: 6px;
        }

        span {
          max-width: 120px;
          font-size: 0.875rem;
        }
      }

      .toolbar-right {
        gap: 0;
        flex-shrink: 0;

        .toolbar-btn {
          width: 36px;
          height: 36px;
          min-width: 36px;

          .v-icon {
            font-size: 18px;
          }
        }

        // 隐藏部分按钮，只保留核心功能
        .v-divider {
          display: none;
        }

        // 在小屏幕上隐藏一些次要按钮
        .toolbar-btn:nth-child(n + 4):not(.close-btn) {
          display: none;
        }
      }
    }

    .image-container {
      padding: 56px 8px 36px;
    }

    .preview-image {
      &.zoomed {
        transform: scale(2); // 移动端放大更多
      }
    }

    .nav-btn {
      width: 44px;
      height: 44px;
      opacity: 0.8;

      .v-icon {
        font-size: 24px;
      }

      &--prev {
        left: 8px;
      }

      &--next {
        right: 8px;
      }

      &:active {
        opacity: 1;
        transform: translateY(-50%) scale(0.95);
      }
    }

    .lightbox-info {
      padding: 12px 12px 16px;

      .info-content {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .info-left,
      .info-right {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .info-chip {
        font-size: 0.75rem;
        height: 24px;
        padding: 0 8px;

        .v-icon {
          font-size: 14px;
          margin-right: 4px;
        }
      }
    }

    // 加载和错误状态
    .loading-container,
    .error-container {
      padding: 20px;

      .v-progress-circular {
        width: 40px !important;
        height: 40px !important;
      }

      .v-icon {
        font-size: 40px;
      }

      p {
        font-size: 0.875rem;
        margin-top: 12px;
      }

      .v-btn {
        margin-top: 12px;
        font-size: 0.875rem;
      }
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .lightbox-card {
    // 增大所有可点击元素
    .toolbar-btn {
      min-width: 44px;
      min-height: 44px;
    }

    .nav-btn {
      min-width: 48px;
      min-height: 48px;
      opacity: 0.9;

      &:active {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.25) !important;
      }
    }

    // 图片双击放大
    .preview-image {
      cursor: default;
    }

    // 触摸反馈
    .lightbox-content {
      -webkit-tap-highlight-color: transparent;
    }
  }
}

// 横屏模式优化
@media (max-width: 960px) and (orientation: landscape) {
  .lightbox-card {
    .lightbox-toolbar {
      padding: 8px 16px;
    }

    .image-container {
      padding: 50px 12px 40px;
    }

    .nav-btn {
      &--prev {
        left: 12px;
      }

      &--next {
        right: 12px;
      }
    }

    .lightbox-info {
      padding: 10px 16px;

      .info-content {
        flex-direction: row;
        gap: 12px;
      }
    }
  }
}

// 小屏幕横屏
@media (max-width: 600px) and (orientation: landscape) {
  .lightbox-card {
    .lightbox-toolbar {
      padding: 6px 12px;

      .toolbar-left span {
        max-width: 100px;
      }
    }

    .image-container {
      padding: 44px 8px 32px;
    }

    .nav-btn {
      width: 40px;
      height: 40px;

      &--prev {
        left: 8px;
      }

      &--next {
        right: 8px;
      }
    }

    .lightbox-info {
      padding: 8px 12px;

      .info-chip {
        font-size: 0.6875rem;
        height: 22px;
      }
    }
  }
}

// 超小屏幕（如 iPhone SE）
@media (max-width: 375px) {
  .lightbox-card {
    .lightbox-toolbar {
      .toolbar-left span {
        max-width: 100px;
      }

      .toolbar-right {
        // 只显示编辑、下载和关闭按钮
        .toolbar-btn:not(:nth-child(1)):not(:nth-child(3)):not(.close-btn) {
          display: none;
        }
      }
    }

    .nav-btn {
      width: 40px;
      height: 40px;

      .v-icon {
        font-size: 20px;
      }
    }
  }
}

// 暗色模式优化
@media (prefers-color-scheme: dark) {
  .lightbox-card {
    .lightbox-toolbar,
    .lightbox-info {
      backdrop-filter: blur(20px);
    }
  }
}
</style>
