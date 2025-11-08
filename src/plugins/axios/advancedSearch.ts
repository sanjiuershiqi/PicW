import axios from './api'
import { useFavoritesStore } from '@/plugins/stores/favorites'
import type { AdvancedSearchFilters } from '@/plugins/stores/advancedSearch'

export interface SearchResult {
  name: string
  path: string
  directory: string
  size: number
  type: string
  sha: string
  download_url?: string
  lastModified?: Date
}

/**
 * 高级搜索 - 支持多维度筛选
 */
export const advancedSearch = async (username: string, repository: string, filters: AdvancedSearchFilters): Promise<SearchResult[]> => {
  try {
    // 获取所有图片
    const allImages = await getAllImages(username, repository, filters.pathFilter.directory || '/', filters.pathFilter.includeSubdirs)

    // 应用筛选条件
    let results = allImages

    // 1. 关键词筛选
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.trim().toLowerCase()
      results = results.filter(img => img.name.toLowerCase().includes(keyword))
    }

    // 2. 文件类型筛选
    if (filters.fileTypes.length > 0) {
      results = results.filter(img => {
        const ext = img.name.split('.').pop()?.toLowerCase()
        return ext && filters.fileTypes.includes(ext)
      })
    }

    // 3. 文件大小筛选
    if (filters.sizeRange.min !== null || filters.sizeRange.max !== null) {
      results = results.filter(img => {
        if (filters.sizeRange.min !== null && img.size < filters.sizeRange.min) {
          return false
        }
        if (filters.sizeRange.max !== null && img.size > filters.sizeRange.max) {
          return false
        }
        return true
      })
    }

    // 4. 日期范围筛选（如果有 lastModified 信息）
    if (filters.dateRange.start || filters.dateRange.end) {
      results = results.filter(img => {
        if (!img.lastModified) {
          return true
        } // 如果没有日期信息，保留

        const imgDate = new Date(img.lastModified)
        if (filters.dateRange.start && imgDate < filters.dateRange.start) {
          return false
        }
        if (filters.dateRange.end && imgDate > filters.dateRange.end) {
          return false
        }
        return true
      })
    }

    // 5. 收藏筛选
    if (filters.onlyFavorites) {
      const favoritesStore = useFavoritesStore()
      results = results.filter(img => favoritesStore.isFavorite(img.sha))
    }

    // 6. 排序
    results = sortResults(results, filters.sortBy, filters.sortOrder)

    return results
  } catch (error) {
    console.error('高级搜索失败:', error)
    throw error
  }
}

/**
 * 递归获取所有图片
 */
const getAllImages = async (username: string, repository: string, path: string, recursive: boolean): Promise<SearchResult[]> => {
  const results: SearchResult[] = []

  try {
    const response = await axios.get(`/repos/${username}/${repository}/contents${path}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    for (const item of items) {
      if (item.type === 'file' && isImageFile(item.name)) {
        results.push({
          name: item.name,
          path: item.path,
          directory: path || '/',
          size: item.size || 0,
          type: 'file',
          sha: item.sha,
          download_url: item.download_url
        })
      } else if (item.type === 'dir' && recursive) {
        // 递归搜索子目录
        const subResults = await getAllImages(username, repository, item.path, recursive)
        results.push(...subResults)
      }
    }
  } catch (error) {
    console.error(`获取目录 ${path} 失败:`, error)
  }

  return results
}

/**
 * 检查是否是图片文件
 */
const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

/**
 * 排序结果
 */
const sortResults = (
  results: SearchResult[],
  sortBy: AdvancedSearchFilters['sortBy'],
  sortOrder: AdvancedSearchFilters['sortOrder']
): SearchResult[] => {
  const sorted = [...results]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'date':
        if (a.lastModified && b.lastModified) {
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
        }
        break
      case 'type': {
        const extA = a.name.split('.').pop()?.toLowerCase() || ''
        const extB = b.name.split('.').pop()?.toLowerCase() || ''
        comparison = extA.localeCompare(extB)
        break
      }
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * 搜索建议 - 基于输入提供建议
 */
export const getSearchSuggestions = async (username: string, repository: string, query: string, limit: number = 10): Promise<string[]> => {
  if (!query.trim()) {
    return []
  }

  try {
    const allImages = await getAllImages(username, repository, '/', true)
    const keyword = query.toLowerCase()

    // 找到匹配的文件名
    const matches = allImages
      .filter(img => img.name.toLowerCase().includes(keyword))
      .map(img => img.name)
      .slice(0, limit)

    // 去重
    return Array.from(new Set(matches))
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    return []
  }
}

/**
 * 获取文件类型统计
 */
export const getFileTypeStats = async (username: string, repository: string, path: string = '/'): Promise<Record<string, number>> => {
  try {
    const allImages = await getAllImages(username, repository, path, true)
    const stats: Record<string, number> = {}

    allImages.forEach(img => {
      const ext = img.name.split('.').pop()?.toLowerCase() || 'unknown'
      stats[ext] = (stats[ext] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('获取文件类型统计失败:', error)
    return {}
  }
}

/**
 * 获取大小分布统计
 */
export const getSizeDistribution = async (
  username: string,
  repository: string,
  path: string = '/'
): Promise<{
  small: number
  medium: number
  large: number
  xlarge: number
}> => {
  try {
    const allImages = await getAllImages(username, repository, path, true)
    const distribution = {
      small: 0, // < 100KB
      medium: 0, // 100KB - 1MB
      large: 0, // 1MB - 5MB
      xlarge: 0 // > 5MB
    }

    allImages.forEach(img => {
      if (img.size < 100 * 1024) {
        distribution.small++
      } else if (img.size < 1024 * 1024) {
        distribution.medium++
      } else if (img.size < 5 * 1024 * 1024) {
        distribution.large++
      } else {
        distribution.xlarge++
      }
    })

    return distribution
  } catch (error) {
    console.error('获取大小分布统计失败:', error)
    return { small: 0, medium: 0, large: 0, xlarge: 0 }
  }
}

/**
 * 智能搜索 - 使用模糊匹配和相似度算法
 */
export const smartSearch = async (
  username: string,
  repository: string,
  query: string,
  options: {
    threshold?: number // 相似度阈值 (0-1)
    maxResults?: number
  } = {}
): Promise<SearchResult[]> => {
  const { threshold = 0.3, maxResults = 50 } = options

  try {
    const allImages = await getAllImages(username, repository, '/', true)
    const keyword = query.toLowerCase()

    // 计算每个图片的相似度分数
    const scored = allImages.map(img => ({
      ...img,
      score: calculateSimilarity(img.name.toLowerCase(), keyword)
    }))

    // 筛选并排序
    const results = scored
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ score: _score, ...item }) => item)

    return results
  } catch (error) {
    console.error('智能搜索失败:', error)
    return []
  }
}

/**
 * 计算字符串相似度（简单的 Levenshtein 距离）
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  // 如果完全包含，返回高分
  if (str1.includes(str2)) {
    return 1.0
  }

  // 计算编辑距离
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}
