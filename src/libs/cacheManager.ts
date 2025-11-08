/**
 * 缓存管理器
 * 用于管理搜索结果和其他数据的缓存
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheManager<T = any> {
  private cache: Map<string, CacheItem<T>>
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    })
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 根据正则表达式删除匹配的缓存
   */
  deletePattern(pattern: RegExp): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 清理过期的缓存
   */
  cleanup(): number {
    const now = Date.now()
    let count = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 获取最旧的缓存键
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存统计信息
   */
  stats(): {
    size: number
    maxSize: number
    hitRate: number
    oldestTimestamp: number
    newestTimestamp: number
  } {
    let oldestTimestamp = Infinity
    let newestTimestamp = 0

    for (const item of this.cache.values()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp
      }
      if (item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 需要额外跟踪命中率
      oldestTimestamp: oldestTimestamp === Infinity ? 0 : oldestTimestamp,
      newestTimestamp
    }
  }
}

// 创建全局缓存实例
export const searchCache = new CacheManager(50, 10 * 60 * 1000) // 50个项目，10分钟过期
export const imageCache = new CacheManager(200, 30 * 60 * 1000) // 200个项目，30分钟过期
export const folderCache = new CacheManager(100, 15 * 60 * 1000) // 100个项目，15分钟过期

// 定期清理过期缓存
setInterval(() => {
  const searchCleanup = searchCache.cleanup()
  const imageCleanup = imageCache.cleanup()
  const folderCleanup = folderCache.cleanup()

  if (searchCleanup + imageCleanup + folderCleanup > 0) {
    console.log(`清理了 ${searchCleanup + imageCleanup + folderCleanup} 个过期缓存`)
  }
}, 5 * 60 * 1000) // 每5分钟清理一次

export default CacheManager
