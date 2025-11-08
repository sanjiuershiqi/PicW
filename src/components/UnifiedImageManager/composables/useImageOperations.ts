import { ref } from 'vue'
import { batchDownload as performBatchDownload, type DownloadProgress } from '@/libs/batchDownload'
import { handleFileError } from '@/libs/errorHandler'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import type { ImageItem } from '../types'

/**
 * 图片操作逻辑 Composable
 */
export const useImageOperations = (getImageUrl: (image: ImageItem) => string) => {
  const { showMessage } = useSnackBarStore()

  // 下载进度
  const downloadProgress = ref<DownloadProgress & { show: boolean }>({
    show: false,
    current: 0,
    total: 0,
    currentFile: ''
  })

  // 灯箱状态
  const showLightbox = ref(false)
  const currentLightboxIndex = ref(0)

  // 打开图片预览
  const openImagePreview = (image: ImageItem, index: number) => {
    currentLightboxIndex.value = index
    showLightbox.value = true
  }

  // 下载单个图片
  const downloadImage = async (image: ImageItem) => {
    try {
      const url = getImageUrl(image)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = image.name
      a.click()

      URL.revokeObjectURL(downloadUrl)
      showMessage('下载成功', { color: 'success' })
    } catch (error) {
      handleFileError(error, 'download')
    }
  }

  // 批量下载
  const batchDownload = async (selectedImages: ImageItem[]) => {
    if (selectedImages.length === 0) {
      showMessage('请先选择要下载的图片', { color: 'warning' })
      return
    }

    try {
      downloadProgress.value.show = true
      downloadProgress.value.current = 0
      downloadProgress.value.total = selectedImages.length
      downloadProgress.value.currentFile = ''

      const items = selectedImages.map(img => ({
        url: getImageUrl(img),
        filename: img.name
      }))

      await performBatchDownload(items, `images-${Date.now()}.zip`, progress => {
        downloadProgress.value.current = progress.current
        downloadProgress.value.total = progress.total
        downloadProgress.value.currentFile = progress.currentFile
      })

      showMessage(`成功下载 ${selectedImages.length} 张图片`, { color: 'success' })
      return true
    } catch (error) {
      handleFileError(error, 'batch')
      return false
    } finally {
      downloadProgress.value.show = false
    }
  }

  return {
    downloadProgress,
    showLightbox,
    currentLightboxIndex,
    openImagePreview,
    downloadImage,
    batchDownload
  }
}
