import Compressor from 'compressorjs'

/**
 * 压缩选项接口
 */
export interface CompressOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  minWidth?: number
  minHeight?: number
  convertSize?: number
  convertTypes?: string[]
  checkOrientation?: boolean
  retainExif?: boolean
}

/**
 * 压缩结果接口
 */
export interface CompressResult {
  file: File
  originalSize: number
  compressedSize: number
  ratio: string
}

/**
 * 默认压缩选项
 */
export const defaultCompressOptions: CompressOptions = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  convertSize: 1000000, // 1MB 以上转换为 JPEG
  convertTypes: ['image/png', 'image/webp'],
  checkOrientation: true,
  retainExif: false
}

/**
 * 压缩单个图片
 * @param file 原始文件
 * @param options 压缩选项
 * @returns Promise<CompressResult>
 */
export const compressImage = (file: File, options: CompressOptions = {}): Promise<CompressResult> => {
  return new Promise((resolve, reject) => {
    const finalOptions = { ...defaultCompressOptions, ...options }
    const originalSize = file.size

    new Compressor(file, {
      ...finalOptions,
      success: result => {
        // 转换 Blob 为 File
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now()
        })

        resolve({
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          ratio: getCompressionRatio(originalSize, compressedFile.size)
        })
      },
      error: reject
    })
  })
}

/**
 * 批量压缩图片
 * @param files 文件列表
 * @param options 压缩选项
 * @param onProgress 进度回调
 * @returns Promise<CompressResult[]>
 */
export const compressImages = async (
  files: File[],
  options: CompressOptions = {},
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<CompressResult[]> => {
  const results: CompressResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    try {
      if (onProgress) {
        onProgress(i + 1, files.length, file.name)
      }

      const result = await compressImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`压缩失败: ${file.name}`, error)
      // 压缩失败时使用原文件
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        ratio: '0%'
      })
    }
  }

  return results
}

/**
 * 计算压缩率
 * @param originalSize 原始大小
 * @param compressedSize 压缩后大小
 * @returns 压缩率字符串
 */
export const getCompressionRatio = (originalSize: number, compressedSize: number): string => {
  if (originalSize === 0) {
    return '0%'
  }
  const ratio = ((originalSize - compressedSize) / originalSize) * 100
  return `${Math.max(0, ratio).toFixed(1)}%`
}

/**
 * 判断是否需要压缩
 * @param file 文件
 * @param threshold 阈值（字节）
 * @returns 是否需要压缩
 */
export const shouldCompress = (file: File, threshold: number = 500 * 1024): boolean => {
  // 检查文件大小
  if (file.size <= threshold) {
    return false
  }

  // 检查文件类型
  const compressibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return compressibleTypes.includes(file.type)
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns Promise<{width: number, height: number}>
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法加载图片'))
    }

    img.src = url
  })
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * 压缩设置管理
 */
export class CompressSettingsManager {
  private storageKey = 'compress-settings'

  /**
   * 保存设置
   */
  save(settings: CompressOptions & { enabled: boolean; threshold: number }): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings))
  }

  /**
   * 加载设置
   */
  load(): (CompressOptions & { enabled: boolean; threshold: number }) | null {
    const saved = localStorage.getItem(this.storageKey)
    if (!saved) {
      return null
    }

    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }

  /**
   * 重置设置
   */
  reset(): void {
    localStorage.removeItem(this.storageKey)
  }

  /**
   * 获取默认设置
   */
  getDefaults() {
    return {
      enabled: true,
      threshold: 500 * 1024,
      ...defaultCompressOptions
    }
  }
}

/**
 * 全局压缩设置管理器实例
 */
export const compressSettings = new CompressSettingsManager()
