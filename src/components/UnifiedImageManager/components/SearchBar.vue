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
      class="glass-search font-mono text-uppercase"
      :loading="isSearching"
      bg-color="transparent"
    >
      <template #prepend-inner>
        <v-icon color="primary" class="ml-2 mr-2">mdi-magnify</v-icon>
      </template>
      <template #append-inner>
        <div v-if="resultCount !== null" class="result-badge font-mono">[{{ resultCount }} RESULTS]</div>
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
.glass-search {
  :deep(.v-field) {
    background: rgba(255, 255, 255, 0.2) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
    border-radius: 24px !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    .v-theme--dark & {
      background: rgba(15, 23, 42, 0.3) !important;
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
    }

    &.v-field--focused {
      background: rgba(255, 255, 255, 0.4) !important;
      border-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 12px 40px rgba(var(--v-theme-primary), 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5) !important;
      transform: translateY(-2px);

      .v-theme--dark & {
        background: rgba(15, 23, 42, 0.5) !important;
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  :deep(.v-field__input) {
    font-weight: 600;
    letter-spacing: 1px;
    padding-top: 14px;
    padding-bottom: 14px;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

    .v-theme--dark & {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
  }
}

.result-badge {
  background: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  padding: 4px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);

  .v-theme--dark & {
    box-shadow: none;
  }
}
</style>
