<template>
  <v-container fluid class="pa-4">
    <!-- 页面标题 -->
    <v-card class="mb-6" elevation="2">
      <v-card-text class="d-flex align-center pa-6">
        <v-avatar color="primary" size="48" class="me-4">
          <v-icon icon="mdi-folder-search" size="28" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">文件夹功能测试</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">测试文件夹浏览和全局搜索功能</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- 配置区域 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="bg-surface-variant">
        <v-icon icon="mdi-cog" class="me-2" />
        测试配置
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="testConfig.username"
              label="GitHub 用户名"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account"
              hint="输入 GitHub 用户名"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="testConfig.repository"
              label="仓库名"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-source-repository"
              hint="输入仓库名称"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="testConfig.currentPath"
              label="当前路径"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-folder"
              hint="当前浏览路径"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 功能切换 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="bg-surface-variant">
        <v-icon icon="mdi-view-module" class="me-2" />
        功能选择
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-btn-toggle v-model="activeTab" variant="outlined" density="comfortable" mandatory color="primary" divided>
          <v-btn value="browser" prepend-icon="mdi-folder-open" size="large"> 文件夹浏览 </v-btn>
          <v-btn value="search" prepend-icon="mdi-magnify" size="large"> 全局搜索 </v-btn>
        </v-btn-toggle>
        <v-alert v-if="activeTab === 'browser'" type="info" variant="tonal" class="mt-4">
          <v-icon icon="mdi-information" class="me-2" />
          文件夹浏览模式：可以浏览目录结构，查看文件夹和图片
        </v-alert>
        <v-alert v-else type="info" variant="tonal" class="mt-4">
          <v-icon icon="mdi-information" class="me-2" />
          全局搜索模式：可以在整个仓库中搜索图片
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 功能展示区域 -->
    <v-card elevation="2" class="mb-6">
      <v-card-title class="bg-surface-variant">
        <v-icon :icon="activeTab === 'browser' ? 'mdi-folder-open' : 'mdi-magnify'" class="me-2" />
        {{ activeTab === 'browser' ? '文件夹浏览' : '全局搜索' }}
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
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
      </v-card-text>
    </v-card>

    <!-- 操作日志 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center bg-surface-variant">
        <v-icon icon="mdi-history" class="me-2" />
        操作日志
        <v-spacer />
        <v-chip size="small" variant="flat" color="primary">{{ logs.length }} 条记录</v-chip>
        <v-btn variant="text" size="small" prepend-icon="mdi-delete" @click="logs = []" class="ml-2"> 清空 </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-alert v-if="logs.length === 0" type="info" variant="tonal" class="text-center">
          <v-icon icon="mdi-information-outline" class="me-2" />
          暂无操作记录，开始测试功能后将显示操作日志
        </v-alert>
        <v-timeline v-else density="compact" class="log-timeline">
          <v-timeline-item v-for="(log, index) in logs.slice().reverse()" :key="index" size="small" :dot-color="getLogColor(log.type)">
            <template #icon>
              <v-icon :icon="getLogIcon(log.type)" size="x-small" />
            </template>
            <v-card variant="tonal" :color="getLogColor(log.type)">
              <v-card-text class="py-2">
                <div class="font-weight-medium">{{ log.action }}</div>
                <div class="text-caption text-medium-emphasis">{{ log.details }}</div>
                <div class="text-caption text-medium-emphasis mt-1">
                  <v-icon icon="mdi-clock-outline" size="x-small" class="me-1" />
                  {{ formatTime(log.timestamp) }}
                </div>
              </v-card-text>
            </v-card>
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
.log-timeline {
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(128, 128, 128, 0.5);
    }
  }
}
</style>
