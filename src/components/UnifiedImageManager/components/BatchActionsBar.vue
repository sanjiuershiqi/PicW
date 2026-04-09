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
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  display: flex;
  align-items: center;
  min-width: 500px;
  
  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.4);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }
}

.selection-badge {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  
  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

.batch-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: rgb(var(--v-theme-secondary));
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
  border-radius: 20px;

  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.5);
    color: rgb(var(--v-theme-primary));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
    
    .v-theme--dark & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  &.text-error:hover {
    background: rgba(var(--v-theme-error), 0.1);
    color: rgb(var(--v-theme-error)) !important;
    box-shadow: 0 4px 12px rgba(var(--v-theme-error), 0.15);
  }
}

.close-btn {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    color: rgb(var(--v-theme-primary)) !important;
    transform: rotate(90deg);
    
    .v-theme--dark & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.divider-line {
  width: 2px;
  height: 20px;
  background: rgba(var(--v-theme-primary), 0.2);
  border-radius: 2px;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.5);
  
  .v-theme--dark & {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
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
