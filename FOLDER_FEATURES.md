# 📁 PicW 文件夹浏览和搜索功能

## 🎯 功能概述

为了解决图片存储在文件夹和子文件夹中无法被检测到的问题，我们新增了以下功能：

### ✨ 新增功能

1. **📂 文件夹浏览器** - 可视化浏览文件夹结构
2. **🔍 全局搜索** - 跨文件夹搜索图片
3. **🗂️ 路径导航** - 面包屑导航和直接路径输入
4. **🔄 实时刷新** - 动态更新文件夹内容

## 🧩 新增组件

### 1. FolderBrowser.vue - 文件夹浏览器

**功能特性**:

- 📍 面包屑导航显示当前路径
- 📁 文件夹和图片分类显示
- 🖼️ 图片缩略图预览
- ⌨️ 直接路径输入支持
- 🔄 一键刷新内容
- 📱 响应式设计

**使用方法**:

```vue
<FolderBrowser
  :current-path="currentPath"
  :folders="folderItems"
  :images="imageItems"
  :loading="loading"
  :username="username"
  :repository="repository"
  @navigate="handleNavigate"
  @folder-selected="handleFolderSelected"
  @refresh="handleRefresh"
/>
```

### 2. GlobalImageSearch.vue - 全局搜索

**功能特性**:

- 🔍 跨文件夹递归搜索
- 🎯 高级筛选选项（文件类型、大小）
- 📊 搜索结果分页显示
- 📍 显示图片所在文件夹路径
- 🖼️ 搜索结果预览
- 🚀 防抖搜索优化

**使用方法**:

```vue
<GlobalImageSearch
  :username="username"
  :repository="repository"
  @navigate-to-folder="handleNavigate"
  @image-selected="handleImageSelected"
  @preview-image="handlePreviewImage"
/>
```

### 3. search.ts - 搜索 API

**功能特性**:

- 🔄 递归文件夹遍历
- 🎯 智能文件类型检测
- 📏 文件大小筛选
- 🌳 文件夹树结构获取
- ⚡ 异步搜索处理

**API 方法**:

```typescript
// 搜索图片
searchImages(options: SearchOptions): Promise<SearchResult[]>

// 获取文件夹结构
getFolderStructure(username, repository, path): Promise<{folders, files}>

// 获取文件夹树
getFolderTree(username, repository, path, maxDepth): Promise<TreeNode[]>
```

## 🎮 使用指南

### 1. 文件夹浏览模式

1. **访问图片管理页面**

   ```
   /images?name=用户名&repository=仓库名&directory=路径
   ```

2. **切换到浏览模式**

   - 点击顶部的文件夹图标按钮

3. **浏览文件夹**

   - 点击文件夹卡片进入子文件夹
   - 使用面包屑导航快速跳转
   - 直接输入路径进行导航

4. **查看图片**
   - 图片以缩略图形式显示
   - 点击"显示全部"查看更多图片

### 2. 全局搜索模式

1. **切换到搜索模式**

   - 点击顶部的搜索图标按钮

2. **执行搜索**

   - 输入图片名称关键词
   - 选择搜索范围（全部/当前/根目录）
   - 使用高级筛选（文件类型、大小）

3. **查看结果**
   - 搜索结果显示图片预览
   - 显示图片所在文件夹路径
   - 点击"打开文件夹"导航到对应位置

### 3. 视图模式切换

**可用模式**:

- 📂 **浏览模式** - 文件夹结构浏览
- 🔍 **搜索模式** - 全局图片搜索
- 🗃️ **网格模式** - 传统网格视图
- 📋 **列表模式** - 详细列表视图
- 📊 **统计模式** - 数据统计分析

## 🔧 技术实现

### 文件夹检测逻辑

```typescript
// 检查是否是图片文件
const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

// 递归搜索文件夹
const recursiveSearch = async (username, repository, path, query) => {
  const response = await request.get(`/repos/${username}/${repository}/contents${path}`)
  const items = Array.isArray(response.data) ? response.data : [response.data]

  for (const item of items) {
    if (item.type === 'file' && isImageFile(item.name)) {
      // 处理图片文件
    } else if (item.type === 'dir') {
      // 递归搜索子文件夹
      await recursiveSearch(username, repository, item.path, query)
    }
  }
}
```

### 路径导航实现

```typescript
// 面包屑导航生成
const breadcrumbItems = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean)
  const items = [{ title: '根目录', path: '/', disabled: false }]

  let currentPath = ''
  parts.forEach(part => {
    currentPath += `/${part}`
    items.push({
      title: part,
      path: currentPath,
      disabled: false
    })
  })

  return items
})
```

## 🎨 界面设计

### 文件夹浏览器界面

```
┌─────────────────────────────────────────┐
│ 📁 文件夹浏览          🔄刷新  🏠根目录 │
├─────────────────────────────────────────┤
│ 🏠 根目录 / 📁 images / 📁 photos      │
├─────────────────────────────────────────┤
│ ⬅️返回上级    📁直接输入路径    ➡️     │
├─────────────────────────────────────────┤
│ 📁 文件夹 (3)                          │
│ ┌─────┐ ┌─────┐ ┌─────┐                │
│ │ 📁  │ │ 📁  │ │ 📁  │                │
│ │icons│ │logos│ │pics │                │
│ └─────┘ └─────┘ └─────┘                │
├─────────────────────────────────────────┤
│ 🖼️ 图片 (6)                           │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│ │🖼️ │ │🖼️ │ │🖼️ │ │🖼️ │ │🖼️ │ │🖼️ │   │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘   │
│           显示全部 12 张图片 ⬇️          │
└─────────────────────────────────────────┘
```

### 全局搜索界面

```
┌─────────────────────────────────────────┐
│ 🔍 全局搜索              找到 8 个结果  │
├─────────────────────────────────────────┤
│ 🔍 [搜索图片名称...] [📁全部文件夹 ⬇️] │
│              高级搜索 ⬇️                │
├─────────────────────────────────────────┤
│ 搜索结果                               │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ 🖼️ 图片预览  │ │ 🖼️ 图片预览  │        │
│ │ 📁/images   │ │ 📁/photos   │        │
│ │ image1.jpg  │ │ photo2.png  │        │
│ │ 500KB       │ │ 1.2MB       │        │
│ │ 📁打开文件夹 👁️│ │ 📁打开文件夹 👁️│        │
│ └─────────────┘ └─────────────┘        │
│           ← 1 2 3 4 5 →                │
└─────────────────────────────────────────┘
```

## 🧪 测试页面

访问 `/folder-test` 可以测试新功能：

**测试功能**:

- 📂 文件夹浏览器交互测试
- 🔍 全局搜索功能测试
- 📝 操作日志记录
- ⚙️ 配置参数调整

## 🚀 性能优化

### 搜索优化

- **防抖搜索**: 500ms 延迟避免频繁请求
- **分页显示**: 每页 12 个结果，减少渲染压力
- **缓存机制**: 搜索结果本地缓存
- **异步加载**: 非阻塞式文件夹遍历

### 界面优化

- **虚拟滚动**: 大量结果时的性能优化
- **懒加载**: 图片缩略图按需加载
- **响应式**: 移动端适配优化
- **动画效果**: 流畅的交互反馈

## 📱 移动端适配

- **触摸友好**: 大按钮和触摸区域
- **手势支持**: 滑动导航和操作
- **响应式布局**: 自适应屏幕尺寸
- **性能优化**: 移动端性能调优

## 🔮 未来规划

1. **📊 文件夹统计** - 显示每个文件夹的图片数量和大小
2. **🏷️ 批量标签** - 为整个文件夹的图片批量添加标签
3. **📁 文件夹操作** - 创建、重命名、删除文件夹
4. **🔄 同步状态** - 实时同步 GitHub 仓库变化
5. **📱 离线缓存** - PWA 离线浏览支持

---

**开发完成时间**: 2025-01-24  
**主要功能**: 文件夹浏览 + 全局搜索  
**技术栈**: Vue 3 + TypeScript + GitHub API  
**兼容性**: 现代浏览器 + 移动端
