<template>
  <div class="search-wrapper mb-6">
    <v-text-field
      :model-value="searchQuery"
      @update:model-value="$emit('update:searchQuery', $event)"
      placeholder="SEARCH IMAGES..."
      clearable
      hide-details
      density="comfortable"
      variant="outlined"
      class="brutalist-search font-mono text-uppercase"
      :loading="isSearching"
      bg-color="surface"
    >
      <template #prepend-inner>
        <v-icon color="primary" class="ml-2 mr-2">mdi-magnify</v-icon>
      </template>
      <template #append-inner>
        <div v-if="resultCount !== null" class="result-badge font-mono">
          [{{ resultCount }} RESULTS]
        </div>
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
.brutalist-search {
  :deep(.v-field) {
    border: 2px solid rgb(var(--v-theme-primary));
    box-shadow: 4px 4px 0 rgb(var(--v-theme-accent)) !important;
    transition: all 0.1s;
    border-radius: 0 !important;
    
    &.v-field--focused {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 rgb(var(--v-theme-accent)) !important;
    }
  }

  :deep(.v-field__input) {
    font-weight: 700;
    letter-spacing: 1px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
}

.result-badge {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
}
</style>
