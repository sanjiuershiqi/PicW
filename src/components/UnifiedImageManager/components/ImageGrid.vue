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
          <v-btn
            icon="mdi-eye-outline"
            size="small"
            variant="text"
            color="medium-emphasis"
            class="mr-2"
            @click.stop="emit('preview', image)"
          />
          <v-checkbox-btn :model-value="selectedImages.includes(image.sha)" color="accent" @click.stop="handleSelect(image)" />
        </template>
      </v-list-item>
    </v-list>

    <!-- 网格视图（图片数量较少时） -->
    <v-row v-else>
      <v-col v-for="image in images" :key="image.sha" cols="12" sm="6" md="4" lg="3">
        <v-card
          class="image-card"
          :class="{ 'selected-card': selectedImages.includes(image.sha) }"
          @click="handleSelect(image)"
          elevation="0"
        >
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
  border-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 8px 32px rgba(var(--v-theme-accent), 0.2), 0 0 0 2px rgb(var(--v-theme-accent)) !important;
  transform: translateY(-4px) scale(1.02);

  .selected-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgb(var(--v-theme-accent));
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(var(--v-theme-accent), 0.4);
    border: 2px solid rgba(255, 255, 255, 0.8);
    animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.image-card {
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
  cursor: pointer;
  background: transparent;
}

.image-actions {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

.image-name {
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

.image-list {
  background: transparent !important;
  padding: 0;

  .selected-item {
    background-color: rgba(255, 255, 255, 0.4) !important;
    border-left: 4px solid rgb(var(--v-theme-accent)) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateX(4px);

    .v-theme--dark & {
      background-color: rgba(15, 23, 42, 0.6) !important;
    }
  }

  .list-item-modern {
    margin-bottom: 8px;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-left: 4px solid transparent;
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

.selected-overlay {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(2px) saturate(120%);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2) !important;
  }
}
</style>
