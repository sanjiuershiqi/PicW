<template>
  <v-dialog v-model="isOpen" fullscreen transition="dialog-bottom-transition" class="image-editor">
    <v-card>
      <!-- 顶部工具栏 -->
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="close" />
        <v-toolbar-title>图片编辑器</v-toolbar-title>
        <v-spacer />
        <v-btn variant="text" @click="reset">重置</v-btn>
        <v-btn variant="text" @click="undo" :disabled="!canUndo">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn variant="text" @click="redo" :disabled="!canRedo">
          <v-icon>mdi-redo</v-icon>
        </v-btn>
        <v-btn variant="text" @click="save" :loading="saving">保存</v-btn>
      </v-toolbar>

      <v-container fluid class="editor-container">
        <v-row>
          <!-- 左侧工具面板 -->
          <v-col cols="12" md="3" class="tools-panel">
            <v-card variant="flat">
              <v-tabs v-model="activeTab" direction="vertical" color="primary">
                <v-tab value="crop">
                  <v-icon start>mdi-crop</v-icon>
                  裁剪
                </v-tab>
                <v-tab value="rotate">
                  <v-icon start>mdi-rotate-right</v-icon>
                  旋转
                </v-tab>
                <v-tab value="filter">
                  <v-icon start>mdi-palette</v-icon>
                  滤镜
                </v-tab>
                <v-tab value="adjust">
                  <v-icon start>mdi-tune</v-icon>
                  调整
                </v-tab>
                <v-tab value="text">
                  <v-icon start>mdi-format-text</v-icon>
                  文字
                </v-tab>
                <v-tab value="draw">
                  <v-icon start>mdi-draw</v-icon>
                  绘制
                </v-tab>
              </v-tabs>
            </v-card>

            <!-- 工具选项 -->
            <v-card variant="flat" class="mt-4">
              <v-window v-model="activeTab">
                <!-- 裁剪工具 -->
                <v-window-item value="crop">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">裁剪比例</h4>
                    <v-btn-toggle v-model="cropRatio" variant="outlined" density="compact" mandatory class="mb-4">
                      <v-btn value="free">自由</v-btn>
                      <v-btn value="1:1">1:1</v-btn>
                      <v-btn value="4:3">4:3</v-btn>
                      <v-btn value="16:9">16:9</v-btn>
                    </v-btn-toggle>

                    <v-btn block color="primary" @click="applyCrop" class="mb-2">应用裁剪</v-btn>
                    <v-btn block variant="outlined" @click="cancelCrop">取消裁剪</v-btn>
                  </v-card-text>
                </v-window-item>

                <!-- 旋转工具 -->
                <v-window-item value="rotate">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">旋转</h4>
                    <v-btn block variant="outlined" prepend-icon="mdi-rotate-left" @click="rotateLeft" class="mb-2"> 向左旋转 90° </v-btn>
                    <v-btn block variant="outlined" prepend-icon="mdi-rotate-right" @click="rotateRight" class="mb-2"> 向右旋转 90° </v-btn>

                    <v-divider class="my-4" />

                    <h4 class="text-subtitle-1 mb-3">翻转</h4>
                    <v-btn block variant="outlined" prepend-icon="mdi-flip-horizontal" @click="flipHorizontal" class="mb-2">
                      水平翻转
                    </v-btn>
                    <v-btn block variant="outlined" prepend-icon="mdi-flip-vertical" @click="flipVertical"> 垂直翻转 </v-btn>
                  </v-card-text>
                </v-window-item>

                <!-- 滤镜工具 -->
                <v-window-item value="filter">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">滤镜效果</h4>
                    <v-list density="compact">
                      <v-list-item
                        v-for="filter in filters"
                        :key="filter.value"
                        @click="applyFilter(filter.value)"
                        :class="{ 'bg-primary': currentFilter === filter.value }"
                      >
                        <v-list-item-title>{{ filter.label }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-window-item>

                <!-- 调整工具 -->
                <v-window-item value="adjust">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">亮度</h4>
                    <v-slider v-model="brightness" :min="0" :max="200" :step="1" thumb-label @update:model-value="applyAdjustments" />

                    <h4 class="text-subtitle-1 mb-3 mt-4">对比度</h4>
                    <v-slider v-model="contrast" :min="0" :max="200" :step="1" thumb-label @update:model-value="applyAdjustments" />

                    <h4 class="text-subtitle-1 mb-3 mt-4">饱和度</h4>
                    <v-slider v-model="saturation" :min="0" :max="200" :step="1" thumb-label @update:model-value="applyAdjustments" />

                    <h4 class="text-subtitle-1 mb-3 mt-4">模糊</h4>
                    <v-slider v-model="blur" :min="0" :max="10" :step="0.1" thumb-label @update:model-value="applyAdjustments" />

                    <v-btn block color="primary" @click="resetAdjustments" class="mt-4">重置调整</v-btn>
                  </v-card-text>
                </v-window-item>

                <!-- 文字水印工具 -->
                <v-window-item value="text">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">文字内容</h4>
                    <v-textarea
                      v-model="textWatermark"
                      placeholder="输入水印文字..."
                      variant="outlined"
                      density="compact"
                      rows="3"
                      hide-details
                      class="mb-4"
                    />

                    <h4 class="text-subtitle-1 mb-3">字体大小</h4>
                    <v-slider v-model="textSize" :min="12" :max="120" :step="2" thumb-label hide-details class="mb-4" />

                    <h4 class="text-subtitle-1 mb-3">文字颜色</h4>
                    <div class="d-flex align-center mb-4">
                      <input v-model="textColor" type="color" class="color-picker me-3" />
                      <v-text-field v-model="textColor" variant="outlined" density="compact" hide-details />
                    </div>

                    <h4 class="text-subtitle-1 mb-3">透明度</h4>
                    <v-slider v-model="textOpacity" :min="0" :max="100" :step="5" thumb-label hide-details class="mb-4" />

                    <h4 class="text-subtitle-1 mb-3">位置</h4>
                    <v-select
                      v-model="textPosition"
                      :items="textPositions"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="mb-4"
                    />

                    <v-btn block color="primary" @click="addTextWatermark" :disabled="!textWatermark.trim()" class="mb-2"> 添加水印 </v-btn>
                    <v-btn block variant="outlined" @click="clearTextSettings"> 清除设置 </v-btn>
                  </v-card-text>
                </v-window-item>

                <!-- 绘制工具 -->
                <v-window-item value="draw">
                  <v-card-text>
                    <h4 class="text-subtitle-1 mb-3">绘制模式</h4>
                    <v-btn-toggle v-model="drawMode" variant="outlined" density="compact" mandatory class="mb-4">
                      <v-btn value="pen">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn value="line">
                        <v-icon>mdi-minus</v-icon>
                      </v-btn>
                      <v-btn value="rect">
                        <v-icon>mdi-rectangle-outline</v-icon>
                      </v-btn>
                      <v-btn value="circle">
                        <v-icon>mdi-circle-outline</v-icon>
                      </v-btn>
                    </v-btn-toggle>

                    <h4 class="text-subtitle-1 mb-3">画笔颜色</h4>
                    <div class="d-flex align-center mb-4">
                      <input v-model="drawColor" type="color" class="color-picker me-3" />
                      <v-text-field v-model="drawColor" variant="outlined" density="compact" hide-details />
                    </div>

                    <h4 class="text-subtitle-1 mb-3">画笔粗细</h4>
                    <v-slider v-model="drawWidth" :min="1" :max="20" :step="1" thumb-label hide-details class="mb-4" />

                    <v-alert type="info" variant="tonal" density="compact" class="mb-4"> 在画布上点击并拖动进行绘制 </v-alert>

                    <v-btn block variant="outlined" @click="clearDrawing"> 清除绘制 </v-btn>
                  </v-card-text>
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>

          <!-- 中间画布区域 -->
          <v-col cols="12" md="9" class="canvas-area">
            <v-card variant="flat" class="canvas-container">
              <div ref="canvasWrapper" class="canvas-wrapper">
                <canvas ref="canvas" class="edit-canvas" />
              </div>
            </v-card>

            <!-- 底部信息栏 -->
            <v-card variant="flat" class="mt-4">
              <v-card-text class="d-flex align-center">
                <v-chip size="small" variant="tonal" class="me-2">
                  <v-icon icon="mdi-image" size="small" class="me-1" />
                  {{ imageDimensions }}
                </v-chip>
                <v-chip size="small" variant="tonal" class="me-2">
                  <v-icon icon="mdi-file" size="small" class="me-1" />
                  {{ imageSize }}
                </v-chip>
                <v-spacer />
                <v-btn-group variant="outlined" density="compact">
                  <v-btn icon="mdi-magnify-minus" @click="zoomOut" />
                  <v-btn>{{ Math.round(zoom * 100) }}%</v-btn>
                  <v-btn icon="mdi-magnify-plus" @click="zoomIn" />
                </v-btn-group>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  imageUrl: string
  imageName?: string
}

const props = withDefaults(defineProps<Props>(), {
  imageName: '未命名图片'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', imageData: Blob, filename: string): void
}>()

const { showMessage } = useSnackBarStore()

// 状态
const canvas = ref<HTMLCanvasElement | null>(null)
const canvasWrapper = ref<HTMLElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const originalImage = ref<HTMLImageElement | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const activeTab = ref('crop')
const saving = ref(false)
const zoom = ref(1)

// 历史记录
const history = ref<ImageData[]>([])
const historyIndex = ref(-1)

// 裁剪
const cropRatio = ref('free')
const isCropping = ref(false)
const cropX = ref(0)
const cropY = ref(0)
const cropWidth = ref(0)
const cropHeight = ref(0)
const cropHandleSize = 8

// 旋转和翻转
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)

// 滤镜
const currentFilter = ref('none')
const filters = [
  { label: '无滤镜', value: 'none' },
  { label: '灰度', value: 'grayscale' },
  { label: '复古', value: 'sepia' },
  { label: '反色', value: 'invert' },
  { label: '黑白', value: 'blackwhite' },
  { label: '暖色', value: 'warm' },
  { label: '冷色', value: 'cool' },
  { label: '鲜艳', value: 'vivid' },
  { label: '柔和', value: 'soft' },
  { label: '怀旧', value: 'vintage' },
  { label: '梦幻', value: 'dreamy' },
  { label: '锐化', value: 'sharpen' },
  { label: '浮雕', value: 'emboss' },
  { label: '边缘检测', value: 'edge' }
]

// 文字水印
const textWatermark = ref('')
const textSize = ref(24)
const textColor = ref('#ffffff')
const textOpacity = ref(80)
const textPosition = ref('bottom-right')
const textPositions = [
  { title: '左上角', value: 'top-left' },
  { title: '上中', value: 'top-center' },
  { title: '右上角', value: 'top-right' },
  { title: '左中', value: 'middle-left' },
  { title: '居中', value: 'center' },
  { title: '右中', value: 'middle-right' },
  { title: '左下角', value: 'bottom-left' },
  { title: '下中', value: 'bottom-center' },
  { title: '右下角', value: 'bottom-right' }
]

// 绘制工具
const drawMode = ref<'none' | 'pen' | 'line' | 'rect' | 'circle'>('none')
const drawColor = ref('#ff0000')
const isDrawing = ref(false)
const drawStartX = ref(0)
const drawStartY = ref(0)

const drawWidth = ref(3)

// 调整
const brightness = ref(100)
const contrast = ref(100)
const saturation = ref(100)
const blur = ref(0)

// 计算属性
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const imageDimensions = computed(() => {
  if (!currentImage.value) {
    return '0 × 0'
  }
  return `${currentImage.value.width} × ${currentImage.value.height}`
})

const imageSize = computed(() => {
  if (!canvas.value) {
    return '0 KB'
  }
  // 估算大小
  const bytes = canvas.value.width * canvas.value.height * 4
  return `${(bytes / 1024).toFixed(1)} KB`
})

// 监听对话框打开
watch(isOpen, async open => {
  if (open) {
    await nextTick()
    await loadImage()
  }
})

// 方法
const loadImage = async () => {
  if (!canvas.value || !props.imageUrl) {
    return
  }

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = props.imageUrl
    })

    originalImage.value = img
    currentImage.value = img

    // 设置画布大小
    const maxWidth = canvasWrapper.value?.clientWidth || 800
    const maxHeight = window.innerHeight - 300
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

    canvas.value.width = img.width
    canvas.value.height = img.height

    ctx.value = canvas.value.getContext('2d')
    if (ctx.value) {
      ctx.value.drawImage(img, 0, 0)
      saveHistory()
    }

    zoom.value = scale
  } catch (error) {
    showMessage('图片加载失败', { color: 'error' })
    console.error('加载图片失败:', error)
  }
}

const saveHistory = () => {
  if (!canvas.value || !ctx.value) {
    return
  }

  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)

  // 删除当前索引之后的历史
  history.value = history.value.slice(0, historyIndex.value + 1)

  // 添加新历史
  history.value.push(imageData)
  historyIndex.value = history.value.length - 1

  // 限制历史记录数量
  if (history.value.length > 20) {
    history.value.shift()
    historyIndex.value--
  }
}

const undo = () => {
  if (!canUndo.value || !canvas.value || !ctx.value) {
    return
  }

  historyIndex.value--
  const imageData = history.value[historyIndex.value]
  ctx.value.putImageData(imageData, 0, 0)
}

const redo = () => {
  if (!canRedo.value || !canvas.value || !ctx.value) {
    return
  }

  historyIndex.value++
  const imageData = history.value[historyIndex.value]
  ctx.value.putImageData(imageData, 0, 0)
}

const reset = () => {
  if (!originalImage.value || !canvas.value || !ctx.value) {
    return
  }

  canvas.value.width = originalImage.value.width
  canvas.value.height = originalImage.value.height
  ctx.value.drawImage(originalImage.value, 0, 0)

  // 重置所有参数
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  currentFilter.value = 'none'
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  blur.value = 0

  saveHistory()
  showMessage('已重置图片', { color: 'info' })
}

// 裁剪功能
const startCrop = () => {
  if (!canvas.value) {
    return
  }

  isCropping.value = true
  // 初始化裁剪区域为画布中心的 80%
  const width = canvas.value.width * 0.8
  const height = canvas.value.height * 0.8
  cropX.value = (canvas.value.width - width) / 2
  cropY.value = (canvas.value.height - height) / 2
  cropWidth.value = width
  cropHeight.value = height

  // 根据比例调整
  adjustCropRatio()

  // 绘制裁剪框
  drawCropOverlay()
  setupCropEvents()
  showMessage('拖动裁剪框调整区域', { color: 'info' })
}

const adjustCropRatio = () => {
  if (!canvas.value || cropRatio.value === 'free') {
    return
  }

  const ratios: Record<string, number> = {
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9
  }

  const ratio = ratios[cropRatio.value]
  if (!ratio) {
    return
  }

  // 保持宽度，调整高度
  cropHeight.value = cropWidth.value / ratio

  // 如果高度超出画布，则保持高度，调整宽度
  if (cropHeight.value > canvas.value.height) {
    cropHeight.value = canvas.value.height * 0.8
    cropWidth.value = cropHeight.value * ratio
  }

  // 重新居中
  cropX.value = (canvas.value.width - cropWidth.value) / 2
  cropY.value = (canvas.value.height - cropHeight.value) / 2
}

const drawCropOverlay = () => {
  if (!canvas.value || !ctx.value || !isCropping.value) {
    return
  }

  // 保存当前画布状态
  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)

  // 绘制半透明遮罩
  ctx.value.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // 清除裁剪区域（显示原图）
  ctx.value.clearRect(cropX.value, cropY.value, cropWidth.value, cropHeight.value)
  ctx.value.putImageData(imageData, 0, 0, cropX.value, cropY.value, cropWidth.value, cropHeight.value)

  // 绘制裁剪框边框
  ctx.value.strokeStyle = '#ffffff'
  ctx.value.lineWidth = 2
  ctx.value.strokeRect(cropX.value, cropY.value, cropWidth.value, cropHeight.value)

  // 绘制九宫格辅助线
  ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.value.lineWidth = 1

  // 垂直线
  ctx.value.beginPath()
  ctx.value.moveTo(cropX.value + cropWidth.value / 3, cropY.value)
  ctx.value.lineTo(cropX.value + cropWidth.value / 3, cropY.value + cropHeight.value)
  ctx.value.moveTo(cropX.value + (cropWidth.value * 2) / 3, cropY.value)
  ctx.value.lineTo(cropX.value + (cropWidth.value * 2) / 3, cropY.value + cropHeight.value)
  ctx.value.stroke()

  // 水平线
  ctx.value.beginPath()
  ctx.value.moveTo(cropX.value, cropY.value + cropHeight.value / 3)
  ctx.value.lineTo(cropX.value + cropWidth.value, cropY.value + cropHeight.value / 3)
  ctx.value.moveTo(cropX.value, cropY.value + (cropHeight.value * 2) / 3)
  ctx.value.lineTo(cropX.value + cropWidth.value, cropY.value + (cropHeight.value * 2) / 3)
  ctx.value.stroke()

  // 绘制8个控制点
  const handles = [
    { x: cropX.value, y: cropY.value }, // 左上
    { x: cropX.value + cropWidth.value / 2, y: cropY.value }, // 上中
    { x: cropX.value + cropWidth.value, y: cropY.value }, // 右上
    { x: cropX.value, y: cropY.value + cropHeight.value / 2 }, // 左中
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value / 2 }, // 右中
    { x: cropX.value, y: cropY.value + cropHeight.value }, // 左下
    { x: cropX.value + cropWidth.value / 2, y: cropY.value + cropHeight.value }, // 下中
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value } // 右下
  ]

  ctx.value.fillStyle = '#ffffff'
  handles.forEach(handle => {
    ctx.value!.fillRect(handle.x - cropHandleSize / 2, handle.y - cropHandleSize / 2, cropHandleSize, cropHandleSize)
  })
}

let cropDragMode: 'none' | 'move' | 'resize' = 'none'
let cropDragHandle = -1
let cropDragStartX = 0
let cropDragStartY = 0

const setupCropEvents = () => {
  if (!canvas.value) {
    return
  }

  canvas.value.addEventListener('mousedown', handleCropMouseDown)
  canvas.value.addEventListener('mousemove', handleCropMouseMove)
  canvas.value.addEventListener('mouseup', handleCropMouseUp)

  canvas.value.addEventListener('touchstart', handleCropTouchStart)
  canvas.value.addEventListener('touchmove', handleCropTouchMove)
  canvas.value.addEventListener('touchend', handleCropMouseUp)
}

const removeCropEvents = () => {
  if (!canvas.value) {
    return
  }

  canvas.value.removeEventListener('mousedown', handleCropMouseDown)
  canvas.value.removeEventListener('mousemove', handleCropMouseMove)
  canvas.value.removeEventListener('mouseup', handleCropMouseUp)

  canvas.value.removeEventListener('touchstart', handleCropTouchStart)
  canvas.value.removeEventListener('touchmove', handleCropTouchMove)
  canvas.value.removeEventListener('touchend', handleCropMouseUp)
}

const getCanvasCoords = (e: MouseEvent | Touch) => {
  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

const handleCropMouseDown = (e: MouseEvent) => {
  if (!isCropping.value) {
    return
  }

  const coords = getCanvasCoords(e)
  cropDragStartX = coords.x
  cropDragStartY = coords.y

  // 检查是否点击了控制点
  const handles = [
    { x: cropX.value, y: cropY.value, cursor: 'nwse-resize' },
    { x: cropX.value + cropWidth.value / 2, y: cropY.value, cursor: 'ns-resize' },
    { x: cropX.value + cropWidth.value, y: cropY.value, cursor: 'nesw-resize' },
    { x: cropX.value, y: cropY.value + cropHeight.value / 2, cursor: 'ew-resize' },
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value / 2, cursor: 'ew-resize' },
    { x: cropX.value, y: cropY.value + cropHeight.value, cursor: 'nesw-resize' },
    { x: cropX.value + cropWidth.value / 2, y: cropY.value + cropHeight.value, cursor: 'ns-resize' },
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value, cursor: 'nwse-resize' }
  ]

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i]
    if (Math.abs(coords.x - handle.x) <= cropHandleSize && Math.abs(coords.y - handle.y) <= cropHandleSize) {
      cropDragMode = 'resize'
      cropDragHandle = i
      return
    }
  }

  // 检查是否点击了裁剪区域内部
  if (
    coords.x >= cropX.value &&
    coords.x <= cropX.value + cropWidth.value &&
    coords.y >= cropY.value &&
    coords.y <= cropY.value + cropHeight.value
  ) {
    cropDragMode = 'move'
  }
}

const handleCropTouchStart = (e: TouchEvent) => {
  if (!isCropping.value) {
    return
  }
  e.preventDefault()

  const touch = e.touches[0]
  const coords = getCanvasCoords(touch)
  cropDragStartX = coords.x
  cropDragStartY = coords.y

  // 与鼠标事件相同的逻辑
  const handles = [
    { x: cropX.value, y: cropY.value },
    { x: cropX.value + cropWidth.value / 2, y: cropY.value },
    { x: cropX.value + cropWidth.value, y: cropY.value },
    { x: cropX.value, y: cropY.value + cropHeight.value / 2 },
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value / 2 },
    { x: cropX.value, y: cropY.value + cropHeight.value },
    { x: cropX.value + cropWidth.value / 2, y: cropY.value + cropHeight.value },
    { x: cropX.value + cropWidth.value, y: cropY.value + cropHeight.value }
  ]

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i]
    if (Math.abs(coords.x - handle.x) <= cropHandleSize * 2 && Math.abs(coords.y - handle.y) <= cropHandleSize * 2) {
      cropDragMode = 'resize'
      cropDragHandle = i
      return
    }
  }

  if (
    coords.x >= cropX.value &&
    coords.x <= cropX.value + cropWidth.value &&
    coords.y >= cropY.value &&
    coords.y <= cropY.value + cropHeight.value
  ) {
    cropDragMode = 'move'
  }
}

const handleCropMouseMove = (e: MouseEvent) => {
  if (!isCropping.value || cropDragMode === 'none') {
    return
  }

  const coords = getCanvasCoords(e)
  const dx = coords.x - cropDragStartX
  const dy = coords.y - cropDragStartY

  if (cropDragMode === 'move') {
    cropX.value = Math.max(0, Math.min(canvas.value!.width - cropWidth.value, cropX.value + dx))
    cropY.value = Math.max(0, Math.min(canvas.value!.height - cropHeight.value, cropY.value + dy))
  } else if (cropDragMode === 'resize') {
    resizeCropArea(cropDragHandle, dx, dy)
  }

  cropDragStartX = coords.x
  cropDragStartY = coords.y

  // 重新绘制
  if (historyIndex.value >= 0) {
    ctx.value!.putImageData(history.value[historyIndex.value], 0, 0)
  }
  drawCropOverlay()
}

const handleCropTouchMove = (e: TouchEvent) => {
  if (!isCropping.value || cropDragMode === 'none') {
    return
  }
  e.preventDefault()

  const touch = e.touches[0]
  const coords = getCanvasCoords(touch)
  const dx = coords.x - cropDragStartX
  const dy = coords.y - cropDragStartY

  if (cropDragMode === 'move') {
    cropX.value = Math.max(0, Math.min(canvas.value!.width - cropWidth.value, cropX.value + dx))
    cropY.value = Math.max(0, Math.min(canvas.value!.height - cropHeight.value, cropY.value + dy))
  } else if (cropDragMode === 'resize') {
    resizeCropArea(cropDragHandle, dx, dy)
  }

  cropDragStartX = coords.x
  cropDragStartY = coords.y

  if (historyIndex.value >= 0) {
    ctx.value!.putImageData(history.value[historyIndex.value], 0, 0)
  }
  drawCropOverlay()
}

const resizeCropArea = (handleIndex: number, dx: number, dy: number) => {
  const minSize = 50

  switch (handleIndex) {
    case 0: // 左上
      cropX.value += dx
      cropY.value += dy
      cropWidth.value -= dx
      cropHeight.value -= dy
      break
    case 1: // 上中
      cropY.value += dy
      cropHeight.value -= dy
      break
    case 2: // 右上
      cropWidth.value += dx
      cropY.value += dy
      cropHeight.value -= dy
      break
    case 3: // 左中
      cropX.value += dx
      cropWidth.value -= dx
      break
    case 4: // 右中
      cropWidth.value += dx
      break
    case 5: // 左下
      cropX.value += dx
      cropWidth.value -= dx
      cropHeight.value += dy
      break
    case 6: // 下中
      cropHeight.value += dy
      break
    case 7: // 右下
      cropWidth.value += dx
      cropHeight.value += dy
      break
  }

  // 限制最小尺寸
  if (cropWidth.value < minSize) {
    cropWidth.value = minSize
  }
  if (cropHeight.value < minSize) {
    cropHeight.value = minSize
  }

  // 限制边界
  cropX.value = Math.max(0, cropX.value)
  cropY.value = Math.max(0, cropY.value)
  if (cropX.value + cropWidth.value > canvas.value!.width) {
    cropWidth.value = canvas.value!.width - cropX.value
  }
  if (cropY.value + cropHeight.value > canvas.value!.height) {
    cropHeight.value = canvas.value!.height - cropY.value
  }
}

const handleCropMouseUp = () => {
  cropDragMode = 'none'
  cropDragHandle = -1
}

const applyCrop = () => {
  if (!canvas.value || !ctx.value || !isCropping.value) {
    startCrop()
    return
  }

  // 获取裁剪区域的图像数据
  const croppedData = ctx.value.getImageData(cropX.value, cropY.value, cropWidth.value, cropHeight.value)

  // 调整画布大小
  canvas.value.width = cropWidth.value
  canvas.value.height = cropHeight.value

  // 绘制裁剪后的图像
  ctx.value.putImageData(croppedData, 0, 0)

  // 清理裁剪状态
  cancelCrop()

  saveHistory()
  showMessage('裁剪成功', { color: 'success' })
}

const cancelCrop = () => {
  if (!isCropping.value) {
    return
  }

  isCropping.value = false
  removeCropEvents()

  // 恢复原图
  if (historyIndex.value >= 0 && ctx.value) {
    ctx.value.putImageData(history.value[historyIndex.value], 0, 0)
  }

  showMessage('已取消裁剪', { color: 'info' })
}

// 监听裁剪比例变化
watch(cropRatio, () => {
  if (isCropping.value) {
    adjustCropRatio()
    if (historyIndex.value >= 0 && ctx.value) {
      ctx.value.putImageData(history.value[historyIndex.value], 0, 0)
    }
    drawCropOverlay()
  }
})

// 旋转功能
const rotateLeft = () => {
  rotateImage(-90)
}

const rotateRight = () => {
  rotateImage(90)
}

const rotateImage = (degrees: number) => {
  if (!canvas.value || !ctx.value) {
    return
  }

  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) {
    return
  }

  // 交换宽高
  tempCanvas.width = canvas.value.height
  tempCanvas.height = canvas.value.width

  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
  tempCtx.rotate((degrees * Math.PI) / 180)
  tempCtx.drawImage(canvas.value, -canvas.value.width / 2, -canvas.value.height / 2)

  canvas.value.width = tempCanvas.width
  canvas.value.height = tempCanvas.height
  ctx.value.drawImage(tempCanvas, 0, 0)

  saveHistory()
  showMessage(`已旋转 ${degrees}°`, { color: 'success' })
}

// 翻转功能
const flipHorizontal = () => {
  if (!canvas.value || !ctx.value) {
    return
  }

  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
  ctx.value.save()
  ctx.value.scale(-1, 1)
  ctx.value.drawImage(canvas.value, -canvas.value.width, 0)
  ctx.value.restore()

  saveHistory()
  showMessage('已水平翻转', { color: 'success' })
}

const flipVertical = () => {
  if (!canvas.value || !ctx.value) {
    return
  }

  ctx.value.save()
  ctx.value.scale(1, -1)
  ctx.value.drawImage(canvas.value, 0, -canvas.value.height)
  ctx.value.restore()

  saveHistory()
  showMessage('已垂直翻转', { color: 'success' })
}

// 滤镜功能
const applyFilter = (filterValue: string) => {
  if (!canvas.value || !ctx.value) {
    return
  }

  currentFilter.value = filterValue

  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const data = imageData.data

  switch (filterValue) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = data[i + 1] = data[i + 2] = avg
      }
      break
    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      }
      break
    case 'invert':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]
        data[i + 1] = 255 - data[i + 1]
        data[i + 2] = 255 - data[i + 2]
      }
      break
    case 'blackwhite':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const bw = avg > 128 ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = bw
      }
      break
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1)
        data[i + 2] = data[i + 2] * 0.9
      }
      break
    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.9
        data[i + 2] = Math.min(255, data[i + 2] * 1.1)
      }
      break
  }

  if (filterValue !== 'none') {
    ctx.value.putImageData(imageData, 0, 0)
    saveHistory()
    showMessage(`已应用${filters.find(f => f.value === filterValue)?.label}滤镜`, { color: 'success' })
  }
}

// 调整功能
const applyAdjustments = () => {
  if (!canvas.value || !ctx.value || historyIndex.value < 0) {
    return
  }

  // 从历史记录恢复原始图像
  const originalData = history.value[0]
  ctx.value.putImageData(originalData, 0, 0)

  // 应用调整
  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const data = imageData.data

  const brightnessFactor = brightness.value / 100
  const contrastFactor = contrast.value / 100
  const saturationFactor = saturation.value / 100

  for (let i = 0; i < data.length; i += 4) {
    // 亮度
    data[i] *= brightnessFactor
    data[i + 1] *= brightnessFactor
    data[i + 2] *= brightnessFactor

    // 对比度
    data[i] = (data[i] - 128) * contrastFactor + 128
    data[i + 1] = (data[i + 1] - 128) * contrastFactor + 128
    data[i + 2] = (data[i + 2] - 128) * contrastFactor + 128

    // 饱和度
    const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    data[i] = gray + (data[i] - gray) * saturationFactor
    data[i + 1] = gray + (data[i + 1] - gray) * saturationFactor
    data[i + 2] = gray + (data[i + 2] - gray) * saturationFactor

    // 限制范围
    data[i] = Math.max(0, Math.min(255, data[i]))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]))
  }

  ctx.value.putImageData(imageData, 0, 0)

  // 应用模糊
  if (blur.value > 0) {
    ctx.value.filter = `blur(${blur.value}px)`
    ctx.value.drawImage(canvas.value, 0, 0)
    ctx.value.filter = 'none'
  }
}

const resetAdjustments = () => {
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  blur.value = 0
  applyAdjustments()
  showMessage('已重置调整', { color: 'info' })
}

// 文字水印功能
const addTextWatermark = () => {
  if (!canvas.value || !ctx.value || !textWatermark.value.trim()) {
    return
  }

  const text = textWatermark.value.trim()
  const fontSize = textSize.value
  const color = textColor.value
  const opacity = textOpacity.value / 100

  // 设置字体
  ctx.value.font = `${fontSize}px Arial, sans-serif`
  ctx.value.fillStyle = color
  ctx.value.globalAlpha = opacity

  // 测量文字宽度
  const metrics = ctx.value.measureText(text)
  const textWidth = metrics.width
  const textHeight = fontSize

  // 计算位置
  let x = 0
  let y = 0
  const padding = 20

  switch (textPosition.value) {
    case 'top-left':
      x = padding
      y = padding + textHeight
      break
    case 'top-center':
      x = (canvas.value.width - textWidth) / 2
      y = padding + textHeight
      break
    case 'top-right':
      x = canvas.value.width - textWidth - padding
      y = padding + textHeight
      break
    case 'middle-left':
      x = padding
      y = (canvas.value.height + textHeight) / 2
      break
    case 'center':
      x = (canvas.value.width - textWidth) / 2
      y = (canvas.value.height + textHeight) / 2
      break
    case 'middle-right':
      x = canvas.value.width - textWidth - padding
      y = (canvas.value.height + textHeight) / 2
      break
    case 'bottom-left':
      x = padding
      y = canvas.value.height - padding
      break
    case 'bottom-center':
      x = (canvas.value.width - textWidth) / 2
      y = canvas.value.height - padding
      break
    case 'bottom-right':
      x = canvas.value.width - textWidth - padding
      y = canvas.value.height - padding
      break
  }

  // 绘制文字
  ctx.value.fillText(text, x, y)
  ctx.value.globalAlpha = 1

  saveHistory()
  showMessage('已添加文字水印', { color: 'success' })
}

const clearTextSettings = () => {
  textWatermark.value = ''
  textSize.value = 24
  textColor.value = '#ffffff'
  textOpacity.value = 80
  textPosition.value = 'bottom-right'
  showMessage('已清除文字设置', { color: 'info' })
}

// 绘制工具功能
const setupDrawingEvents = () => {
  if (!canvas.value) {
    return
  }

  canvas.value.addEventListener('mousedown', handleDrawStart)
  canvas.value.addEventListener('mousemove', handleDrawMove)
  canvas.value.addEventListener('mouseup', handleDrawEnd)
  canvas.value.addEventListener('mouseleave', handleDrawEnd)

  // 触摸事件
  canvas.value.addEventListener('touchstart', handleTouchStart)
  canvas.value.addEventListener('touchmove', handleTouchMove)
  canvas.value.addEventListener('touchend', handleDrawEnd)
}

const removeDrawingEvents = () => {
  if (!canvas.value) {
    return
  }

  canvas.value.removeEventListener('mousedown', handleDrawStart)
  canvas.value.removeEventListener('mousemove', handleDrawMove)
  canvas.value.removeEventListener('mouseup', handleDrawEnd)
  canvas.value.removeEventListener('mouseleave', handleDrawEnd)

  canvas.value.removeEventListener('touchstart', handleTouchStart)
  canvas.value.removeEventListener('touchmove', handleTouchMove)
  canvas.value.removeEventListener('touchend', handleDrawEnd)
}

const handleDrawStart = (e: MouseEvent) => {
  if (activeTab.value !== 'draw') {
    return
  }

  isDrawing.value = true
  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height

  drawStartX.value = (e.clientX - rect.left) * scaleX
  drawStartY.value = (e.clientY - rect.top) * scaleY

  if (drawMode.value === 'pen') {
    ctx.value!.beginPath()
    ctx.value!.moveTo(drawStartX.value, drawStartY.value)
  }
}

const handleTouchStart = (e: TouchEvent) => {
  if (activeTab.value !== 'draw') {
    return
  }
  e.preventDefault()

  const touch = e.touches[0]
  isDrawing.value = true
  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height

  drawStartX.value = (touch.clientX - rect.left) * scaleX
  drawStartY.value = (touch.clientY - rect.top) * scaleY

  if (drawMode.value === 'pen') {
    ctx.value!.beginPath()
    ctx.value!.moveTo(drawStartX.value, drawStartY.value)
  }
}

const handleDrawMove = (e: MouseEvent) => {
  if (!isDrawing.value || activeTab.value !== 'draw' || !ctx.value) {
    return
  }

  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  ctx.value.strokeStyle = drawColor.value
  ctx.value.lineWidth = drawWidth.value
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'

  if (drawMode.value === 'pen') {
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDrawing.value || activeTab.value !== 'draw' || !ctx.value) {
    return
  }
  e.preventDefault()

  const touch = e.touches[0]
  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height
  const x = (touch.clientX - rect.left) * scaleX
  const y = (touch.clientY - rect.top) * scaleY

  ctx.value.strokeStyle = drawColor.value
  ctx.value.lineWidth = drawWidth.value
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'

  if (drawMode.value === 'pen') {
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }
}

const handleDrawEnd = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || activeTab.value !== 'draw' || !ctx.value) {
    return
  }

  const rect = canvas.value!.getBoundingClientRect()
  const scaleX = canvas.value!.width / rect.width
  const scaleY = canvas.value!.height / rect.height

  let x: number, y: number
  if (e instanceof MouseEvent) {
    x = (e.clientX - rect.left) * scaleX
    y = (e.clientY - rect.top) * scaleY
  } else {
    if (e.changedTouches.length === 0) {
      isDrawing.value = false
      return
    }
    const touch = e.changedTouches[0]
    x = (touch.clientX - rect.left) * scaleX
    y = (touch.clientY - rect.top) * scaleY
  }

  ctx.value.strokeStyle = drawColor.value
  ctx.value.fillStyle = drawColor.value
  ctx.value.lineWidth = drawWidth.value

  switch (drawMode.value) {
    case 'line': {
      ctx.value.beginPath()
      ctx.value.moveTo(drawStartX.value, drawStartY.value)
      ctx.value.lineTo(x, y)
      ctx.value.stroke()
      break
    }
    case 'rect': {
      ctx.value.strokeRect(drawStartX.value, drawStartY.value, x - drawStartX.value, y - drawStartY.value)
      break
    }
    case 'circle': {
      const radius = Math.sqrt(Math.pow(x - drawStartX.value, 2) + Math.pow(y - drawStartY.value, 2))
      ctx.value.beginPath()
      ctx.value.arc(drawStartX.value, drawStartY.value, radius, 0, 2 * Math.PI)
      ctx.value.stroke()
      break
    }
  }

  isDrawing.value = false
  saveHistory()
}

const clearDrawing = () => {
  showMessage('请使用撤销功能移除绘制', { color: 'info' })
}

// 监听标签切换，设置绘制事件
watch(activeTab, (newTab, oldTab) => {
  if (newTab === 'draw') {
    setupDrawingEvents()
  } else if (oldTab === 'draw') {
    removeDrawingEvents()
  }
})

// 组件卸载时清理事件
watch(isOpen, open => {
  if (!open) {
    removeDrawingEvents()
  }
})

// 缩放功能
const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.1)
}

// 保存功能
const save = async () => {
  if (!canvas.value) {
    return
  }

  saving.value = true
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.value!.toBlob(blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('转换失败'))
        }
      }, 'image/png')
    })

    emit('save', blob, props.imageName)
    showMessage('图片已保存', { color: 'success' })
    close()
  } catch (error) {
    showMessage('保存失败', { color: 'error' })
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const close = () => {
  isOpen.value = false
}
</script>

<style scoped lang="scss">
.image-editor {
  .editor-container {
    height: calc(100vh - 64px);
    overflow: hidden;
  }

  .tools-panel {
    height: calc(100vh - 64px);
    overflow-y: auto;
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .canvas-area {
    // 颜色选择器样式
    .color-picker {
      width: 50px;
      height: 36px;
      border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      border-radius: 4px;
      cursor: pointer;
    }
    height: calc(100vh - 64px);
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .canvas-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 50% / 20px 20px;
    overflow: auto;
  }

  .canvas-wrapper {
    position: relative;
    display: inline-block;
    transform: scale(v-bind(zoom));
    transform-origin: center;
    transition: transform 0.3s ease;
  }

  .edit-canvas {
    display: block;
    max-width: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    touch-action: none; // 禁用默认触摸行为
  }

  // 移动端适配
  @media (max-width: 960px) {
    .editor-container {
      flex-direction: column;
    }

    .tools-panel {
      height: auto;
      max-height: 40vh;
      border-right: none;
      border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      order: 2; // 工具面板移到底部
    }

    .canvas-area {
      height: 60vh;
      order: 1; // 画布区域在上方
    }

    // 垂直标签改为水平
    :deep(.v-tabs) {
      flex-direction: row !important;

      .v-tab {
        flex-direction: column;
        min-width: auto;
        padding: 8px 12px;

        .v-icon {
          margin: 0 0 4px 0 !important;
        }
      }
    }

    // 工具选项卡片
    :deep(.v-window) {
      .v-card-text {
        padding: 12px;
      }

      .v-slider {
        margin: 8px 0;
      }

      .v-btn {
        font-size: 0.875rem;
      }
    }
  }

  @media (max-width: 600px) {
    .tools-panel {
      max-height: 50vh;
    }

    .canvas-area {
      height: 50vh;
    }

    // 更紧凑的按钮
    :deep(.v-toolbar) {
      .v-btn {
        min-width: auto;
        padding: 0 8px;
      }

      .v-toolbar-title {
        font-size: 1rem;
      }
    }

    // 缩放控制
    :deep(.v-btn-group) {
      .v-btn {
        min-width: 32px;
        padding: 0 4px;
      }
    }

    // 滤镜列表
    :deep(.v-list) {
      .v-list-item {
        min-height: 40px;
        padding: 0 12px;
      }
    }
  }

  // 触摸优化
  @media (hover: none) and (pointer: coarse) {
    .edit-canvas {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    // 增大触摸目标
    :deep(.v-btn) {
      min-height: 44px;
      min-width: 44px;
    }

    :deep(.v-slider) {
      .v-slider-thumb {
        width: 24px;
        height: 24px;
      }
    }

    // 滤镜列表项
    :deep(.v-list-item) {
      min-height: 48px;
    }
  }
}
</style>
