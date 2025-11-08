import { useSnackBarStore } from '@/plugins/stores/snackbar'
import type { AxiosError } from 'axios'

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  showMessage?: boolean
  logError?: boolean
  customMessage?: string
  duration?: number
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param options 处理选项
 * @returns ApiError 实例
 */
export const handleApiError = (error: any, options: ErrorHandlerOptions = {}): ApiError => {
  const { showMessage = true, logError = true, customMessage, duration = 5000 } = options

  let message = customMessage || '操作失败'
  let statusCode: number | undefined

  if (error.response) {
    // 服务器响应错误
    statusCode = error.response.status

    switch (statusCode) {
      case 400:
        message = '请求参数错误'
        break
      case 401:
        message = '认证失败，请检查 GitHub Token'
        break
      case 403:
        if (error.response.data?.message?.includes('rate limit')) {
          message = 'API 请求频率超限，请稍后再试'
        } else if (error.response.data?.message?.includes('API rate limit exceeded')) {
          message = 'GitHub API 限流，请稍后再试'
        } else {
          message = '权限不足，请检查 Token 权限'
        }
        break
      case 404:
        message = '资源不存在'
        break
      case 409:
        message = '资源冲突，可能文件已存在'
        break
      case 422:
        message = error.response.data?.message || '文件已存在或参数错误'
        break
      case 500:
        message = '服务器错误，请稍后重试'
        break
      case 502:
      case 503:
      case 504:
        message = '服务暂时不可用，请稍后重试'
        break
      default:
        message = `请求失败 (${statusCode})`
    }

    // 如果有详细错误信息，使用它
    if (error.response.data?.message && !customMessage) {
      message = error.response.data.message
    }
  } else if (error.request) {
    // 网络错误
    message = '网络连接失败，请检查网络设置'
  } else {
    // 其他错误
    message = error.message || '未知错误'
  }

  // 显示错误消息
  if (showMessage) {
    try {
      const { showMessage: showSnackbar } = useSnackBarStore()
      showSnackbar(message, {
        color: 'error',
        timeout: duration
      })
    } catch (e) {
      console.error('无法显示错误消息:', e)
    }
  }

  // 记录错误
  if (logError) {
    console.error('[API Error]', {
      message,
      statusCode,
      originalError: error,
      timestamp: new Date().toISOString(),
      stack: error.stack
    })
  }

  return new ApiError(message, statusCode, error)
}

/**
 * GitHub API 特定错误处理
 * @param error Axios 错误对象
 * @returns ApiError 实例
 */
export const handleGitHubError = (error: AxiosError): ApiError => {
  const response = error.response?.data as any

  // GitHub API 错误消息
  if (response?.message) {
    return handleApiError(error, {
      customMessage: response.message
    })
  }

  return handleApiError(error)
}

/**
 * 文件操作错误处理
 * @param error 错误对象
 * @param operation 操作类型
 * @returns ApiError 实例
 */
export const handleFileError = (error: any, operation: string): ApiError => {
  const messages: Record<string, string> = {
    upload: '上传失败',
    download: '下载失败',
    delete: '删除失败',
    read: '读取失败',
    compress: '压缩失败',
    batch: '批量操作失败'
  }

  return handleApiError(error, {
    customMessage: messages[operation] || '文件操作失败'
  })
}

/**
 * 网络错误处理
 * @param error 错误对象
 * @returns ApiError 实例
 */
export const handleNetworkError = (error: any): ApiError => {
  return handleApiError(error, {
    customMessage: '网络请求失败，请检查网络连接'
  })
}

/**
 * 验证错误处理
 * @param message 错误消息
 * @returns ApiError 实例
 */
export const handleValidationError = (message: string): ApiError => {
  return handleApiError(new Error(message), {
    customMessage: message,
    logError: false
  })
}

/**
 * 超时错误处理
 * @param error 错误对象
 * @returns ApiError 实例
 */
export const handleTimeoutError = (error: any): ApiError => {
  return handleApiError(error, {
    customMessage: '请求超时，请稍后重试'
  })
}

/**
 * 权限错误处理
 * @param error 错误对象
 * @returns ApiError 实例
 */
export const handlePermissionError = (error: any): ApiError => {
  return handleApiError(error, {
    customMessage: '权限不足，请检查 Token 权限设置'
  })
}
