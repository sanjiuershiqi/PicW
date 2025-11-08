<template>
  <v-text-field
    :model-value="searchQuery"
    @update:model-value="$emit('update:searchQuery', $event)"
    prepend-inner-icon="mdi-magnify"
    placeholder="搜索图片..."
    clearable
    hide-details
    density="comfortable"
    variant="outlined"
    :loading="isSearching"
  >
    <template #append-inner>
      <v-chip v-if="resultCount !== null" size="small" color="primary" variant="flat"> {{ resultCount }} 个结果 </v-chip>
    </template>
  </v-text-field>
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
