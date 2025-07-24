import { request } from './index'

export interface SearchResult {
  name: string
  path: string
  directory: string
  size: number
  type: string
  sha: string
  download_url?: string
}

export interface SearchOptions {
  query: string
  username: string
  repository: string
  path?: string
  fileTypes?: string[]
  sizeRange?: 'small' | 'medium' | 'large' | 'xlarge' | 'all'
  recursive?: boolean
}

/**
 * 搜索仓库中的图片文件
 */
export const searchImages = async (options: SearchOptions): Promise<SearchResult[]> => {
  const { query, username, repository, path = '', recursive = true } = options

  try {
    // 如果是递归搜索，需要遍历所有文件夹
    if (recursive) {
      return await recursiveSearch(username, repository, path, query, options)
    } else {
      // 只搜索当前文件夹
      return await searchInFolder(username, repository, path, query, options)
    }
  } catch (error) {
    console.error('搜索失败:', error)
    return []
  }
}

/**
 * 递归搜索所有文件夹
 */
const recursiveSearch = async (
  username: string,
  repository: string,
  currentPath: string,
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> => {
  const results: SearchResult[] = []

  try {
    // 获取当前文件夹内容
    const response = await request.get(`/repos/${username}/${repository}/contents${currentPath}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    for (const item of items) {
      if (item.type === 'file') {
        // 检查是否是图片文件
        if (isImageFile(item.name) && matchesQuery(item.name, query)) {
          // 应用筛选条件
          if (matchesFilters(item, options)) {
            results.push({
              name: item.name,
              path: item.path,
              directory: currentPath || '/',
              size: item.size || 0,
              type: 'file',
              sha: item.sha,
              download_url: item.download_url
            })
          }
        }
      } else if (item.type === 'dir') {
        // 递归搜索子文件夹
        const subResults = await recursiveSearch(username, repository, item.path, query, options)
        results.push(...subResults)
      }
    }
  } catch (error) {
    console.error(`搜索文件夹 ${currentPath} 失败:`, error)
  }

  return results
}

/**
 * 在单个文件夹中搜索
 */
const searchInFolder = async (
  username: string,
  repository: string,
  path: string,
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> => {
  const results: SearchResult[] = []

  try {
    const response = await request.get(`/repos/${username}/${repository}/contents${path}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    for (const item of items) {
      if (item.type === 'file' && isImageFile(item.name) && matchesQuery(item.name, query)) {
        if (matchesFilters(item, options)) {
          results.push({
            name: item.name,
            path: item.path,
            directory: path || '/',
            size: item.size || 0,
            type: 'file',
            sha: item.sha,
            download_url: item.download_url
          })
        }
      }
    }
  } catch (error) {
    console.error(`搜索文件夹 ${path} 失败:`, error)
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
 * 检查文件名是否匹配查询
 */
const matchesQuery = (filename: string, query: string): boolean => {
  if (!query.trim()) {
    return true
  }
  return filename.toLowerCase().includes(query.toLowerCase())
}

/**
 * 应用筛选条件
 */
const matchesFilters = (item: any, options: SearchOptions): boolean => {
  // 文件类型筛选
  if (options.fileTypes && options.fileTypes.length > 0) {
    const ext = item.name.split('.').pop()?.toLowerCase()
    if (!ext || !options.fileTypes.includes(ext)) {
      return false
    }
  }

  // 文件大小筛选
  if (options.sizeRange && options.sizeRange !== 'all') {
    const size = item.size || 0
    switch (options.sizeRange) {
      case 'small':
        if (size >= 100 * 1024) {
          return false
        }
        break
      case 'medium':
        if (size < 100 * 1024 || size >= 1024 * 1024) {
          return false
        }
        break
      case 'large':
        if (size < 1024 * 1024 || size >= 5 * 1024 * 1024) {
          return false
        }
        break
      case 'xlarge':
        if (size < 5 * 1024 * 1024) {
          return false
        }
        break
    }
  }

  return true
}

/**
 * 获取文件夹结构
 */
export const getFolderStructure = async (
  username: string,
  repository: string,
  path: string = ''
): Promise<{ folders: any[]; files: any[] }> => {
  try {
    const response = await request.get(`/repos/${username}/${repository}/contents${path}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    const folders = items.filter(item => item.type === 'dir')
    const files = items.filter(item => item.type === 'file' && isImageFile(item.name))

    return { folders, files }
  } catch (error) {
    console.error('获取文件夹结构失败:', error)
    return { folders: [], files: [] }
  }
}

/**
 * 获取完整的文件夹树结构
 */
export const getFolderTree = async (username: string, repository: string, path: string = '', maxDepth: number = 3): Promise<any[]> => {
  if (maxDepth <= 0) {
    return []
  }

  try {
    const response = await request.get(`/repos/${username}/${repository}/contents${path}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    const tree = []

    for (const item of items) {
      if (item.type === 'dir') {
        const children = await getFolderTree(username, repository, item.path, maxDepth - 1)
        tree.push({
          ...item,
          children,
          hasImages: await hasImagesInFolder(username, repository, item.path)
        })
      }
    }

    return tree
  } catch (error) {
    console.error('获取文件夹树失败:', error)
    return []
  }
}

/**
 * 检查文件夹是否包含图片
 */
const hasImagesInFolder = async (username: string, repository: string, path: string): Promise<boolean> => {
  try {
    const response = await request.get(`/repos/${username}/${repository}/contents${path}`)
    const items = Array.isArray(response.data) ? response.data : [response.data]

    return items.some(item => item.type === 'file' && isImageFile(item.name))
  } catch (error) {
    return false
  }
}
