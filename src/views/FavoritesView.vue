<template>
  <v-container fluid class="favorites-view">
    <!-- 页面头部 -->
    <v-card class="header-card mb-6 glass-panel" elevation="0">
      <v-card-text class="d-flex align-center pa-6">
        <!-- 左侧：标题和统计信息 -->
        <div class="d-flex align-center flex-grow-1">
          <div class="header-icon-wrapper mr-5">
            <v-icon size="32" color="warning">mdi-star</v-icon>
            <div class="icon-glow" style="background: radial-gradient(circle, rgba(var(--v-theme-warning), 0.3) 0%, transparent 70%)"></div>
          </div>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1 header-title">我的收藏</h1>
            <div class="d-flex align-center text-body-1 text-secondary">
              <v-icon size="18" class="mr-2">mdi-image-multiple</v-icon>
              <span class="font-mono text-uppercase tracking-wider">共 {{ favoriteCount }} 张图片 • {{ totalSize }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="d-flex align-center gap-3">
          <v-btn
            class="glass-btn px-6 transition-all"
            rounded="pill"
            elevation="0"
            prepend-icon="mdi-export"
            @click="exportFavorites"
            :disabled="favoriteCount === 0"
          >
            导出
          </v-btn>
          <v-btn class="glass-btn px-6 transition-all" rounded="pill" elevation="0" prepend-icon="mdi-import" @click="triggerImport">
            导入
          </v-btn>
          <v-btn
            class="glass-btn px-6 transition-all"
            color="error"
            rounded="pill"
            elevation="0"
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
      <v-card class="toolbar-card mb-6 glass-panel" elevation="0">
        <v-card-text class="pa-4">
          <div class="d-flex align-center">
            <!-- 左侧：筛选和排序 -->
            <div class="d-flex align-center gap-3 flex-grow-1">
              <div class="glass-select-wrapper">
                <v-select
                  v-model="sortBy"
                  :items="sortOptions"
                  density="compact"
                  variant="plain"
                  hide-details
                  style="min-width: 140px; max-width: 200px"
                  prepend-inner-icon="mdi-sort"
                  class="glass-select"
                  :menu-props="{ contentClass: 'glass-select-menu', offset: 8 }"
                />
              </div>
            </div>

            <!-- 右侧：视图切换 -->
            <div class="view-toggle d-flex rounded-pill glass-panel p-1">
              <v-btn
                :color="viewMode === 'grid' ? 'primary' : 'transparent'"
                :class="{ 'elevation-2': viewMode === 'grid' }"
                size="small"
                rounded="pill"
                class="view-btn px-4"
                @click="viewMode = 'grid'"
              >
                <v-icon size="small" :color="viewMode === 'grid' ? 'on-primary' : 'primary'">mdi-view-grid</v-icon>
              </v-btn>
              <v-btn
                :color="viewMode === 'list' ? 'primary' : 'transparent'"
                :class="{ 'elevation-2': viewMode === 'list' }"
                size="small"
                rounded="pill"
                class="view-btn px-4"
                @click="viewMode = 'list'"
              >
                <v-icon size="small" :color="viewMode === 'list' ? 'on-primary' : 'primary'">mdi-view-list</v-icon>
              </v-btn>
            </div>
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
  min-height: calc(100vh - 64px);
}

.header-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;

  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  }
}

.header-title {
  letter-spacing: -0.5px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

.header-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-warning), 0.1);
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-warning), 0.2);

  .icon-glow {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    z-index: 0;
    filter: blur(8px);
    pointer-events: none;
  }

  .v-icon {
    z-index: 1;
    text-shadow: 0 2px 8px rgba(var(--v-theme-warning), 0.4);
  }
}

.glass-btn {
  background: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;

  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.5) !important;
    border-color: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.5) !important;
    border-color: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    color: rgb(var(--v-theme-primary));

    .v-theme--dark & {
      background: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.3);
    }
  }

  &.bg-error:hover {
    color: white !important;
    background: rgb(var(--v-theme-error)) !important;
  }
}

.glass-panel {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.glass-select-wrapper {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0 12px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &:hover {
    background: rgba(255, 255, 255, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.6);
  }

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.3) !important;
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(15, 23, 42, 0.5) !important;
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.glass-select {
  :deep(.v-field__input) {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--v-theme-primary));
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    padding-top: 8px;
    padding-bottom: 8px;

    .v-theme--dark & {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
  }

  :deep(.v-field__append-inner) {
    color: rgb(var(--v-theme-primary));
    opacity: 0.8;
  }

  :deep(.v-field__prepend-inner) {
    color: rgb(var(--v-theme-primary));
    opacity: 0.8;
  }
}

.view-btn {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(.bg-primary) {
    background: rgba(255, 255, 255, 0.5) !important;

    .v-theme--dark & {
      background: rgba(0, 0, 0, 0.3) !important;
    }
  }
}

.favorite-card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px !important;
  position: relative;

  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.3) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.4) !important;

    .v-theme--dark & {
      background: rgba(15, 23, 42, 0.5) !important;
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.image-preview {
  background-color: transparent !important;
}

.favorite-list {
  background: transparent !important;

  .list-item-modern {
    margin-bottom: 8px;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.2) !important;
    backdrop-filter: blur(12px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 8px 16px;

    .v-theme--dark & {
      background: rgba(15, 23, 42, 0.3) !important;
      border-color: rgba(255, 255, 255, 0.1);
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.5) !important;
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      border-color: rgba(255, 255, 255, 0.6);

      .v-theme--dark & {
        background-color: rgba(15, 23, 42, 0.5) !important;
        border-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}
</style>
