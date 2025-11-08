<template>
  <div class="unified-image-manager">
    <!-- 顶部工具栏 -->
    <v-card variant="flat" class="toolbar-card mb-4">
      <v-card-text class="pa-4">
        <!-- 面包屑导航和搜索 -->
        <div class="d-flex align-center mb-3">
          <!-- 面包屑导航 -->
          <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-1" divider="/">
            <template #item="{ item }">
              <v-breadcrumbs-item :disabled="item.disabled" @click="navigateToPath(item.path)" class="breadcrumb-item">
                {{ item.title }}
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>

          <!-- 搜索框 -->
          <v-text-field
            v-model="searchQuery"
            placeholder="搜索图片..."
            :prepend-inner-icon="searchLoading ? undefined : 'mdi-magnify'"
            variant="outlined"
            density="compact"
            style="max-width: 300px"
            hide-details
            clearable
            @input="onSearchInput"
          >
            <template v-if="searchLoading" #prepend-inner>
              <v-progress-circular indeterminate size="20" />
            </template>
          </v-text-field>
        </div>

        <!-- 快速操作栏 -->
        <div class="d-flex align-center">
          <!-- 导航按钮 -->
          <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" :disabled="!canGoBack" @click="goBack"> 返回上级 </v-btn>

          <v-btn variant="text" size="small" prepend-icon="mdi-home" @click="goToRoot"> 根目录 </v-btn>

          <v-btn variant="text" size="small" prepend-icon="mdi-refresh" @click="refreshContent"> 刷新 </v-btn>

          <v-spacer />

          <!-- 视图切换 -->
          <v-btn-toggle v-model="viewMode" variant="outlined" density="compact" mandatory>
            <v-btn value="grid" icon="mdi-view-grid" title="网格视图" />
            <v-btn value="list" icon="mdi-view-list" title="列表视图" />
          </v-btn-toggle>

          <!-- 筛选和排序 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn variant="text" icon="mdi-filter-variant" v-bind="props" title="筛选和排序" />
            </template>
            <v-card min-width="250">
              <v-card-text>
                <v-select v-model="sortBy" :items="sortOptions" label="排序方式" density="compact" variant="outlined" />
                <v-select
                  v-model="fileTypeFilter"
                  :items="fileTypeOptions"
                  label="文件类型"
                  density="compact"
                  variant="outlined"
                  multiple
                  chips
                />
              </v-card-text>
            </v-card>
          </v-menu>
        </div>

        <!-- 搜索结果提示 -->
        <v-alert v-if="isSearching && searchResults.length > 0" type="info" variant="tonal" class="mt-3" density="compact">
          找到 {{ searchResults.length }} 个搜索结果
          <template #append>
            <v-btn size="small" variant="text" @click="clearSearch"> 清除搜索 </v-btn>
          </template>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate size="48" />
        <p class="mt-4">加载中...</p>
      </div>

      <!-- 内容显示 -->
      <template v-else>
        <!-- 文件夹显示 -->
        <div v-if="!isSearching && displayFolders.length > 0" class="folders-section mb-6">
          <h4 class="text-subtitle-1 mb-3 d-flex align-center">
            <v-icon icon="mdi-folder" class="me-2" />
            文件夹 ({{ displayFolders.length }})
          </h4>
          <v-row>
            <v-col v-for="folder in displayFolders" :key="folder.path" cols="6" sm="4" md="3" lg="2">
              <v-card variant="tonal" class="folder-card" @click="navigateToFolder(folder)">
                <v-card-text class="text-center pa-4">
                  <v-icon icon="mdi-folder" size="48" color="primary" class="mb-2" />
                  <div class="text-subtitle-2 font-weight-medium text-truncate">
                    {{ folder.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">文件夹</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 图片显示 -->
        <div v-if="displayImages.length > 0" class="images-section">
          <h4 class="text-subtitle-1 mb-3 d-flex align-center">
            <v-icon icon="mdi-image-multiple" class="me-2" />
            {{ isSearching ? '搜索结果' : '图片' }} ({{ displayImages.length }})
          </h4>

          <!-- 网格视图 -->
          <v-row v-if="viewMode === 'grid'" class="image-grid">
            <v-col v-for="(image, index) in displayImages" :key="image.sha" cols="6" sm="4" md="3" lg="3" xl="2" class="image-col">
              <v-card
                class="image-card"
                :class="{ 'image-card--selected': selectedItems.includes(image.sha) }"
                elevation="2"
                @click="openImagePreview(image, index)"
              >
                <!-- 选择框 -->
                <v-checkbox
                  :model-value="selectedItems.includes(image.sha)"
                  @update:model-value="toggleSelection(image.sha, $event)"
                  @click.stop
                  class="selection-checkbox"
                  hide-details
                  density="compact"
                />

                <!-- 图片 -->
                <v-img
                  :src="getImageUrl(image)"
                  :alt="image.name"
                  height="200"
                  cover
                  class="image-content"
                  :lazy-src="getPlaceholderImage()"
                  loading="lazy"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-progress-circular indeterminate size="32" color="primary" />
                    </div>
                  </template>

                  <template #error>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-icon icon="mdi-image-broken" size="48" color="grey" />
                    </div>
                  </template>

                  <!-- 悬停操作层 -->
                  <div class="image-overlay">
                    <div class="overlay-actions">
                      <v-btn
                        :icon="isFavorite(image.sha) ? 'mdi-star' : 'mdi-star-outline'"
                        variant="elevated"
                        :color="isFavorite(image.sha) ? 'warning' : 'default'"
                        size="small"
                        @click.stop="toggleFavorite(image)"
                        :title="isFavorite(image.sha) ? '取消收藏' : '收藏'"
                      />
                      <v-btn
                        icon="mdi-eye"
                        variant="elevated"
                        color="primary"
                        size="small"
                        @click.stop="openImagePreview(image, index)"
                        title="预览"
                      />
                      <v-btn
                        icon="mdi-image-edit"
                        variant="elevated"
                        color="info"
                        size="small"
                        @click.stop="editImage(image)"
                        title="编辑"
                      />
                      <v-btn
                        icon="mdi-download"
                        variant="elevated"
                        color="success"
                        size="small"
                        @click.stop="downloadImage(image)"
                        title="下载"
                      />
                      <v-btn
                        v-if="canDelete"
                        icon="mdi-delete"
                        variant="elevated"
                        color="error"
                        size="small"
                        @click.stop="deleteImage(image, index)"
                        title="删除"
                      />
                    </div>
                  </div>
                </v-img>

                <!-- 图片信息 -->
                <v-card-text class="pa-3">
                  <div class="text-subtitle-2 text-truncate mb-1" :title="image.name">
                    {{ image.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">{{ formatFileSize(image.size) }} • {{ getFileType(image.name) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 列表视图 -->
          <v-card v-else-if="viewMode === 'list'">
            <v-list>
              <v-list-item v-for="(image, index) in displayImages" :key="image.sha" @click="openImagePreview(image, index)">
                <template #prepend>
                  <v-checkbox
                    :model-value="selectedItems.includes(image.sha)"
                    @update:model-value="toggleSelection(image.sha, $event)"
                    @click.stop
                    hide-details
                    density="compact"
                  />
                  <v-avatar size="48" class="me-3">
                    <v-img :src="getImageUrl(image)" :lazy-src="getPlaceholderImage()" loading="lazy" />
                  </v-avatar>
                </template>

                <v-list-item-title>{{ image.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(image.size) }} • {{ getFileType(image.name) }}
                  <span v-if="isSearching && image.directory" class="ml-2"> 📁 {{ image.directory }} </span>
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    :icon="isFavorite(image.sha) ? 'mdi-star' : 'mdi-star-outline'"
                    variant="text"
                    size="small"
                    :color="isFavorite(image.sha) ? 'warning' : 'default'"
                    @click.stop="toggleFavorite(image)"
                    :title="isFavorite(image.sha) ? '取消收藏' : '收藏'"
                  />
                  <v-btn icon="mdi-eye" variant="text" size="small" @click.stop="openImagePreview(image, index)" title="预览" />
                  <v-btn icon="mdi-image-edit" variant="text" size="small" @click.stop="editImage(image)" title="编辑" />
                  <v-btn icon="mdi-download" variant="text" size="small" @click.stop="downloadImage(image)" title="下载" />
                  <v-btn
                    v-if="canDelete"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click.stop="deleteImage(image, index)"
                    title="删除"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </div>

        <!-- 空状态 -->
        <div v-if="displayFolders.length === 0 && displayImages.length === 0" class="empty-state">
          <EmptyState
            :icon="isSearching ? 'mdi-magnify' : 'mdi-folder-open-outline'"
            :title="isSearching ? '未找到搜索结果' : '文件夹为空'"
            :description="isSearching ? '尝试使用不同的关键词搜索' : '当前文件夹中没有任何内容'"
            :show-action="false"
          />
        </div>
      </template>
    </div>

    <!-- 图片预览灯箱 -->
    <ImageLightbox
      v-model="showLightbox"
      :images="lightboxImages"
      :current-index="currentLightboxIndex"
      @update:current-index="currentLightboxIndex = $event"
    />

    <!-- 图片编辑器 -->
    <ImageEditor v-model="showEditor" :image-url="editingImageUrl" :image-name="editingImageName" @save="handleSaveEdit" />

    <!-- 下载进度对话框 -->
    <v-dialog v-model="downloadProgress.show" persistent max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-download" class="me-2" />
          正在下载图片
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            <v-progress-linear :model-value="(downloadProgress.current / downloadProgress.total) * 100" height="25" color="primary" rounded>
              <template #default>
                <strong>{{ downloadProgress.current }} / {{ downloadProgress.total }}</strong>
              </template>
            </v-progress-linear>
          </div>
          <div class="text-center text-caption text-medium-emphasis">
            <v-icon icon="mdi-file-image" size="small" class="me-1" />
            {{ downloadProgress.currentFile || '准备下载...' }}
          </div>
          <p class="mt-4 text-center text-body-2">请稍候，正在打包下载...</p>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 批量操作栏 -->
    <v-slide-y-reverse-transition>
      <v-card v-if="selectedItems.length > 0" variant="elevated" class="batch-actions-bar">
        <v-card-text class="d-flex align-center pa-4">
          <span class="text-subtitle-2"> 已选择 {{ selectedItems.length }} 个项目 </span>
          <v-spacer />
          <v-btn variant="text" @click="clearSelection">取消选择</v-btn>
          <v-btn variant="text" prepend-icon="mdi-download" @click="batchDownload">批量下载</v-btn>
          <v-btn v-if="canDelete" variant="text" color="error" prepend-icon="mdi-delete" @click="batchDelete"> 批量删除 </v-btn>
        </v-card-text>
      </v-card>
    </v-slide-y-reverse-transition>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import ImageEditor from '@/components/ImageEditor.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { batchDownload as performBatchDownload, type DownloadProgress } from '@/libs/batchDownload'
import { searchCache } from '@/libs/cacheManager'
import { handleFileError, handleApiError } from '@/libs/errorHandler'
import filesize from '@/libs/filesize'
import { searchInRepository } from '@/plugins/axios/search'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useFavoritesStore } from '@/plugins/stores/favorites'
import { computed, ref, watch } from 'vue'

interface ImageItem {
  name: string
  path: string
  sha: string
  size: number
  type: string
  directory?: string
}

interface FolderItem {
  name: string
  path: string
  type: string
}

interface Props {
  currentPath: string
  folders: FolderItem[]
  images: ImageItem[]
  loading?: boolean
  username: string
  repository: string
  canDelete?: boolean
  getCdnUrlItems?: (username: string, repository: string, directory: string, filename: string) => { text: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canDelete: false,
  getCdnUrlItems: undefined
})

const emit = defineEmits<{
  (e: 'navigate', path: string): void
  (e: 'refresh'): void
  (e: 'delete', image: ImageItem, index: number): void
  (e: 'folder-selected', folder: FolderItem): void
}>()

const { showMessage } = useSnackBarStore()
const favoritesStore = useFavoritesStore()

// 状态管理
const searchQuery = ref('')
const searchResults = ref<ImageItem[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('name-asc')
const fileTypeFilter = ref<string[]>([])
const selectedItems = ref<string[]>([])
const showLightbox = ref(false)
const currentLightboxIndex = ref(0)

// 编辑器状态
const showEditor = ref(false)
const editingImageUrl = ref('')
const editingImageName = ref('')

// 批量下载状态
const downloadProgress = ref<DownloadProgress & { show: boolean }>({
  show: false,
  current: 0,
  total: 0,
  currentFile: ''
})

// 搜索状态
const isSearching = computed(() => searchQuery.value.trim().length > 0)

// 排序选项
const sortOptions = [
  { title: '名称 A-Z', value: 'name-asc' },
  { title: '名称 Z-A', value: 'name-desc' },
  { title: '大小 小-大', value: 'size-asc' },
  { title: '大小 大-小', value: 'size-desc' }
]

// 文件类型选项
const fileTypeOptions = [
  { title: 'JPG', value: 'jpg' },
  { title: 'PNG', value: 'png' },
  { title: 'GIF', value: 'gif' },
  { title: 'WebP', value: 'webp' },
  { title: 'SVG', value: 'svg' }
]

// 面包屑导航
const breadcrumbItems = computed(() => {
  const parts = props.currentPath.split('/').filter(Boolean)
  const items = [{ title: '根目录', path: '/', disabled: false }]

  let currentPath = ''
  for (const part of parts) {
    currentPath += `/${part}`
    items.push({
      title: part,
      path: currentPath,
      disabled: false
    })
  }

  // 最后一项设为禁用
  if (items.length > 0) {
    items[items.length - 1].disabled = true
  }

  return items
})

// 是否可以返回上级
const canGoBack = computed(() => props.currentPath !== '/')

// 显示的文件夹和图片
const displayFolders = computed(() => {
  if (isSearching.value) {
    return []
  }
  return props.folders
})

const displayImages = computed(() => {
  let images = isSearching.value ? searchResults.value : props.images

  // 文件类型筛选
  if (fileTypeFilter.value.length > 0) {
    images = images.filter(image => {
      const ext = image.name.split('.').pop()?.toLowerCase()
      return ext && fileTypeFilter.value.includes(ext)
    })
  }

  // 排序
  images = [...images].sort((a, b) => {
    switch (sortBy.value) {
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'size-asc':
        return a.size - b.size
      case 'size-desc':
        return b.size - a.size
      default:
        return 0
    }
  })

  return images
})

// 灯箱图片数据
const lightboxImages = computed(() => {
  return displayImages.value.map(image => ({
    name: image.name,
    path: image.path,
    sha: image.sha,
    size: image.size,
    url: getImageUrl(image)
  }))
})

// 方法
const navigateToPath = (path: string) => {
  emit('navigate', path)
}

const navigateToFolder = (folder: FolderItem) => {
  const newPath = props.currentPath === '/' ? `/${folder.name}` : `${props.currentPath}/${folder.name}`
  emit('navigate', newPath)
  emit('folder-selected', folder)
}

const goBack = () => {
  const parts = props.currentPath.split('/').filter(Boolean)
  parts.pop()
  const newPath = parts.length > 0 ? `/${parts.join('/')}` : '/'
  emit('navigate', newPath)
}

const goToRoot = () => {
  emit('navigate', '/')
}

const refreshContent = () => {
  // 清除搜索缓存
  searchCache.clear()
  emit('refresh')
}

// 搜索功能
const searchLoading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  // 清除之前的搜索定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (searchQuery.value.trim()) {
    // 防抖搜索，500ms 后执行
    searchTimeout = setTimeout(() => {
      performSearch()
    }, 500)
  } else {
    searchResults.value = []
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    searchLoading.value = true
    const results = await searchInRepository(props.username, props.repository, searchQuery.value.trim(), {
      fileTypes: fileTypeFilter.value,
      sortBy: sortBy.value,
      maxResults: 100
    })

    // 转换搜索结果格式
    searchResults.value = results.map((result: any) => ({
      ...result,
      directory: result.path.substring(0, result.path.lastIndexOf('/')) || '/'
    }))

    showMessage(`找到 ${results.length} 个搜索结果`, { color: 'success' })
  } catch (error) {
    handleApiError(error, { customMessage: '搜索失败，请稍后重试' })
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// 图片操作
const getImageUrl = (image: ImageItem) => {
  if (props.getCdnUrlItems) {
    try {
      const directory = image.path.substring(0, image.path.lastIndexOf('/')) || '/'
      const filename = image.name
      const cdnUrls = props.getCdnUrlItems(props.username, props.repository, directory, filename)

      if (cdnUrls && cdnUrls.length > 0 && cdnUrls[0].text) {
        return cdnUrls[0].text
      }
    } catch (error) {
      console.error('生成CDN URL失败:', error)
    }
  }

  // 备用方案 - 确保总是返回有效URL
  return `https://cdn.jsdelivr.net/gh/${props.username}/${props.repository}@master${image.path}`
}

const openImagePreview = (image: ImageItem, index: number) => {
  currentLightboxIndex.value = index
  showLightbox.value = true
}

const downloadImage = async (image: ImageItem) => {
  try {
    const url = getImageUrl(image)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = image.name
    a.click()

    URL.revokeObjectURL(downloadUrl)
    showMessage('下载成功', { color: 'success' })
  } catch (error) {
    handleFileError(error, 'download')
  }
}

const deleteImage = (image: ImageItem, index: number) => {
  emit('delete', image, index)
}

// 编辑功能
const editImage = (image: ImageItem) => {
  editingImageUrl.value = getImageUrl(image)
  editingImageName.value = image.name
  showEditor.value = true
}

const handleSaveEdit = async (blob: Blob, filename: string) => {
  try {
    // 下载编辑后的图片
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    showMessage('图片已保存', { color: 'success' })
  } catch (error) {
    showMessage('保存失败', { color: 'error' })
    console.error('保存编辑失败:', error)
  }
}

// 收藏功能
const isFavorite = (sha: string) => {
  return favoritesStore.isFavorite(sha)
}

const toggleFavorite = (image: ImageItem) => {
  const favoriteItem = {
    sha: image.sha,
    name: image.name,
    path: image.path,
    url: getImageUrl(image),
    size: image.size,
    repository: props.repository,
    username: props.username
  }

  const added = favoritesStore.toggleFavorite(favoriteItem)
  showMessage(added ? '已添加到收藏' : '已取消收藏', {
    color: added ? 'success' : 'info'
  })
}

// 选择功能
const toggleSelection = (sha: string, selected: boolean) => {
  if (selected) {
    selectedItems.value.push(sha)
  } else {
    const index = selectedItems.value.indexOf(sha)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

// 批量下载
const batchDownload = async () => {
  const selectedImages = displayImages.value.filter(img => selectedItems.value.includes(img.sha))

  if (selectedImages.length === 0) {
    showMessage('请先选择要下载的图片', { color: 'warning' })
    return
  }

  try {
    downloadProgress.value.show = true
    downloadProgress.value.current = 0
    downloadProgress.value.total = selectedImages.length
    downloadProgress.value.currentFile = ''

    const items = selectedImages.map(img => ({
      url: getImageUrl(img),
      filename: img.name
    }))

    await performBatchDownload(items, `images-${Date.now()}.zip`, progress => {
      downloadProgress.value.current = progress.current
      downloadProgress.value.total = progress.total
      downloadProgress.value.currentFile = progress.currentFile
    })

    showMessage(`成功下载 ${selectedImages.length} 张图片`, { color: 'success' })
    clearSelection()
  } catch (error) {
    handleFileError(error, 'batch')
  } finally {
    downloadProgress.value.show = false
  }
}

const batchDelete = () => {
  // 实现批量删除逻辑
  showMessage(`将删除 ${selectedItems.value.length} 个项目`, { color: 'warning' })
}

// 工具函数
const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'Unknown'
}

// 获取占位图片
const getPlaceholderImage = () => {
  // 返回一个 1x1 透明 PNG 作为占位符
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
}

// 监听路径变化，清除搜索
watch(
  () => props.currentPath,
  () => {
    clearSearch()
    clearSelection()
  }
)
</script>

<style scoped lang="scss">
.unified-image-manager {
  .toolbar-card {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .breadcrumb-item {
    cursor: pointer;

    &:hover {
      color: rgb(var(--v-theme-primary));
    }
  }

  .folder-card {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  // 图片网格样式
  .image-grid {
    .image-col {
      padding: 8px;
    }

    .image-card {
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 12px;
      overflow: hidden;
      position: relative;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

        .image-overlay {
          opacity: 1;
        }
      }

      &--selected {
        border: 2px solid rgb(var(--v-theme-primary));
        box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.3);
      }
    }

    .selection-checkbox {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 3;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 6px;
      padding: 2px;
      backdrop-filter: blur(4px);
    }

    .image-content {
      position: relative;
      border-radius: 12px 12px 0 0;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.8) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .overlay-actions {
      display: flex;
      gap: 8px;

      .v-btn {
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .batch-actions-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    min-width: 400px;
    backdrop-filter: blur(10px);
    border-radius: 16px;
  }

  .empty-state {
    padding: 4rem 0;
  }
}

// 移动端适配
@media (max-width: 960px) {
  .unified-image-manager {
    // 工具栏优化
    .toolbar-card {
      :deep(.v-card-text) {
        padding: 12px;
      }
    }

    // 面包屑导航
    :deep(.v-breadcrumbs) {
      padding: 8px 0;
      font-size: 0.875rem;

      .v-breadcrumbs-item {
        font-size: 0.875rem;
      }

      .v-breadcrumbs-divider {
        padding: 0 8px;
      }
    }

    // 搜索框
    :deep(.v-text-field) {
      max-width: 200px !important;
      font-size: 0.875rem;
    }

    // 快速操作栏
    .d-flex.align-center {
      flex-wrap: wrap;
      gap: 8px;

      .v-btn {
        font-size: 0.75rem;
        padding: 0 8px;
      }
    }

    // 文件夹卡片
    .folder-card {
      :deep(.v-card-text) {
        padding: 12px;

        .v-icon {
          font-size: 40px;
        }

        .text-subtitle-2 {
          font-size: 0.875rem;
        }
      }
    }

    // 图片网格
    .image-grid {
      .image-col {
        padding: 6px;
      }

      .image-card {
        border-radius: 8px;

        .image-content {
          height: 180px !important;
          border-radius: 8px 8px 0 0;
        }

        :deep(.v-card-text) {
          padding: 8px;

          .text-subtitle-2 {
            font-size: 0.875rem;
          }

          .text-caption {
            font-size: 0.75rem;
          }
        }
      }

      .overlay-actions {
        gap: 6px;

        .v-btn {
          min-width: auto;
          width: 36px;
          height: 36px;
        }
      }
    }

    // 列表视图
    :deep(.v-list) {
      .v-list-item {
        padding: 8px 12px;

        .v-avatar {
          width: 40px;
          height: 40px;
        }

        .v-list-item-title {
          font-size: 0.875rem;
        }

        .v-list-item-subtitle {
          font-size: 0.75rem;
        }
      }
    }

    // 批量操作栏
    .batch-actions-bar {
      bottom: 16px;
      min-width: 90%;
      left: 5%;
      transform: none;

      :deep(.v-card-text) {
        padding: 12px;

        .v-btn {
          font-size: 0.875rem;
          padding: 0 12px;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .unified-image-manager {
    // 工具栏
    .toolbar-card {
      :deep(.v-card-text) {
        padding: 8px;
      }
    }

    // 面包屑和搜索框布局
    .d-flex.align-center.mb-3 {
      flex-direction: column;
      align-items: stretch !important;
      gap: 8px;

      :deep(.v-breadcrumbs) {
        flex-grow: 0 !important;
      }

      :deep(.v-text-field) {
        max-width: 100% !important;
      }
    }

    // 快速操作栏
    .d-flex.align-center:not(.mb-3) {
      .v-btn {
        min-width: auto;
        padding: 0 8px;

        .v-icon {
          margin: 0;
        }

        // 隐藏按钮文字，只显示图标
        span:not(.v-icon) {
          display: none;
        }
      }

      .v-btn-toggle {
        .v-btn {
          padding: 0 8px;
        }
      }
    }

    // 文件夹网格
    .folders-section {
      :deep(.v-row) {
        margin: -4px;

        .v-col {
          padding: 4px;
        }
      }
    }

    // 图片网格
    .image-grid {
      .image-col {
        padding: 4px;
      }

      .image-card {
        border-radius: 6px;

        .image-content {
          height: 140px !important;
          border-radius: 6px 6px 0 0;
        }

        .selection-checkbox {
          top: 4px;
          left: 4px;
          transform: scale(0.9);
        }

        :deep(.v-card-text) {
          padding: 6px;

          .text-subtitle-2 {
            font-size: 0.8125rem;
            line-height: 1.2;
          }

          .text-caption {
            font-size: 0.6875rem;
          }
        }
      }

      // 移动端显示简化的操作按钮
      .image-overlay {
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
      }

      .overlay-actions {
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;

        .v-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;

          .v-icon {
            font-size: 18px;
          }
        }
      }
    }

    // 列表视图
    :deep(.v-list) {
      .v-list-item {
        padding: 6px 8px;
        min-height: 56px;

        .v-avatar {
          width: 36px;
          height: 36px;
          margin-right: 8px;
        }

        .v-list-item-title {
          font-size: 0.8125rem;
        }

        .v-list-item-subtitle {
          font-size: 0.6875rem;
        }

        .v-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;

          .v-icon {
            font-size: 18px;
          }
        }
      }
    }

    // 批量操作栏
    .batch-actions-bar {
      bottom: 12px;
      left: 8px;
      right: 8px;
      min-width: auto;
      border-radius: 12px;

      :deep(.v-card-text) {
        padding: 8px 12px;
        flex-wrap: wrap;
        gap: 4px;

        .text-subtitle-2 {
          font-size: 0.875rem;
          width: 100%;
          margin-bottom: 4px;
        }

        .v-btn {
          font-size: 0.75rem;
          padding: 0 8px;
          height: 32px;
        }
      }
    }

    // 空状态
    .empty-state {
      padding: 2rem 1rem;

      :deep(.v-icon) {
        font-size: 64px;
      }

      :deep(.text-h6) {
        font-size: 1rem;
      }

      :deep(.text-body-2) {
        font-size: 0.875rem;
      }
    }

    // 下载进度对话框
    :deep(.v-dialog) {
      .v-card {
        margin: 16px;

        .v-card-title {
          font-size: 1rem;
          padding: 12px 16px;
        }

        .v-card-text {
          padding: 12px 16px;
          font-size: 0.875rem;
        }
      }
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .unified-image-manager {
    // 增大所有可点击元素
    .folder-card,
    .image-card {
      min-height: 44px;
    }

    // 按钮最小尺寸
    :deep(.v-btn) {
      min-height: 44px;
      min-width: 44px;
    }

    // 复选框
    :deep(.v-checkbox) {
      .v-selection-control__input {
        width: 32px;
        height: 32px;
      }
    }

    // 图片卡片 - 移动端始终显示操作按钮
    .image-card {
      .image-overlay {
        opacity: 0.9;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
      }

      .overlay-actions {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
  }
}

// 横屏模式优化
@media (max-width: 960px) and (orientation: landscape) {
  .unified-image-manager {
    .image-grid {
      .image-card {
        .image-content {
          height: 160px !important;
        }
      }
    }

    .batch-actions-bar {
      bottom: 8px;
    }
  }
}

// 小屏幕横屏
@media (max-width: 600px) and (orientation: landscape) {
  .unified-image-manager {
    .toolbar-card {
      :deep(.v-card-text) {
        padding: 6px 8px;
      }
    }

    .image-grid {
      .image-card {
        .image-content {
          height: 120px !important;
        }
      }
    }
  }
}
</style>
