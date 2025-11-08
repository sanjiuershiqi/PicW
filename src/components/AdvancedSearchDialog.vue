<template>
  <v-dialog v-model="show" max-width="800" scrollable>
    <v-card>
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-magnify-plus-outline" class="me-2" />
        高级搜索
        <v-spacer />
        <v-chip v-if="activeFiltersCount > 0" color="primary" size="small" variant="tonal" class="me-2">
          {{ activeFiltersCount }} 个筛选
        </v-chip>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-tabs v-model="currentTab" bg-color="surface" density="compact">
          <v-tab value="filters">
            <v-icon icon="mdi-filter-variant" size="small" class="me-2" />
            筛选条件
          </v-tab>
          <v-tab value="history">
            <v-icon icon="mdi-history" size="small" class="me-2" />
            搜索历史
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-window v-model="currentTab">
          <!-- 筛选条件标签页 -->
          <v-window-item value="filters">
            <div class="pa-4">
              <v-form ref="formRef">
                <!-- 关键词搜索 -->
                <v-text-field
                  v-model="filters.keyword"
                  label="关键词"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  placeholder="输入图片名称..."
                  hint="支持模糊搜索"
                  persistent-hint
                  class="mb-4"
                >
                  <template #append-inner>
                    <v-menu v-if="topFrequentSearches.length > 0">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-history" variant="text" size="small" />
                      </template>
                      <v-list density="compact">
                        <v-list-subheader>常用搜索</v-list-subheader>
                        <v-list-item v-for="keyword in topFrequentSearches" :key="keyword" @click="filters.keyword = keyword">
                          <v-list-item-title>{{ keyword }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-text-field>

                <!-- 文件类型 -->
                <v-select
                  v-model="filters.fileTypes"
                  :items="fileTypeOptions"
                  label="文件类型"
                  prepend-inner-icon="mdi-file-image"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  closable-chips
                  hint="选择要搜索的图片格式"
                  persistent-hint
                  class="mb-4"
                />

                <!-- 文件大小 -->
                <div class="mb-4">
                  <v-label class="text-subtitle-2 mb-2 d-block">文件大小</v-label>
                  <v-btn-toggle
                    v-model="filters.sizeRange.preset"
                    @update:model-value="handleSizePresetChange"
                    variant="outlined"
                    density="comfortable"
                    mandatory
                    divided
                    class="mb-3"
                    style="width: 100%"
                  >
                    <v-btn value="all" size="small" style="flex: 1">全部</v-btn>
                    <v-btn value="small" size="small" style="flex: 1">&lt; 100KB</v-btn>
                    <v-btn value="medium" size="small" style="flex: 1">100KB-1MB</v-btn>
                    <v-btn value="large" size="small" style="flex: 1">1MB-5MB</v-btn>
                    <v-btn value="xlarge" size="small" style="flex: 1">&gt; 5MB</v-btn>
                    <v-btn value="custom" size="small" style="flex: 1">自定义</v-btn>
                  </v-btn-toggle>

                  <!-- 自定义大小范围 -->
                  <v-expand-transition>
                    <v-row v-if="filters.sizeRange.preset === 'custom'" dense>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="customSizeMin"
                          label="最小 (KB)"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="customSizeMax"
                          label="最大 (KB)"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </v-expand-transition>
                </div>

                <!-- 日期范围 -->
                <div class="mb-4">
                  <v-label class="text-subtitle-2 mb-2 d-block">上传日期</v-label>
                  <v-btn-toggle
                    v-model="filters.dateRange.preset"
                    @update:model-value="handleDatePresetChange"
                    variant="outlined"
                    density="comfortable"
                    mandatory
                    divided
                    class="mb-3"
                    style="width: 100%"
                  >
                    <v-btn value="all" size="small" style="flex: 1">全部</v-btn>
                    <v-btn value="today" size="small" style="flex: 1">今天</v-btn>
                    <v-btn value="week" size="small" style="flex: 1">一周</v-btn>
                    <v-btn value="month" size="small" style="flex: 1">一月</v-btn>
                    <v-btn value="year" size="small" style="flex: 1">一年</v-btn>
                    <v-btn value="custom" size="small" style="flex: 1">自定义</v-btn>
                  </v-btn-toggle>

                  <!-- 自定义日期范围 -->
                  <v-expand-transition>
                    <v-row v-if="filters.dateRange.preset === 'custom'" dense>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customDateStart"
                          label="开始日期"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="customDateEnd"
                          label="结束日期"
                          type="date"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </v-expand-transition>
                </div>

                <!-- 路径筛选 -->
                <v-text-field
                  v-model="filters.pathFilter.directory"
                  label="目录路径"
                  prepend-inner-icon="mdi-folder"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  placeholder="例如: /images/photos"
                  hint="留空表示搜索所有目录"
                  persistent-hint
                  class="mb-2"
                />
                <v-checkbox v-model="filters.pathFilter.includeSubdirs" label="包含子目录" density="compact" hide-details class="mb-4" />

                <!-- 其他选项 -->
                <v-checkbox
                  v-model="filters.onlyFavorites"
                  label="仅显示收藏的图片"
                  prepend-icon="mdi-star"
                  density="compact"
                  hide-details
                  class="mb-4"
                />

                <!-- 排序选项 -->
                <v-row dense>
                  <v-col cols="6">
                    <v-select
                      v-model="filters.sortBy"
                      :items="sortByOptions"
                      label="排序方式"
                      prepend-inner-icon="mdi-sort"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="filters.sortOrder"
                      :items="sortOrderOptions"
                      label="排序顺序"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-form>
            </div>
          </v-window-item>

          <!-- 搜索历史标签页 -->
          <v-window-item value="history">
            <div class="pa-4">
              <div v-if="sortedSearchHistory.length === 0" class="text-center py-8">
                <v-icon icon="mdi-history" size="64" color="grey-lighten-1" />
                <p class="text-subtitle-1 text-medium-emphasis mt-4">暂无搜索历史</p>
              </div>

              <v-list v-else density="compact">
                <v-list-item
                  v-for="item in sortedSearchHistory"
                  :key="item.id"
                  @click="restoreSearch(item.id)"
                  class="history-item mb-2"
                  rounded
                >
                  <template #prepend>
                    <v-avatar color="primary" size="36" variant="tonal">
                      <v-icon icon="mdi-magnify" size="20" />
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-subtitle-2">
                    {{ item.filters.keyword || '(无关键词)' }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatHistorySubtitle(item) }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-chip size="small" variant="tonal" class="me-2"> {{ item.resultCount }} 个结果 </v-chip>
                    <v-btn icon="mdi-delete" variant="text" size="small" @click.stop="removeHistory(item.id)" />
                  </template>
                </v-list-item>
              </v-list>

              <v-divider v-if="sortedSearchHistory.length > 0" class="my-4" />

              <div v-if="sortedSearchHistory.length > 0" class="text-center">
                <v-btn variant="text" color="error" prepend-icon="mdi-delete-sweep" @click="confirmClearHistory"> 清空历史记录 </v-btn>
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <!-- 操作按钮 -->
      <v-card-actions class="pa-4">
        <v-btn variant="text" prepend-icon="mdi-refresh" @click="resetAllFilters" :disabled="!hasActiveFilters"> 重置 </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn variant="elevated" color="primary" prepend-icon="mdi-magnify" @click="search" :loading="searching"> 搜索 </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 清空历史确认对话框 -->
    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="warning" class="me-2" />
          确认清空历史
        </v-card-title>
        <v-card-text> 确定要清空所有搜索历史吗？此操作不可恢复。 </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="clearAllHistory">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAdvancedSearchStore } from '@/plugins/stores/advancedSearch'
import { storeToRefs } from 'pinia'

interface Props {
  modelValue: boolean
  searching?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searching: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'search'): void
}>()

const searchStore = useAdvancedSearchStore()
const { filters, hasActiveFilters, activeFiltersCount, sortedSearchHistory, topFrequentSearches } = storeToRefs(searchStore)

// 本地状态
const show = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const currentTab = ref('filters')
const formRef = ref()
const showClearDialog = ref(false)

// 自定义大小范围
const customSizeMin = ref<number | null>(null)
const customSizeMax = ref<number | null>(null)

// 自定义日期范围
const customDateStart = ref('')
const customDateEnd = ref('')

// 选项
const fileTypeOptions = [
  { title: 'JPG / JPEG', value: 'jpg' },
  { title: 'PNG', value: 'png' },
  { title: 'GIF', value: 'gif' },
  { title: 'WebP', value: 'webp' },
  { title: 'SVG', value: 'svg' },
  { title: 'BMP', value: 'bmp' },
  { title: 'ICO', value: 'ico' }
]

const sortByOptions = [
  { title: '名称', value: 'name' },
  { title: '大小', value: 'size' },
  { title: '日期', value: 'date' },
  { title: '类型', value: 'type' }
]

const sortOrderOptions = [
  { title: '升序', value: 'asc' },
  { title: '降序', value: 'desc' }
]

// 方法
const close = () => {
  show.value = false
}

const search = () => {
  // 应用自定义大小范围
  if (filters.value.sizeRange.preset === 'custom') {
    filters.value.sizeRange.min = customSizeMin.value ? customSizeMin.value * 1024 : null
    filters.value.sizeRange.max = customSizeMax.value ? customSizeMax.value * 1024 : null
  }

  // 应用自定义日期范围
  if (filters.value.dateRange.preset === 'custom') {
    filters.value.dateRange.start = customDateStart.value ? new Date(customDateStart.value) : null
    filters.value.dateRange.end = customDateEnd.value ? new Date(customDateEnd.value) : null
  }

  emit('search')
}

const resetAllFilters = () => {
  searchStore.resetFilters()
  customSizeMin.value = null
  customSizeMax.value = null
  customDateStart.value = ''
  customDateEnd.value = ''
}

const handleSizePresetChange = (preset: string) => {
  searchStore.setSizePreset(preset as any)
}

const handleDatePresetChange = (preset: string) => {
  searchStore.setDatePreset(preset as any)
}

const restoreSearch = (historyId: string) => {
  searchStore.restoreFromHistory(historyId)
  currentTab.value = 'filters'
}

const removeHistory = (historyId: string) => {
  searchStore.removeFromHistory(historyId)
}

const confirmClearHistory = () => {
  showClearDialog.value = true
}

const clearAllHistory = () => {
  searchStore.clearHistory()
  showClearDialog.value = false
}

const formatHistorySubtitle = (item: any) => {
  const parts = []

  if (item.filters.fileTypes.length > 0) {
    parts.push(`类型: ${item.filters.fileTypes.join(', ')}`)
  }

  if (item.filters.sizeRange.preset !== 'all') {
    parts.push(`大小: ${item.filters.sizeRange.preset}`)
  }

  if (item.filters.onlyFavorites) {
    parts.push('仅收藏')
  }

  const date = new Date(item.timestamp)
  parts.push(date.toLocaleString('zh-CN'))

  return parts.join(' • ')
}

// 监听自定义大小范围变化
watch([customSizeMin, customSizeMax], () => {
  if (filters.value.sizeRange.preset === 'custom') {
    filters.value.sizeRange.min = customSizeMin.value ? customSizeMin.value * 1024 : null
    filters.value.sizeRange.max = customSizeMax.value ? customSizeMax.value * 1024 : null
  }
})

// 监听自定义日期范围变化
watch([customDateStart, customDateEnd], () => {
  if (filters.value.dateRange.preset === 'custom') {
    filters.value.dateRange.start = customDateStart.value ? new Date(customDateStart.value) : null
    filters.value.dateRange.end = customDateEnd.value ? new Date(customDateEnd.value) : null
  }
})
</script>

<style scoped lang="scss">
.history-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }
}

:deep(.v-btn-toggle) {
  .v-btn {
    text-transform: none;
    letter-spacing: normal;
  }
}

// 响应式调整
@media (max-width: 600px) {
  :deep(.v-dialog) {
    margin: 16px;
  }

  :deep(.v-btn-toggle) {
    flex-wrap: wrap;

    .v-btn {
      flex: 1 1 calc(50% - 4px);
      min-width: 0;
    }
  }
}
</style>
