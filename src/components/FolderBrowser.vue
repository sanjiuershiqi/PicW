<template>
  <v-card variant="flat" class="folder-browser mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-folder-open" class="me-2" />
      文件夹浏览
      <v-spacer />
      <v-btn variant="text" size="small" prepend-icon="mdi-refresh" @click="refreshContent" class="me-2"> 刷新 </v-btn>
      <v-btn variant="text" size="small" prepend-icon="mdi-home" @click="goToRoot"> 根目录 </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- 面包屑导航 -->
      <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4" divider="/">
        <template #item="{ item }">
          <v-breadcrumbs-item :disabled="item.disabled" @click="navigateToPath(item.path)" class="breadcrumb-item">
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>

      <!-- 快速导航 -->
      <div class="d-flex align-center mb-4">
        <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" :disabled="!canGoBack" @click="goBack"> 返回上级 </v-btn>

        <v-spacer />

        <!-- 路径输入 -->
        <v-text-field
          v-model="pathInput"
          label="直接输入路径"
          prepend-inner-icon="mdi-folder"
          variant="outlined"
          density="compact"
          style="max-width: 300px"
          @keyup.enter="navigateToPath(pathInput)"
          hide-details
        />

        <v-btn variant="text" icon="mdi-arrow-right" @click="navigateToPath(pathInput)" class="ml-2" />
      </div>

      <!-- 文件夹列表 -->
      <div v-if="folders.length > 0" class="mb-4">
        <h4 class="text-subtitle-2 mb-2 text-medium-emphasis">
          <v-icon icon="mdi-folder" size="small" class="me-1" />
          文件夹 ({{ folders.length }})
        </h4>
        <v-row>
          <v-col v-for="folder in folders" :key="folder.path" cols="12" sm="6" md="4" lg="3">
            <v-card variant="tonal" class="folder-card" @click="navigateToFolder(folder)">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-folder" size="48" color="primary" class="mb-2" />
                <div class="text-subtitle-2 font-weight-medium">
                  {{ folder.name }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(folder.name) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- 图片预览 -->
      <div v-if="images.length > 0">
        <h4 class="text-subtitle-2 mb-2 text-medium-emphasis">
          <v-icon icon="mdi-image-multiple" size="small" class="me-1" />
          图片 ({{ images.length }})
        </h4>
        <v-row>
          <v-col v-for="image in images.slice(0, showAllImages ? images.length : 6)" :key="image.sha" cols="6" sm="4" md="3" lg="2">
            <v-card class="image-preview-card">
              <v-img :src="getImageUrl(image)" :alt="image.name" height="120" cover class="image-preview">
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate size="24" />
                  </div>
                </template>
              </v-img>
              <v-card-subtitle class="text-caption pa-2">
                {{ image.name }}
              </v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>

        <!-- 显示更多按钮 -->
        <div v-if="images.length > 6" class="text-center mt-4">
          <v-btn variant="text" @click="showAllImages = !showAllImages">
            {{ showAllImages ? '收起' : `显示全部 ${images.length} 张图片` }}
            <v-icon :icon="showAllImages ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
          </v-btn>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="folders.length === 0 && images.length === 0 && !loading" class="text-center py-8">
        <EmptyState icon="mdi-folder-open-outline" title="文件夹为空" description="当前文件夹中没有任何内容" :show-action="false" />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate size="48" />
        <p class="text-subtitle-2 mt-4">正在加载文件夹内容...</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import { useCodeStore } from '@/plugins/stores/code'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

interface FolderItem {
  name: string
  path: string
  type: 'dir'
  sha: string
}

interface ImageItem {
  name: string
  path: string
  type: 'file'
  sha: string
  size: number
}

interface Props {
  currentPath: string
  folders: FolderItem[]
  images: ImageItem[]
  loading?: boolean
  username: string
  repository: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  navigate: [path: string]
  'folder-selected': [folder: FolderItem]
  refresh: []
}>()

const { getCdnUrlItems } = storeToRefs(useCodeStore())

const showAllImages = ref(false)
const pathInput = ref('')

// 监听当前路径变化，更新路径输入
watch(
  () => props.currentPath,
  newPath => {
    pathInput.value = newPath
  },
  { immediate: true }
)

// 面包屑导航
const breadcrumbItems = computed(() => {
  const parts = props.currentPath.split('/').filter(Boolean)
  const items = [
    {
      title: '根目录',
      path: '/',
      disabled: false
    }
  ]

  let currentPath = ''
  parts.forEach(part => {
    currentPath += `/${part}`
    items.push({
      title: part,
      path: currentPath,
      disabled: false
    })
  })

  // 最后一项设为禁用
  if (items.length > 0) {
    items[items.length - 1].disabled = true
  }

  return items
})

// 是否可以返回上级
const canGoBack = computed(() => {
  return props.currentPath !== '/' && props.currentPath !== ''
})

// 获取图片URL
const getImageUrl = (image: ImageItem) => {
  return getCdnUrlItems.value(props.username, props.repository, props.currentPath, image.name)[0]?.text || ''
}

// 格式化日期（这里可以根据实际需求调整）
const formatDate = (name: string) => {
  return '文件夹'
}

// 导航方法
const navigateToPath = (path: string) => {
  // 清理路径
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  emit('navigate', cleanPath)
}

const navigateToFolder = (folder: FolderItem) => {
  emit('folder-selected', folder)
  emit('navigate', folder.path)
}

const goBack = () => {
  const parts = props.currentPath.split('/').filter(Boolean)
  parts.pop()
  const parentPath = parts.length > 0 ? `/${parts.join('/')}` : '/'
  emit('navigate', parentPath)
}

const goToRoot = () => {
  emit('navigate', '/')
}

const refreshContent = () => {
  emit('refresh')
}
</script>

<style scoped lang="scss">
.folder-browser {
  .breadcrumb-item {
    cursor: pointer;

    &:hover:not(.v-breadcrumbs-item--disabled) {
      color: rgb(var(--v-theme-primary));
    }
  }

  .folder-card {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .image-preview-card {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.02);
    }

    .image-preview {
      cursor: pointer;
    }
  }
}

// 响应式调整
@media (max-width: 600px) {
  .folder-browser {
    .breadcrumb-item {
      font-size: 0.875rem;
    }
  }
}
</style>
