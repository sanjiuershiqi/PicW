<template>
  <v-container>
    <h1 class="text-h4 mb-6">文件夹浏览和搜索测试</h1>

    <!-- 配置区域 -->
    <v-card class="mb-6">
      <v-card-title>测试配置</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="testConfig.username" label="GitHub 用户名" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="testConfig.repository" label="仓库名" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="testConfig.currentPath" label="当前路径" variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 功能切换 -->
    <v-card class="mb-6">
      <v-card-title>功能测试</v-card-title>
      <v-card-text>
        <v-btn-toggle v-model="activeTab" variant="outlined" density="comfortable" mandatory>
          <v-btn value="browser" prepend-icon="mdi-folder-open"> 文件夹浏览 </v-btn>
          <v-btn value="search" prepend-icon="mdi-magnify"> 全局搜索 </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>

    <!-- 文件夹浏览测试 -->
    <template v-if="activeTab === 'browser'">
      <FolderBrowser
        :current-path="testConfig.currentPath"
        :folders="mockFolders"
        :images="mockImages"
        :loading="loading"
        :username="testConfig.username"
        :repository="testConfig.repository"
        @navigate="handleNavigate"
        @folder-selected="handleFolderSelected"
        @refresh="handleRefresh"
      />
    </template>

    <!-- 全局搜索测试 -->
    <template v-if="activeTab === 'search'">
      <GlobalImageSearch
        :username="testConfig.username"
        :repository="testConfig.repository"
        @navigate-to-folder="handleNavigate"
        @image-selected="handleImageSelected"
        @preview-image="handlePreviewImage"
      />
    </template>

    <!-- 操作日志 -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        操作日志
        <v-spacer />
        <v-btn variant="text" size="small" prepend-icon="mdi-delete" @click="logs = []"> 清空 </v-btn>
      </v-card-title>
      <v-card-text>
        <div v-if="logs.length === 0" class="text-center py-4 text-medium-emphasis">暂无操作记录</div>
        <v-timeline v-else density="compact">
          <v-timeline-item v-for="(log, index) in logs.slice().reverse()" :key="index" size="small" :dot-color="getLogColor(log.type)">
            <div class="d-flex align-center">
              <v-icon :icon="getLogIcon(log.type)" size="small" class="me-2" />
              <div>
                <div class="font-weight-medium">{{ log.action }}</div>
                <div class="text-caption text-medium-emphasis">{{ log.details }} - {{ formatTime(log.timestamp) }}</div>
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import FolderBrowser from '@/components/FolderBrowser.vue'
import GlobalImageSearch from '@/components/GlobalImageSearch.vue'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { reactive, ref } from 'vue'

const { showMessage } = useSnackBarStore()

// 测试配置
const testConfig = reactive({
  username: 'test-user',
  repository: 'test-repo',
  currentPath: '/'
})

// 状态
const activeTab = ref('browser')
const loading = ref(false)
const logs = ref<
  Array<{
    type: 'navigate' | 'select' | 'search' | 'refresh'
    action: string
    details: string
    timestamp: Date
  }>
>([])

// 模拟数据
const mockFolders = ref([
  {
    name: 'images',
    path: '/images',
    type: 'dir' as const,
    sha: 'folder1'
  },
  {
    name: 'photos',
    path: '/photos',
    type: 'dir' as const,
    sha: 'folder2'
  },
  {
    name: 'screenshots',
    path: '/screenshots',
    type: 'dir' as const,
    sha: 'folder3'
  }
])

const mockImages = ref([
  {
    name: 'avatar.jpg',
    path: '/avatar.jpg',
    type: 'file' as const,
    sha: 'image1',
    size: 1024 * 200
  },
  {
    name: 'logo.png',
    path: '/logo.png',
    type: 'file' as const,
    sha: 'image2',
    size: 1024 * 50
  },
  {
    name: 'banner.gif',
    path: '/banner.gif',
    type: 'file' as const,
    sha: 'image3',
    size: 1024 * 800
  }
])

// 事件处理
const handleNavigate = (path: string) => {
  testConfig.currentPath = path
  addLog('navigate', '导航到文件夹', `路径: ${path}`)
  showMessage(`导航到: ${path}`, { color: 'info' })
}

const handleFolderSelected = (folder: any) => {
  addLog('select', '选择文件夹', `文件夹: ${folder.name}`)
  showMessage(`选择文件夹: ${folder.name}`, { color: 'success' })
}

const handleRefresh = () => {
  loading.value = true
  addLog('refresh', '刷新内容', `路径: ${testConfig.currentPath}`)

  // 模拟刷新延迟
  setTimeout(() => {
    loading.value = false
    showMessage('内容已刷新', { color: 'success' })
  }, 1000)
}

const handleImageSelected = (result: any) => {
  addLog('select', '选择搜索结果', `图片: ${result.name}`)
  showMessage(`选择图片: ${result.name}`, { color: 'success' })
}

const handlePreviewImage = (result: any) => {
  addLog('select', '预览图片', `图片: ${result.name}`)
  showMessage(`预览图片: ${result.name}`, { color: 'info' })
}

// 工具方法
const addLog = (type: string, action: string, details: string) => {
  logs.value.push({
    type: type as any,
    action,
    details,
    timestamp: new Date()
  })
}

const getLogColor = (type: string) => {
  switch (type) {
    case 'navigate':
      return 'primary'
    case 'select':
      return 'success'
    case 'search':
      return 'info'
    case 'refresh':
      return 'warning'
    default:
      return 'grey'
  }
}

const getLogIcon = (type: string) => {
  switch (type) {
    case 'navigate':
      return 'mdi-folder-open'
    case 'select':
      return 'mdi-cursor-default-click'
    case 'search':
      return 'mdi-magnify'
    case 'refresh':
      return 'mdi-refresh'
    default:
      return 'mdi-information'
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN')
}
</script>

<style scoped lang="scss">
.v-timeline {
  max-height: 300px;
  overflow-y: auto;
}
</style>
