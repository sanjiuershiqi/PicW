<template>
  <v-card variant="flat" class="image-toolbar-card mb-4">
    <v-card-text class="d-flex align-center pa-3">
      <!-- 左侧：导航区域 -->
      <div class="d-flex align-center flex-grow-1">
        <!-- 返回按钮 -->
        <v-btn v-if="canGoBack" icon variant="text" size="small" @click="emit('go-back')" class="me-2">
          <v-icon>mdi-arrow-left</v-icon>
          <v-tooltip activator="parent" location="bottom"> 返回上级 </v-tooltip>
        </v-btn>

        <!-- 面包屑导航 -->
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 flex-grow-0">
          <template #divider>
            <v-icon size="small">mdi-chevron-right</v-icon>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              :to="item.disabled ? undefined : { path: '#' }"
              @click.prevent="!item.disabled && emit('navigate', item.path)"
              class="text-body-2"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </div>

      <v-spacer />

      <!-- 右侧：操作区域 -->
      <div class="d-flex align-center gap-2">
        <!-- 排序选择 -->
        <v-select
          :model-value="sortBy"
          @update:model-value="emit('update:sortBy', $event)"
          :items="sortOptions"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-sort"
          style="min-width: 160px; max-width: 200px"
        />

        <v-divider vertical class="mx-1" />

        <!-- 视图模式切换 -->
        <v-btn-toggle
          :model-value="viewMode"
          @update:model-value="emit('update:viewMode', $event)"
          mandatory
          density="compact"
          variant="outlined"
          divided
        >
          <v-btn value="grid" size="small">
            <v-icon size="small">mdi-view-grid</v-icon>
            <v-tooltip activator="parent" location="bottom"> 网格视图 </v-tooltip>
          </v-btn>
          <v-btn value="list" size="small">
            <v-icon size="small">mdi-view-list</v-icon>
            <v-tooltip activator="parent" location="bottom"> 列表视图 </v-tooltip>
          </v-btn>
        </v-btn-toggle>

        <v-divider vertical class="mx-1" />

        <!-- 仅显示图片按钮 -->
        <v-btn
          :color="showImagesOnly ? 'primary' : undefined"
          :variant="showImagesOnly ? 'tonal' : 'text'"
          size="small"
          @click="emit('update:showImagesOnly', !showImagesOnly)"
        >
          <v-icon size="small">{{ showImagesOnly ? 'mdi-image' : 'mdi-file-multiple' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ showImagesOnly ? '显示所有文件' : '仅显示图片' }}
          </v-tooltip>
        </v-btn>

        <!-- 文件类型筛选 -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :color="fileTypeFilter.length > 0 ? 'primary' : undefined"
              :variant="fileTypeFilter.length > 0 ? 'tonal' : 'text'"
              size="small"
            >
              <v-icon size="small">mdi-filter-variant</v-icon>
              <v-badge v-if="fileTypeFilter.length > 0" :content="fileTypeFilter.length" color="primary" inline />
              <v-tooltip activator="parent" location="bottom"> 文件类型筛选 </v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-subheader>选择文件类型</v-list-subheader>
            <v-list-item v-for="option in fileTypeOptions" :key="option.value" @click="toggleFileType(option.value)">
              <template #prepend>
                <v-checkbox-btn
                  :model-value="fileTypeFilter.includes(option.value)"
                  @click.stop="toggleFileType(option.value)"
                  density="compact"
                />
              </template>
              <v-list-item-title>{{ option.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider vertical class="mx-1" />

        <!-- 高级搜索按钮 -->
        <v-btn variant="text" size="small" color="primary" @click="emit('advanced-search')">
          <v-icon size="small">mdi-magnify-plus-outline</v-icon>
          <v-tooltip activator="parent" location="bottom"> 高级搜索 </v-tooltip>
        </v-btn>

        <!-- 刷新按钮 -->
        <v-btn variant="text" size="small" @click="emit('refresh')">
          <v-icon size="small">mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom"> 刷新 </v-tooltip>
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
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
}

.gap-2 {
  gap: 8px;
}

// 响应式调整
@media (max-width: 960px) {
  .image-toolbar-card {
    .d-flex {
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

@media (max-width: 600px) {
  .image-toolbar-card {
    .v-breadcrumbs {
      max-width: 200px;
      overflow: hidden;
    }

    .v-select {
      min-width: 120px !important;
    }
  }
}
</style>
