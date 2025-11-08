import { computed, type Ref } from 'vue'
import type { BreadcrumbItem } from '../types'

/**
 * 导航逻辑 Composable
 */
export const useNavigation = (currentPath: Ref<string>, onNavigate: (path: string) => void) => {
  // 面包屑导航
  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const parts = currentPath.value.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = [{ title: '根目录', path: '/', disabled: false }]

    let path = ''
    for (const part of parts) {
      path += `/${part}`
      items.push({
        title: part,
        path,
        disabled: false
      })
    }

    // 最后一项设为禁用
    if (items.length > 0) {
      items[items.length - 1].disabled = true
    }

    return items
  })

  // 是否可以返回上级
  const canGoBack = computed(() => currentPath.value !== '/')

  // 导航到指定路径
  const navigateToPath = (path: string) => {
    onNavigate(path)
  }

  // 返回上级
  const goBack = () => {
    const parts = currentPath.value.split('/').filter(Boolean)
    parts.pop()
    const newPath = parts.length > 0 ? `/${parts.join('/')}` : '/'
    onNavigate(newPath)
  }

  // 返回根目录
  const goToRoot = () => {
    onNavigate('/')
  }

  return {
    breadcrumbItems,
    canGoBack,
    navigateToPath,
    goBack,
    goToRoot
  }
}
