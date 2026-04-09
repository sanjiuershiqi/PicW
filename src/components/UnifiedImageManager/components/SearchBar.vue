<template>
  <div class="search-wrapper">
    <v-text-field
      :model-value="searchQuery"
      @update:model-value="$emit('update:searchQuery', $event)"
      placeholder="Search for images..."
      clearable
      hide-details
      density="comfortable"
      variant="solo-filled"
      class="modern-search"
      :loading="isSearching"
      rounded="xl"
      elevation="0"
      bg-color="rgba(var(--v-theme-surface), 0.6)"
    >
      <template #prepend-inner>
        <v-icon color="medium-emphasis" class="ml-2 mr-2">mdi-magnify</v-icon>
      </template>
      <template #append-inner>
        <v-chip v-if="resultCount !== null" size="small" color="accent" variant="tonal" class="font-weight-bold mr-2">
          {{ resultCount }} results
        </v-chip>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
interface Props {
  searchQuery: string
  isSearching: boolean
  resultCount: number | null
}

defineProps<Props>()

defineEmits<{
  'update:searchQuery': [query: string]
}>()
</script>

<style scoped lang="scss">
.modern-search {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  
  :deep(.v-field) {
    box-shadow: none !important;
    border-radius: 24px !important;
    padding-right: 8px;
    
    &.v-field--focused {
      background: rgba(var(--v-theme-surface), 1) !important;
    }
  }

  :deep(.v-field__input) {
    font-weight: 500;
    letter-spacing: -0.2px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04) !important;
    border-color: rgba(var(--v-theme-accent), 0.3);
  }

  &:focus-within {
    box-shadow: 0 8px 32px rgba(var(--v-theme-accent), 0.1) !important;
    border-color: rgb(var(--v-theme-accent));
    transform: translateY(-2px);
  }
}
</style>
