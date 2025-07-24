<template>
  <v-card variant="flat" class="global-search mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-magnify" class="me-2" />
      全局搜索
      <v-spacer />
      <v-chip v-if="searchResults.length > 0" :color="searchResults.length > 0 ? 'primary' : 'grey'" size="small" variant="tonal">
        找到 {{ searchResults.length }} 个结果
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 搜索输入 -->
      <v-row class="mb-4">
        <v-col cols="12" md="8">
          <v-text-field
            v-model="searchQuery"
            label="搜索图片名称"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            :loading="searching"
            @input="onSearchInput"
            @keyup.enter="performSearch"
            placeholder="输入图片名称进行搜索..."
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="searchScope"
            :items="scopeOptions"
            label="搜索范围"
            prepend-inner-icon="mdi-folder-search"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>

      <!-- 高级搜索选项 -->
      <v-expand-transition>
        <div v-show="showAdvanced">
          <v-divider class="mb-4" />
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="fileTypeFilter"
                :items="fileTypeOptions"
                label="文件类型"
                prepend-inner-icon="mdi-file-image"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                closable-chips
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="sizeFilter"
                :items="sizeOptions"
                label="文件大小"
                prepend-inner-icon="mdi-file-document-outline"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>

      <!-- 高级搜索切换 -->
      <div class="text-center mb-4">
        <v-btn
          variant="text"
          size="small"
          :prepend-icon="showAdvanced ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="showAdvanced = !showAdvanced"
        >
          {{ showAdvanced ? '收起' : '高级搜索' }}
        </v-btn>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0">
        <h4 class="text-subtitle-1 mb-3">搜索结果</h4>
        <v-row>
          <v-col v-for="result in paginatedResults" :key="result.path" cols="12" sm="6" md="4" lg="3">
            <v-card class="search-result-card" @click="selectResult(result)">
              <v-img :src="getImageUrl(result)" :alt="result.name" height="150" cover>
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate size="24" />
                  </div>
                </template>

                <!-- 文件夹路径标签 -->
                <v-chip size="small" color="primary" variant="flat" class="ma-2" style="position: absolute; top: 0; right: 0">
                  <v-icon icon="mdi-folder" size="small" class="me-1" />
                  {{ getRelativePath(result.directory) }}
                </v-chip>
              </v-img>

              <v-card-text class="pa-3">
                <div class="text-subtitle-2 font-weight-medium mb-1">
                  {{ result.name }}
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center">
                  <v-icon icon="mdi-folder-outline" size="small" class="me-1" />
                  {{ result.directory }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ formatFileSize(result.size) }}
                </div>
              </v-card-text>

              <v-card-actions class="pa-3 pt-0">
                <v-btn variant="text" size="small" prepend-icon="mdi-folder-open" @click.stop="navigateToFolder(result.directory)">
                  打开文件夹
                </v-btn>
                <v-spacer />
                <v-btn variant="text" size="small" icon="mdi-eye" @click.stop="previewImage(result)" />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="text-center mt-4">
          <v-pagination v-model="currentPage" :length="totalPages" :total-visible="5" density="comfortable" />
        </div>
      </div>

      <!-- 搜索状态 -->
      <div v-else-if="searchQuery && !searching" class="text-center py-8">
        <EmptyState
          icon="mdi-magnify-scan"
          title="未找到匹配的图片"
          description="尝试使用不同的关键词或调整搜索条件"
          :show-action="false"
        />
      </div>

      <!-- 搜索提示 -->
      <div v-else-if="!searchQuery" class="text-center py-8">
        <EmptyState icon="mdi-magnify" title="开始搜索" description="输入图片名称来搜索整个仓库中的图片" :show-action="false" />
      </div>

      <!-- 搜索中状态 -->
      <div v-if="searching" class="text-center py-8">
        <v-progress-circular indeterminate size="48" />
        <p class="text-subtitle-2 mt-4">正在搜索图片...</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import debounce from '@/libs/debounce'
import filesize from '@/libs/filesize'
import { useCodeStore } from '@/plugins/stores/code'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

interface SearchResult {
  name: string
  path: string
  directory: string
  size: number
  type: string
  sha: string
}

interface Props {
  username: string
  repository: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'navigate-to-folder': [path: string]
  'image-selected': [result: SearchResult]
  'preview-image': [result: SearchResult]
}>()

const { getCdnUrlItems } = storeToRefs(useCodeStore())

// 搜索状态
const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref<SearchResult[]>([])
const showAdvanced = ref(false)

// 搜索选项
const searchScope = ref('all')
const fileTypeFilter = ref<string[]>([])
const sizeFilter = ref('all')

// 分页
const currentPage = ref(1)
const itemsPerPage = 12

const scopeOptions = [
  { title: '全部文件夹', value: 'all' },
  { title: '当前文件夹', value: 'current' },
  { title: '根目录', value: 'root' }
]

const fileTypeOptions = [
  { title: 'JPG', value: 'jpg' },
  { title: 'PNG', value: 'png' },
  { title: 'GIF', value: 'gif' },
  { title: 'WebP', value: 'webp' },
  { title: 'SVG', value: 'svg' }
]

const sizeOptions = [
  { title: '全部大小', value: 'all' },
  { title: '小于 100KB', value: 'small' },
  { title: '100KB - 1MB', value: 'medium' },
  { title: '1MB - 5MB', value: 'large' },
  { title: '大于 5MB', value: 'xlarge' }
]

// 计算属性
const filteredResults = computed(() => {
  let results = searchResults.value

  // 文件类型筛选
  if (fileTypeFilter.value.length > 0) {
    results = results.filter(result => {
      const ext = result.name.split('.').pop()?.toLowerCase()
      return ext && fileTypeFilter.value.includes(ext)
    })
  }

  // 大小筛选
  if (sizeFilter.value !== 'all') {
    results = results.filter(result => {
      switch (sizeFilter.value) {
        case 'small':
          return result.size < 100 * 1024
        case 'medium':
          return result.size >= 100 * 1024 && result.size < 1024 * 1024
        case 'large':
          return result.size >= 1024 * 1024 && result.size < 5 * 1024 * 1024
        case 'xlarge':
          return result.size >= 5 * 1024 * 1024
        default:
          return true
      }
    })
  }

  return results
})

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / itemsPerPage)
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredResults.value.slice(start, end)
})

// 方法
const getImageUrl = (result: SearchResult) => {
  return getCdnUrlItems.value(props.username, props.repository, result.directory, result.name)[0]?.text || ''
}

const getRelativePath = (path: string) => {
  return path === '/' ? '根目录' : path.replace(/^\//, '')
}

const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

// 防抖搜索
const onSearchInput = debounce(() => {
  if (searchQuery.value.trim()) {
    performSearch()
  } else {
    searchResults.value = []
  }
}, 500)

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  searching.value = true
  try {
    // 动态导入搜索API
    const { searchImages } = await import('@/plugins/axios/search')

    const results = await searchImages({
      query: searchQuery.value,
      username: props.username,
      repository: props.repository,
      path: searchScope.value === 'root' ? '/' : undefined,
      fileTypes: fileTypeFilter.value.length > 0 ? fileTypeFilter.value : undefined,
      sizeRange: sizeFilter.value !== 'all' ? (sizeFilter.value as any) : undefined,
      recursive: searchScope.value === 'all'
    })

    searchResults.value = results
    currentPage.value = 1
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

// 事件处理
const selectResult = (result: SearchResult) => {
  emit('image-selected', result)
}

const navigateToFolder = (path: string) => {
  emit('navigate-to-folder', path)
}

const previewImage = (result: SearchResult) => {
  emit('preview-image', result)
}
</script>

<style scoped lang="scss">
.global-search {
  .search-result-card {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
