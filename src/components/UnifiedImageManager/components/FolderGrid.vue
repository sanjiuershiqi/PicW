<template>
  <div v-if="folders.length > 0">
    <!-- 列表视图 -->
    <v-card v-if="viewMode === 'list'" variant="flat" class="folder-list bg-transparent mb-4">
      <v-list lines="two" class="bg-transparent pa-0">
        <v-list-item v-for="folder in folders" :key="folder.path" @click="$emit('navigate', folder.path)" class="folder-list-item">
          <template #prepend>
            <div class="folder-icon-wrapper elevation-1">
              <v-icon size="28" color="accent">mdi-folder-open-outline</v-icon>
            </div>
          </template>

          <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1 folder-name">
            {{ folder.name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-medium-emphasis"> Folder </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              color="medium-emphasis"
              size="small"
              @click.stop="$emit('navigate', folder.path)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- 网格视图 -->
    <v-row v-else class="mb-4">
      <v-col v-for="folder in folders" :key="folder.path" cols="12" sm="6" md="4" lg="3">
        <v-card @click="$emit('navigate', folder.path)" class="folder-card" elevation="0">
          <v-card-text class="d-flex align-center pa-4">
            <div class="folder-icon-wrapper elevation-1 mr-4">
              <v-icon size="32" color="accent">mdi-folder-outline</v-icon>
            </div>
            <div class="overflow-hidden">
              <div class="text-subtitle-1 font-weight-bold mb-1 text-truncate folder-name">
                {{ folder.name }}
              </div>
              <div class="text-caption text-medium-emphasis d-flex align-center">Folder</div>
            </div>
            <v-spacer></v-spacer>
            <v-icon color="medium-emphasis" size="small" class="chevron-icon">mdi-chevron-right</v-icon>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import type { FolderItem } from '../types'

interface Props {
  folders: FolderItem[]
  viewMode?: 'grid' | 'list'
}

withDefaults(defineProps<Props>(), {
  viewMode: 'grid'
})

defineEmits<{
  navigate: [path: string]
}>()
</script>

<style scoped lang="scss">
.folder-card {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08) !important;
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(255, 255, 255, 0.8);

    .v-theme--dark & {
      background: rgba(15, 23, 42, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .chevron-icon {
      transform: translateX(4px);
      color: rgb(var(--v-theme-accent)) !important;
    }

    .folder-icon-wrapper {
      background: rgba(var(--v-theme-accent), 0.1);
      transform: scale(1.05);

      .v-icon {
        color: rgb(var(--v-theme-accent)) !important;
      }
    }
  }
}

.folder-icon-wrapper {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .v-theme--dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.folder-name {
  letter-spacing: -0.2px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

  .v-theme--dark & {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

.chevron-icon {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.folder-list {
  background: transparent !important;

  .folder-list-item {
    cursor: pointer;
    margin-bottom: 8px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 12px 16px;

    .v-theme--dark & {
      background: rgba(15, 23, 42, 0.3);
      border-color: rgba(255, 255, 255, 0.1);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      transform: translateX(4px);
      border-color: rgba(255, 255, 255, 0.6);

      .v-theme--dark & {
        background: rgba(15, 23, 42, 0.5);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .folder-icon-wrapper {
        background: rgba(var(--v-theme-accent), 0.1);
        transform: scale(1.05);

        .v-icon {
          color: rgb(var(--v-theme-accent)) !important;
        }
      }
    }
  }
}
</style>
