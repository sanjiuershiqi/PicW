import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export interface DownloadItem {
  url: string
  filename: string
}

export interface DownloadProgress {
  current: number
  total: number
  currentFile: string
}

/**
 * 批量下载图片并打包为 ZIP
 * @param items 要下载的图片列表
 * @param zipFilename ZIP 文件名
 * @param onProgress 进度回调
 * @returns Promise
 */
export const batchDownload = async (
  items: DownloadItem[],
  zipFilename: string = `images-${Date.now()}.zip`,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> => {
  if (items.length === 0) {
    throw new Error('没有要下载的图片')
  }

  const zip = new JSZip()
  const total = items.length
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    try {
      // 更新进度
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          currentFile: item.filename
        })
      }

      // 下载图片
      const response = await fetch(item.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      zip.file(item.filename, blob)
      successCount++
    } catch (error) {
      console.error(`下载失败: ${item.filename}`, error)
      failedCount++
      // 继续下载其他文件
    }
  }

  // 如果所有文件都下载失败
  if (successCount === 0) {
    throw new Error('所有图片下载失败')
  }

  // 生成 ZIP 文件
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  // 保存文件
  saveAs(content, zipFilename)

  // 返回下载统计
  return {
    success: successCount,
    failed: failedCount,
    total
  } as any
}

/**
 * 单个图片下载
 * @param url 图片 URL
 * @param filename 文件名
 */
export const downloadSingleImage = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    saveAs(blob, filename)
  } catch (error) {
    console.error(`下载失败: ${filename}`, error)
    throw error
  }
}
