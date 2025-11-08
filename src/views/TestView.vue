<template>
  <v-container fluid class="pa-4">
    <!-- 页面标题 -->
    <v-card class="mb-6" elevation="2">
      <v-card-text class="d-flex align-center pa-6">
        <v-avatar color="primary" size="48" class="me-4">
          <v-icon icon="mdi-test-tube" size="28" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">组件测试中心</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">测试和预览各个 UI 组件的功能和样式</p>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- 左侧：组件列表 -->
      <v-col cols="12" md="3">
        <v-card elevation="2" class="sticky-nav">
          <v-card-title
            class="text-subtitle-1 font-weight-bold d-flex align-center"
            style="cursor: pointer"
            @click="navExpanded = !navExpanded"
          >
            <v-icon icon="mdi-view-list" class="me-2" />
            组件列表
            <v-spacer />
            <v-btn :icon="navExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" size="small" />
          </v-card-title>
          <v-expand-transition>
            <div v-show="navExpanded">
              <v-divider />
              <v-list density="compact" nav>
                <v-list-item
                  v-for="component in components"
                  :key="component.id"
                  :value="component.id"
                  :active="activeComponent === component.id"
                  @click="scrollToComponent(component.id)"
                  :prepend-icon="component.icon"
                >
                  <v-list-item-title>{{ component.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>

      <!-- 右侧：组件展示 -->
      <v-col cols="12" md="9">
        <!-- 空状态组件 -->
        <v-card :id="components[0].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[0].icon" class="me-2" />
            {{ components[0].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">用于显示空状态的组件，支持自定义图标、标题、描述和操作按钮。</p>
            <EmptyState
              icon="mdi-image-outline"
              title="没有图片"
              description="这是一个空状态组件的示例，点击下方按钮触发操作"
              :show-action="true"
              action-text="上传图片"
              action-icon="mdi-upload"
              @action="handleAction"
            />
          </v-card-text>
        </v-card>

        <!-- 骨架屏组件 -->
        <v-card :id="components[1].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[1].icon" class="me-2" />
            {{ components[1].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">在内容加载时显示的占位符，提升用户体验。</p>
            <v-btn
              @click="showSkeleton = !showSkeleton"
              :color="showSkeleton ? 'error' : 'primary'"
              variant="flat"
              class="mb-4"
              :prepend-icon="showSkeleton ? 'mdi-eye-off' : 'mdi-eye'"
            >
              {{ showSkeleton ? '隐藏骨架屏' : '显示骨架屏' }}
            </v-btn>
            <SkeletonLoader v-if="showSkeleton" type="image-grid" :count="6" />
            <v-alert v-else type="info" variant="tonal" class="mt-4"> 点击上方按钮查看骨架屏效果 </v-alert>
          </v-card-text>
        </v-card>

        <!-- 主题设置组件 -->
        <v-card :id="components[2].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[2].icon" class="me-2" />
            {{ components[2].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">主题切换和自定义设置组件，支持浅色、深色和自动模式。</p>
            <ThemeSettings />
          </v-card-text>
        </v-card>

        <!-- 标签管理组件 -->
        <v-card :id="components[3].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[3].icon" class="me-2" />
            {{ components[3].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">用于管理和选择标签的组件，支持创建、编辑和删除标签。</p>
            <TagManager @tag-selected="handleTagSelected" />
          </v-card-text>
        </v-card>

        <!-- 图片筛选组件 -->
        <v-card :id="components[4].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[4].icon" class="me-2" />
            {{ components[4].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">提供多种筛选条件，帮助用户快速找到目标图片。</p>
            <ImageFilter @update:filters="handleFiltersUpdate" />
          </v-card-text>
        </v-card>

        <!-- 批量操作组件 -->
        <v-card :id="components[5].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[5].icon" class="me-2" />
            {{ components[5].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">支持批量选择和操作多个项目，提高工作效率。</p>
            <BatchOperations
              :items="mockItems"
              :selected-items="selectedItems"
              @update:selected-items="selectedItems = $event"
              @delete-items="handleBatchDelete"
              @add-tags="handleBatchAddTags"
            />
          </v-card-text>
        </v-card>

        <!-- 图片统计组件 -->
        <v-card :id="components[6].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="components[6].icon" class="me-2" />
            {{ components[6].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">可用</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">展示图片库的统计信息，包括数量、大小、类型分布等。</p>
            <ImageStatistics :images="mockImageData" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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

// 组件列表
const components = [
  { id: 'empty-state', name: '空状态组件', icon: 'mdi-image-off-outline' },
  { id: 'skeleton', name: '骨架屏组件', icon: 'mdi-loading' },
  { id: 'theme', name: '主题设置', icon: 'mdi-palette' },
  { id: 'tags', name: '标签管理', icon: 'mdi-tag-multiple' },
  { id: 'filter', name: '图片筛选', icon: 'mdi-filter' },
  { id: 'batch', name: '批量操作', icon: 'mdi-checkbox-multiple-marked' },
  { id: 'statistics', name: '图片统计', icon: 'mdi-chart-bar' }
]

const activeComponent = ref('empty-state')
const showSkeleton = ref(false)
const selectedItems = ref<string[]>([])
const navExpanded = ref(true)

// 滚动到指定组件
const scrollToComponent = (id: string) => {
  activeComponent.value = id
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

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
.sticky-nav {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

// 平滑滚动
html {
  scroll-behavior: smooth;
}
</style>
