<template>
  <v-slide-y-reverse-transition>
    <div v-if="selectedCount > 0" class="batch-actions-wrapper">
      <div class="brutalist-batch-bar">
        <div class="d-flex align-center py-2 px-4 px-sm-6 w-100">
          <!-- 选中信息 -->
          <div class="selection-badge font-mono mr-4">
            [{{ selectedCount }} SELECTED]
          </div>

          <v-spacer />

          <!-- 操作按钮 -->
          <div class="batch-actions">
            <v-btn variant="text" size="small" @click="$emit('copy-links')" class="action-btn font-mono">
              <v-icon start size="small">mdi-link-variant</v-icon>
              COPY
            </v-btn>

            <v-btn variant="text" size="small" @click="$emit('batch-download')" class="action-btn font-mono">
              <v-icon start size="small">mdi-download-outline</v-icon>
              DOWNLOAD
            </v-btn>

            <div class="divider-line mx-2"></div>

            <v-btn variant="text" size="small" @click="$emit('batch-delete')" class="action-btn font-mono text-accent">
              <v-icon start size="small">mdi-delete-outline</v-icon>
              DELETE
            </v-btn>

            <v-btn variant="flat" size="small" icon="mdi-close" color="primary" class="ml-2 close-btn rounded-0" @click="$emit('clear-selection')" />
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
  bottom: 32px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.brutalist-batch-bar {
  pointer-events: auto;
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgb(var(--v-theme-primary));
  box-shadow: 8px 8px 0 rgb(var(--v-theme-accent));
  display: flex;
  align-items: center;
  min-width: 600px;
}

.selection-badge {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 4px 12px;
  font-weight: 700;
  font-size: 0.9rem;
}

.batch-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  letter-spacing: 1px;
  font-weight: 700;
  transition: all 0.1s;
  border: 2px solid transparent;
  color: rgb(var(--v-theme-primary));

  &:hover {
    background: rgba(var(--v-theme-primary), 0.1);
    border-color: rgb(var(--v-theme-primary));
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 rgb(var(--v-theme-primary));
  }
}

.close-btn {
  transition: all 0.1s;
  &:hover {
    transform: rotate(90deg) scale(1.1);
    background: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
  }
}

.divider-line {
  width: 2px;
  height: 24px;
  background: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  .batch-actions-wrapper {
    bottom: 16px;
    padding: 0 16px;
  }
  
  .brutalist-batch-bar {
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
