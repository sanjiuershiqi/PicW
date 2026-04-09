<template>
  <div v-if="folders.length > 0">
    <!-- 列表视图 -->
    <v-card v-if="viewMode === 'list'" variant="flat" class="folder-list bg-transparent mb-4">
      <v-list lines="two" class="bg-transparent pa-0">
        <v-list-item
          v-for="(folder, index) in folders"
          :key="folder.path"
          @click="$emit('navigate', folder.path)"
          class="folder-list-item"
        >
          <template #prepend>
            <div class="folder-icon-wrapper elevation-1">
              <v-icon size="28" color="accent">mdi-folder-open-outline</v-icon>
            </div>
          </template>

          <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1 folder-name">
            {{ folder.name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            Folder
          </v-list-item-subtitle>

          <template #append>
            <v-btn icon="mdi-chevron-right" variant="text" color="medium-emphasis" size="small" @click.stop="$emit('navigate', folder.path)" />
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
              <div class="text-caption text-medium-emphasis d-flex align-center">
                Folder
              </div>
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
  border-radius: 0;
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgb(var(--v-theme-primary));
  transition: all 0.1s;
  overflow: hidden;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 6px 6px 0 rgb(var(--v-theme-accent)) !important;

    .chevron-icon {
      transform: translateX(4px);
      color: rgb(var(--v-theme-accent)) !important;
    }
    
    .folder-icon-wrapper {
      background: rgb(var(--v-theme-primary));
      color: rgb(var(--v-theme-on-primary));
      
      .v-icon {
        color: rgb(var(--v-theme-on-primary)) !important;
      }
    }
  }
}

.folder-icon-wrapper {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.folder-name {
  letter-spacing: 0;
  font-family: var(--font-mono);
  font-weight: 700 !important;
  text-transform: uppercase;
}

.chevron-icon {
  transition: all 0.1s;
}

.folder-list {
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 0;
  
  .folder-list-item {
    cursor: pointer;
    background: rgb(var(--v-theme-surface));
    border-bottom: 2px solid rgb(var(--v-theme-primary));
    transition: all 0.1s;
    padding: 16px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(var(--v-theme-accent), 0.1);
      padding-left: 24px;

      .folder-icon-wrapper {
        background: rgb(var(--v-theme-primary));
        
        .v-icon {
          color: rgb(var(--v-theme-on-primary)) !important;
        }
      }
    }
  }
}
</style>
