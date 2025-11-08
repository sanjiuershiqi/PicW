<template>
  <v-container fluid class="favorites-view">
    <!-- 页面头部 -->
    <v-card variant="flat" class="header-card mb-6">
      <v-card-text class="d-flex align-center pa-4">
        <!-- 左侧：标题和统计信息 -->
        <div class="d-flex align-center flex-grow-1">
          <v-avatar color="warning" size="48" class="me-4">
            <v-icon size="28">mdi-star</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold mb-1">我的收藏</h1>
            <div class="d-flex align-center text-body-2 text-medium-emphasis">
              <v-icon size="16" class="me-1">mdi-image-multiple</v-icon>
              <span>共 {{ favoriteCount }} 张图片 • {{ totalSize }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="d-flex align-center gap-2">
          <v-btn variant="outlined" prepend-icon="mdi-export" @click="exportFavorites" :disabled="favoriteCount === 0"> 导出 </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-import" @click="triggerImport"> 导入 </v-btn>
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete-sweep"
            @click="showClearDialog = true"
            :disabled="favoriteCount === 0"
          >
            清空
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 空状态 -->
    <EmptyState v-if="favoriteCount === 0" icon="mdi-star-outline" title="还没有收藏" subtitle="在图片管理器中点击星标按钮收藏图片" />

    <!-- 收藏图片管理器 -->
    <template v-else>
      <!-- 工具栏 -->
      <v-card variant="flat" class="toolbar-card mb-4">
        <v-card-text class="pa-3">
          <div class="d-flex align-center">
            <!-- 左侧：筛选和排序 -->
            <div class="d-flex align-center gap-2 flex-grow-1">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 200px"
                prepend-inner-icon="mdi-sort"
              />
            </div>

            <!-- 右侧：视图切换 -->
            <v-btn-toggle v-model="viewMode" variant="outlined" density="compact" mandatory>
              <v-btn value="grid" icon="mdi-view-grid" title="网格视图" />
              <v-btn value="list" icon="mdi-view-list" title="列表视图" />
            </v-btn-toggle>
          </div>
        </v-card-text>
      </v-card>

      <!-- 网格视图 -->
      <v-row v-if="viewMode === 'grid'">
        <v-col v-for="item in displayFavorites" :key="item.sha" cols="12" sm="6" md="4" lg="3">
          <v-card hover class="favorite-card" @click="openLightbox(item)">
            <v-img
              :src="item.url"
              :lazy-src="getPlaceholderUrl()"
              :alt="item.name"
              aspect-ratio="1"
              cover
              loading="lazy"
              class="image-preview"
            >
              <template #placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5" />
                </v-row>
              </template>
              <template #error>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-icon size="48" color="grey">mdi-image-broken</v-icon>
                </v-row>
              </template>
            </v-img>

            <v-card-actions class="pa-2">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <div v-bind="props" class="text-truncate text-caption flex-grow-1">
                    {{ item.name }}
                  </div>
                </template>
                <span>{{ item.name }}</span>
              </v-tooltip>

              <v-btn icon="mdi-star" size="small" color="warning" variant="text" @click.stop="removeFavorite(item.sha)" title="取消收藏" />
              <v-btn icon="mdi-download" size="small" variant="text" @click.stop="downloadImage(item)" title="下载" />
              <v-btn icon="mdi-eye" size="small" variant="text" @click.stop="openLightbox(item)" title="预览" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- 列表视图 -->
      <v-list v-else-if="viewMode === 'list'" class="image-list">
        <v-list-item v-for="item in displayFavorites" :key="item.sha" @click="openLightbox(item)">
          <template #prepend>
            <v-avatar size="60" rounded="lg">
              <v-img :src="item.url" :alt="item.name" cover>
                <template #placeholder>
                  <v-progress-circular indeterminate size="20" />
                </template>
                <template #error>
                  <v-icon>mdi-image-broken</v-icon>
                </template>
              </v-img>
            </v-avatar>
          </template>

          <v-list-item-title>{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatFileSize(item.size) }} • {{ formatDate(item.addedAt) }}
            <br />
            {{ item.username }}/{{ item.repository }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn icon="mdi-star" size="small" color="warning" variant="text" @click.stop="removeFavorite(item.sha)" title="取消收藏" />
            <v-btn icon="mdi-download" size="small" variant="text" @click.stop="downloadImage(item)" title="下载" />
            <v-btn icon="mdi-eye" size="small" variant="text" @click.stop="openLightbox(item)" title="预览" />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <!-- 图片灯箱 -->
    <ImageLightbox
      v-model="showLightbox"
      :images="lightboxImages"
      :current-index="currentLightboxIndex"
      @update:current-index="currentLightboxIndex = $event"
    />

    <!-- 清空确认对话框 -->
    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="warning" class="me-2" />
          确认清空收藏
        </v-card-title>
        <v-card-text> 确定要清空所有收藏吗？此操作不可恢复。 </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="confirmClear">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInput" type="file" accept="application/json" style="display: none" @change="handleImport" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFavoritesStore } from '@/plugins/stores/favorites'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import EmptyState from '@/components/EmptyState.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import filesize from '@/libs/filesize'

const favoritesStore = useFavoritesStore()
const { showMessage } = useSnackBarStore()

// 状态
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('date-desc')
const showLightbox = ref(false)
const currentLightboxIndex = ref(0)
const showClearDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 排序选项
const sortOptions = [
  { title: '最新收藏', value: 'date-desc' },
  { title: '最早收藏', value: 'date-asc' },
  { title: '名称 A-Z', value: 'name-asc' },
  { title: '名称 Z-A', value: 'name-desc' },
  { title: '大小从大到小', value: 'size-desc' },
  { title: '大小从小到大', value: 'size-asc' }
]

// 计算属性
const favoriteCount = computed(() => favoritesStore.favoriteCount)

const totalSize = computed(() => {
  const total = favoritesStore.sortedFavorites.reduce((sum, item) => sum + item.size, 0)
  return filesize(total)
})

// 根据排序选项显示收藏
const displayFavorites = computed(() => {
  const favorites = [...favoritesStore.sortedFavorites]

  switch (sortBy.value) {
    case 'date-desc':
      return favorites.sort((a, b) => b.addedAt - a.addedAt)
    case 'date-asc':
      return favorites.sort((a, b) => a.addedAt - b.addedAt)
    case 'name-asc':
      return favorites.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return favorites.sort((a, b) => b.name.localeCompare(a.name))
    case 'size-desc':
      return favorites.sort((a, b) => b.size - a.size)
    case 'size-asc':
      return favorites.sort((a, b) => a.size - b.size)
    default:
      return favorites
  }
})

const lightboxImages = computed(() => {
  return displayFavorites.value.map(item => ({
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    url: item.url
  }))
})

// 方法
const openLightbox = (item: any) => {
  const index = displayFavorites.value.findIndex(f => f.sha === item.sha)
  currentLightboxIndex.value = index
  showLightbox.value = true
}

const removeFavorite = (sha: string) => {
  favoritesStore.removeFavorite(sha)
  showMessage('已取消收藏', { color: 'info' })
}

const downloadImage = async (item: any) => {
  try {
    const response = await fetch(item.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    a.click()

    URL.revokeObjectURL(url)
    showMessage('下载成功', { color: 'success' })
  } catch (error) {
    showMessage('下载失败', { color: 'error' })
    console.error('下载失败:', error)
  }
}

const exportFavorites = () => {
  try {
    favoritesStore.exportFavorites()
    showMessage('导出成功', { color: 'success' })
  } catch (error) {
    showMessage('导出失败', { color: 'error' })
    console.error('导出失败:', error)
  }
}

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  try {
    const count = await favoritesStore.importFavorites(file)
    showMessage(`成功导入 ${count} 个收藏`, { color: 'success' })
  } catch (error) {
    showMessage('导入失败', { color: 'error' })
    console.error('导入失败:', error)
  }

  // 清空文件输入
  if (target) {
    target.value = ''
  }
}

const confirmClear = () => {
  favoritesStore.clearFavorites()
  showClearDialog.value = false
  showMessage('已清空所有收藏', { color: 'info' })
}

const formatFileSize = (bytes: number) => {
  return filesize(bytes)
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }

  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }

  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }

  // 显示日期
  return date.toLocaleDateString('zh-CN')
}

const getPlaceholderUrl = () => {
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
}
</script>

<style scoped lang="scss">
.favorites-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.header-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8) 0%, rgba(var(--v-theme-surface), 1) 100%);
}

.toolbar-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
}

.gap-2 {
  gap: 8px;
}

.favorite-card {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.image-preview {
  cursor: pointer;
}

.image-list {
  .v-list-item {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

    &:hover {
      background-color: rgba(var(--v-theme-on-surface), 0.04);
    }
  }
}

// 响应式调整
@media (max-width: 960px) {
  .favorites-view {
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
  .favorites-view {
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

  .toolbar-card {
    .d-flex {
      flex-direction: column;
      gap: 12px;
    }

    .v-select {
      max-width: 100% !important;
    }
  }
}
</style>
