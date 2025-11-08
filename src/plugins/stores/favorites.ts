import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FavoriteItem {
  sha: string
  name: string
  path: string
  url: string
  size: number
  addedAt: number
  repository: string
  username: string
}

export const useFavoritesStore = defineStore('favorites', () => {
  // 状态
  const favorites = ref<FavoriteItem[]>([])
  const isLoading = ref(false)

  // 计算属性
  const favoriteCount = computed(() => favorites.value.length)

  const isFavorite = computed(() => (sha: string) => {
    return favorites.value.some(item => item.sha === sha)
  })

  const getFavoritesBySha = computed(() => (shaList: string[]) => {
    return favorites.value.filter(item => shaList.includes(item.sha))
  })

  const sortedFavorites = computed(() => {
    return [...favorites.value].sort((a, b) => b.addedAt - a.addedAt)
  })

  // 方法
  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('picw_favorites')
      if (stored) {
        favorites.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载收藏失败:', error)
      favorites.value = []
    }
  }

  const saveFavorites = () => {
    try {
      localStorage.setItem('picw_favorites', JSON.stringify(favorites.value))
    } catch (error) {
      console.error('保存收藏失败:', error)
    }
  }

  const addFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    // 检查是否已收藏
    if (isFavorite.value(item.sha)) {
      return false
    }

    const favoriteItem: FavoriteItem = {
      ...item,
      addedAt: Date.now()
    }

    favorites.value.push(favoriteItem)
    saveFavorites()
    return true
  }

  const removeFavorite = (sha: string) => {
    const index = favorites.value.findIndex(item => item.sha === sha)
    if (index > -1) {
      favorites.value.splice(index, 1)
      saveFavorites()
      return true
    }
    return false
  }

  const toggleFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    if (isFavorite.value(item.sha)) {
      removeFavorite(item.sha)
      return false
    } else {
      addFavorite(item)
      return true
    }
  }

  const clearFavorites = () => {
    favorites.value = []
    saveFavorites()
  }

  const batchAddFavorites = (items: Omit<FavoriteItem, 'addedAt'>[]) => {
    let addedCount = 0
    items.forEach(item => {
      if (addFavorite(item)) {
        addedCount++
      }
    })
    return addedCount
  }

  const batchRemoveFavorites = (shaList: string[]) => {
    let removedCount = 0
    shaList.forEach(sha => {
      if (removeFavorite(sha)) {
        removedCount++
      }
    })
    return removedCount
  }

  const exportFavorites = () => {
    const data = JSON.stringify(favorites.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `picw-favorites-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFavorites = async (file: File) => {
    try {
      const text = await file.text()
      const imported = JSON.parse(text) as FavoriteItem[]

      if (!Array.isArray(imported)) {
        throw new Error('无效的收藏数据格式')
      }

      // 合并导入的收藏（去重）
      let addedCount = 0
      imported.forEach(item => {
        if (!isFavorite.value(item.sha)) {
          favorites.value.push(item)
          addedCount++
        }
      })

      saveFavorites()
      return addedCount
    } catch (error) {
      console.error('导入收藏失败:', error)
      throw error
    }
  }

  // 初始化时加载
  loadFavorites()

  return {
    // 状态
    favorites,
    isLoading,

    // 计算属性
    favoriteCount,
    isFavorite,
    getFavoritesBySha,
    sortedFavorites,

    // 方法
    loadFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    batchAddFavorites,
    batchRemoveFavorites,
    exportFavorites,
    importFavorites
  }
})
