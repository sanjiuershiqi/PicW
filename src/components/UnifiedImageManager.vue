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
                <v-img :src="getImageUrl(image)" :alt="image.name" height="200" cover class="image-content">
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
                        icon="mdi-eye"
                        variant="elevated"
                        color="primary"
                        size="small"
                        @click.stop="openImagePreview(image, index)"
                        title="预览"
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
                    <v-img :src="getImageUrl(image)" />
                  </v-avatar>
                </template>

                <v-list-item-title>{{ image.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(image.size) }} • {{ getFileType(image.name) }}
                  <span v-if="isSearching && image.directory" class="ml-2"> 📁 {{ image.directory }} </span>
                </v-list-item-subtitle>

                <template #append>
                  <v-btn icon="mdi-eye" variant="text" size="small" @click.stop="openImagePreview(image, index)" />
                  <v-btn icon="mdi-download" variant="text" size="small" @click.stop="downloadImage(image)" />
                  <v-btn
                    v-if="canDelete"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click.stop="deleteImage(image, index)"
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

    <!-- 批量操作栏 -->
    <v-slide-y-reverse-transition>
      <v-card v-if="selectedItems.length > 0" variant="elevated" class="batch-actions-bar">
        <v-card-text class="d-flex align-center pa-4">
          <span class="text-subtitle-2"> 已选择 {{ selectedItems.length }} 个项目 </span>
          <v-spacer />
          <v-btn variant="text" @click="clearSelection">取消选择</v-btn>
          <v-btn variant="text" prepend-icon="mdi-download">批量下载</v-btn>
          <v-btn v-if="canDelete" variant="text" color="error" prepend-icon="mdi-delete" @click="batchDelete"> 批量删除 </v-btn>
        </v-card-text>
      </v-card>
    </v-slide-y-reverse-transition>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import filesize from '@/libs/filesize'
import { searchInRepository } from '@/plugins/axios/search'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
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
  navigate: [path: string]
  refresh: []
  delete: [image: ImageItem, index: number]
  'folder-selected': [folder: FolderItem]
}>()

const { showMessage } = useSnackBarStore()

// 状态管理
const searchQuery = ref('')
const searchResults = ref<ImageItem[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('name-asc')
const fileTypeFilter = ref<string[]>([])
const selectedItems = ref<string[]>([])
const showLightbox = ref(false)
const currentLightboxIndex = ref(0)

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
  emit('refresh')
}

// 搜索功能
const searchLoading = ref(false)
let searchTimeout: number | null = null

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
    searchResults.value = results.map(result => ({
      ...result,
      directory: result.path.substring(0, result.path.lastIndexOf('/')) || '/'
    }))

    showMessage(`找到 ${results.length} 个搜索结果`, { color: 'success' })
  } catch (error) {
    console.error('搜索失败:', error)
    showMessage('搜索失败，请稍后重试', { color: 'error' })
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
      return cdnUrls && cdnUrls.length > 0 ? cdnUrls[0].text : ''
    } catch (error) {
      console.error('生成CDN URL失败:', error)
    }
  }
  // 备用方案
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
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = image.name
    a.click()

    URL.revokeObjectURL(downloadUrl)
    showMessage('下载成功', { color: 'success' })
  } catch (error) {
    showMessage('下载失败', { color: 'error' })
  }
}

const deleteImage = (image: ImageItem, index: number) => {
  emit('delete', image, index)
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

// 响应式调整
@media (max-width: 960px) {
  .unified-image-manager {
    .image-grid {
      .image-col {
        padding: 6px;
      }

      .image-card {
        .image-content {
          height: 180px !important;
        }
      }

      .overlay-actions {
        gap: 6px;

        .v-btn {
          min-width: auto;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .unified-image-manager {
    .image-grid {
      .image-col {
        padding: 4px;
      }

      .image-card {
        .image-content {
          height: 160px !important;
        }

        .selection-checkbox {
          top: 4px;
          left: 4px;
        }
      }

      .overlay-actions {
        gap: 4px;

        .v-btn {
          size: x-small;
        }
      }
    }

    .batch-actions-bar {
      left: 10px;
      right: 10px;
      transform: none;
      min-width: auto;
    }
  }
}
</style>
