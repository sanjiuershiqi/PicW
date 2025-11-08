<template>
  <v-dialog v-model="isOpen" fullscreen transition="dialog-bottom-transition" class="image-compare">
    <v-card>
      <!-- 顶部工具栏 -->
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="close" />
        <v-toolbar-title>图片对比</v-toolbar-title>
        <v-spacer />
        <v-btn-toggle v-model="compareMode" variant="outlined" density="compact" mandatory>
          <v-btn value="slider">
            <v-icon>mdi-arrow-left-right</v-icon>
            滑动对比
          </v-btn>
          <v-btn value="sidebyside">
            <v-icon>mdi-view-split-vertical</v-icon>
            并排对比
          </v-btn>
          <v-btn value="overlay">
            <v-icon>mdi-layers</v-icon>
            叠加对比
          </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn icon="mdi-swap-horizontal" @click="swapImages" title="交换图片" />
      </v-toolbar>

      <v-container fluid class="compare-container">
        <!-- 滑动对比模式 -->
        <div v-if="compareMode === 'slider'" class="slider-compare">
          <div class="compare-wrapper" ref="compareWrapper">
            <!-- 左侧图片 -->
            <div class="image-container left-image">
              <img :src="leftImage" alt="左侧图片" />
              <div class="image-label">
                <v-chip color="primary" size="small">{{ leftLabel }}</v-chip>
              </div>
            </div>

            <!-- 右侧图片 -->
            <div class="image-container right-image" :style="{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }">
              <img :src="rightImage" alt="右侧图片" />
              <div class="image-label">
                <v-chip color="secondary" size="small">{{ rightLabel }}</v-chip>
              </div>
            </div>

            <!-- 滑块 -->
            <div class="slider-handle" :style="{ left: `${sliderPosition}%` }" @mousedown="startDrag" @touchstart="startDrag">
              <div class="slider-line" />
              <div class="slider-button">
                <v-icon color="white">mdi-arrow-left-right</v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 并排对比模式 -->
        <div v-else-if="compareMode === 'sidebyside'" class="sidebyside-compare">
          <v-row class="fill-height">
            <v-col cols="12" md="6" class="image-column">
              <v-card variant="flat" class="fill-height">
                <v-card-title class="d-flex align-center">
                  <v-chip color="primary" size="small" class="me-2">{{ leftLabel }}</v-chip>
                  <v-spacer />
                  <v-chip size="small" variant="tonal">{{ leftImageInfo }}</v-chip>
                </v-card-title>
                <v-card-text class="image-wrapper">
                  <img :src="leftImage" alt="左侧图片" class="compare-image" />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" class="image-column">
              <v-card variant="flat" class="fill-height">
                <v-card-title class="d-flex align-center">
                  <v-chip color="secondary" size="small" class="me-2">{{ rightLabel }}</v-chip>
                  <v-spacer />
                  <v-chip size="small" variant="tonal">{{ rightImageInfo }}</v-chip>
                </v-card-title>
                <v-card-text class="image-wrapper">
                  <img :src="rightImage" alt="右侧图片" class="compare-image" />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 叠加对比模式 -->
        <div v-else-if="compareMode === 'overlay'" class="overlay-compare">
          <div class="compare-wrapper">
            <!-- 底层图片 -->
            <div class="image-container base-image">
              <img :src="leftImage" alt="底层图片" />
              <div class="image-label">
                <v-chip color="primary" size="small">{{ leftLabel }}</v-chip>
              </div>
            </div>

            <!-- 叠加图片 -->
            <div class="image-container overlay-image" :style="{ opacity: overlayOpacity / 100 }">
              <img :src="rightImage" alt="叠加图片" />
              <div class="image-label">
                <v-chip color="secondary" size="small">{{ rightLabel }}</v-chip>
              </div>
            </div>
          </div>

          <!-- 透明度控制 -->
          <v-card variant="flat" class="opacity-control">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon class="me-2">mdi-opacity</v-icon>
                <span class="text-subtitle-2 me-4">叠加透明度</span>
                <v-slider v-model="overlayOpacity" :min="0" :max="100" :step="1" thumb-label hide-details class="flex-grow-1" />
                <span class="text-subtitle-2 ms-4">{{ overlayOpacity }}%</span>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- 底部信息栏 -->
        <v-card variant="flat" class="info-bar">
          <v-card-text class="d-flex align-center">
            <v-chip size="small" variant="tonal" class="me-2">
              <v-icon icon="mdi-image" size="small" class="me-1" />
              对比模式: {{ compareModeLabel }}
            </v-chip>
            <v-spacer />
            <v-btn-group variant="outlined" density="compact">
              <v-btn icon="mdi-magnify-minus" @click="zoomOut" />
              <v-btn>{{ Math.round(zoom * 100) }}%</v-btn>
              <v-btn icon="mdi-magnify-plus" @click="zoomIn" />
              <v-btn icon="mdi-fit-to-screen" @click="fitToScreen" />
            </v-btn-group>
          </v-card-text>
        </v-card>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  leftImage: string
  rightImage: string
  leftLabel?: string
  rightLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  leftLabel: '原图',
  rightLabel: '对比图'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// 状态
const compareMode = ref<'slider' | 'sidebyside' | 'overlay'>('slider')
const sliderPosition = ref(50)
const overlayOpacity = ref(50)
const zoom = ref(1)
const isDragging = ref(false)
const compareWrapper = ref<HTMLElement | null>(null)

// 图片信息
const leftImageInfo = ref('')
const rightImageInfo = ref('')

// 计算属性
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const compareModeLabel = computed(() => {
  switch (compareMode.value) {
    case 'slider':
      return '滑动对比'
    case 'sidebyside':
      return '并排对比'
    case 'overlay':
      return '叠加对比'
    default:
      return ''
  }
})

// 方法
const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  updateSliderPosition(e)

  document.addEventListener('mousemove', updateSliderPosition)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', updateSliderPosition)
  document.addEventListener('touchend', stopDrag)
}

const updateSliderPosition = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !compareWrapper.value) {
    return
  }

  const rect = compareWrapper.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const position = ((clientX - rect.left) / rect.width) * 100

  sliderPosition.value = Math.max(0, Math.min(100, position))
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', updateSliderPosition)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateSliderPosition)
  document.removeEventListener('touchend', stopDrag)
}

const swapImages = () => {
  // 交换图片需要父组件支持
  // 这里只是示意
  const temp = sliderPosition.value
  sliderPosition.value = 100 - temp
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.1)
}

const fitToScreen = () => {
  zoom.value = 1
}

const close = () => {
  isOpen.value = false
}

// 加载图片信息
const loadImageInfo = async () => {
  try {
    const leftImg = new Image()
    leftImg.src = props.leftImage
    await new Promise(resolve => {
      leftImg.onload = resolve
    })
    leftImageInfo.value = `${leftImg.width} × ${leftImg.height}`

    const rightImg = new Image()
    rightImg.src = props.rightImage
    await new Promise(resolve => {
      rightImg.onload = resolve
    })
    rightImageInfo.value = `${rightImg.width} × ${rightImg.height}`
  } catch (error) {
    console.error('加载图片信息失败:', error)
  }
}

onMounted(() => {
  loadImageInfo()
})

onUnmounted(() => {
  stopDrag()
})
</script>

<style scoped lang="scss">
.image-compare {
  .compare-container {
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .slider-compare,
  .overlay-compare {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 50% / 20px 20px;
    overflow: auto;
    touch-action: pan-x pan-y; // 允许触摸滚动
  }

  .compare-wrapper {
    position: relative;
    display: inline-block;
    transform: scale(v-bind(zoom));
    transform-origin: center;
    transition: transform 0.3s ease;
    max-width: 90%;
    max-height: 80%;
  }

  .image-container {
    position: relative;
    display: block;

    img {
      display: block;
      max-width: 100%;
      height: auto;
      user-select: none;
      pointer-events: none;
    }

    .image-label {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 2;
    }
  }

  .left-image {
    position: relative;
  }

  .right-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .slider-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
    z-index: 10;
    transform: translateX(-50%);
    touch-action: none; // 禁用默认触摸行为

    .slider-line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2px;
      background: white;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      transform: translateX(-50%);
    }

    .slider-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      background: rgb(var(--v-theme-primary));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translate(-50%, -50%) scale(1.1);
      }
    }
  }

  .sidebyside-compare {
    flex: 1;
    overflow: auto;

    .image-column {
      height: 100%;
    }

    .image-wrapper {
      height: calc(100% - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 50% / 20px 20px;
    }

    .compare-image {
      max-width: 100%;
      max-height: 100%;
      display: block;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .overlay-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.3s ease;
  }

  .opacity-control {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 400px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .info-bar {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  // 移动端适配
  @media (max-width: 960px) {
    .compare-container {
      height: calc(100vh - 56px); // 移动端工具栏更小
    }

    .compare-wrapper {
      max-width: 95%;
      max-height: 85%;
    }

    .sidebyside-compare {
      .image-column {
        height: 50vh;
      }

      .image-wrapper {
        height: calc(100% - 56px);
      }
    }

    .opacity-control {
      min-width: 90%;
      bottom: 70px;
    }

    .slider-handle {
      width: 8px; // 增大触摸区域

      .slider-button {
        width: 56px; // 增大按钮尺寸
        height: 56px;
      }
    }

    // 工具栏按钮组
    :deep(.v-toolbar) {
      .v-btn-toggle {
        .v-btn {
          font-size: 0.75rem;
          padding: 0 8px;

          .v-icon {
            font-size: 18px;
          }
        }
      }
    }
  }

  @media (max-width: 600px) {
    .compare-container {
      height: calc(100vh - 56px);
    }

    .image-label {
      top: 8px !important;
      left: 8px !important;

      .v-chip {
        font-size: 0.75rem;
        height: 24px;
      }
    }

    .opacity-control {
      min-width: 95%;
      bottom: 60px;

      :deep(.v-card-text) {
        padding: 12px;

        .text-subtitle-2 {
          font-size: 0.875rem;
        }
      }
    }

    .info-bar {
      :deep(.v-card-text) {
        padding: 8px 12px;
        flex-wrap: wrap;
        gap: 8px;

        .v-chip {
          font-size: 0.75rem;
        }

        .v-btn-group {
          .v-btn {
            min-width: 32px;
            padding: 0 4px;
            font-size: 0.75rem;
          }
        }
      }
    }

    // 并排对比模式
    .sidebyside-compare {
      :deep(.v-card-title) {
        padding: 8px 12px;
        font-size: 0.875rem;

        .v-chip {
          font-size: 0.75rem;
          height: 24px;
        }
      }
    }

    // 顶部工具栏
    :deep(.v-toolbar) {
      height: 56px;

      .v-toolbar-title {
        font-size: 1rem;
      }

      .v-btn-toggle {
        flex-direction: column;
        height: auto;

        .v-btn {
          min-width: auto;
          padding: 4px 8px;
          font-size: 0;

          .v-icon {
            margin: 0;
            font-size: 20px;
          }

          // 隐藏文字，只显示图标
          &::after {
            content: none;
          }
        }
      }
    }
  }

  // 触摸设备优化
  @media (hover: none) and (pointer: coarse) {
    .slider-handle {
      width: 12px; // 更大的触摸区域

      .slider-button {
        width: 64px;
        height: 64px;

        .v-icon {
          font-size: 28px;
        }
      }
    }

    // 增大所有按钮的触摸目标
    :deep(.v-btn) {
      min-height: 44px;
      min-width: 44px;
    }

    // 滑块控制
    :deep(.v-slider) {
      .v-slider-thumb {
        width: 28px;
        height: 28px;
      }

      .v-slider-track {
        height: 6px;
      }
    }
  }

  // 横屏模式优化
  @media (max-width: 960px) and (orientation: landscape) {
    .compare-wrapper {
      max-height: 70%;
    }

    .opacity-control {
      bottom: 60px;
    }

    .sidebyside-compare {
      .image-column {
        height: calc(100vh - 120px);
      }
    }
  }
}
</style>
