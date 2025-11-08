import { useUserStore } from '@/plugins/stores/user'
import { handleApiError } from '@/libs/errorHandler'
import axios from 'axios'

const request = axios.create({
  baseURL: 'https://api.github.com/',
  timeout: 30000 // 30秒超时
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    config.url = config.url?.replaceAll(/\/{2,}/g, '/')
    const { token } = useUserStore()
    if (token) {
      Object.assign(config, {
        headers: {
          Authorization: `token ${token}`
        }
      })
    }
    return config
  },
  error => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 成功响应直接返回
    return response
  },
  error => {
    // 全局错误处理
    // 注意：这里只记录错误，不显示消息
    // 具体的错误消息由各个调用处决定是否显示
    if (error.response) {
      console.error('API 响应错误:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data
      })
    } else if (error.request) {
      console.error('网络请求失败:', error.message)
    } else {
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

export default request
