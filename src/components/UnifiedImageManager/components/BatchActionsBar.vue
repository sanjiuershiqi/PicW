<template>
  <v-slide-y-reverse-transition>
    <div v-if="selectedCount > 0" class="batch-actions-wrapper">
      <div class="util-batch-bar">
        <div class="d-flex align-center py-2 px-4 w-100">
          <!-- 选中信息 -->
          <div class="selection-badge mr-4">
            <v-icon size="small" class="mr-1">mdi-check-circle</v-icon>
            {{ selectedCount }} selected
          </div>

          <v-spacer />

          <!-- 操作按钮 -->
          <div class="batch-actions">
            <v-btn variant="text" size="small" @click="$emit('copy-links')" class="action-btn">
              <v-icon start size="small">mdi-link-variant</v-icon>
              Copy Links
            </v-btn>

            <v-btn variant="text" size="small" @click="$emit('batch-download')" class="action-btn">
              <v-icon start size="small">mdi-download-outline</v-icon>
              Download
            </v-btn>

            <div class="divider-line mx-2"></div>

            <v-btn variant="text" size="small" color="error" @click="$emit('batch-delete')" class="action-btn">
              <v-icon start size="small">mdi-delete-outline</v-icon>
              Delete
            </v-btn>

            <v-btn variant="text" size="small" icon="mdi-close" color="secondary" class="ml-2 close-btn" @click="$emit('clear-selection')" />
          </div>
        </div>
      </div>
    </div>
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
.batch-actions-wrapper {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.util-batch-bar {
  pointer-events: auto;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgb(var(--v-theme-border-color));
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  min-width: 500px;
}

.selection-badge {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.batch-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  transition: all 0.15s ease;
  color: rgb(var(--v-theme-secondary));

  &:hover {
    background: rgba(var(--v-theme-primary), 0.05);
    color: rgb(var(--v-theme-primary));
  }
  
  &.text-error:hover {
    background: rgba(var(--v-theme-error), 0.05);
    color: rgb(var(--v-theme-error)) !important;
  }
}

.close-btn {
  transition: all 0.15s ease;
  &:hover {
    background: rgba(var(--v-theme-primary), 0.05);
    color: rgb(var(--v-theme-primary)) !important;
  }
}

.divider-line {
  width: 1px;
  height: 16px;
  background: rgb(var(--v-theme-border-color));
}

@media (max-width: 600px) {
  .batch-actions-wrapper {
    bottom: 16px;
    padding: 0 16px;
  }
  
  .util-batch-bar {
    min-width: auto;
    width: 100%;
  }
  
  .batch-actions {
    .v-btn span {
      display: none;
    }
    
    .v-icon {
      margin: 0 !important;
    }
  }
}
</style>
