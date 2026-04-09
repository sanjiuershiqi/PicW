<template>
  <v-card class="image-toolbar-card mb-6" elevation="0">
    <v-card-text class="d-flex align-center pa-2 px-4">
      <!-- 左侧：导航区域 -->
      <div class="d-flex align-center flex-grow-1">
        <!-- 返回按钮 -->
        <v-btn v-if="canGoBack" icon variant="flat" size="small" @click="emit('go-back')" class="me-3 back-btn rounded-circle">
          <v-icon size="small" color="primary">mdi-arrow-left</v-icon>
        </v-btn>

        <!-- 面包屑导航 -->
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-0 breadcrumb-glass">
          <template #divider>
            <v-icon size="small" color="secondary" class="mx-1">mdi-chevron-right</v-icon>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              :to="item.disabled ? undefined : { path: '#' }"
              @click.prevent="!item.disabled && emit('navigate', item.path)"
              class="text-body-2 font-weight-medium breadcrumb-text"
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
        <div class="glass-select-wrapper mr-3">
          <v-select
            :model-value="sortBy"
            @update:model-value="emit('update:sortBy', $event)"
            :items="sortOptions"
            density="compact"
            variant="plain"
            hide-details
            prepend-inner-icon="mdi-sort-variant"
            class="glass-select"
            style="min-width: 140px; max-width: 180px"
          />
        </div>

        <!-- 视图模式切换 -->
        <div class="view-toggle d-flex rounded-pill glass-panel p-1 mr-3">
          <v-btn
            :color="viewMode === 'grid' ? 'primary' : 'transparent'"
            :class="{'elevation-2': viewMode === 'grid'}"
            size="small"
            rounded="pill"
            class="view-btn px-4"
            @click="emit('update:viewMode', 'grid')"
          >
            <v-icon size="small" :color="viewMode === 'grid' ? 'on-primary' : 'primary'">mdi-view-grid-outline</v-icon>
          </v-btn>
          <v-btn
            :color="viewMode === 'list' ? 'primary' : 'transparent'"
            :class="{'elevation-2': viewMode === 'list'}"
            size="small"
            rounded="pill"
            class="view-btn px-4"
            @click="emit('update:viewMode', 'list')"
          >
            <v-icon size="small" :color="viewMode === 'list' ? 'on-primary' : 'primary'">mdi-format-list-bulleted</v-icon>
          </v-btn>
        </div>

        <div class="divider-orb mx-2"></div>

        <!-- 操作按钮组 -->
        <div class="d-flex gap-2 align-center ml-2">
          <v-btn
            :color="showImagesOnly ? 'primary' : 'transparent'"
            :variant="showImagesOnly ? 'flat' : 'text'"
            size="small"
            class="action-btn rounded-circle"
            icon
            @click="emit('update:showImagesOnly', !showImagesOnly)"
          >
            <v-icon size="small">{{ showImagesOnly ? 'mdi-image-outline' : 'mdi-folder-multiple-image' }}</v-icon>
          </v-btn>

          <!-- 文件类型筛选 -->
          <v-menu location="bottom end" transition="slide-y-transition">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :color="fileTypeFilter.length > 0 ? 'primary' : 'transparent'"
                :variant="fileTypeFilter.length > 0 ? 'flat' : 'text'"
                size="small"
                class="action-btn rounded-circle"
                icon
              >
                <v-icon size="small">mdi-filter-variant</v-icon>
                <div v-if="fileTypeFilter.length > 0" class="filter-orb"></div>
              </v-btn>
            </template>
            <v-list density="compact" class="glass-menu rounded-xl mt-2" elevation="0">
              <v-list-subheader class="text-caption font-weight-medium px-4">File Types</v-list-subheader>
              <v-list-item v-for="option in fileTypeOptions" :key="option.value" @click="toggleFileType(option.value)" class="menu-item mx-2 rounded-pill mb-1">
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

          <v-btn variant="text" size="small" color="primary" class="action-btn rounded-circle" icon @click="emit('advanced-search')">
            <v-icon size="small">mdi-magnify-expand</v-icon>
          </v-btn>

          <v-btn variant="text" size="small" color="primary" class="action-btn rounded-circle" icon @click="emit('refresh')">
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
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 100px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  
  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.3) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:hover {
    transform: translateX(-2px);
    background: rgb(var(--v-theme-primary)) !important;
    border-color: transparent;
    
    .v-icon {
      color: rgb(var(--v-theme-on-primary)) !important;
    }
  }
}

.breadcrumb-glass {
  :deep(.v-breadcrumbs-item) {
    padding: 4px 12px;
    border-radius: 100px;
    transition: all 0.2s ease;
    
    &:hover:not(.v-breadcrumbs-item--disabled) {
      background: rgba(255, 255, 255, 0.5);
      color: rgb(var(--v-theme-primary)) !important;
      
      .v-theme--dark & {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }
}

.breadcrumb-text {
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

.glass-select-wrapper {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0 4px;
  
  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.glass-select {
  :deep(.v-field__input) {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--v-theme-primary));
  }
}

.glass-panel {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
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

.divider-orb {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.2);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.5);
}

.action-btn {
  background: rgba(255, 255, 255, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  
  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  &:hover {
    transform: translateY(-2px);
    background: rgb(var(--v-theme-primary)) !important;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
    
    .v-icon {
      color: rgb(var(--v-theme-on-primary)) !important;
    }
  }
  
  &.bg-primary {
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
  }
}

.filter-orb {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-accent));
  box-shadow: 0 0 8px rgb(var(--v-theme-accent));
  border: 1px solid rgba(255,255,255,0.8);
}

.glass-menu {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  padding: 8px 0;
  
  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.6) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .menu-item {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.05);
      transform: translateX(4px);
    }
  }
}

// 响应式调整
@media (max-width: 960px) {
  .image-toolbar-card {
    border-radius: 24px !important;
  }
  
  .toolbar-actions {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  
  .divider-orb {
    display: none;
  }
}

@media (max-width: 600px) {
  .image-toolbar-card {
    .v-breadcrumbs {
      max-width: 150px;
      overflow: hidden;
    }

    .glass-select {
      min-width: 120px !important;
    }
  }
}
</style>
