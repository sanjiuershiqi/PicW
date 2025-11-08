<template>
  <v-container fluid class="unified-image-manager">
    <!-- 工具栏 -->
    <Toolbar
      :breadcrumb-items="breadcrumbItems"
      :can-go-back="canGoBack"
      v-model:view-mode="viewMode"
      v-model:sort-by="sortBy"
      v-model:file-type-filter="fileTypeFilter"
      :sort-options="sortOptions"
      :file-type-options="fileTypeOptions"
      :show-images-only="showImagesOnly"
      @update:show-images-only="showImagesOnly = $event"
      @navigate="navigateToPath"
      @go-back="goBack"
      @advanced-search="showAdvancedSearch = true"
      @refresh="loadContent"
    />

    <!-- 搜索栏 -->
    <SearchBar
      v-model:search-query="searchQuery"
      :is-searching="isSearching"
      :result-count="searchResults.length > 0 ? searchResults.length : null"
      class="my-4"
    />

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- 空状态 -->
    <EmptyState
      v-if="!loading && displayImages.length === 0 && folders.length === 0"
      :title="isSearching ? '未找到匹配的图片' : '此文件夹为空'"
      :subtitle="isSearching ? '尝试使用不同的搜索词' : '上传一些图片开始使用'"
      icon="mdi-image-off"
    />

    <!-- 内容区域 -->
    <div v-else>
      <!-- 文件夹网格/列表 -->
      <FolderGrid
        v-if="!isSearching && folders.length > 0"
        :folders="folders"
        :view-mode="viewMode"
        @navigate="navigateToPath"
        class="mb-4"
      />

      <!-- 图片网格/列表 -->
      <ImageGrid
        v-if="displayImages.length > 0"
        :images="displayImages"
        :selected-images="selectedImages"
        :view-mode="viewMode"
        @select="handleImageSelect"
        @preview="openPreview"
      />
    </div>

    <!-- 批量操作栏 -->
    <BatchActionsBar
      :selected-count="selectedImages.length"
      @copy-links="handleCopyLinks"
      @batch-download="handleBatchDownload"
      @batch-delete="handleBatchDelete"
      @clear-selection="clearSelection"
    />

    <!-- 图片预览灯箱 -->
    <ImageLightbox
      v-model="showLightbox"
      :images="lightboxImages"
      :current-index="currentImageIndex"
      @update:current-index="currentImageIndex = $event"
    />

    <!-- 批量下载进度对话框 -->
    <v-dialog v-model="downloadProgress.show" persistent max-width="500">
      <v-card>
        <v-card-title>批量下载进度</v-card-title>
        <v-card-text>
          <div class="mb-2">正在下载: {{ downloadProgress.currentFile }}</div>
          <v-progress-linear :model-value="(downloadProgress.current / downloadProgress.total) * 100" height="20" color="primary">
            <template #default>
              <strong>{{ downloadProgress.current }} / {{ downloadProgress.total }}</strong>
            </template>
          </v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 高级搜索对话框 -->
    <AdvancedSearchDialog v-model="showAdvancedSearch" :searching="advancedSearching" @search="performAdvancedSearch" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/plugins/stores/user'
import { useCodeStore } from '@/plugins/stores/code'
import { useAdvancedSearchStore } from '@/plugins/stores/advancedSearch'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { repoPathContent } from '@/plugins/axios/repo'
import { advancedSearch } from '@/plugins/axios/advancedSearch'
import { handleApiError } from '@/libs/errorHandler'
import { batchDownload } from '@/libs/batchDownload'
import { storeToRefs } from 'pinia'

// 组件导入
import Toolbar from './components/Toolbar.vue'
import SearchBar from './components/SearchBar.vue'
import FolderGrid from './components/FolderGrid.vue'
import ImageGrid from './components/ImageGrid.vue'
import BatchActionsBar from './components/BatchActionsBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'

// Composables 导入
import { useNavigation } from './composables/useNavigation'
import { useSelection } from './composables/useSelection'
import { useSearch } from './composables/useSearch'
import { useFilters } from './composables/useFilters'
import { useImageOperations } from './composables/useImageOperations'

// 类型导入
import type { ImageItem, FolderItem, DownloadProgress } from './types'

// Props
interface Props {
  initialPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: ''
})

// Emits
const emit = defineEmits<{
  (e: 'path-change', path: string): void
}>()

// 路由和状态
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const advancedSearchStore = useAdvancedSearchStore()
const { showMessage } = useSnackBarStore()
const { getCdnUrlItems } = storeToRefs(useCodeStore())

// 数据状态
const loading = ref(false)
const images = ref<ImageItem[]>([])
const folders = ref<FolderItem[]>([])
const currentPath = ref(props.initialPath || '')
const showImagesOnly = ref(true) // 默认仅显示图片
const showAdvancedSearch = ref(false)
const advancedSearching = ref(false)
const advancedSearchResults = ref<ImageItem[]>([])
const isAdvancedSearchActive = ref(false)

// 导航到路径的处理函数
const handleNavigate = (path: string) => {
  currentPath.value = path
  // 通知父组件路径变化
  emit('path-change', path)
}

// 导航 Composable
const { breadcrumbItems, canGoBack, navigateToPath, goBack } = useNavigation(currentPath, handleNavigate)

// 选择 Composable
const { selectedItems: selectedImages, toggleSelection, selectAll, deselectAll: clearSelection, isSelected } = useSelection()

// 处理图片选择
const handleImageSelect = (image: ImageItem) => {
  const selected = isSelected(image.sha)
  toggleSelection(image.sha, !selected)
}

// 搜索 Composable
const { searchQuery, isSearching, searchResults, performSearch } = useSearch(userStore.name, userStore.repository, [], 'name-asc')

// 筛选 Composable - 使用计算属性来动态选择数据源
const searchDataSource = computed(() => {
  return isAdvancedSearchActive.value ? advancedSearchResults.value : searchResults.value
})

const isAnySearchActive = computed(() => {
  return isSearching.value || isAdvancedSearchActive.value
})

const { viewMode, sortBy, fileTypeFilter, sortOptions, fileTypeOptions, displayImages } = useFilters(
  images,
  searchDataSource,
  isAnySearchActive
)

// 图片操作状态
const showLightbox = ref(false)
const currentImageIndex = ref(0)
const downloadProgress = ref<DownloadProgress>({
  show: false,
  current: 0,
  total: 0,
  currentFile: ''
})

// 图片 URL 缓存
const imageUrlCache = new Map<string, string>()

// 获取 CDN URL
const getCdnUrl = (image: ImageItem): string => {
  try {
    const directory = image.path.substring(0, image.path.lastIndexOf('/')) || '/'
    const cdnUrls = getCdnUrlItems.value(userStore.name, userStore.repository, directory, image.name)

    if (cdnUrls && cdnUrls.length > 0 && cdnUrls[0].text) {
      return cdnUrls[0].text
    }
  } catch (error) {
    console.error('生成 CDN URL 失败:', error)
  }

  return `https://cdn.jsdelivr.net/gh/${userStore.name}/${userStore.repository}@master/${image.path}`
}

// 获取 GitHub raw URL
const getGithubRawUrl = (image: ImageItem): string => {
  return `https://raw.githubusercontent.com/${userStore.name}/${userStore.repository}/master/${image.path}`
}

// 获取图片 URL（优先 CDN，缓存备用 URL）
const getImageUrl = (image: ImageItem): string => {
  const cachedUrl = imageUrlCache.get(image.sha)
  if (cachedUrl) {
    return cachedUrl
  }
  return getCdnUrl(image)
}

// 灯箱图片数据（带 url 属性）
const lightboxImages = computed(() => {
  return displayImages.value.map(image => ({
    ...image,
    url: getImageUrl(image)
  }))
})

// 打开预览
const openPreview = (image: ImageItem) => {
  const index = displayImages.value.findIndex(img => img.sha === image.sha)
  if (index !== -1) {
    currentImageIndex.value = index
    showLightbox.value = true
  }
}

// 判断是否为图片文件
const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

// 加载内容
const loadContent = async () => {
  loading.value = true
  try {
    const contents = await repoPathContent(userStore.name, userStore.repository, currentPath.value)

    // 分离文件夹和图片
    folders.value = contents.filter((item: any) => item.type === 'dir')

    // 过滤文件：如果开启"仅显示图片"，则只显示图片格式
    const files = contents.filter((item: any) => item.type === 'file')
    const filteredFiles = showImagesOnly.value ? files.filter((item: any) => isImageFile(item.name)) : files

    images.value = filteredFiles.map((item: any) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      size: item.size,
      type: item.type,
      directory: currentPath.value
    }))
  } catch (error) {
    handleApiError(error, { customMessage: '加载内容失败' })
  } finally {
    loading.value = false
  }
}

// 批量下载处理
const handleBatchDownload = async () => {
  const selectedImageItems = displayImages.value.filter(img => selectedImages.value.includes(img.sha))

  downloadProgress.value.show = true
  downloadProgress.value.total = selectedImageItems.length
  downloadProgress.value.current = 0

  try {
    const downloadItems = selectedImageItems.map(img => ({
      url: getImageUrl(img),
      filename: img.name
    }))

    await batchDownload(downloadItems, `${userStore.repository}-images-${Date.now()}.zip`, progress => {
      downloadProgress.value.current = progress.current
      downloadProgress.value.currentFile = progress.currentFile
    })
  } catch (error) {
    handleApiError(error, { customMessage: '批量下载失败' })
  } finally {
    downloadProgress.value.show = false
    clearSelection()
  }
}

// 复制链接处理
const handleCopyLinks = async () => {
  const selectedImageItems = displayImages.value.filter(img => selectedImages.value.includes(img.sha))

  if (selectedImageItems.length === 0) {
    return
  }

  const links = selectedImageItems.map(img => getImageUrl(img)).join('\n')

  try {
    await navigator.clipboard.writeText(links)
    // 这里需要显示成功消息，但我们没有导入 snackbar store
    console.log(`已复制 ${selectedImageItems.length} 个链接`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 批量删除处理
const handleBatchDelete = async () => {
  // TODO: 实现批量删除逻辑
  console.log('批量删除:', selectedImages.value)
}

// 执行高级搜索
const performAdvancedSearch = async () => {
  advancedSearching.value = true
  try {
    const { filters } = advancedSearchStore

    // 执行高级搜索
    const results = await advancedSearch(userStore.name, userStore.repository, filters)

    advancedSearchResults.value = results
    isAdvancedSearchActive.value = true

    // 添加到搜索历史
    advancedSearchStore.addToHistory(results.length)

    // 关闭对话框
    showAdvancedSearch.value = false

    // 显示结果消息
    showMessage(`找到 ${results.length} 个匹配的图片`, {
      color: results.length > 0 ? 'success' : 'info'
    })
  } catch (error) {
    handleApiError(error, { customMessage: '高级搜索失败' })
    advancedSearchResults.value = []
  } finally {
    advancedSearching.value = false
  }
}

// 清除高级搜索结果
const clearAdvancedSearch = () => {
  isAdvancedSearchActive.value = false
  advancedSearchResults.value = []
  advancedSearchStore.resetFilters()
}

// 监听 initialPath prop 变化
watch(
  () => props.initialPath,
  newPath => {
    if (newPath !== undefined && newPath !== currentPath.value) {
      currentPath.value = newPath || ''
      loadContent()
    }
  },
  { immediate: false }
)

// 监听路径变化
watch(currentPath, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    loadContent()
    // 清除选择
    clearSelection()
  }
})

// 监听搜索查询
watch(searchQuery, () => {
  performSearch()
})

// 监听"仅显示图片"开关
watch(showImagesOnly, () => {
  loadContent()
})

// 监听路径变化时清除高级搜索
watch(currentPath, () => {
  if (isAdvancedSearchActive.value) {
    clearAdvancedSearch()
  }
})

// 初始加载
onMounted(() => {
  loadContent()
})
</script>

<style scoped>
.unified-image-manager {
  padding-bottom: 80px; /* 为批量操作栏留出空间 */
}
</style>
