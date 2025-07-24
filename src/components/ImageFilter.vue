<template>
  <v-card variant="flat" class="image-filter">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-filter-variant" class="me-2" />
      筛选和搜索
      <v-spacer />
      <v-btn v-if="hasActiveFilters" variant="text" color="warning" size="small" prepend-icon="mdi-filter-remove" @click="clearAllFilters">
        清除筛选
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- 搜索框 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.search"
            label="搜索文件名"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            @input="onSearchInput"
          />
        </v-col>

        <!-- 文件类型筛选 -->
        <v-col cols="12" md="6">
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
            hide-details
          />
        </v-col>

        <!-- 文件大小范围 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="filters.sizeRange"
            :items="sizeRangeOptions"
            label="文件大小"
            prepend-inner-icon="mdi-file-document-outline"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- 排序方式 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="filters.sortBy"
            :items="sortOptions"
            label="排序方式"
            prepend-inner-icon="mdi-sort"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- 日期范围 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="filters.dateRange"
            :items="dateRangeOptions"
            label="上传时间"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- 显示方式 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="filters.viewMode"
            :items="viewModeOptions"
            label="显示方式"
            prepend-inner-icon="mdi-view-grid"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 高级筛选展开 -->
      <v-expand-transition>
        <div v-show="showAdvanced" class="mt-4">
          <v-divider class="mb-4" />
          <v-row>
            <!-- 自定义日期范围 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="filters.customDateStart"
                label="开始日期"
                type="date"
                prepend-inner-icon="mdi-calendar-start"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="filters.customDateEnd"
                label="结束日期"
                type="date"
                prepend-inner-icon="mdi-calendar-end"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>

            <!-- 自定义大小范围 -->
            <v-col cols="12">
              <v-range-slider
                v-model="filters.customSizeRange"
                :min="0"
                :max="10"
                :step="0.1"
                label="文件大小范围 (MB)"
                prepend-icon="mdi-file-document-outline"
                thumb-label="always"
                hide-details
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>

      <!-- 高级筛选切换 -->
      <v-row class="mt-2">
        <v-col cols="12" class="text-center">
          <v-btn
            variant="text"
            size="small"
            :prepend-icon="showAdvanced ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            @click="showAdvanced = !showAdvanced"
          >
            {{ showAdvanced ? '收起' : '高级筛选' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import debounce from '@/libs/debounce'

export interface ImageFilters {
  search: string
  fileTypes: string[]
  sizeRange: string
  sortBy: string
  dateRange: string
  viewMode: string
  customDateStart: string
  customDateEnd: string
  customSizeRange: [number, number]
}

const emit = defineEmits<{
  'update:filters': [filters: ImageFilters]
}>()

const showAdvanced = ref(false)

const filters = reactive<ImageFilters>({
  search: '',
  fileTypes: [],
  sizeRange: 'all',
  sortBy: 'name-asc',
  dateRange: 'all',
  viewMode: 'grid',
  customDateStart: '',
  customDateEnd: '',
  customSizeRange: [0, 10]
})

const fileTypeOptions = [
  { title: 'JPG', value: 'jpg' },
  { title: 'PNG', value: 'png' },
  { title: 'GIF', value: 'gif' },
  { title: 'WebP', value: 'webp' },
  { title: 'SVG', value: 'svg' }
]

const sizeRangeOptions = [
  { title: '全部大小', value: 'all' },
  { title: '小于 100KB', value: 'small' },
  { title: '100KB - 1MB', value: 'medium' },
  { title: '1MB - 5MB', value: 'large' },
  { title: '大于 5MB', value: 'xlarge' },
  { title: '自定义', value: 'custom' }
]

const sortOptions = [
  { title: '名称 A-Z', value: 'name-asc' },
  { title: '名称 Z-A', value: 'name-desc' },
  { title: '大小 小-大', value: 'size-asc' },
  { title: '大小 大-小', value: 'size-desc' },
  { title: '时间 新-旧', value: 'date-desc' },
  { title: '时间 旧-新', value: 'date-asc' }
]

const dateRangeOptions = [
  { title: '全部时间', value: 'all' },
  { title: '今天', value: 'today' },
  { title: '本周', value: 'week' },
  { title: '本月', value: 'month' },
  { title: '本年', value: 'year' },
  { title: '自定义', value: 'custom' }
]

const viewModeOptions = [
  { title: '网格视图', value: 'grid' },
  { title: '列表视图', value: 'list' },
  { title: '详细视图', value: 'detail' }
]

// 检查是否有活动的筛选条件
const hasActiveFilters = computed(() => {
  return (
    filters.search !== '' ||
    filters.fileTypes.length > 0 ||
    filters.sizeRange !== 'all' ||
    filters.sortBy !== 'name-asc' ||
    filters.dateRange !== 'all' ||
    filters.customDateStart !== '' ||
    filters.customDateEnd !== ''
  )
})

// 防抖搜索
const onSearchInput = debounce(() => {
  emitFilters()
}, 300)

// 清除所有筛选
const clearAllFilters = () => {
  Object.assign(filters, {
    search: '',
    fileTypes: [],
    sizeRange: 'all',
    sortBy: 'name-asc',
    dateRange: 'all',
    viewMode: 'grid',
    customDateStart: '',
    customDateEnd: '',
    customSizeRange: [0, 10]
  })
  emitFilters()
}

// 发送筛选条件更新
const emitFilters = () => {
  emit('update:filters', { ...filters })
}

// 监听筛选条件变化
watch(
  filters,
  () => {
    emitFilters()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.image-filter {
  margin-bottom: 24px;

  :deep(.v-card-title) {
    padding-bottom: 8px;
  }

  :deep(.v-chip) {
    margin: 2px;
  }
}
</style>
