<template>
  <v-slide-y-reverse-transition>
    <v-card v-if="selectedCount > 0" variant="flat" color="primary" class="batch-actions-bar">
      <v-card-text class="d-flex align-center py-3 px-4">
        <!-- 选中信息 -->
        <div class="d-flex align-center">
          <v-icon icon="mdi-checkbox-marked-circle" class="me-2" />
          <span class="text-subtitle-1 font-weight-medium"> 已选择 {{ selectedCount }} 项 </span>
        </div>

        <v-spacer />

        <!-- 操作按钮 -->
        <div class="batch-actions">
          <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="$emit('copy-links')" class="me-2"> 复制链接 </v-btn>

          <v-btn variant="text" size="small" prepend-icon="mdi-download-multiple" @click="$emit('batch-download')" class="me-2">
            下载
          </v-btn>

          <v-btn variant="text" size="small" prepend-icon="mdi-delete-multiple" color="error" @click="$emit('batch-delete')" class="me-2">
            删除
          </v-btn>

          <v-btn variant="text" size="small" icon="mdi-close" @click="$emit('clear-selection')" />
        </div>
      </v-card-text>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script setup lang="ts">
interface Props {
  selectedCount: number
}

defineProps<Props>()

defineEmits<{
  'copy-links': []
  'batch-download': []
  'batch-delete': []
  'clear-selection': []
}>()
</script>

<style scoped lang="scss">
.batch-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
