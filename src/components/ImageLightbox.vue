<template>
  <teleport to="body">
    <v-dialog v-model="isOpen" fullscreen transition="scale-transition" class="image-lightbox" @keydown.esc="close">
      <v-card color="rgba(0, 0, 0, 0.95)" class="lightbox-card">
        <!-- 顶部工具栏 -->
        <v-app-bar color="transparent" density="compact" class="lightbox-toolbar">
          <v-app-bar-title class="text-truncate">
            {{ currentImage?.name || '图片预览' }}
          </v-app-bar-title>
          <v-spacer />

          <!-- 工具按钮 -->
          <v-btn icon="mdi-download" variant="text" @click="downloadImage" title="下载图片" />
          <v-btn icon="mdi-content-copy" variant="text" @click="copyImageUrl" title="复制链接" />
          <v-btn icon="mdi-open-in-new" variant="text" @click="openInNewTab" title="新窗口打开" />
          <v-btn icon="mdi-fullscreen" variant="text" @click="toggleFullscreen" title="全屏" />
          <v-btn icon="mdi-close" variant="text" @click="close" title="关闭 (ESC)" />
        </v-app-bar>

        <!-- 主要内容区域 -->
        <v-card-text class="lightbox-content" @click="close">
          <div class="image-container" @click.stop>
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
            icon="mdi-chevron-left"
            variant="elevated"
            size="large"
            class="nav-btn nav-btn--prev"
            @click.stop="previous"
            title="上一张"
          />
          <v-btn
            v-if="hasNext"
            icon="mdi-chevron-right"
            variant="elevated"
            size="large"
            class="nav-btn nav-btn--next"
            @click.stop="next"
            title="下一张"
          />
        </v-card-text>

        <!-- 底部信息栏 -->
        <div v-if="currentImage" class="lightbox-info">
          <div class="info-left">
            <v-chip size="small" variant="tonal">
              {{ formatFileSize(currentImage.size) }}
            </v-chip>
            <v-chip size="small" variant="tonal" class="ml-2">
              {{ getFileType(currentImage.name) }}
            </v-chip>
            <v-chip v-if="imageDimensions" size="small" variant="tonal" class="ml-2">
              {{ imageDimensions }}
            </v-chip>
          </div>
          <div v-if="images.length > 1" class="info-right">
            <v-chip size="small" variant="outlined"> {{ currentIndex + 1 }} / {{ images.length }} </v-chip>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </teleport>
</template>

<script setup lang="ts">
import filesize from '@/libs/filesize'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { computed, nextTick, ref, watch } from 'vue'

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
  'update:modelValue': [value: boolean]
  'update:currentIndex': [index: number]
}>()

const { showMessage } = useSnackBarStore()

// 状态
const loading = ref(false)
const error = ref(false)
const isZoomed = ref(false)
const imageDimensions = ref('')
const currentImageIndex = ref(props.currentIndex)

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
})

watch(isOpen, open => {
  if (open) {
    loadImage()
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
    isZoomed.value = false
  }
})

// 方法
const loadImage = async () => {
  if (!currentImage.value || !currentImageUrl.value) {
    loading.value = false
    error.value = true
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

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      previous()
      break
    case 'ArrowRight':
      next()
      break
    case ' ':
      event.preventDefault()
      toggleZoom()
      break
  }
}

// 工具函数
const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'Unknown'
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
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
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
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    cursor: zoom-in;
    transition: transform 0.3s ease;

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

    &--prev {
      left: 20px;
    }

    &--next {
      right: 20px;
    }
  }

  .lightbox-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }
}

// 响应式调整
@media (max-width: 600px) {
  .lightbox-card {
    .image-container {
      padding: 60px 10px 40px;
    }

    .nav-btn {
      &--prev {
        left: 10px;
      }

      &--next {
        right: 10px;
      }
    }

    .lightbox-info {
      padding: 15px;
      flex-direction: column;
      gap: 10px;
    }
  }
}
</style>
