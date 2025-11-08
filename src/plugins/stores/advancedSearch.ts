import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AdvancedSearchFilters {
  // 基础搜索
  keyword: string

  // 文件类型
  fileTypes: string[]

  // 大小范围
  sizeRange: {
    min: number | null
    max: number | null
    preset: 'all' | 'small' | 'medium' | 'large' | 'xlarge' | 'custom'
  }

  // 日期范围
  dateRange: {
    start: Date | null
    end: Date | null
    preset: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  }

  // 路径筛选
  pathFilter: {
    directory: string
    includeSubdirs: boolean
  }

  // 标签筛选
  tags: string[]

  // 收藏筛选
  onlyFavorites: boolean

  // 排序
  sortBy: 'name' | 'size' | 'date' | 'type'
  sortOrder: 'asc' | 'desc'
}

export interface SearchHistory {
  id: string
  filters: AdvancedSearchFilters
  timestamp: number
  resultCount: number
}

export const useAdvancedSearchStore = defineStore('advancedSearch', () => {
  // 当前搜索筛选条件
  const filters = ref<AdvancedSearchFilters>({
    keyword: '',
    fileTypes: [],
    sizeRange: {
      min: null,
      max: null,
      preset: 'all'
    },
    dateRange: {
      start: null,
      end: null,
      preset: 'all'
    },
    pathFilter: {
      directory: '',
      includeSubdirs: true
    },
    tags: [],
    onlyFavorites: false,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // 搜索历史（最多保存20条）
  const searchHistory = ref<SearchHistory[]>([])

  // 常用搜索（使用频率最高的5个）
  const frequentSearches = ref<Map<string, number>>(new Map())

  // 是否有活动的筛选条件
  const hasActiveFilters = computed(() => {
    return (
      filters.value.keyword.trim() !== '' ||
      filters.value.fileTypes.length > 0 ||
      filters.value.sizeRange.preset !== 'all' ||
      filters.value.dateRange.preset !== 'all' ||
      filters.value.pathFilter.directory !== '' ||
      filters.value.tags.length > 0 ||
      filters.value.onlyFavorites
    )
  })

  // 活动筛选条件数量
  const activeFiltersCount = computed(() => {
    let count = 0
    if (filters.value.keyword.trim()) {
      count++
    }
    if (filters.value.fileTypes.length > 0) {
      count++
    }
    if (filters.value.sizeRange.preset !== 'all') {
      count++
    }
    if (filters.value.dateRange.preset !== 'all') {
      count++
    }
    if (filters.value.pathFilter.directory) {
      count++
    }
    if (filters.value.tags.length > 0) {
      count++
    }
    if (filters.value.onlyFavorites) {
      count++
    }
    return count
  })

  // 获取排序后的搜索历史
  const sortedSearchHistory = computed(() => {
    return [...searchHistory.value].sort((a, b) => b.timestamp - a.timestamp)
  })

  // 获取常用搜索（按使用频率排序）
  const topFrequentSearches = computed(() => {
    return Array.from(frequentSearches.value.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword)
  })

  // 更新筛选条件
  const updateFilters = (newFilters: Partial<AdvancedSearchFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // 重置筛选条件
  const resetFilters = () => {
    filters.value = {
      keyword: '',
      fileTypes: [],
      sizeRange: {
        min: null,
        max: null,
        preset: 'all'
      },
      dateRange: {
        start: null,
        end: null,
        preset: 'all'
      },
      pathFilter: {
        directory: '',
        includeSubdirs: true
      },
      tags: [],
      onlyFavorites: false,
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }

  // 添加到搜索历史
  const addToHistory = (resultCount: number) => {
    const historyItem: SearchHistory = {
      id: Date.now().toString(),
      filters: JSON.parse(JSON.stringify(filters.value)),
      timestamp: Date.now(),
      resultCount
    }

    // 添加到历史记录
    searchHistory.value.unshift(historyItem)

    // 限制历史记录数量
    if (searchHistory.value.length > 20) {
      searchHistory.value = searchHistory.value.slice(0, 20)
    }

    // 更新常用搜索
    if (filters.value.keyword.trim()) {
      const keyword = filters.value.keyword.trim()
      const count = frequentSearches.value.get(keyword) || 0
      frequentSearches.value.set(keyword, count + 1)
    }

    // 保存到 localStorage
    saveToLocalStorage()
  }

  // 从历史记录恢复搜索
  const restoreFromHistory = (historyId: string) => {
    const historyItem = searchHistory.value.find(item => item.id === historyId)
    if (historyItem) {
      filters.value = JSON.parse(JSON.stringify(historyItem.filters))
    }
  }

  // 删除历史记录
  const removeFromHistory = (historyId: string) => {
    searchHistory.value = searchHistory.value.filter(item => item.id !== historyId)
    saveToLocalStorage()
  }

  // 清空搜索历史
  const clearHistory = () => {
    searchHistory.value = []
    frequentSearches.value.clear()
    saveToLocalStorage()
  }

  // 设置大小范围预设
  const setSizePreset = (preset: AdvancedSearchFilters['sizeRange']['preset']) => {
    switch (preset) {
      case 'small':
        filters.value.sizeRange = { min: null, max: 100 * 1024, preset }
        break
      case 'medium':
        filters.value.sizeRange = { min: 100 * 1024, max: 1024 * 1024, preset }
        break
      case 'large':
        filters.value.sizeRange = { min: 1024 * 1024, max: 5 * 1024 * 1024, preset }
        break
      case 'xlarge':
        filters.value.sizeRange = { min: 5 * 1024 * 1024, max: null, preset }
        break
      case 'all':
        filters.value.sizeRange = { min: null, max: null, preset }
        break
      case 'custom':
        filters.value.sizeRange.preset = 'custom'
        break
    }
  }

  // 设置日期范围预设
  const setDatePreset = (preset: AdvancedSearchFilters['dateRange']['preset']) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case 'today':
        filters.value.dateRange = {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          preset
        }
        break
      case 'week':
        filters.value.dateRange = {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
          preset
        }
        break
      case 'month':
        filters.value.dateRange = {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
          preset
        }
        break
      case 'year':
        filters.value.dateRange = {
          start: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000),
          end: now,
          preset
        }
        break
      case 'all':
        filters.value.dateRange = { start: null, end: null, preset }
        break
      case 'custom':
        filters.value.dateRange.preset = 'custom'
        break
    }
  }

  // 保存到 localStorage
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('advancedSearch_history', JSON.stringify(searchHistory.value))
      localStorage.setItem('advancedSearch_frequent', JSON.stringify(Array.from(frequentSearches.value.entries())))
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  // 从 localStorage 加载
  const loadFromLocalStorage = () => {
    try {
      const historyData = localStorage.getItem('advancedSearch_history')
      if (historyData) {
        searchHistory.value = JSON.parse(historyData)
      }

      const frequentData = localStorage.getItem('advancedSearch_frequent')
      if (frequentData) {
        frequentSearches.value = new Map(JSON.parse(frequentData))
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromLocalStorage()

  return {
    // State
    filters,
    searchHistory,

    // Computed
    hasActiveFilters,
    activeFiltersCount,
    sortedSearchHistory,
    topFrequentSearches,

    // Actions
    updateFilters,
    resetFilters,
    addToHistory,
    restoreFromHistory,
    removeFromHistory,
    clearHistory,
    setSizePreset,
    setDatePreset
  }
})
