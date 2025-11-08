/**
 * UnifiedImageManager 类型定义
 */

export interface ImageItem {
  name: string
  path: string
  sha: string
  size: number
  type: string
  directory?: string
}

export interface FolderItem {
  name: string
  path: string
  type: string
}

export interface BreadcrumbItem {
  title: string
  path: string
  disabled: boolean
}

export interface DownloadProgress {
  show: boolean
  current: number
  total: number
  currentFile: string
}

export interface SortOption {
  title: string
  value: string
}

export interface FileTypeOption {
  title: string
  value: string
}

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'
