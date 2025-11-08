<template>
  <div class="image-preview">
    <!-- 图片卡片 -->
    <v-card class="image-card" :class="{ 'image-card--selected': selected }" @click="handleCardClick">
      <!-- 选择框 -->
      <v-checkbox
        v-if="showSelection"
        :model-value="selected"
        @update:model-value="$emit('update:selected', $event)"
        @click.stop
        class="selection-checkbox"
        hide-details
        density="compact"
      />

      <!-- 图片 -->
      <v-img :src="imageUrl" :alt="image.name" :height="imageHeight" cover class="image-content">
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate size="24" />
          </div>
        </template>

        <!-- 悬停操作层 -->
        <v-fade-transition>
          <div v-show="showActions" class="image-overlay">
            <div class="overlay-content">
              <!-- 快速操作按钮 -->
              <div class="quick-actions">
                <v-btn icon="mdi-eye" variant="elevated" color="primary" size="large" @click.stop="openPreview" title="预览图片" />
                <v-btn icon="mdi-download" variant="elevated" color="success" size="large" @click.stop="downloadImage" title="下载图片" />
                <v-btn
                  v-if="showDelete"
                  icon="mdi-delete"
                  variant="elevated"
                  color="error"
                  size="large"
                  @click.stop="confirmDelete"
                  title="删除图片"
                />
              </div>

              <!-- 图片信息 -->
              <div class="image-info">
                <div class="image-name">{{ image.name }}</div>
                <div class="image-details">{{ formatFileSize(image.size) }} • {{ getFileType(image.name) }}</div>
              </div>
            </div>
          </div>
        </v-fade-transition>
      </v-img>

      <!-- 图片标题 -->
      <v-card-subtitle v-if="showTitle" class="text-caption pa-2">
        <div class="text-truncate">{{ image.name }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ formatFileSize(image.size) }}
        </div>
      </v-card-subtitle>
    </v-card>

    <!-- 全屏预览对话框 -->
    <v-dialog v-model="previewDialog" fullscreen transition="scale-transition" class="image-preview-dialog">
      <v-card color="rgba(0, 0, 0, 0.9)" class="preview-card">
        <!-- 工具栏 -->
        <v-app-bar color="transparent" density="compact">
          <v-app-bar-title class="text-truncate">
            {{ image.name }}
          </v-app-bar-title>
          <v-spacer />

          <!-- 工具按钮 -->
          <v-btn icon="mdi-download" variant="text" @click="downloadImage" title="下载" />
          <v-btn icon="mdi-content-copy" variant="text" @click="copyImageUrl" title="复制链接" />
          <v-btn icon="mdi-open-in-new" variant="text" @click="openInNewTab" title="新窗口打开" />
          <v-btn icon="mdi-close" variant="text" @click="previewDialog = false" title="关闭" />
        </v-app-bar>

        <!-- 图片内容 -->
        <v-card-text class="preview-content" @click="previewDialog = false">
          <div class="preview-container">
            <v-img :src="imageUrl" :alt="image.name" class="preview-image" contain>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate size="48" />
                </div>
              </template>
            </v-img>
          </div>
        </v-card-text>

        <!-- 图片信息底栏 -->
        <div class="preview-info">
          <v-chip size="small" variant="tonal">
            {{ formatFileSize(image.size) }}
          </v-chip>
          <v-chip size="small" variant="tonal" class="ml-2">
            {{ getFileType(image.name) }}
          </v-chip>
          <v-chip v-if="imageDimensions" size="small" variant="tonal" class="ml-2">
            {{ imageDimensions }}
          </v-chip>
        </div>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="me-2" />
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除图片 "{{ image.name }}" 吗？
          <v-alert type="warning" variant="tonal" class="mt-4"> 此操作不可撤销！ </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="handleDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import filesize from '@/libs/filesize'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { computed, ref } from 'vue'

interface ImageItem {
  name: string
  path: string
  sha: string
  size: number
  type: string
}

interface Props {
  image: ImageItem
  imageUrl: string
  selected?: boolean
  showSelection?: boolean
  showTitle?: boolean
  showDelete?: boolean
  showActions?: boolean
  imageHeight?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  showSelection: false,
  showTitle: true,
  showDelete: true,
  showActions: true,
  imageHeight: 200
})

const emit = defineEmits<{
  (e: 'update:selected', selected: boolean): void
  (e: 'preview', image: ImageItem): void
  (e: 'download', image: ImageItem): void
  (e: 'delete', image: ImageItem): void
  (e: 'click', image: ImageItem): void
}>()

const { showMessage } = useSnackBarStore()

// 对话框状态
const previewDialog = ref(false)
const deleteDialog = ref(false)
const imageDimensions = ref('')

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

// 获取文件类型
const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'Unknown'
}

// 事件处理
const handleCardClick = () => {
  emit('click', props.image)
}

const openPreview = () => {
  previewDialog.value = true
  emit('preview', props.image)

  // 获取图片尺寸
  const img = new Image()
  img.onload = () => {
    imageDimensions.value = `${img.width} × ${img.height}`
  }
  img.src = props.imageUrl
}

const downloadImage = async () => {
  try {
    const response = await fetch(props.imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = props.image.name
    a.click()

    URL.revokeObjectURL(url)
    showMessage('下载成功', { color: 'success' })
    emit('download', props.image)
  } catch (error) {
    showMessage('下载失败', { color: 'error' })
  }
}

const copyImageUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.imageUrl)
    showMessage('链接已复制', { color: 'success' })
  } catch (error) {
    showMessage('复制失败', { color: 'error' })
  }
}

const openInNewTab = () => {
  window.open(props.imageUrl, '_blank')
}

const confirmDelete = () => {
  deleteDialog.value = true
}

const handleDelete = () => {
  deleteDialog.value = false
  emit('delete', props.image)
}
</script>

<style scoped lang="scss">
.image-preview {
  .image-card {
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(var(--v-theme-primary), 0.1) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1;
      pointer-events: none;
    }

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);

      &::before {
        opacity: 1;
      }

      .image-content {
        transform: scale(1.05);
      }
    }

    &--selected {
      border: 3px solid rgb(var(--v-theme-primary));
      box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.2);

      &::after {
        content: '✓';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        background: rgb(var(--v-theme-primary));
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        z-index: 3;
        animation: checkmark 0.3s ease;
      }
    }
  }

  @keyframes checkmark {
    0% {
      transform: scale(0) rotate(-45deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(0deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  .selection-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 4px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      background-color: white;
    }
  }

  .image-content {
    position: relative;
    transition: transform 0.3s ease;

    &:hover .image-overlay {
      opacity: 1;
    }
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.9) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px;
    backdrop-filter: blur(2px);
  }

  .quick-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    animation: fadeInDown 0.3s ease;

    .v-btn {
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.15) translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      &:active {
        transform: scale(1.05);
      }
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .image-info {
    text-align: center;
    color: white;
    animation: fadeInUp 0.3s ease;

    .image-name {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 4px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
      letter-spacing: 0.3px;
    }

    .image-details {
      font-size: 0.75rem;
      opacity: 0.95;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.preview-card {
  .preview-content {
    height: calc(100vh - 64px);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%);
  }

  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    cursor: pointer;
    transition: transform 0.3s ease;
    animation: zoomIn 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .preview-info {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 10;
    animation: slideInLeft 0.3s ease;

    .v-chip {
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

// 响应式调整
@media (max-width: 600px) {
  .image-preview {
    .image-card {
      &:hover {
        transform: translateY(-2px) scale(1.01);
      }
    }

    .image-overlay {
      padding: 12px;
    }

    .quick-actions {
      gap: 8px;

      .v-btn {
        min-width: auto;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .image-info {
      .image-name {
        font-size: 0.8rem;
      }

      .image-details {
        font-size: 0.7rem;
      }
    }
  }

  .preview-card {
    .preview-info {
      bottom: 10px;
      left: 10px;
    }
  }
}
</style>
