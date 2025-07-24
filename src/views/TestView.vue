<template>
  <v-container>
    <h1 class="text-h4 mb-6">组件测试页面</h1>

    <!-- 空状态组件测试 -->
    <v-card class="mb-6">
      <v-card-title>空状态组件</v-card-title>
      <v-card-text>
        <EmptyState
          icon="mdi-image-outline"
          title="没有图片"
          description="这是一个空状态组件的示例"
          :show-action="true"
          action-text="上传图片"
          action-icon="mdi-upload"
          @action="handleAction"
        />
      </v-card-text>
    </v-card>

    <!-- 骨架屏组件测试 -->
    <v-card class="mb-6">
      <v-card-title>骨架屏组件</v-card-title>
      <v-card-text>
        <v-btn @click="showSkeleton = !showSkeleton" class="mb-4"> {{ showSkeleton ? '隐藏' : '显示' }}骨架屏 </v-btn>
        <SkeletonLoader v-if="showSkeleton" type="image-grid" :count="6" />
      </v-card-text>
    </v-card>

    <!-- 主题设置组件测试 -->
    <v-card class="mb-6">
      <v-card-title>主题设置组件</v-card-title>
      <v-card-text>
        <ThemeSettings />
      </v-card-text>
    </v-card>

    <!-- 标签管理组件测试 -->
    <v-card class="mb-6">
      <v-card-title>标签管理组件</v-card-title>
      <v-card-text>
        <TagManager @tag-selected="handleTagSelected" />
      </v-card-text>
    </v-card>

    <!-- 图片筛选组件测试 -->
    <v-card class="mb-6">
      <v-card-title>图片筛选组件</v-card-title>
      <v-card-text>
        <ImageFilter @update:filters="handleFiltersUpdate" />
      </v-card-text>
    </v-card>

    <!-- 批量操作组件测试 -->
    <v-card class="mb-6">
      <v-card-title>批量操作组件</v-card-title>
      <v-card-text>
        <BatchOperations
          :items="mockItems"
          :selected-items="selectedItems"
          @update:selected-items="selectedItems = $event"
          @delete-items="handleBatchDelete"
          @add-tags="handleBatchAddTags"
        />
      </v-card-text>
    </v-card>

    <!-- 图片统计组件测试 -->
    <v-card class="mb-6">
      <v-card-title>图片统计组件</v-card-title>
      <v-card-text>
        <ImageStatistics :images="mockImageData" />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import BatchOperations from '@/components/BatchOperations.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImageFilter from '@/components/ImageFilter.vue'
import ImageStatistics from '@/components/ImageStatistics.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TagManager from '@/components/TagManager.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { ref } from 'vue'

import type { ImageFilters } from '@/components/ImageFilter.vue'

const { showMessage } = useSnackBarStore()

const showSkeleton = ref(false)
const selectedItems = ref<string[]>([])

// 模拟数据
const mockItems = [
  {
    id: '1',
    name: 'image1.jpg',
    type: 'image/jpeg',
    size: 1024 * 500, // 500KB
    uploadedAt: new Date(),
    url: 'https://picsum.photos/300/200?random=1'
  },
  {
    id: '2',
    name: 'image2.png',
    type: 'image/png',
    size: 1024 * 1024 * 2, // 2MB
    uploadedAt: new Date(),
    url: 'https://picsum.photos/300/200?random=2'
  },
  {
    id: '3',
    name: 'image3.gif',
    type: 'image/gif',
    size: 1024 * 100, // 100KB
    uploadedAt: new Date(),
    url: 'https://picsum.photos/300/200?random=3'
  }
]

const mockImageData = [
  {
    id: '1',
    name: 'image1.jpg',
    size: 1024 * 500,
    type: 'jpg',
    uploadedAt: new Date(),
    tags: ['nature', 'landscape']
  },
  {
    id: '2',
    name: 'image2.png',
    size: 1024 * 1024 * 2,
    type: 'png',
    uploadedAt: new Date(),
    tags: ['ui', 'design']
  },
  {
    id: '3',
    name: 'image3.gif',
    size: 1024 * 100,
    type: 'gif',
    uploadedAt: new Date(),
    tags: ['animation']
  },
  {
    id: '4',
    name: 'image4.webp',
    size: 1024 * 800,
    type: 'webp',
    uploadedAt: new Date(),
    tags: ['photo', 'portrait']
  }
]

// 事件处理
const handleAction = () => {
  showMessage('空状态组件操作被触发', { color: 'info' })
}

const handleTagSelected = (tagId: string) => {
  showMessage(`选择了标签: ${tagId}`, { color: 'success' })
}

const handleFiltersUpdate = (filters: ImageFilters) => {
  console.log('筛选条件更新:', filters)
  showMessage('筛选条件已更新', { color: 'info' })
}

const handleBatchDelete = (itemIds: string[]) => {
  console.log('批量删除:', itemIds)
  showMessage(`批量删除 ${itemIds.length} 项`, { color: 'warning' })
}

const handleBatchAddTags = (itemIds: string[], tagIds: string[]) => {
  console.log('批量添加标签:', itemIds, tagIds)
  showMessage(`为 ${itemIds.length} 项添加 ${tagIds.length} 个标签`, { color: 'success' })
}
</script>

<style scoped lang="scss">
.v-card {
  margin-bottom: 24px;
}
</style>
