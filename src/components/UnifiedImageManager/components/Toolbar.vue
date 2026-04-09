<template>
  <v-card class="image-toolbar-card mb-6" elevation="0">
    <v-card-text class="d-flex align-center pa-0">
      <!-- 左侧：导航区域 -->
      <div class="d-flex align-center flex-grow-1 h-100 px-4 border-r">
        <!-- 返回按钮 -->
        <v-btn v-if="canGoBack" icon variant="flat" size="small" color="primary" @click="emit('go-back')" class="me-3 back-btn rounded-0">
          <v-icon size="small">mdi-arrow-left</v-icon>
        </v-btn>

        <!-- 面包屑导航 -->
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-0 breadcrumb-modern font-mono">
          <template #divider>
            <span class="mx-2 font-weight-bold">/</span>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              :to="item.disabled ? undefined : { path: '#' }"
              @click.prevent="!item.disabled && emit('navigate', item.path)"
              class="text-body-2 font-weight-bold text-uppercase"
              :class="item.disabled ? 'text-medium-emphasis' : 'text-accent'"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </div>

      <!-- 右侧：操作区域 -->
      <div class="d-flex align-center toolbar-actions h-100">
        <!-- 排序选择 -->
        <div class="border-r h-100 d-flex align-center px-2">
          <v-select
            :model-value="sortBy"
            @update:model-value="emit('update:sortBy', $event)"
            :items="sortOptions"
            density="compact"
            variant="plain"
            hide-details
            prepend-inner-icon="mdi-sort-variant"
            class="brutalist-select font-mono text-uppercase"
            style="min-width: 140px; max-width: 180px"
          />
        </div>

        <!-- 视图模式切换 -->
        <div class="view-toggle d-flex h-100 border-r">
          <v-btn
            :color="viewMode === 'grid' ? 'primary' : 'transparent'"
            size="large"
            rounded="0"
            class="px-4 h-100 view-btn"
            @click="emit('update:viewMode', 'grid')"
          >
            <v-icon>mdi-view-grid-outline</v-icon>
          </v-btn>
          <v-btn
            :color="viewMode === 'list' ? 'primary' : 'transparent'"
            size="large"
            rounded="0"
            class="px-4 h-100 view-btn border-l"
            @click="emit('update:viewMode', 'list')"
          >
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-btn>
        </div>

        <!-- 操作按钮组 -->
        <div class="d-flex h-100">
          <v-btn
            :color="showImagesOnly ? 'accent' : 'transparent'"
            variant="flat"
            size="large"
            rounded="0"
            class="action-btn h-100 border-r px-4"
            @click="emit('update:showImagesOnly', !showImagesOnly)"
          >
            <v-icon>{{ showImagesOnly ? 'mdi-image-outline' : 'mdi-folder-multiple-image' }}</v-icon>
          </v-btn>

          <!-- 文件类型筛选 -->
          <v-menu transition="none">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :color="fileTypeFilter.length > 0 ? 'accent' : 'transparent'"
                variant="flat"
                size="large"
                rounded="0"
                class="action-btn h-100 border-r px-4"
              >
                <v-icon>mdi-filter-variant</v-icon>
                <span v-if="fileTypeFilter.length > 0" class="filter-count font-mono">[{{ fileTypeFilter.length }}]</span>
              </v-btn>
            </template>
            <div class="brutalist-menu">
              <div class="menu-header font-mono">FILE TYPES</div>
              <div v-for="option in fileTypeOptions" :key="option.value" class="menu-item" @click="toggleFileType(option.value)">
                <v-checkbox-btn
                  :model-value="fileTypeFilter.includes(option.value)"
                  @click.stop="toggleFileType(option.value)"
                  density="compact"
                  color="primary"
                  class="mr-2"
                />
                <span class="font-mono text-uppercase">{{ option.title }}</span>
              </div>
            </div>
          </v-menu>

          <v-btn variant="flat" size="large" rounded="0" class="action-btn h-100 border-r px-4" @click="emit('advanced-search')">
            <v-icon>mdi-magnify-expand</v-icon>
          </v-btn>

          <v-btn variant="flat" size="large" rounded="0" class="action-btn h-100 px-4" @click="emit('refresh')">
            <v-icon>mdi-refresh</v-icon>
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
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  height: 64px;
}

.border-r {
  border-right: 2px solid rgb(var(--v-theme-primary));
}

.border-l {
  border-left: 2px solid rgb(var(--v-theme-primary));
}

.h-100 {
  height: 100%;
}

.back-btn {
  border: 2px solid rgb(var(--v-theme-primary));
  transition: all 0.1s;

  &:hover {
    background: rgb(var(--v-theme-accent)) !important;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 rgb(var(--v-theme-primary));
  }
}

.breadcrumb-modern {
  :deep(.v-breadcrumbs-item) {
    padding: 0 4px;
    transition: color 0.1s;
    
    &:hover:not(.v-breadcrumbs-item--disabled) {
      color: rgb(var(--v-theme-accent)) !important;
      background: rgb(var(--v-theme-primary));
    }
  }
}

.brutalist-select {
  :deep(.v-field__input) {
    font-size: 0.9rem;
    font-weight: 700;
  }
  :deep(.v-field__append-inner) {
    padding-top: 4px;
  }
}

.view-btn {
  transition: all 0.1s;
  
  &:hover:not(.bg-primary) {
    background: rgba(var(--v-theme-primary), 0.1) !important;
  }
  
  &.bg-primary {
    color: rgb(var(--v-theme-on-primary)) !important;
  }
}

.action-btn {
  transition: all 0.1s;
  color: rgb(var(--v-theme-primary));
  
  &:hover {
    background: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
  }
  
  &.bg-accent {
    color: rgb(var(--v-theme-on-primary)) !important;
    
    &:hover {
      filter: brightness(1.2);
    }
  }
}

.filter-count {
  margin-left: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.brutalist-menu {
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgb(var(--v-theme-primary));
  box-shadow: 8px 8px 0 rgb(var(--v-theme-accent));
  min-width: 200px;
  margin-top: 8px;
}

.menu-header {
  padding: 12px 16px;
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  cursor: pointer;
  transition: all 0.1s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(var(--v-theme-accent), 0.1);
    padding-left: 24px;
  }
}

// 响应式调整
@media (max-width: 960px) {
  .image-toolbar-card {
    height: auto;
  }
  .toolbar-actions {
    flex-wrap: wrap;
    border-left: none;
    border-top: 2px solid rgb(var(--v-theme-primary));
    width: 100%;
  }
  .border-r {
    border-right: none;
    border-bottom: 2px solid rgb(var(--v-theme-primary));
  }
  .view-toggle {
    width: 100%;
    border-bottom: 2px solid rgb(var(--v-theme-primary));
    .view-btn {
      flex: 1;
    }
  }
}
</style>
