<template>
  <v-container>
    <!-- 页面标题和操作 -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">图片管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ search.repository }} / {{ search.directory }}</p>
      </div>
      <v-spacer />
      <v-btn-toggle v-model="viewMode" variant="outlined" density="compact" mandatory>
        <v-btn value="browse" icon="mdi-folder-open" title="浏览文件夹" />
        <v-btn value="search" icon="mdi-magnify" title="全局搜索" />
        <v-btn value="grid" icon="mdi-view-grid" title="网格视图" />
        <v-btn value="list" icon="mdi-view-list" title="列表视图" />
        <v-btn value="stats" icon="mdi-chart-box" title="统计信息" />
      </v-btn-toggle>
    </div>

    <!-- 文件夹浏览视图 -->
    <template v-if="viewMode === 'browse'">
      <FolderBrowser
        :current-path="search.directory"
        :folders="folderItems"
        :images="imageItems"
        :loading="!fileLoaded"
        :username="search.name"
        :repository="search.repository"
        @navigate="navigateToPath"
        @folder-selected="selectFolder"
        @refresh="loadContent"
      />
    </template>

    <!-- 全局搜索视图 -->
    <template v-else-if="viewMode === 'search'">
      <GlobalImageSearch
        :username="search.name"
        :repository="search.repository"
        @navigate-to-folder="navigateToPath"
        @image-selected="selectSearchResult"
        @preview-image="previewSearchResult"
      />
    </template>

    <!-- 统计视图 -->
    <template v-else-if="viewMode === 'stats'">
      <ImageStatistics :images="imageData" />
    </template>

    <!-- 图片管理视图 -->
    <template v-else>
      <!-- 筛选组件 -->
      <ImageFilter @update:filters="updateFilters" />

      <!-- 批量操作 -->
      <BatchOperations
        :items="batchItems"
        :selected-items="selectedItems"
        @update:selected-items="selectedItems = $event"
        @delete-items="batchDelete"
        @add-tags="batchAddTags"
      />

      <!-- 内容区域 -->
      <v-fade-transition hide-on-leave>
        <div v-if="fileLoaded || files.length > 0">
          <template v-if="filteredFiles.length > 0">
            <!-- README 显示 -->
            <v-slide-y-transition>
              <v-card v-if="readmeText" class="mb-6 markdown-content">
                <v-card-text class="position-relative">
                  <v-btn
                    v-if="islogin"
                    icon="mdi-circle-edit-outline"
                    variant="text"
                    size="small"
                    :href="editHref"
                    target="_blank"
                    class="position-absolute"
                    style="right: 8px; top: 8px"
                  />
                  <VueShowdown :markdown="readmeText" flavor="github" :options="{ emoji: true }" />
                </v-card-text>
              </v-card>
            </v-slide-y-transition>

            <!-- 图片网格/列表 -->
            <transition-group name="list-item" tag="div">
              <v-row v-if="viewMode === 'grid'" key="grid">
                <v-col v-for="(item, index) in filteredFiles" :key="item.sha" cols="12" sm="6" md="4" lg="3">
                  <ImagePreview
                    :image="item"
                    :image-url="getImageUrl(item)"
                    :selected="selectedItems.includes(item.sha)"
                    :show-selection="true"
                    :show-delete="islogin"
                    @update:selected="toggleSelection(item.sha, $event)"
                    @delete="delFile(item, index)"
                    @preview="handleImagePreview"
                    @download="handleImageDownload"
                    @click="handleImageClick"
                  />
                </v-col>
              </v-row>

              <div v-else-if="viewMode === 'list'" key="list">
                <v-card>
                  <v-list>
                    <v-list-item v-for="(item, index) in filteredFiles" :key="item.sha" class="list-item-hover">
                      <template #prepend>
                        <v-checkbox
                          :model-value="selectedItems.includes(item.sha)"
                          @update:model-value="toggleSelection(item.sha, $event)"
                          hide-details
                          density="compact"
                        />
                      </template>

                      <template #title>
                        <div class="d-flex align-center">
                          <v-avatar size="40" class="me-3">
                            <v-img :src="getImageUrl(item)" />
                          </v-avatar>
                          <div>
                            <div class="font-weight-medium">{{ item.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                              {{ formatFileSize(item.size) }} • {{ formatDate(item.name) }}
                            </div>
                          </div>
                        </div>
                      </template>

                      <template #append>
                        <div class="d-flex align-center">
                          <v-btn variant="text" size="small" icon="mdi-eye" @click="previewImage(item)" />
                          <v-btn variant="text" size="small" icon="mdi-download" @click="downloadImage(item)" />
                          <v-btn v-if="islogin" variant="text" size="small" icon="mdi-delete" color="error" @click="delFile(item, index)" />
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card>
              </div>
            </transition-group>
          </template>

          <!-- 空状态 -->
          <EmptyState
            v-else
            icon="mdi-image-off-outline"
            title="没有找到图片"
            description="尝试调整筛选条件或上传一些图片"
            :show-action="true"
            action-text="上传图片"
            action-icon="mdi-upload"
            @action="$router.push('/')"
          />
        </div>

        <!-- 加载状态 -->
        <SkeletonLoader v-else type="image-grid" :count="12" />
      </v-fade-transition>
    </template>

    <!-- 图片预览灯箱 -->
    <ImageLightbox
      v-model="showLightbox"
      :images="lightboxImages"
      :current-index="currentLightboxIndex"
      @update:current-index="currentLightboxIndex = $event"
    />
  </v-container>
</template>

<script setup lang="ts">
import BatchOperations from '@/components/BatchOperations.vue'
import CloudImage from '@/components/CloudImage.vue'
import EmptyState from '@/components/EmptyState.vue'
import FolderBrowser from '@/components/FolderBrowser.vue'
import GlobalImageSearch from '@/components/GlobalImageSearch.vue'
import ImageFilter from '@/components/ImageFilter.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import ImageStatistics from '@/components/ImageStatistics.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import filesize from '@/libs/filesize'
import { deleteFile } from '@/plugins/axios/file'
import { repoPathContent, type RepoPathContent } from '@/plugins/axios/repo'
import { useCodeStore } from '@/plugins/stores/code'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useTagsStore } from '@/plugins/stores/tags'
import { useUserStore } from '@/plugins/stores/user'
import { storeToRefs } from 'pinia'
import { computed, onActivated, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import type { ImageFilters } from '@/components/ImageFilter.vue'

const { islogin } = storeToRefs(useUserStore())
const { getCdnUrlItems } = storeToRefs(useCodeStore())
const { showMessage } = useSnackBarStore()
const tagsStore = useTagsStore()

const search = reactive({
  name: '',
  repository: '',
  directory: ''
})

// 状态管理
const fileLoaded = ref(false)
const files = ref<RepoPathContent[]>([])
const readmeText = ref('')
const viewMode = ref<'browse' | 'search' | 'grid' | 'list' | 'stats'>('browse')
const selectedItems = ref<string[]>([])
const filters = ref<ImageFilters>({
  search: '',
  fileTypes: [],
  sizeRange: 'all',
  sortBy: 'name-asc',
  dateRange: 'all',
  viewMode: 'grid',
  customDateStart: '',
  customDateEnd: '',
  customSizeRange: [0, 10]
})

// 图片预览灯箱状态
const showLightbox = ref(false)
const currentLightboxIndex = ref(0)
onActivated(async () => {
  const { query } = useRoute()
  search.name = query.name as string
  search.repository = query.repository as string
  search.directory = query.directory as string
  try {
    fileLoaded.value = false
    // 获取文件
    const data = await repoPathContent(search.name, search.repository, search.directory)
    const Suffix = [
      'tif',
      'jfif',
      'pjp',
      'apng',
      'ico',
      'tiff',
      'gif',
      'svg',
      'xbm',
      'jxl',
      'jpeg',
      'svgz',
      'jpg',
      'webp',
      'png',
      'bmp',
      'pjpeg',
      'avif'
    ]
    files.value = data.filter(val => val.type == 'dir' || Suffix.some(suffix => val.name.toLowerCase().endsWith(suffix)))
    // 获取 markdown 文件内容
    const readmeItem = data.find(val => val.name.toLowerCase().endsWith('.md') && val.path == `${search.directory}/${val.name}`)
    if (readmeItem) {
      const readmeUrl = getCdnUrlItems.value(search.name, search.repository, search.directory, readmeItem.name)[0].text
      readmeText.value = await fetch(readmeUrl).then(val => (val.ok ? val.text() : ''))
    }
  } catch (error) {
    console.error(error)
  } finally {
    fileLoaded.value = true
  }
})

// 计算属性
const editHref = computed(() => `https://github.com/${search.name}/${search.repository}/edit/master/${search.directory}/README.md`)

// 文件夹项
const folderItems = computed(() => {
  return files.value.filter(file => file.type === 'dir')
})

// 图片项
const imageItems = computed(() => {
  return files.value.filter(file => file.type === 'file')
})

// 筛选后的文件
const filteredFiles = computed(() => {
  let result = files.value.filter(file => file.type === 'file')

  // 搜索筛选
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    result = result.filter(file => file.name.toLowerCase().includes(searchTerm))
  }

  // 文件类型筛选
  if (filters.value.fileTypes.length > 0) {
    result = result.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ext && filters.value.fileTypes.includes(ext)
    })
  }

  // 大小筛选
  if (filters.value.sizeRange !== 'all') {
    result = result.filter(file => {
      switch (filters.value.sizeRange) {
        case 'small':
          return file.size < 100 * 1024
        case 'medium':
          return file.size >= 100 * 1024 && file.size < 1024 * 1024
        case 'large':
          return file.size >= 1024 * 1024 && file.size < 5 * 1024 * 1024
        case 'xlarge':
          return file.size >= 5 * 1024 * 1024
        default:
          return true
      }
    })
  }

  // 排序
  result.sort((a, b) => {
    switch (filters.value.sortBy) {
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

  return result
})

// 批量操作数据
const batchItems = computed(() => {
  return filteredFiles.value.map(file => ({
    id: file.sha,
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date(), // 这里应该从 GitHub API 获取实际时间
    url: getImageUrl(file)
  }))
})

// 统计数据
const imageData = computed(() => {
  return files.value
    .filter(file => file.type === 'file')
    .map(file => ({
      id: file.sha,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      uploadedAt: new Date(), // 这里应该从 GitHub API 获取实际时间
      tags: [] // 这里应该从标签系统获取
    }))
})

// 灯箱图片数据
const lightboxImages = computed(() => {
  return filteredFiles.value.map(file => ({
    name: file.name,
    path: file.path,
    sha: file.sha,
    size: file.size,
    url: getImageUrl(file)
  }))
})

// 方法
const updateFilters = (newFilters: ImageFilters) => {
  filters.value = newFilters
}

const toggleSelection = (itemId: string, selected: boolean) => {
  if (selected) {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  } else {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

const getImageUrl = (item: RepoPathContent) => {
  return getCdnUrlItems.value(search.name, search.repository, search.directory, item.name)[0]?.text || ''
}

const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const formatDate = () => {
  // 这里可以根据文件名或其他信息格式化日期
  return '最近上传'
}

const previewImage = (item: RepoPathContent) => {
  // 使用统一的灯箱预览
  const index = filteredFiles.value.findIndex(file => file.sha === item.sha)
  if (index !== -1) {
    currentLightboxIndex.value = index
    showLightbox.value = true
  }
}

const downloadImage = async (item: RepoPathContent) => {
  try {
    const url = getImageUrl(item)
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = item.name
    a.click()

    URL.revokeObjectURL(downloadUrl)
    showMessage('下载成功', { color: 'success' })
  } catch (error) {
    showMessage('下载失败', { color: 'error' })
  }
}

// 图片预览相关方法
const handleImagePreview = (image: any) => {
  // 找到图片在列表中的索引
  const index = filteredFiles.value.findIndex(file => file.sha === image.sha)
  if (index !== -1) {
    currentLightboxIndex.value = index
    showLightbox.value = true
  }
}

const handleImageDownload = (image: any) => {
  // ImagePreview 组件内部已经处理了下载逻辑
  console.log('下载图片:', image.name)
}

const handleImageClick = (image: any) => {
  // 点击图片时打开预览
  handleImagePreview(image)
}

const batchDelete = async (itemIds: string[]) => {
  try {
    for (const id of itemIds) {
      const item = files.value.find(f => f.sha === id)
      if (item) {
        await deleteFile(search.name, search.repository, item.path, item.name, item.sha)
        const index = files.value.indexOf(item)
        if (index > -1) {
          files.value.splice(index, 1)
        }
      }
    }
    selectedItems.value = []
    showMessage(`成功删除 ${itemIds.length} 个文件`, { color: 'success' })
  } catch (error) {
    showMessage('批量删除失败', { color: 'error' })
  }
}

const batchAddTags = (itemIds: string[], tagIds: string[]) => {
  // 实现批量添加标签逻辑
  itemIds.forEach(itemId => {
    tagIds.forEach(tagId => {
      tagsStore.addTagToImage(itemId, tagId)
    })
  })
}

// 文件夹导航方法
const navigateToPath = (path: string) => {
  // 更新当前路径并重新加载内容
  search.directory = path
  // 这里应该重新调用 API 加载新路径的内容
  loadContent()
}

const selectFolder = (folder: any) => {
  // 选择文件夹时的处理逻辑
  console.log('选择文件夹:', folder)
}

// 搜索结果处理方法
const selectSearchResult = (result: any) => {
  // 处理搜索结果选择
  console.log('选择搜索结果:', result)
  // 可以导航到对应的文件夹
  navigateToPath(result.directory)
}

const previewSearchResult = (result: any) => {
  // 预览搜索结果中的图片
  const url = getCdnUrlItems.value(search.name, search.repository, result.directory, result.name)[0]?.text || ''
  if (url) {
    window.open(url, '_blank')
  }
}

// 加载内容的方法（需要根据实际API调整）
const loadContent = async () => {
  try {
    fileLoaded.value = false
    const data = await repoPathContent(search.name, search.repository, search.directory)
    files.value = data

    // 查找README文件
    const readme = data.find(file => file.name.toLowerCase() === 'readme.md')
    if (readme) {
      // 加载README内容
      // 这里需要实现README内容加载逻辑
    }
  } catch (error) {
    console.error('加载内容失败:', error)
  } finally {
    fileLoaded.value = true
  }
}

// 删除单个文件
const delFile = async (item: RepoPathContent, index: number) => {
  try {
    await deleteFile(search.name, search.repository, item.path, item.name, item.sha)
    files.value.splice(index, 1)
    showMessage('删除成功', { color: 'success' })
  } catch (error) {
    console.error(error)
    showMessage('删除失败', { color: 'error' })
  }
}
</script>

<style scoped lang="scss">
// Markdown 内容样式
:deep(.markdown-content) {
  * {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    line-height: 1.5em;
  }
  .v-card-text > div *:not(:first-child) {
    margin-top: 0.25em;
  }
  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgb(110 118 129 / 30%);
    border-radius: 6px;
    user-select: all;
  }
}

// 选择框样式
.selection-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 2px;
}

// 卡片悬停效果
.card-hover {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &:hover {
    transform: translateY(-4px);
  }
}

// 列表项悬停效果
.list-item-hover {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.1);
  }
}

// 响应式调整
@media (max-width: 960px) {
  .selection-checkbox {
    top: 4px;
    left: 4px;
  }
}

// 动画效果
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.list-item-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-item-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.list-item-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>
