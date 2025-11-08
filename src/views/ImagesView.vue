<template>
  <v-container fluid class="images-view">
    <!-- 页面头部 -->
    <v-card variant="flat" class="header-card mb-6">
      <v-card-text class="d-flex align-center pa-4">
        <!-- 左侧：标题和仓库信息 -->
        <div class="d-flex align-center flex-grow-1">
          <v-avatar color="primary" size="48" class="me-4">
            <v-icon size="28">mdi-folder-multiple-image</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold mb-1">图片管理</h1>
            <div class="d-flex align-center text-body-2 text-medium-emphasis">
              <v-icon size="16" class="me-1">mdi-github</v-icon>
              <span>{{ search.name }} / {{ search.repository }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="d-flex align-center gap-2">
          <!-- 统计信息按钮 -->
          <v-btn
            :variant="showStats ? 'tonal' : 'outlined'"
            :color="showStats ? 'primary' : undefined"
            prepend-icon="mdi-chart-box"
            @click="showStats = !showStats"
          >
            {{ showStats ? '隐藏统计' : '显示统计' }}
          </v-btn>

          <!-- README 切换按钮 -->
          <v-btn
            v-if="readmeText"
            :variant="showReadme ? 'tonal' : 'outlined'"
            :color="showReadme ? 'primary' : undefined"
            prepend-icon="mdi-file-document"
            @click="showReadme = !showReadme"
          >
            {{ showReadme ? '隐藏 README' : '显示 README' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- README 显示 -->
    <v-expand-transition>
      <MarkdownCard
        v-if="readmeText && showReadme"
        :content="readmeText"
        :title="readmeFileName"
        :show-edit="islogin"
        :edit-url="editHref"
        :file-info="readmeFileInfo || undefined"
        show-copy
        show-fullscreen
        elevated
        class="mb-6"
      />
    </v-expand-transition>

    <!-- 统计信息 -->
    <v-expand-transition>
      <ImageStatistics v-if="showStats" :images="imageData" class="mb-6" />
    </v-expand-transition>

    <!-- 统一图片管理器（新版重构） -->
    <UnifiedImageManager :initial-path="search.directory" @path-change="handlePathChange" />
  </v-container>
</template>

<script setup lang="ts">
import ImageStatistics from '@/components/ImageStatistics.vue'
import MarkdownCard from '@/components/MarkdownCard.vue'
import UnifiedImageManager from '@/components/UnifiedImageManager/index.vue'
import { repoPathContent, type RepoPathContent } from '@/plugins/axios/repo'
import { useCodeStore } from '@/plugins/stores/code'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useUserStore } from '@/plugins/stores/user'
import { storeToRefs } from 'pinia'
import { computed, onActivated, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

// Store 状态
const { islogin } = storeToRefs(useUserStore())
const { getCdnUrlItems } = storeToRefs(useCodeStore())
const { showMessage } = useSnackBarStore()

// 搜索参数
const search = reactive({
  name: '',
  repository: '',
  directory: ''
})

// 状态管理
const files = ref<RepoPathContent[]>([])
const readmeText = ref('')
const readmeFileName = ref('')
const showStats = ref(false)
const showReadme = ref(true) // 默认显示 README

// 计算属性
const editHref = computed(
  () => `https://github.com/${search.name}/${search.repository}/edit/master/${search.directory}/${readmeFileName.value}`
)

const readmeFileInfo = computed(() => {
  if (!readmeFileName.value) {
    return null
  }

  const readmeFile = files.value.find((file: any) => file.name.toLowerCase() === readmeFileName.value.toLowerCase())
  return readmeFile
    ? {
        name: readmeFile.name,
        size: readmeFile.size,
        lastModified: new Date()
      }
    : {
        name: readmeFileName.value,
        size: readmeText.value.length,
        lastModified: new Date()
      }
})

const imageData = computed(() => {
  return files.value
    .filter((file: any) => file.type === 'file')
    .map((file: any) => ({
      id: file.sha,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      uploadedAt: new Date(),
      tags: []
    }))
})

// 页面初始化
onActivated(async () => {
  const { query } = useRoute()
  search.name = query.name as string
  search.repository = query.repository as string
  search.directory = query.directory as string

  await loadContent()
})

// 处理路径变化
const handlePathChange = async (newPath: string) => {
  search.directory = newPath
  await loadContent()
}

// 加载内容（仅用于 README 和统计）
const loadContent = async () => {
  try {
    const data = await repoPathContent(search.name, search.repository, search.directory)

    // 保存文件列表用于 README 和统计
    files.value = data

    // 加载 README
    const readmeItem = data.find((val: any) => val.name.toLowerCase().endsWith('.md') && val.type === 'file')

    if (readmeItem) {
      try {
        readmeFileName.value = readmeItem.name
        const cdnUrls = getCdnUrlItems.value(search.name, search.repository, search.directory, readmeItem.name)
        if (cdnUrls && cdnUrls.length > 0) {
          const readmeUrl = cdnUrls[0].text
          const response = await fetch(readmeUrl)
          readmeText.value = response.ok ? await response.text() : ''
        } else {
          readmeText.value = ''
        }
      } catch (error) {
        console.error('加载 README 失败:', error)
        readmeText.value = ''
        readmeFileName.value = ''
      }
    } else {
      readmeText.value = ''
      readmeFileName.value = ''
    }
  } catch (error) {
    console.error('加载内容失败:', error)
    showMessage('加载失败', { color: 'error' })
  }
}
</script>

<style scoped lang="scss">
.images-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.header-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8) 0%, rgba(var(--v-theme-surface), 1) 100%);
}

.gap-2 {
  gap: 8px;
}

// 动画效果
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.3s ease;
}

.list-item-enter-from,
.list-item-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 响应式调整
@media (max-width: 960px) {
  .images-view {
    padding: 16px;
  }

  .header-card {
    .d-flex {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 16px;
    }
  }
}

@media (max-width: 600px) {
  .images-view {
    padding: 12px;
  }

  .header-card {
    .v-avatar {
      display: none;
    }

    .v-btn {
      width: 100%;
    }
  }
}
</style>
