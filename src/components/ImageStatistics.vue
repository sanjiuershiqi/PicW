<template>
  <div class="image-statistics">
    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card variant="tonal" color="primary" class="stat-card">
          <v-card-text class="text-center">
            <v-icon icon="mdi-image-multiple" size="48" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.totalImages }}</div>
            <div class="text-subtitle-2">总图片数</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" md="3">
        <v-card variant="tonal" color="success" class="stat-card">
          <v-card-text class="text-center">
            <v-icon icon="mdi-harddisk" size="48" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ formatSize(stats.totalSize) }}</div>
            <div class="text-subtitle-2">总大小</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" md="3">
        <v-card variant="tonal" color="info" class="stat-card">
          <v-card-text class="text-center">
            <v-icon icon="mdi-calendar-month" size="48" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.monthlyUploads }}</div>
            <div class="text-subtitle-2">本月上传</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" md="3">
        <v-card variant="tonal" color="warning" class="stat-card">
          <v-card-text class="text-center">
            <v-icon icon="mdi-tag-multiple" size="48" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ stats.totalTags }}</div>
            <div class="text-subtitle-2">标签数量</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 详细统计 -->
    <v-row>
      <!-- 文件类型分布 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-pie" class="me-2" />
            文件类型分布
          </v-card-title>
          <v-card-text>
            <div v-if="stats.fileTypes.length === 0" class="text-center py-8">
              <EmptyState icon="mdi-file-image-outline" title="暂无数据" description="还没有上传任何图片" :show-action="false" />
            </div>
            <div v-else>
              <div v-for="type in stats.fileTypes" :key="type.name" class="file-type-item d-flex align-center mb-3">
                <v-avatar :color="type.color" size="32" class="me-3">
                  <span class="text-caption font-weight-bold">
                    {{ type.name.toUpperCase() }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-medium">{{ type.name.toUpperCase() }}</span>
                    <span class="text-caption">{{ type.count }} 个 ({{ type.percentage }}%)</span>
                  </div>
                  <v-progress-linear :model-value="type.percentage" :color="type.color" height="4" rounded class="mt-1" />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 大小分布 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-bar" class="me-2" />
            文件大小分布
          </v-card-title>
          <v-card-text>
            <div v-if="stats.sizeDistribution.length === 0" class="text-center py-8">
              <EmptyState icon="mdi-file-document-outline" title="暂无数据" description="还没有上传任何图片" :show-action="false" />
            </div>
            <div v-else>
              <div v-for="size in stats.sizeDistribution" :key="size.range" class="size-item d-flex align-center mb-3">
                <v-icon :icon="size.icon" :color="size.color" size="32" class="me-3" />
                <div class="flex-grow-1">
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-medium">{{ size.range }}</span>
                    <span class="text-caption">{{ size.count }} 个 ({{ size.percentage }}%)</span>
                  </div>
                  <v-progress-linear :model-value="size.percentage" :color="size.color" height="4" rounded class="mt-1" />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 上传趋势 -->
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-line" class="me-2" />
            上传趋势
            <v-spacer />
            <v-btn-toggle v-model="trendPeriod" variant="outlined" density="compact" mandatory>
              <v-btn value="week" size="small">周</v-btn>
              <v-btn value="month" size="small">月</v-btn>
              <v-btn value="year" size="small">年</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <div v-if="trendData.length === 0" class="text-center py-8">
              <EmptyState icon="mdi-chart-line-variant" title="暂无数据" description="还没有足够的数据显示趋势" :show-action="false" />
            </div>
            <div v-else class="trend-chart">
              <div v-for="(item, index) in trendData" :key="index" class="trend-item d-flex align-center mb-2">
                <div class="trend-date text-caption me-3" style="min-width: 80px">
                  {{ item.date }}
                </div>
                <div class="flex-grow-1">
                  <v-progress-linear :model-value="item.percentage" color="primary" height="20" rounded>
                    <template #default>
                      <span class="text-caption">{{ item.count }}</span>
                    </template>
                  </v-progress-linear>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 存储使用情况 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-database" class="me-2" />
            存储使用情况
          </v-card-title>
          <v-card-text>
            <div class="storage-info">
              <div class="d-flex justify-space-between align-center mb-2">
                <span>已使用</span>
                <span class="font-weight-bold">{{ formatSize(stats.totalSize) }}</span>
              </div>
              <v-progress-linear :model-value="storageUsagePercentage" :color="getStorageColor" height="12" rounded class="mb-3" />
              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                <span>{{ storageUsagePercentage.toFixed(1) }}% 已使用</span>
                <span>GitHub 仓库</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 热门标签 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-tag-heart" class="me-2" />
            热门标签
          </v-card-title>
          <v-card-text>
            <div v-if="stats.popularTags.length === 0" class="text-center py-8">
              <EmptyState icon="mdi-tag-outline" title="暂无标签" description="开始为图片添加标签吧" :show-action="false" />
            </div>
            <div v-else>
              <v-chip-group column>
                <v-chip v-for="tag in stats.popularTags" :key="tag.id" :color="tag.color" variant="tonal" size="small" class="me-2 mb-2">
                  {{ tag.name }}
                  <v-badge :content="tag.count" color="primary" inline class="ms-2" />
                </v-chip>
              </v-chip-group>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import filesize from '@/libs/filesize'
import { useTagsStore } from '@/plugins/stores/tags'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

interface ImageData {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  tags: string[]
}

interface Props {
  images: ImageData[]
}

const props = defineProps<Props>()

const tagsStore = useTagsStore()
const { tags } = storeToRefs(tagsStore)

const trendPeriod = ref<'week' | 'month' | 'year'>('month')

// 格式化文件大小
const formatSize = (bytes: number) => {
  return filesize(bytes)
}

// 基础统计
const stats = computed(() => {
  const totalImages = props.images.length
  const totalSize = props.images.reduce((sum, img) => sum + img.size, 0)

  // 本月上传数量
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyUploads = props.images.filter(img => img.uploadedAt >= monthStart).length

  // 文件类型分布
  const typeCount: Record<string, number> = {}
  props.images.forEach(img => {
    const ext = img.name.split('.').pop()?.toLowerCase() || 'unknown'
    typeCount[ext] = (typeCount[ext] || 0) + 1
  })

  const fileTypes = Object.entries(typeCount)
    .map(([name, count], index) => ({
      name,
      count,
      percentage: Math.round((count / totalImages) * 100),
      color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'][index % 5]
    }))
    .sort((a, b) => b.count - a.count)

  // 大小分布
  const sizeRanges = [
    { range: '< 100KB', min: 0, max: 100 * 1024, icon: 'mdi-file-document', color: 'success' },
    { range: '100KB - 1MB', min: 100 * 1024, max: 1024 * 1024, icon: 'mdi-file-image', color: 'info' },
    { range: '1MB - 5MB', min: 1024 * 1024, max: 5 * 1024 * 1024, icon: 'mdi-file-video', color: 'warning' },
    { range: '> 5MB', min: 5 * 1024 * 1024, max: Infinity, icon: 'mdi-file-multiple', color: 'error' }
  ]

  const sizeDistribution = sizeRanges
    .map(range => {
      const count = props.images.filter(img => img.size >= range.min && img.size < range.max).length
      return {
        ...range,
        count,
        percentage: totalImages > 0 ? Math.round((count / totalImages) * 100) : 0
      }
    })
    .filter(range => range.count > 0)

  // 热门标签
  const popularTags = tags.value
    .filter(tag => tag.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalImages,
    totalSize,
    monthlyUploads,
    totalTags: tags.value.length,
    fileTypes,
    sizeDistribution,
    popularTags
  }
})

// 上传趋势数据
const trendData = computed(() => {
  if (props.images.length === 0) {
    return []
  }

  const now = new Date()
  const data: { date: string; count: number; percentage: number }[] = []

  if (trendPeriod.value === 'week') {
    // 最近7天
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const count = props.images.filter(img => img.uploadedAt >= dayStart && img.uploadedAt < dayEnd).length

      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        count,
        percentage: 0
      })
    }
  } else if (trendPeriod.value === 'month') {
    // 最近12个月
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      const count = props.images.filter(img => img.uploadedAt >= monthStart && img.uploadedAt < monthEnd).length

      data.push({
        date: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }),
        count,
        percentage: 0
      })
    }
  }

  // 计算百分比
  const maxCount = Math.max(...data.map(d => d.count))
  if (maxCount > 0) {
    data.forEach(item => {
      item.percentage = (item.count / maxCount) * 100
    })
  }

  return data.filter(item => item.count > 0)
})

// 存储使用情况
const storageUsagePercentage = computed(() => {
  // 假设 GitHub 仓库限制为 1GB
  const maxStorage = 1024 * 1024 * 1024 // 1GB
  return Math.min((stats.value.totalSize / maxStorage) * 100, 100)
})

const getStorageColor = computed(() => {
  const percentage = storageUsagePercentage.value
  if (percentage < 50) {
    return 'success'
  }
  if (percentage < 80) {
    return 'warning'
  }
  return 'error'
})
</script>

<style scoped lang="scss">
.stat-card {
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.file-type-item,
.size-item {
  transition: background-color 0.2s ease;
  padding: 8px;
  border-radius: 8px;

  &:hover {
    background-color: rgba(var(--v-theme-surface-variant), 0.1);
  }
}

.trend-chart {
  max-height: 300px;
  overflow-y: auto;
}

.trend-item {
  padding: 4px 0;
}

.storage-info {
  padding: 16px;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
}
</style>
