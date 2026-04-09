<template>
  <v-card class="image-toolbar-card mb-6" elevation="0">
    <v-card-text class="d-flex align-center pa-2 px-4">
      <!-- 左侧：导航区域 -->
      <div class="d-flex align-center flex-grow-1">
        <!-- 返回按钮 -->
        <v-btn v-if="canGoBack" icon variant="flat" size="small" color="surface-variant" @click="emit('go-back')" class="me-3 back-btn rounded-md">
          <v-icon size="small" color="secondary">mdi-arrow-left</v-icon>
        </v-btn>

        <!-- 面包屑导航 -->
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-0 breadcrumb-util">
          <template #divider>
            <v-icon size="small" color="secondary">mdi-chevron-right</v-icon>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              :to="item.disabled ? undefined : { path: '#' }"
              @click.prevent="!item.disabled && emit('navigate', item.path)"
              class="text-body-2 font-weight-medium"
              :class="item.disabled ? 'text-secondary' : 'text-primary'"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </div>

      <!-- 右侧：操作区域 -->
      <div class="d-flex align-center toolbar-actions">
        <!-- 排序选择 -->
        <v-select
          :model-value="sortBy"
          @update:model-value="emit('update:sortBy', $event)"
          :items="sortOptions"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-sort-variant"
          class="util-select"
          style="min-width: 140px; max-width: 180px"
        />

        <div class="divider-vertical mx-4"></div>

        <!-- 视图模式切换 -->
        <div class="view-toggle d-flex rounded-md bg-surface-variant p-1">
          <v-btn
            :color="viewMode === 'grid' ? 'surface' : 'transparent'"
            :class="{'elevation-1': viewMode === 'grid'}"
            size="small"
            rounded="md"
            class="view-btn"
            @click="emit('update:viewMode', 'grid')"
          >
            <v-icon size="small" :color="viewMode === 'grid' ? 'primary' : 'secondary'">mdi-view-grid-outline</v-icon>
          </v-btn>
          <v-btn
            :color="viewMode === 'list' ? 'surface' : 'transparent'"
            :class="{'elevation-1': viewMode === 'list'}"
            size="small"
            rounded="md"
            class="view-btn"
            @click="emit('update:viewMode', 'list')"
          >
            <v-icon size="small" :color="viewMode === 'list' ? 'primary' : 'secondary'">mdi-format-list-bulleted</v-icon>
          </v-btn>
        </div>

        <div class="divider-vertical mx-4"></div>

        <!-- 操作按钮组 -->
        <div class="d-flex gap-2">
          <v-btn
            :color="showImagesOnly ? 'primary' : 'secondary'"
            :variant="showImagesOnly ? 'tonal' : 'text'"
            size="small"
            class="action-btn rounded-md"
            @click="emit('update:showImagesOnly', !showImagesOnly)"
          >
            <v-icon size="small">{{ showImagesOnly ? 'mdi-image-outline' : 'mdi-folder-multiple-image' }}</v-icon>
          </v-btn>

          <!-- 文件类型筛选 -->
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :color="fileTypeFilter.length > 0 ? 'primary' : 'secondary'"
                :variant="fileTypeFilter.length > 0 ? 'tonal' : 'text'"
                size="small"
                class="action-btn rounded-md"
              >
                <v-icon size="small">mdi-filter-variant</v-icon>
                <span v-if="fileTypeFilter.length > 0" class="filter-count">{{ fileTypeFilter.length }}</span>
              </v-btn>
            </template>
            <v-list density="compact" class="util-menu rounded-lg mt-2" elevation="4">
              <v-list-subheader class="text-caption font-weight-medium">File Types</v-list-subheader>
              <v-list-item v-for="option in fileTypeOptions" :key="option.value" @click="toggleFileType(option.value)" class="menu-item">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="fileTypeFilter.includes(option.value)"
                    @click.stop="toggleFileType(option.value)"
                    density="compact"
                    color="primary"
                    class="mr-2"
                  />
                </template>
                <v-list-item-title class="text-body-2">{{ option.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn variant="text" size="small" color="secondary" class="action-btn rounded-md" @click="emit('advanced-search')">
            <v-icon size="small">mdi-magnify-expand</v-icon>
          </v-btn>

          <v-btn variant="text" size="small" color="secondary" class="action-btn rounded-md" @click="emit('refresh')">
            <v-icon size="small">mdi-refresh</v-icon>
          </v-btn>
        </div>
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
  border: 1px solid rgb(var(--v-theme-border-color));
  background: rgb(var(--v-theme-surface));
}

.back-btn {
  border: 1px solid rgb(var(--v-theme-border-color));
  background: transparent !important;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.05) !important;
    color: rgb(var(--v-theme-primary)) !important;
    border-color: rgba(var(--v-theme-primary), 0.2);
  }
}

.breadcrumb-util {
  :deep(.v-breadcrumbs-item) {
    padding: 0 4px;
    transition: color 0.15s ease;
    
    &:hover:not(.v-breadcrumbs-item--disabled) {
      color: rgb(var(--v-theme-primary)) !important;
      background: rgba(var(--v-theme-primary), 0.05);
      border-radius: 4px;
    }
  }
}

.divider-vertical {
  width: 1px;
  height: 24px;
  background-color: rgb(var(--v-theme-border-color));
}

.util-select {
  :deep(.v-field__input) {
    font-size: 0.875rem;
    font-weight: 500;
  }
}

.view-btn {
  transition: all 0.15s ease;
  
  &:hover:not(.bg-surface) {
    background: rgba(var(--v-theme-primary), 0.05) !important;
  }
}

.action-btn {
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(var(--v-theme-primary), 0.05) !important;
    color: rgb(var(--v-theme-primary)) !important;
  }
}

.filter-count {
  margin-left: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 0 6px;
  border-radius: 10px;
  line-height: 16px;
}

.util-menu {
  border: 1px solid rgb(var(--v-theme-border-color));
  
  .menu-item {
    transition: background-color 0.15s ease;
    
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.05);
    }
  }
}

// 响应式调整
@media (max-width: 960px) {
  .toolbar-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .divider-vertical {
    display: none;
  }
}

@media (max-width: 600px) {
  .image-toolbar-card {
    .v-breadcrumbs {
      max-width: 150px;
      overflow: hidden;
    }

    .util-select {
      min-width: 120px !important;
    }
  }
}
</style>
