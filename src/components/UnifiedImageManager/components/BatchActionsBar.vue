<template>
  <v-slide-y-reverse-transition>
    <div v-if="selectedCount > 0" class="batch-actions-wrapper">
      <v-card elevation="10" rounded="pill" class="batch-actions-bar">
        <v-card-text class="d-flex align-center py-2 px-4 px-sm-6">
          <!-- 选中信息 -->
          <div class="d-flex align-center selection-info bg-accent rounded-pill px-3 py-1 mr-4">
            <span class="text-caption font-weight-bold text-white">{{ selectedCount }} selected</span>
          </div>

          <v-spacer />

          <!-- 操作按钮 -->
          <div class="batch-actions">
            <v-btn variant="text" size="small" rounded="pill" @click="$emit('copy-links')" class="action-btn text-body-2 font-weight-medium">
              <v-icon start size="small">mdi-link-variant</v-icon>
              Copy
            </v-btn>

            <v-btn variant="text" size="small" rounded="pill" @click="$emit('batch-download')" class="action-btn text-body-2 font-weight-medium">
              <v-icon start size="small">mdi-download-outline</v-icon>
              Download
            </v-btn>

            <div class="divider-dot mx-2"></div>

            <v-btn variant="text" size="small" rounded="pill" color="error" @click="$emit('batch-delete')" class="action-btn text-body-2 font-weight-medium">
              <v-icon start size="small">mdi-delete-outline</v-icon>
              Delete
            </v-btn>

            <v-btn variant="tonal" size="small" icon="mdi-close" color="medium-emphasis" class="ml-2 close-btn" @click="$emit('clear-selection')" />
          </div>
        </v-card-text>
      </v-card>
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

.batch-actions-bar {
  pointer-events: auto;
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;
}

.selection-info {
  box-shadow: 0 4px 12px rgba(var(--v-theme-accent), 0.3);
}

.batch-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  text-transform: none;
  letter-spacing: 0;
  transition: all 0.2s;
  color: rgba(var(--v-theme-on-surface), 0.8);

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.05);
    color: rgb(var(--v-theme-on-surface));
  }
}

.close-btn {
  transition: transform 0.2s;
  &:hover {
    transform: rotate(90deg);
  }
}

.divider-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.2);
}

@media (max-width: 600px) {
  .batch-actions-wrapper {
    bottom: 16px;
    padding: 0 16px;
  }
  
  .batch-actions-bar {
    width: 100%;
    border-radius: 24px !important;
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
