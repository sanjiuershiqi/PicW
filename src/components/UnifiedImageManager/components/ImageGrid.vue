<template>
  <div>
    <!-- 使用虚拟滚动（当图片数量超过阈值时） -->
    <VirtualImageGrid
      v-if="useVirtualScroll"
      :items="virtualScrollImages"
      :selected-items="selectedImages"
      @image-click="handleVirtualSelect"
      @preview="handleVirtualPreview"
    />

    <!-- 列表视图 -->
    <v-list v-else-if="viewMode === 'list'" class="image-list">
      <v-list-item
        v-for="image in images"
        :key="image.sha"
        class="list-item-modern"
        :class="{ 'selected-item': selectedImages.includes(image.sha) }"
        @click="handleSelect(image)"
      >
        <template #prepend>
          <v-avatar size="60" rounded="lg" class="elevation-2">
            <v-img :src="getImageUrl(image)" :alt="image.name" cover @error="e => handleImageError(e, image)">
              <template #placeholder>
                <v-progress-circular indeterminate size="20" color="accent" />
              </template>
              <template #error>
                <v-icon color="medium-emphasis">mdi-image-broken-variant</v-icon>
              </template>
            </v-img>
          </v-avatar>
        </template>

        <v-list-item-title class="image-name">{{ image.name }}</v-list-item-title>
        <v-list-item-subtitle class="text-medium-emphasis">
          {{ formatFileSize(image.size) }}
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            :icon="favoritesStore.isFavorite(image.sha) ? 'mdi-star' : 'mdi-star-outline'"
            size="small"
            :color="favoritesStore.isFavorite(image.sha) ? 'accent' : 'medium-emphasis'"
            variant="text"
            class="mr-1"
            @click.stop="handleToggleFavorite(image)"
          />
          <v-btn icon="mdi-eye-outline" size="small" variant="text" color="medium-emphasis" class="mr-2" @click.stop="emit('preview', image)" />
          <v-checkbox-btn :model-value="selectedImages.includes(image.sha)" color="accent" @click.stop="handleSelect(image)" />
        </template>
      </v-list-item>
    </v-list>

    <!-- 网格视图（图片数量较少时） -->
    <v-row v-else>
      <v-col v-for="image in images" :key="image.sha" cols="12" sm="6" md="4" lg="3">
        <v-card class="image-card" :class="{ 'selected-card': selectedImages.includes(image.sha) }" @click="handleSelect(image)" elevation="0">
          <div class="overflow-hidden">
            <v-img
              :src="getImageUrl(image)"
              :lazy-src="getPlaceholderUrl(image)"
              :alt="image.name"
              aspect-ratio="1"
              cover
              loading="lazy"
              class="image-preview"
              @error="e => handleImageError(e, image)"
            >
              <template #placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="accent" />
                </v-row>
              </template>
              <template #error>
                <v-row class="fill-height ma-0 bg-surface-variant" align="center" justify="center">
                  <v-icon size="48" color="medium-emphasis">mdi-image-broken-variant</v-icon>
                </v-row>
              </template>
            </v-img>
          </div>

          <v-card-actions class="pa-3 image-actions">
            <v-tooltip location="top" open-delay="300">
              <template #activator="{ props }">
                <div v-bind="props" class="text-truncate image-name text-body-2 flex-grow-1">
                  {{ image.name }}
                </div>
              </template>
              <span class="font-mono text-uppercase">{{ image.name }}</span>
            </v-tooltip>

            <v-btn
              :icon="favoritesStore.isFavorite(image.sha) ? 'mdi-star' : 'mdi-star-outline'"
              size="small"
              :color="favoritesStore.isFavorite(image.sha) ? 'accent' : 'primary'"
              variant="text"
              @click.stop="handleToggleFavorite(image)"
            />
            <v-btn icon="mdi-eye-outline" size="small" variant="text" color="primary" @click.stop="emit('preview', image)" />
          </v-card-actions>

          <!-- 选中标记 -->
          <div v-if="selectedImages.includes(image.sha)" class="selected-badge">
            <v-icon size="small">mdi-check</v-icon>
          </div>
          <v-overlay v-if="selectedImages.includes(image.sha)" contained class="selected-overlay" opacity="1"></v-overlay>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/plugins/stores/user'
import { useCodeStore } from '@/plugins/stores/code'
import { useFavoritesStore } from '@/plugins/stores/favorites'
import { storeToRefs } from 'pinia'
import VirtualImageGrid from '@/components/VirtualImageGrid.vue'
import type { ImageItem } from '../types'

interface Props {
  images: ImageItem[]
  selectedImages: string[]
  viewMode?: 'grid' | 'list'
  virtualScrollThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  virtualScrollThreshold: 100
})

const emit = defineEmits<{
  (e: 'select', image: ImageItem): void
  (e: 'preview', image: ImageItem): void
}>()

const userStore = useUserStore()
const { getCdnUrlItems } = storeToRefs(useCodeStore())
const favoritesStore = useFavoritesStore()

// 图片 URL 缓存（用于存储失败后的备用 URL）
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

  // 备用 CDN
  return `https://cdn.jsdelivr.net/gh/${userStore.name}/${userStore.repository}@master/${image.path}`
}

// 获取 GitHub raw URL（备用方案）
const getGithubRawUrl = (image: ImageItem): string => {
  return `https://raw.githubusercontent.com/${userStore.name}/${userStore.repository}/master/${image.path}`
}

// 获取图片 URL（优先 CDN，失败后使用缓存的备用 URL）
const getImageUrl = (image: ImageItem): string => {
  // 检查是否已经有备用 URL
  const cachedUrl = imageUrlCache.get(image.sha)
  if (cachedUrl) {
    return cachedUrl
  }

  // 默认使用 CDN
  return getCdnUrl(image)
}

// 获取占位符 URL（极小的模糊图片）
const getPlaceholderUrl = (image: ImageItem): string => {
  // 使用 1x1 透明 GIF 作为占位符
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
}

// 处理收藏切换
const handleToggleFavorite = (image: ImageItem) => {
  const favoriteItem = {
    sha: image.sha,
    name: image.name,
    path: image.path,
    size: image.size,
    url: getImageUrl(image),
    repository: userStore.repository,
    username: userStore.name
  }
  favoritesStore.toggleFavorite(favoriteItem)
}

// 处理图片加载错误（自动切换到 GitHub raw URL）
const handleImageError = (event: Event, image: ImageItem) => {
  const imgElement = event.target as HTMLImageElement
  const currentUrl = imgElement.src

  // 如果当前是 CDN URL，切换到 GitHub raw URL
  if (currentUrl.includes('cdn.jsdelivr.net') || currentUrl.includes('unpkg.com')) {
    const githubUrl = getGithubRawUrl(image)
    console.log(`CDN 加载失败，切换到 GitHub raw URL: ${image.name}`)

    // 缓存备用 URL
    imageUrlCache.set(image.sha, githubUrl)

    // 更新图片源
    imgElement.src = githubUrl
  } else {
    console.warn('图片加载失败（所有源都尝试过）:', image.name)
  }
}

// 处理选择
const handleSelect = (image: ImageItem) => {
  emit('select', image)
}

// 是否使用虚拟滚动
const useVirtualScroll = computed(() => {
  return props.images.length > props.virtualScrollThreshold
})

// 为虚拟滚动组件转换图片数据（添加 url 属性）
const virtualScrollImages = computed(() => {
  return props.images.map(img => ({
    ...img,
    url: getImageUrl(img)
  }))
})

// 处理虚拟滚动组件的事件
const handleVirtualSelect = (item: ImageItem & { url: string }) => {
  const { url, ...image } = item
  emit('select', image)
}

const handleVirtualPreview = (item: ImageItem & { url: string }) => {
  const { url, ...image } = item
  emit('preview', image)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
.selected-card {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)) !important;
  transform: translateY(-2px);
  
  .selected-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
    width: 24px;
    height: 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.image-card {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-border-color));
  transition: all 0.2s ease;
  background: rgb(var(--v-theme-surface));
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: rgba(var(--v-theme-primary), 0.2);
  }
}

.image-preview {
  cursor: pointer;
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgb(var(--v-theme-border-color));
}

.image-actions {
  background: rgb(var(--v-theme-surface));
}

.image-name {
  font-weight: 500;
}

.image-list {
  background: transparent;
  border: 1px solid rgb(var(--v-theme-border-color));
  border-radius: 8px;
  padding: 0;
  
  .selected-item {
    background-color: rgba(var(--v-theme-primary), 0.04) !important;
    border-left: 3px solid rgb(var(--v-theme-primary)) !important;
  }

  .list-item-modern {
    margin-bottom: 0;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid rgb(var(--v-theme-border-color));
    border-left: 3px solid transparent;
    background: rgb(var(--v-theme-surface));
    transition: all 0.15s ease;
    padding: 12px 16px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.02);
    }
  }
}

.selected-overlay {
  background: rgba(var(--v-theme-primary), 0.05) !important;
}
</style>
