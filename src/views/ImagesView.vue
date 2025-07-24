<template>
  <v-container>
    <!-- 页面标题 -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">图片管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ search.repository }}</p>
      </div>
      <v-spacer />
      <!-- 统计信息按钮 -->
      <v-btn variant="outlined" prepend-icon="mdi-chart-box" @click="showStats = !showStats">
        {{ showStats ? '隐藏统计' : '显示统计' }}
      </v-btn>
    </div>

    <!-- README 显示 -->
    <MarkdownCard
      v-if="readmeText"
      :content="readmeText"
      :title="readmeFileName"
      :show-edit="islogin"
      :edit-url="editHref"
      :file-info="readmeFileInfo"
      show-copy
      show-fullscreen
      elevated
    />

    <!-- 统计信息 -->
    <v-slide-y-transition>
      <ImageStatistics v-if="showStats" :images="imageData" class="mb-6" />
    </v-slide-y-transition>

    <!-- 统一图片管理器 -->
    <UnifiedImageManager
      :current-path="search.directory"
      :folders="folderItems"
      :images="imageItems"
      :loading="!fileLoaded"
      :username="search.name"
      :repository="search.repository"
      :can-delete="islogin"
      :get-cdn-url-items="getCdnUrlItems"
      @navigate="navigateToPath"
      @refresh="loadContent"
      @delete="delFile"
      @folder-selected="selectFolder"
    />
  </v-container>
</template>

<script setup lang="ts">
import ImageStatistics from '@/components/ImageStatistics.vue'
import MarkdownCard from '@/components/MarkdownCard.vue'
import UnifiedImageManager from '@/components/UnifiedImageManager.vue'
import { deleteFile } from '@/plugins/axios/file'
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
const fileLoaded = ref(false)
const files = ref<RepoPathContent[]>([])
const readmeText = ref('')
const readmeFileName = ref('')
const showStats = ref(false)

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

const folderItems = computed(() => {
  return files.value.filter((file: any) => file.type === 'dir')
})

const imageItems = computed(() => {
  return files.value.filter((file: any) => file.type === 'file')
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

// 加载内容
const loadContent = async () => {
  try {
    fileLoaded.value = false
    const data = await repoPathContent(search.name, search.repository, search.directory)

    // 过滤图片文件
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'avif']
    files.value = data.filter((val: any) => val.type === 'dir' || imageExtensions.some(ext => val.name.toLowerCase().endsWith(`.${ext}`)))

    // 加载 README
    const readmeItem = data.find((val: any) => val.name.toLowerCase().endsWith('.md') && val.path === `${search.directory}/${val.name}`)

    if (readmeItem) {
      try {
        readmeFileName.value = readmeItem.name
        const readmeUrl = getCdnUrlItems.value(search.name, search.repository, search.directory, readmeItem.name)[0].text
        const response = await fetch(readmeUrl)
        readmeText.value = response.ok ? await response.text() : ''
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
  } finally {
    fileLoaded.value = true
  }
}

// 导航方法
const navigateToPath = (path: string) => {
  search.directory = path
  loadContent()
}

const selectFolder = (folder: any) => {
  console.log('选择文件夹:', folder.name)
}

// 删除文件
const delFile = async (item: any) => {
  try {
    await deleteFile(search.name, search.repository, item.path, item.name, item.sha)
    files.value.splice(files.value.indexOf(item), 1)
    showMessage('删除成功', { color: 'success' })
  } catch (error) {
    console.error('删除失败:', error)
    showMessage('删除失败', { color: 'error' })
  }
}
</script>

<style scoped lang="scss">
// 页面样式
.v-container {
  max-width: 1400px;
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
@media (max-width: 600px) {
  .v-container {
    padding: 16px 12px;
  }
}
</style>
