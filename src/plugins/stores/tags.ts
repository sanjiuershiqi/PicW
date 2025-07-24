import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface ImageTag {
  id: string
  name: string
  color: string
  description?: string
  createdAt: Date
  count: number
}

export interface ImageWithTags {
  id: string
  name: string
  path: string
  size: number
  type: string
  uploadedAt: Date
  tags: string[] // tag IDs
  sha?: string
}

const storeSetup = () => {
  const tags = ref<ImageTag[]>([])
  const images = ref<ImageWithTags[]>([])

  // 预设标签颜色
  const tagColors = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722'
  ]

  // 创建新标签
  const createTag = (name: string, description?: string): ImageTag => {
    const existingTag = tags.value.find(tag => tag.name.toLowerCase() === name.toLowerCase())
    if (existingTag) {
      throw new Error('标签已存在')
    }

    const newTag: ImageTag = {
      id: generateId(),
      name: name.trim(),
      color: tagColors[tags.value.length % tagColors.length],
      description: description?.trim(),
      createdAt: new Date(),
      count: 0
    }

    tags.value.push(newTag)
    return newTag
  }

  // 删除标签
  const deleteTag = (tagId: string) => {
    const tagIndex = tags.value.findIndex(tag => tag.id === tagId)
    if (tagIndex === -1) {
      throw new Error('标签不存在')
    }

    // 从所有图片中移除该标签
    images.value.forEach(image => {
      const index = image.tags.indexOf(tagId)
      if (index > -1) {
        image.tags.splice(index, 1)
      }
    })

    tags.value.splice(tagIndex, 1)
  }

  // 更新标签
  const updateTag = (tagId: string, updates: Partial<Omit<ImageTag, 'id' | 'createdAt' | 'count'>>) => {
    const tag = tags.value.find(tag => tag.id === tagId)
    if (!tag) {
      throw new Error('标签不存在')
    }

    if (updates.name && updates.name !== tag.name) {
      const existingTag = tags.value.find(t => t.id !== tagId && t.name.toLowerCase() === updates.name!.toLowerCase())
      if (existingTag) {
        throw new Error('标签名称已存在')
      }
    }

    Object.assign(tag, updates)
  }

  // 为图片添加标签
  const addTagToImage = (imageId: string, tagId: string) => {
    const image = images.value.find(img => img.id === imageId)
    const tag = tags.value.find(t => t.id === tagId)

    if (!image || !tag) {
      throw new Error('图片或标签不存在')
    }

    if (!image.tags.includes(tagId)) {
      image.tags.push(tagId)
      updateTagCount()
    }
  }

  // 从图片移除标签
  const removeTagFromImage = (imageId: string, tagId: string) => {
    const image = images.value.find(img => img.id === imageId)
    if (!image) {
      throw new Error('图片不存在')
    }

    const index = image.tags.indexOf(tagId)
    if (index > -1) {
      image.tags.splice(index, 1)
      updateTagCount()
    }
  }

  // 添加图片
  const addImage = (imageData: Omit<ImageWithTags, 'id' | 'tags'>) => {
    const newImage: ImageWithTags = {
      ...imageData,
      id: generateId(),
      tags: []
    }
    images.value.push(newImage)
    return newImage
  }

  // 删除图片
  const deleteImage = (imageId: string) => {
    const index = images.value.findIndex(img => img.id === imageId)
    if (index > -1) {
      images.value.splice(index, 1)
      updateTagCount()
    }
  }

  // 更新标签计数
  const updateTagCount = () => {
    tags.value.forEach(tag => {
      tag.count = images.value.filter(image => image.tags.includes(tag.id)).length
    })
  }

  // 根据标签筛选图片
  const getImagesByTags = (tagIds: string[]) => {
    if (tagIds.length === 0) {
      return images.value
    }

    return images.value.filter(image => tagIds.every(tagId => image.tags.includes(tagId)))
  }

  // 获取图片的标签
  const getImageTags = (imageId: string) => {
    const image = images.value.find(img => img.id === imageId)
    if (!image) {
      return []
    }

    return tags.value.filter(tag => image.tags.includes(tag.id))
  }

  // 搜索标签
  const searchTags = (query: string) => {
    if (!query.trim()) {
      return tags.value
    }

    const lowerQuery = query.toLowerCase()
    return tags.value.filter(tag => tag.name.toLowerCase().includes(lowerQuery) || tag.description?.toLowerCase().includes(lowerQuery))
  }

  // 计算属性
  const tagCount = computed(() => tags.value.length)
  const imageCount = computed(() => images.value.length)
  const untaggedImages = computed(() => images.value.filter(image => image.tags.length === 0))

  // 统计信息
  const getTagStats = computed(() => {
    const totalImages = images.value.length
    const taggedImages = images.value.filter(img => img.tags.length > 0).length
    const averageTagsPerImage = totalImages > 0 ? images.value.reduce((sum, img) => sum + img.tags.length, 0) / totalImages : 0

    return {
      totalTags: tags.value.length,
      totalImages,
      taggedImages,
      untaggedImages: totalImages - taggedImages,
      averageTagsPerImage: Math.round(averageTagsPerImage * 100) / 100
    }
  })

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  return {
    // 状态
    tags,
    images,

    // 计算属性
    tagCount,
    imageCount,
    untaggedImages,
    getTagStats,

    // 标签操作
    createTag,
    deleteTag,
    updateTag,
    searchTags,

    // 图片操作
    addImage,
    deleteImage,
    addTagToImage,
    removeTagFromImage,
    getImagesByTags,
    getImageTags,

    // 工具方法
    updateTagCount
  }
}

export const useTagsStore = defineStore('tags', storeSetup, {
  persist: true
})
