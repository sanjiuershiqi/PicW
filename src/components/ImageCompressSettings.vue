<template>
  <div>
    <v-switch v-model="enabled" color="primary" hide-details class="mb-4">
      <template #label>
        <div class="d-flex align-center">
          <span class="font-weight-medium">启用自动压缩</span>
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-information-outline" size="small" class="ml-2" />
            </template>
            <span>上传前自动压缩大图片，节省存储空间</span>
          </v-tooltip>
        </div>
      </template>
    </v-switch>

    <template v-if="enabled">
      <v-divider class="my-4" />

      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <v-icon icon="mdi-quality-high" size="small" class="me-1" />
            <span class="text-subtitle-2">压缩质量</span>
          </div>
          <v-chip size="small" color="primary" variant="flat">{{ (quality * 100).toFixed(0) }}%</v-chip>
        </div>
        <v-slider v-model="quality" :min="0.1" :max="1" :step="0.1" thumb-label hide-details color="primary" class="mb-2">
          <template #thumb-label="{ modelValue }"> {{ (modelValue * 100).toFixed(0) }}% </template>
        </v-slider>
        <div class="text-caption text-medium-emphasis">质量越高，文件越大，图片越清晰</div>
      </div>

      <v-row class="mb-4">
        <v-col cols="12" sm="6">
          <div class="mb-2">
            <v-icon icon="mdi-arrow-expand-horizontal" size="small" class="me-1" />
            <span class="text-subtitle-2">最大宽度</span>
          </div>
          <v-text-field v-model.number="maxWidth" type="number" suffix="px" variant="outlined" density="compact" hide-details />
        </v-col>
        <v-col cols="12" sm="6">
          <div class="mb-2">
            <v-icon icon="mdi-arrow-expand-vertical" size="small" class="me-1" />
            <span class="text-subtitle-2">最大高度</span>
          </div>
          <v-text-field v-model.number="maxHeight" type="number" suffix="px" variant="outlined" density="compact" hide-details />
        </v-col>
      </v-row>

      <div class="mb-4">
        <div class="mb-2">
          <v-icon icon="mdi-file-alert" size="small" class="me-1" />
          <span class="text-subtitle-2">压缩阈值</span>
        </div>
        <v-text-field
          v-model.number="threshold"
          type="number"
          suffix="KB"
          hint="大于此大小的图片将被压缩"
          persistent-hint
          variant="outlined"
          density="compact"
        />
      </div>

      <v-alert type="info" variant="tonal" density="compact">
        <div class="d-flex align-center mb-2">
          <v-icon icon="mdi-lightbulb-on" class="me-2" />
          <span class="font-weight-bold">优化建议</span>
        </div>
        <ul class="text-caption ml-6">
          <li>建议质量设置为 80% 以获得最佳平衡</li>
          <li>最大尺寸 1920x1920 适合大多数场景</li>
          <li>压缩阈值 500KB 可以有效减少存储</li>
        </ul>
      </v-alert>

      <div class="d-flex justify-end gap-2 mt-4">
        <v-btn variant="outlined" prepend-icon="mdi-restore" @click="reset">重置默认</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="save">保存设置</v-btn>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { compressSettings, defaultCompressOptions } from '@/libs/imageCompressor'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { onMounted, ref } from 'vue'

const { showMessage } = useSnackBarStore()

const enabled = ref(true)
const quality = ref(defaultCompressOptions.quality || 0.8)
const maxWidth = ref(defaultCompressOptions.maxWidth || 1920)
const maxHeight = ref(defaultCompressOptions.maxHeight || 1920)
const threshold = ref(500) // KB

const emit = defineEmits<{
  save: [options: any]
}>()

const save = () => {
  const settings = {
    enabled: enabled.value,
    quality: quality.value,
    maxWidth: maxWidth.value,
    maxHeight: maxHeight.value,
    threshold: threshold.value * 1024
  }

  compressSettings.save(settings)
  emit('save', settings)
  showMessage('压缩设置已保存', { color: 'success' })
}

const reset = () => {
  const defaults = compressSettings.getDefaults()
  enabled.value = defaults.enabled
  quality.value = defaults.quality || 0.8
  maxWidth.value = defaults.maxWidth || 1920
  maxHeight.value = defaults.maxHeight || 1920
  threshold.value = (defaults.threshold || 500 * 1024) / 1024
  showMessage('已重置为默认设置', { color: 'info' })
}

// 从 localStorage 加载设置
const loadSettings = () => {
  const saved = compressSettings.load()
  if (saved) {
    enabled.value = saved.enabled ?? true
    quality.value = saved.quality ?? 0.8
    maxWidth.value = saved.maxWidth ?? 1920
    maxHeight.value = saved.maxHeight ?? 1920
    threshold.value = (saved.threshold ?? 500 * 1024) / 1024
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
ul {
  list-style-type: disc;

  li {
    margin-bottom: 4px;
  }
}

.gap-2 {
  gap: 8px;
}
</style>
