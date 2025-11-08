import { ref, computed, type Ref } from 'vue'
import type { ImageItem, SortOption, FileTypeOption, ViewMode, SortBy } from '../types'

/**
 * 筛选和排序逻辑 Composable
 */
export const useFilters = (images: Ref<ImageItem[]>, searchResults: Ref<ImageItem[]>, isSearching: Ref<boolean>) => {
  const viewMode = ref<ViewMode>('grid')
  const sortBy = ref<SortBy>('name-asc')
  const fileTypeFilter = ref<string[]>([])

  // 排序选项
  const sortOptions: SortOption[] = [
    { title: '名称 A-Z', value: 'name-asc' },
    { title: '名称 Z-A', value: 'name-desc' },
    { title: '大小 小-大', value: 'size-asc' },
    { title: '大小 大-小', value: 'size-desc' }
  ]

  // 文件类型选项
  const fileTypeOptions: FileTypeOption[] = [
    { title: 'JPG', value: 'jpg' },
    { title: 'PNG', value: 'png' },
    { title: 'GIF', value: 'gif' },
    { title: 'WebP', value: 'webp' },
    { title: 'SVG', value: 'svg' }
  ]

  // 显示的图片（应用筛选和排序）
  const displayImages = computed(() => {
    let result = isSearching.value ? searchResults.value : images.value

    // 文件类型筛选
    if (fileTypeFilter.value.length > 0) {
      result = result.filter(image => {
        const ext = image.name.split('.').pop()?.toLowerCase()
        return ext && fileTypeFilter.value.includes(ext)
      })
    }

    // 排序
    result = [...result].sort((a, b) => {
      switch (sortBy.value) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'size-asc':
          return a.size - b.size
        case 'size-desc':
          return b.size - a.size
        default:
          return 0
      }
    })

    return result
  })

  return {
    viewMode,
    sortBy,
    fileTypeFilter,
    sortOptions,
    fileTypeOptions,
    displayImages
  }
}
