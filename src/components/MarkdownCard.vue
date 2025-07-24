<template>
  <v-slide-y-transition>
    <v-card v-if="content" variant="flat" class="markdown-card mb-6" :class="{ 'markdown-card--elevated': elevated }">
      <!-- 卡片标题 -->
      <v-card-title v-if="showTitle" class="d-flex align-center">
        <v-icon :icon="titleIcon" class="me-2" />
        {{ title }}
        <v-spacer />

        <!-- 操作按钮 -->
        <div class="card-actions">
          <v-btn
            v-if="showEdit && editUrl"
            icon="mdi-circle-edit-outline"
            variant="text"
            size="small"
            :href="editUrl"
            target="_blank"
            title="编辑文件"
          />
          <v-btn v-if="showCopy" icon="mdi-content-copy" variant="text" size="small" @click="copyContent" title="复制内容" />
          <v-btn v-if="showFullscreen" icon="mdi-fullscreen" variant="text" size="small" @click="toggleFullscreen" title="全屏查看" />
          <v-btn
            v-if="collapsible"
            :icon="isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            variant="text"
            size="small"
            @click="toggleCollapse"
            :title="isCollapsed ? '展开' : '收起'"
          />
        </div>
      </v-card-title>

      <!-- Markdown 内容 -->
      <v-expand-transition>
        <v-card-text v-show="!isCollapsed" class="markdown-content" :class="contentClass">
          <VueShowdown :markdown="content" :flavor="flavor" :options="showdownOptions" class="markdown-body" />
        </v-card-text>
      </v-expand-transition>

      <!-- 文件信息 -->
      <v-card-actions v-if="showInfo && fileInfo" class="file-info">
        <v-chip size="small" variant="tonal" prepend-icon="mdi-file-document">
          {{ fileInfo.name }}
        </v-chip>
        <v-chip v-if="fileInfo.size" size="small" variant="tonal" prepend-icon="mdi-file-outline">
          {{ formatFileSize(fileInfo.size) }}
        </v-chip>
        <v-chip v-if="fileInfo.lastModified" size="small" variant="tonal" prepend-icon="mdi-clock-outline">
          {{ formatDate(fileInfo.lastModified) }}
        </v-chip>
        <v-spacer />
        <v-chip size="small" variant="outlined"> Markdown </v-chip>
      </v-card-actions>
    </v-card>
  </v-slide-y-transition>

  <!-- 全屏预览对话框 -->
  <v-dialog v-model="fullscreenDialog" fullscreen transition="scale-transition" class="markdown-fullscreen">
    <v-card>
      <!-- 全屏工具栏 -->
      <v-app-bar color="primary" density="compact">
        <v-app-bar-title>
          <v-icon icon="mdi-file-document" class="me-2" />
          {{ title || '文档预览' }}
        </v-app-bar-title>
        <v-spacer />

        <v-btn icon="mdi-content-copy" variant="text" @click="copyContent" title="复制内容" />
        <v-btn v-if="editUrl" icon="mdi-circle-edit-outline" variant="text" :href="editUrl" target="_blank" title="编辑文件" />
        <v-btn icon="mdi-close" variant="text" @click="fullscreenDialog = false" title="关闭" />
      </v-app-bar>

      <!-- 全屏内容 -->
      <v-card-text class="fullscreen-content">
        <div class="markdown-container">
          <VueShowdown :markdown="content" :flavor="flavor" :options="showdownOptions" class="markdown-body markdown-body--fullscreen" />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import filesize from '@/libs/filesize'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { computed, ref } from 'vue'

interface FileInfo {
  name: string
  size?: number
  lastModified?: Date
}

interface Props {
  content: string
  title?: string
  titleIcon?: string
  elevated?: boolean
  showTitle?: boolean
  showEdit?: boolean
  showCopy?: boolean
  showFullscreen?: boolean
  showInfo?: boolean
  collapsible?: boolean
  editUrl?: string
  fileInfo?: FileInfo
  flavor?: string
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'README.md',
  titleIcon: 'mdi-file-document-outline',
  elevated: false,
  showTitle: false,
  showEdit: true,
  showCopy: true,
  showFullscreen: true,
  showInfo: false,
  collapsible: false,
  flavor: 'github'
})

const emit = defineEmits<{
  copy: [content: string]
  fullscreen: [isFullscreen: boolean]
  collapse: [isCollapsed: boolean]
}>()

const { showMessage } = useSnackBarStore()

// 状态
const isCollapsed = ref(false)
const fullscreenDialog = ref(false)

// Showdown 配置
const showdownOptions = computed(() => ({
  emoji: true,
  tables: true,
  strikethrough: true,
  tasklists: true,
  ghCodeBlocks: true,
  smoothLivePreview: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true
}))

// 方法
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    showMessage('内容已复制到剪贴板', { color: 'success' })
    emit('copy', props.content)
  } catch (error) {
    showMessage('复制失败', { color: 'error' })
  }
}

const toggleFullscreen = () => {
  fullscreenDialog.value = !fullscreenDialog.value
  emit('fullscreen', fullscreenDialog.value)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('collapse', isCollapsed.value)
}

const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
.markdown-card {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &--elevated {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .file-info {
    background-color: rgba(var(--v-theme-surface-variant), 0.1);
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

// Markdown 内容样式
:deep(.markdown-content) {
  .markdown-body {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    line-height: 1.6;
    color: rgb(var(--v-theme-on-surface));

    * {
      line-height: 1.5em;
    }

    *:not(:first-child) {
      margin-top: 0.5em;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;

      &:first-child {
        margin-top: 0;
      }
    }

    h1 {
      font-size: 2em;
    }
    h2 {
      font-size: 1.5em;
    }
    h3 {
      font-size: 1.25em;
    }
    h4 {
      font-size: 1.1em;
    }

    p {
      margin-bottom: 1em;
    }

    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(var(--v-theme-surface-variant), 0.5);
      border-radius: 6px;
      user-select: all;
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    }

    pre {
      padding: 1em;
      background-color: rgba(var(--v-theme-surface-variant), 0.3);
      border-radius: 8px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
        font-size: 0.9em;
      }
    }

    blockquote {
      margin: 1em 0;
      padding: 0 1em;
      border-left: 4px solid rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.1);
      border-radius: 0 4px 4px 0;
    }

    ul,
    ol {
      padding-left: 2em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.25em;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;

      th,
      td {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        padding: 0.5em 1em;
        text-align: left;
      }

      th {
        background-color: rgba(var(--v-theme-surface-variant), 0.3);
        font-weight: 600;
      }
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 0.5em 0;
    }

    a {
      color: rgb(var(--v-theme-primary));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    hr {
      border: none;
      border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      margin: 2em 0;
    }

    &--fullscreen {
      max-width: 1200px;
      margin: 0 auto;
      font-size: 1.1em;
    }
  }
}

.fullscreen-content {
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 2em;

  .markdown-container {
    max-width: 1200px;
    margin: 0 auto;
  }
}

// 响应式调整
@media (max-width: 600px) {
  .markdown-card {
    .card-actions {
      gap: 2px;
    }
  }

  :deep(.markdown-content) {
    .markdown-body {
      font-size: 0.9em;

      pre {
        padding: 0.5em;
        font-size: 0.8em;
      }

      table {
        font-size: 0.8em;

        th,
        td {
          padding: 0.25em 0.5em;
        }
      }
    }
  }

  .fullscreen-content {
    padding: 1em;
  }
}
</style>
