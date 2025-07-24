<template>
  <div class="batch-operations">
    <!-- 批量操作工具栏 -->
    <v-slide-y-transition>
      <v-card v-show="selectedItems.length > 0" variant="flat" color="primary" class="batch-toolbar">
        <v-card-text class="d-flex align-center py-3">
          <v-icon icon="mdi-checkbox-marked-circle" class="me-2" />
          <span class="text-subtitle-1 font-weight-medium"> 已选择 {{ selectedItems.length }} 项 </span>

          <v-spacer />

          <!-- 批量操作按钮 -->
          <div class="batch-actions">
            <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copySelectedLinks" class="me-2"> 复制链接 </v-btn>

            <v-btn variant="text" size="small" prepend-icon="mdi-tag-plus" @click="showTagDialog = true" class="me-2"> 添加标签 </v-btn>

            <v-btn variant="text" size="small" prepend-icon="mdi-download" @click="downloadSelected" class="me-2"> 下载 </v-btn>

            <v-btn variant="text" size="small" prepend-icon="mdi-delete" color="error" @click="showDeleteDialog = true" class="me-2">
              删除
            </v-btn>

            <v-btn variant="text" size="small" icon="mdi-close" @click="clearSelection" />
          </div>
        </v-card-text>
      </v-card>
    </v-slide-y-transition>

    <!-- 选择控制 -->
    <v-card variant="flat" class="selection-controls mb-4">
      <v-card-text class="d-flex align-center py-2">
        <v-checkbox
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          @update:model-value="toggleSelectAll"
          hide-details
          density="compact"
        />
        <span class="text-body-2 ms-2">
          {{ getSelectionText }}
        </span>

        <v-spacer />

        <!-- 快速选择 -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" size="small" prepend-icon="mdi-select-all"> 快速选择 </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="selectAll">
              <v-list-item-title>全选</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectNone">
              <v-list-item-title>取消全选</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectInverse">
              <v-list-item-title>反选</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="selectByType('image')">
              <v-list-item-title>选择所有图片</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectBySize('large')">
              <v-list-item-title>选择大文件 (>1MB)</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectByDate('recent')">
              <v-list-item-title>选择最近上传</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-text>
    </v-card>

    <!-- 批量添加标签对话框 -->
    <v-dialog v-model="showTagDialog" max-width="600">
      <v-card>
        <v-card-title>为选中项添加标签</v-card-title>
        <v-card-text>
          <v-combobox
            v-model="selectedTags"
            :items="availableTags"
            item-title="name"
            item-value="id"
            label="选择或创建标签"
            multiple
            chips
            closable-chips
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showTagDialog = false">取消</v-btn>
          <v-btn color="primary" @click="addTagsToSelected">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批量删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="me-2" />
          确认删除
        </v-card-title>
        <v-card-text>
          <p>确定要删除选中的 {{ selectedItems.length }} 项吗？</p>
          <v-alert type="warning" variant="tonal" class="mt-4"> 此操作不可撤销，请谨慎操作！ </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteSelected" :loading="deleting"> 删除 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 进度对话框 -->
    <v-dialog v-model="showProgressDialog" persistent max-width="400">
      <v-card>
        <v-card-title>{{ progressTitle }}</v-card-title>
        <v-card-text>
          <v-progress-linear :model-value="progress" height="8" rounded class="mb-4" />
          <p class="text-center">
            {{ progressText }}
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useTagsStore } from '@/plugins/stores/tags'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

interface BatchItem {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
  url?: string
}

interface Props {
  items: BatchItem[]
  selectedItems: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedItems': [items: string[]]
  'delete-items': [items: string[]]
  'add-tags': [items: string[], tags: string[]]
}>()

const tagsStore = useTagsStore()
const { tags } = storeToRefs(tagsStore)
const { showMessage } = useSnackBarStore()

// 对话框状态
const showTagDialog = ref(false)
const showDeleteDialog = ref(false)
const showProgressDialog = ref(false)

// 操作状态
const deleting = ref(false)
const progress = ref(0)
const progressTitle = ref('')
const progressText = ref('')

// 标签相关
const selectedTags = ref<string[]>([])
const availableTags = computed(() => tags.value)

// 选择状态计算
const isAllSelected = computed(() => {
  return props.items.length > 0 && props.selectedItems.length === props.items.length
})

const isIndeterminate = computed(() => {
  return props.selectedItems.length > 0 && props.selectedItems.length < props.items.length
})

const getSelectionText = computed(() => {
  if (props.selectedItems.length === 0) {
    return `共 ${props.items.length} 项`
  }
  return `已选择 ${props.selectedItems.length} / ${props.items.length} 项`
})

// 选择操作
const toggleSelectAll = (value: boolean) => {
  if (value) {
    selectAll()
  } else {
    selectNone()
  }
}

const selectAll = () => {
  emit(
    'update:selectedItems',
    props.items.map(item => item.id)
  )
}

const selectNone = () => {
  emit('update:selectedItems', [])
}

const selectInverse = () => {
  const newSelection = props.items.filter(item => !props.selectedItems.includes(item.id)).map(item => item.id)
  emit('update:selectedItems', newSelection)
}

const selectByType = (type: string) => {
  const filtered = props.items.filter(item => item.type.includes(type)).map(item => item.id)
  emit('update:selectedItems', filtered)
}

const selectBySize = (sizeType: string) => {
  let filtered: string[] = []

  switch (sizeType) {
    case 'large': {
      filtered = props.items
        .filter(item => item.size > 1024 * 1024) // > 1MB
        .map(item => item.id)
      break
    }
    case 'small': {
      filtered = props.items
        .filter(item => item.size < 100 * 1024) // < 100KB
        .map(item => item.id)
      break
    }
  }

  emit('update:selectedItems', filtered)
}

const selectByDate = (dateType: string) => {
  const now = new Date()
  let filtered: string[] = []

  switch (dateType) {
    case 'recent': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = props.items.filter(item => item.uploadedAt > weekAgo).map(item => item.id)
      break
    }
  }

  emit('update:selectedItems', filtered)
}

const clearSelection = () => {
  emit('update:selectedItems', [])
}

// 批量操作
const copySelectedLinks = async () => {
  const selectedItemsData = props.items.filter(item => props.selectedItems.includes(item.id) && item.url)

  if (selectedItemsData.length === 0) {
    showMessage('没有可复制的链接', { color: 'warning' })
    return
  }

  const links = selectedItemsData.map(item => item.url).join('\n')

  try {
    await navigator.clipboard.writeText(links)
    showMessage(`已复制 ${selectedItemsData.length} 个链接`, { color: 'success' })
  } catch (error) {
    showMessage('复制失败', { color: 'error' })
  }
}

const downloadSelected = async () => {
  const selectedItemsData = props.items.filter(item => props.selectedItems.includes(item.id) && item.url)

  if (selectedItemsData.length === 0) {
    showMessage('没有可下载的文件', { color: 'warning' })
    return
  }

  showProgressDialog.value = true
  progressTitle.value = '下载文件'
  progress.value = 0

  for (let i = 0; i < selectedItemsData.length; i++) {
    const item = selectedItemsData[i]
    progressText.value = `正在下载: ${item.name} (${i + 1}/${selectedItemsData.length})`

    try {
      const response = await fetch(item.url!)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = item.name
      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', item.name, error)
    }

    progress.value = ((i + 1) / selectedItemsData.length) * 100
  }

  showProgressDialog.value = false
  showMessage(`下载完成: ${selectedItemsData.length} 个文件`, { color: 'success' })
}

const addTagsToSelected = () => {
  if (selectedTags.value.length === 0) {
    showMessage('请选择至少一个标签', { color: 'warning' })
    return
  }

  emit('add-tags', props.selectedItems, selectedTags.value)
  showTagDialog.value = false
  selectedTags.value = []
  showMessage(`已为 ${props.selectedItems.length} 项添加标签`, { color: 'success' })
}

const deleteSelected = async () => {
  deleting.value = true

  try {
    emit('delete-items', props.selectedItems)
    showDeleteDialog.value = false
    showMessage(`已删除 ${props.selectedItems.length} 项`, { color: 'success' })
  } catch (error) {
    showMessage('删除失败', { color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
.batch-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 16px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-controls {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (max-width: 600px) {
  .batch-actions {
    flex-wrap: wrap;
    gap: 4px;

    .v-btn {
      min-width: auto;
    }
  }
}
</style>
