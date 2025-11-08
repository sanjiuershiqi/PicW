<template>
  <div v-if="folders.length > 0">
    <!-- 列表视图 -->
    <v-card v-if="viewMode === 'list'" variant="flat" class="folder-list mb-4">
      <v-list lines="two" class="pa-0">
        <v-list-item
          v-for="(folder, index) in folders"
          :key="folder.path"
          @click="$emit('navigate', folder.path)"
          class="folder-list-item"
          :class="{ 'border-b': index < folders.length - 1 }"
        >
          <template #prepend>
            <v-avatar color="primary" variant="tonal" size="56" rounded="lg" class="me-4">
              <v-icon size="32">mdi-folder</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1">
            {{ folder.name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            <v-icon size="14" class="me-1">mdi-folder-outline</v-icon>
            文件夹
          </v-list-item-subtitle>

          <template #append>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" @click.stop="$emit('navigate', folder.path)" />
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- 网格视图 -->
    <v-row v-else>
      <v-col v-for="folder in folders" :key="folder.path" cols="12" sm="6" md="4" lg="3">
        <v-card hover @click="$emit('navigate', folder.path)" class="folder-card" variant="tonal">
          <v-card-text class="text-center pa-6">
            <v-avatar color="primary" size="80" class="mb-4">
              <v-icon size="48">mdi-folder</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              {{ folder.name }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex align-center justify-center">
              <v-icon size="14" class="me-1">mdi-folder-outline</v-icon>
              文件夹
            </div>
          </v-card-text>
          <v-card-actions class="justify-center pa-2 pt-0">
            <v-btn variant="text" size="small" prepend-icon="mdi-folder-open" @click.stop="$emit('navigate', folder.path)"> 打开 </v-btn>
          </v-card-actions>
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: rgb(var(--v-theme-primary));
  }
}

.folder-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;

  .folder-list-item {
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 16px;

    &.border-b {
      border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.08);
    }

    &:active {
      background-color: rgba(var(--v-theme-primary), 0.12);
    }
  }
}
</style>
