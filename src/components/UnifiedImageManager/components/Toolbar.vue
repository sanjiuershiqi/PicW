<template>
  <v-card class="image-toolbar-card mb-4" elevation="0" rounded="xl">
    <v-card-text class="d-flex align-center pa-4">
      <!-- 左侧：导航区域 -->
      <div class="d-flex align-center flex-grow-1">
        <!-- 返回按钮 -->
        <v-btn v-if="canGoBack" icon variant="flat" size="small" color="surface-variant" @click="emit('go-back')" class="me-3 back-btn elevation-1">
          <v-icon size="small">mdi-arrow-left</v-icon>
          <v-tooltip activator="parent" location="bottom"> Go Back </v-tooltip>
        </v-btn>

        <!-- 面包屑导航 -->
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-0 breadcrumb-modern">
          <template #divider>
            <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              :to="item.disabled ? undefined : { path: '#' }"
              @click.prevent="!item.disabled && emit('navigate', item.path)"
              class="text-body-2 font-weight-medium"
              :class="item.disabled ? 'text-medium-emphasis' : 'text-accent'"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </div>

      <v-spacer />

      <!-- 右侧：操作区域 -->
      <div class="d-flex align-center toolbar-actions">
        <!-- 排序选择 -->
        <v-select
          :model-value="sortBy"
          @update:model-value="emit('update:sortBy', $event)"
          :items="sortOptions"
          density="compact"
          variant="plain"
          hide-details
          prepend-inner-icon="mdi-sort-variant"
          class="modern-select"
          style="min-width: 140px; max-width: 180px"
        />

        <div class="divider-dot mx-3"></div>

        <!-- 视图模式切换 -->
        <div class="view-toggle bg-surface-variant rounded-pill p-1 d-flex">
          <v-btn
            :color="viewMode === 'grid' ? 'surface' : 'transparent'"
            :class="{'elevation-1': viewMode === 'grid'}"
            size="small"
            rounded="pill"
            class="px-3"
            @click="emit('update:viewMode', 'grid')"
          >
            <v-icon size="small">mdi-view-grid-outline</v-icon>
          </v-btn>
          <v-btn
            :color="viewMode === 'list' ? 'surface' : 'transparent'"
            :class="{'elevation-1': viewMode === 'list'}"
            size="small"
            rounded="pill"
            class="px-3"
            @click="emit('update:viewMode', 'list')"
          >
            <v-icon size="small">mdi-format-list-bulleted</v-icon>
          </v-btn>
        </div>

        <div class="divider-dot mx-3"></div>

        <!-- 仅显示图片按钮 -->
        <v-btn
          :color="showImagesOnly ? 'accent' : 'medium-emphasis'"
          variant="text"
          size="small"
          icon
          class="action-btn"
          @click="emit('update:showImagesOnly', !showImagesOnly)"
        >
          <v-icon size="small">{{ showImagesOnly ? 'mdi-image-outline' : 'mdi-folder-multiple-image' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ showImagesOnly ? 'Show all files' : 'Show images only' }}
          </v-tooltip>
        </v-btn>

        <!-- 文件类型筛选 -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :color="fileTypeFilter.length > 0 ? 'accent' : 'medium-emphasis'"
              variant="text"
              size="small"
              icon
              class="action-btn ml-1"
            >
              <v-badge v-if="fileTypeFilter.length > 0" dot color="error" class="filter-badge">
                <v-icon size="small">mdi-filter-variant</v-icon>
              </v-badge>
              <v-icon v-else size="small">mdi-filter-variant</v-icon>
              <v-tooltip activator="parent" location="bottom"> Filter file types </v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact" class="rounded-xl mt-2 elevation-4" bg-color="surface">
            <v-list-subheader class="text-caption font-weight-bold px-4">FILE TYPES</v-list-subheader>
            <v-list-item v-for="option in fileTypeOptions" :key="option.value" @click="toggleFileType(option.value)" class="mx-2 rounded-lg mb-1">
              <template #prepend>
                <v-checkbox-btn
                  :model-value="fileTypeFilter.includes(option.value)"
                  @click.stop="toggleFileType(option.value)"
                  density="compact"
                  color="accent"
                />
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ option.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- 高级搜索按钮 -->
        <v-btn variant="text" size="small" icon color="accent" class="action-btn ml-1" @click="emit('advanced-search')">
          <v-icon size="small">mdi-magnify-expand</v-icon>
          <v-tooltip activator="parent" location="bottom"> Advanced Search </v-tooltip>
        </v-btn>

        <!-- 刷新按钮 -->
        <v-btn variant="text" size="small" icon color="medium-emphasis" class="action-btn ml-1" @click="emit('refresh')">
          <v-icon size="small">mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom"> Refresh </v-tooltip>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, SortOption, FileTypeOption, ViewMode, SortBy } from '../types'

interface Props {
  breadcrumbItems: BreadcrumbItem[]
  canGoBack: boolean
  viewMode: ViewMode
  sortBy: SortBy
  sortOptions: SortOption[]
  fileTypeFilter: string[]
  fileTypeOptions: FileTypeOption[]
  showImagesOnly: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'navigate', path: string): void
  (e: 'go-back'): void
  (e: 'update:viewMode', mode: ViewMode): void
  (e: 'update:sortBy', sort: SortBy): void
  (e: 'update:fileTypeFilter', types: string[]): void
  (e: 'update:showImagesOnly', value: boolean): void
  (e: 'advanced-search'): void
  (e: 'refresh'): void
}>()

const toggleFileType = (type: string) => {
  const current = [...props.fileTypeFilter]
  const index = current.indexOf(type)
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(type)
  }
  emit('update:fileTypeFilter', current)
}
</script>

<style scoped lang="scss">
.image-toolbar-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.back-btn {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.08) !important;
    transform: translateX(-2px);
  }
}

.breadcrumb-modern {
  :deep(.v-breadcrumbs-item) {
    padding: 0 4px;
    transition: color 0.2s;
    
    &:hover:not(.v-breadcrumbs-item--disabled) {
      color: rgb(var(--v-theme-accent)) !important;
      opacity: 0.8;
    }
  }
}

.divider-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.2);
}

.modern-select {
  :deep(.v-field__input) {
    font-size: 0.875rem;
    font-weight: 500;
  }
}

.action-btn {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  background: transparent;
  
  &:hover {
    background: rgba(var(--v-theme-accent), 0.1) !important;
    color: rgb(var(--v-theme-accent)) !important;
    transform: scale(1.05);
  }
}

.filter-badge {
  :deep(.v-badge__badge) {
    right: 2px;
    top: 2px;
  }
}

// 响应式调整
@media (max-width: 960px) {
  .toolbar-actions {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .divider-dot {
    display: none;
  }
}

@media (max-width: 600px) {
  .image-toolbar-card {
    .v-breadcrumbs {
      max-width: 150px;
      overflow: hidden;
    }

    .v-select {
      min-width: 120px !important;
    }
  }
}
</style>
