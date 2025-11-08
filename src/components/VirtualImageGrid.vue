<template>
  <div class="virtual-image-grid">
    <RecycleScroller
      v-slot="{ item, index }"
      :items="items"
      :item-size="itemSize"
      :grid-items="gridColumns"
      :buffer="buffer"
      key-field="sha"
      class="scroller"
      :class="{ 'scroller--list': viewMode === 'list' }"
    >
      <div class="grid-item" :class="{ 'grid-item--list': viewMode === 'list' }">
        <!-- 网格视图 -->
        <v-card
          v-if="viewMode === 'grid'"
          class="image-card"
          :class="{ 'image-card--selected': isSelected(item.sha) }"
          elevation="2"
          @click="$emit('image-click', item, index)"
        >
          <!-- 选择框 -->
          <v-checkbox
            :model-value="isSelected(item.sha)"
            @update:model-value="$emit('selection-change', item.sha, $event)"
            @click.stop
            class="selection-checkbox"
            hide-details
            density="compact"
          />

          <!-- 图片 -->
          <v-img :src="item.url" :alt="item.name" height="200" cover class="image-content">
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular indeterminate size="32" color="primary" />
              </div>
            </template>

            <template #error>
              <div class="d-flex align-center justify-center fill-height">
                <v-icon icon="mdi-image-broken" size="48" color="grey" />
              </div>
            </template>

            <!-- 悬停操作层 -->
            <div class="image-overlay">
              <div class="overlay-actions">
                <v-btn
                  icon="mdi-eye"
                  variant="elevated"
                  color="primary"
                  size="small"
                  @click.stop="$emit('preview', item, index)"
                  title="预览"
                />
                <v-btn
                  icon="mdi-download"
                  variant="elevated"
                  color="success"
                  size="small"
                  @click.stop="$emit('download', item)"
                  title="下载"
                />
                <v-btn
                  v-if="canDelete"
                  icon="mdi-delete"
                  variant="elevated"
                  color="error"
                  size="small"
                  @click.stop="$emit('delete', item, index)"
                  title="删除"
                />
              </div>
            </div>
          </v-img>

          <!-- 图片信息 -->
          <v-card-text class="pa-3">
            <div class="text-subtitle-2 text-truncate mb-1" :title="item.name">
              {{ item.name }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ formatFileSize(item.size) }} • {{ getFileType(item.name) }}</div>
          </v-card-text>
        </v-card>

        <!-- 列表视图 -->
        <v-list-item v-else @click="$emit('image-click', item, index)" class="list-item">
          <template #prepend>
            <v-checkbox
              :model-value="isSelected(item.sha)"
              @update:model-value="$emit('selection-change', item.sha, $event)"
              @click.stop
              hide-details
              density="compact"
            />
            <v-avatar size="48" class="me-3">
              <v-img :src="item.url" />
            </v-avatar>
          </template>

          <v-list-item-title>{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatFileSize(item.size) }} • {{ getFileType(item.name) }}
            <span v-if="item.directory" class="ml-2"> 📁 {{ item.directory }} </span>
          </v-list-item-subtitle>

          <template #append>
            <v-btn icon="mdi-eye" variant="text" size="small" @click.stop="$emit('preview', item, index)" />
            <v-btn icon="mdi-download" variant="text" size="small" @click.stop="$emit('download', item)" />
            <v-btn
              v-if="canDelete"
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click.stop="$emit('delete', item, index)"
            />
          </template>
        </v-list-item>
      </div>
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { computed } from 'vue'

interface ImageItem {
  name: string
  path: string
  sha: string
  size: number
  url: string
  directory?: string
}

interface Props {
  items: ImageItem[]
  selectedItems: string[]
  viewMode?: 'grid' | 'list'
  canDelete?: boolean
  gridColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  canDelete: false,
  gridColumns: 4
})

defineEmits<{
  'image-click': [item: ImageItem, index: number]
  'selection-change': [sha: string, selected: boolean]
  preview: [item: ImageItem, index: number]
  download: [item: ImageItem]
  delete: [item: ImageItem, index: number]
}>()

// 计算项目大小
const itemSize = computed(() => {
  return props.viewMode === 'grid' ? 280 : 72
})

// 缓冲区大小
const buffer = computed(() => {
  return props.viewMode === 'grid' ? 200 : 100
})

// 检查是否选中
const isSelected = (sha: string) => {
  return props.selectedItems.includes(sha)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 获取文件类型
const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'Unknown'
}
</script>

<style scoped lang="scss">
.virtual-image-grid {
  .scroller {
    height: calc(100vh - 400px);
    min-height: 400px;

    &--list {
      height: calc(100vh - 350px);
    }
  }

  .grid-item {
    padding: 8px;

    &--list {
      padding: 0;
    }
  }

  // 图片卡片样式
  .image-card {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

      .image-overlay {
        opacity: 1;
      }
    }

    &--selected {
      border: 2px solid rgb(var(--v-theme-primary));
      box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.3);
    }
  }

  .selection-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 3;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    padding: 2px;
    backdrop-filter: blur(4px);
  }

  .image-content {
    position: relative;
    border-radius: 12px 12px 0 0;
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.8) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .overlay-actions {
    display: flex;
    gap: 8px;

    .v-btn {
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  // 列表项样式
  .list-item {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

    &:hover {
      background-color: rgba(var(--v-theme-surface-variant), 0.5);
    }
  }
}

// 响应式调整
@media (max-width: 960px) {
  .virtual-image-grid {
    .image-card {
      .image-content {
        height: 180px !important;
      }
    }

    .overlay-actions {
      gap: 6px;

      .v-btn {
        min-width: auto;
      }
    }
  }
}

@media (max-width: 600px) {
  .virtual-image-grid {
    .grid-item {
      padding: 4px;
    }

    .image-card {
      .image-content {
        height: 160px !important;
      }

      .selection-checkbox {
        top: 4px;
        left: 4px;
      }
    }

    .overlay-actions {
      gap: 4px;

      .v-btn {
        size: x-small;
      }
    }
  }
}
</style>
