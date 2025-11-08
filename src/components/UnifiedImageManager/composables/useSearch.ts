import { ref, computed } from 'vue'
import { searchInRepository } from '@/plugins/axios/search'
import { handleApiError } from '@/libs/errorHandler'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import type { ImageItem } from '../types'

/**
 * 搜索逻辑 Composable
 */
export const useSearch = (username: string, repository: string, fileTypeFilter: string[], sortBy: string) => {
  const { showMessage } = useSnackBarStore()

  const searchQuery = ref('')
  const searchResults = ref<ImageItem[]>([])
  const searchLoading = ref(false)
  let searchTimeout: number | null = null

  // 是否正在搜索
  const isSearching = computed(() => searchQuery.value.trim().length > 0)

  // 搜索输入处理（防抖）
  const onSearchInput = () => {
    // 清除之前的搜索定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (searchQuery.value.trim()) {
      // 防抖搜索，500ms 后执行
      searchTimeout = setTimeout(() => {
        performSearch()
      }, 500)
    } else {
      searchResults.value = []
    }
  }

  // 执行搜索
  const performSearch = async () => {
    if (!searchQuery.value.trim()) {
      return
    }

    try {
      searchLoading.value = true
      const results = await searchInRepository(username, repository, searchQuery.value.trim(), {
        fileTypes: fileTypeFilter,
        sortBy: sortBy,
        maxResults: 100
      })

      // 转换搜索结果格式
      searchResults.value = results.map(result => ({
        ...result,
        directory: result.path.substring(0, result.path.lastIndexOf('/')) || '/'
      }))

      showMessage(`找到 ${results.length} 个搜索结果`, { color: 'success' })
    } catch (error) {
      handleApiError(error, { customMessage: '搜索失败，请稍后重试' })
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  // 清除搜索
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchQuery,
    searchResults,
    searchLoading,
    isSearching,
    onSearchInput,
    performSearch,
    clearSearch
  }
}
