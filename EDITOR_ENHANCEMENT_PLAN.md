# 图片编辑器增强计划

## 📋 当前状态

ImageEditor 组件已实现基础功能：

- ✅ 7 种滤镜效果
- ✅ 旋转和翻转
- ✅ 亮度/对比度/饱和度/模糊调整
- ✅ 撤销/重做（20 步历史）
- ✅ 缩放控制

## 🎯 增强计划

### 1. 更多滤镜效果 ✅

已添加到滤镜列表：

- 鲜艳 (vivid)
- 柔和 (soft)
- 怀旧 (vintage)
- 梦幻 (dreamy)
- 锐化 (sharpen)
- 浮雕 (emboss)
- 边缘检测 (edge)

**实现方法**：

```typescript
case 'vivid':
  // 增强饱和度和对比度
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = gray + (r - gray) * 1.5
    data[i + 1] = gray + (g - gray) * 1.5
    data[i + 2] = gray + (b - gray) * 1.5
  }
  break

case 'sharpen':
  // 使用卷积核锐化
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  applyConvolution(data, width, height, kernel)
  break
```

### 2. 文字水印功能 🔄

**UI 组件**：

```vue
<v-window-item value="text">
  <v-card-text>
    <h4 class="text-subtitle-1 mb-3">文字内容</h4>
    <v-textarea
      v-model="textWatermark"
      label="输入文字"
      rows="3"
      variant="outlined"
    />
    
    <h4 class="text-subtitle-1 mb-3 mt-4">字体大小</h4>
    <v-slider
      v-model="textSize"
      :min="12"
      :max="72"
      :step="1"
      thumb-label
    />
    
    <h4 class="text-subtitle-1 mb-3 mt-4">文字颜色</h4>
    <v-color-picker v-model="textColor" mode="hex" />
    
    <h4 class="text-subtitle-1 mb-3 mt-4">透明度</h4>
    <v-slider
      v-model="textOpacity"
      :min="0"
      :max="100"
      :step="1"
      thumb-label
    />
    
    <h4 class="text-subtitle-1 mb-3 mt-4">位置</h4>
    <v-select
      v-model="textPosition"
      :items="[
        { title: '左上', value: 'top-left' },
        { title: '居中上', value: 'top-center' },
        { title: '右上', value: 'top-right' },
        { title: '左中', value: 'middle-left' },
        { title: '居中', value: 'center' },
        { title: '右中', value: 'middle-right' },
        { title: '左下', value: 'bottom-left' },
        { title: '居中下', value: 'bottom-center' },
        { title: '右下', value: 'bottom-right' }
      ]"
      variant="outlined"
    />
    
    <v-btn block color="primary" @click="addTextWatermark" class="mt-4">
      添加文字
    </v-btn>
  </v-card-text>
</v-window-item>
```

**实现方法**：

```typescript
const addTextWatermark = () => {
  if (!canvas.value || !ctx.value || !textWatermark.value) return

  ctx.value.save()
  ctx.value.font = `${textSize.value}px Arial`
  ctx.value.fillStyle = textColor.value
  ctx.value.globalAlpha = textOpacity.value / 100

  // 计算位置
  const metrics = ctx.value.measureText(textWatermark.value)
  const textWidth = metrics.width
  const textHeight = textSize.value

  let x = 0,
    y = 0
  switch (textPosition.value) {
    case 'top-left':
      x = 20
      y = textHeight + 20
      break
    case 'top-center':
      x = (canvas.value.width - textWidth) / 2
      y = textHeight + 20
      break
    case 'top-right':
      x = canvas.value.width - textWidth - 20
      y = textHeight + 20
      break
    case 'center':
      x = (canvas.value.width - textWidth) / 2
      y = canvas.value.height / 2
      break
    // ... 其他位置
  }

  ctx.value.fillText(textWatermark.value, x, y)
  ctx.value.restore()

  saveHistory()
  showMessage('已添加文字水印', { color: 'success' })
}
```

### 3. 图形绘制工具 🔄

**UI 组件**：

```vue
<v-window-item value="draw">
  <v-card-text>
    <h4 class="text-subtitle-1 mb-3">绘制工具</h4>
    <v-btn-toggle v-model="drawMode" variant="outlined" mandatory class="mb-4">
      <v-btn value="pen" icon="mdi-pen" />
      <v-btn value="line" icon="mdi-minus" />
      <v-btn value="rect" icon="mdi-rectangle-outline" />
      <v-btn value="circle" icon="mdi-circle-outline" />
    </v-btn-toggle>
    
    <h4 class="text-subtitle-1 mb-3 mt-4">画笔颜色</h4>
    <v-color-picker v-model="drawColor" mode="hex" />
    
    <h4 class="text-subtitle-1 mb-3 mt-4">线条粗细</h4>
    <v-slider
      v-model="drawWidth"
      :min="1"
      :max="20"
      :step="1"
      thumb-label
    />
    
    <v-btn block color="error" @click="clearDrawing" class="mt-4">
      清除绘制
    </v-btn>
  </v-card-text>
</v-window-item>
```

**实现方法**：

```typescript
// 绘制状态
const isDrawing = ref(false)
const startX = ref(0)
const startY = ref(0)

// 鼠标事件
const handleMouseDown = (e: MouseEvent) => {
  if (drawMode.value === 'none') return

  isDrawing.value = true
  const rect = canvas.value!.getBoundingClientRect()
  startX.value = (e.clientX - rect.left) / zoom.value
  startY.value = (e.clientY - rect.top) / zoom.value

  if (drawMode.value === 'pen') {
    ctx.value!.beginPath()
    ctx.value!.moveTo(startX.value, startY.value)
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || drawMode.value === 'none') return

  const rect = canvas.value!.getBoundingClientRect()
  const x = (e.clientX - rect.left) / zoom.value
  const y = (e.clientY - rect.top) / zoom.value

  ctx.value!.strokeStyle = drawColor.value
  ctx.value!.lineWidth = drawWidth.value

  if (drawMode.value === 'pen') {
    ctx.value!.lineTo(x, y)
    ctx.value!.stroke()
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (!isDrawing.value) return

  const rect = canvas.value!.getBoundingClientRect()
  const x = (e.clientX - rect.left) / zoom.value
  const y = (e.clientY - rect.top) / zoom.value

  ctx.value!.strokeStyle = drawColor.value
  ctx.value!.lineWidth = drawWidth.value

  switch (drawMode.value) {
    case 'line':
      ctx.value!.beginPath()
      ctx.value!.moveTo(startX.value, startY.value)
      ctx.value!.lineTo(x, y)
      ctx.value!.stroke()
      break
    case 'rect':
      ctx.value!.strokeRect(startX.value, startY.value, x - startX.value, y - startY.value)
      break
    case 'circle':
      const radius = Math.sqrt(Math.pow(x - startX.value, 2) + Math.pow(y - startY.value, 2))
      ctx.value!.beginPath()
      ctx.value!.arc(startX.value, startY.value, radius, 0, 2 * Math.PI)
      ctx.value!.stroke()
      break
  }

  isDrawing.value = false
  saveHistory()
}
```

### 4. 交互式裁剪功能 🔄

**实现思路**：

1. 在画布上绘制可拖动的裁剪框
2. 支持 8 个控制点调整大小
3. 支持拖动整个裁剪框移动位置
4. 显示裁剪区域外的半透明遮罩

```typescript
interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

const cropBox = ref<CropBox>({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

const initCropBox = () => {
  const padding = 50
  cropBox.value = {
    x: padding,
    y: padding,
    width: canvas.value!.width - padding * 2,
    height: canvas.value!.height - padding * 2
  }
  drawCropBox()
}

const drawCropBox = () => {
  if (!canvas.value || !ctx.value) return

  // 绘制半透明遮罩
  ctx.value.save()
  ctx.value.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // 清除裁剪区域
  ctx.value.clearRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)

  // 绘制裁剪框边框
  ctx.value.strokeStyle = '#ffffff'
  ctx.value.lineWidth = 2
  ctx.value.strokeRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)

  // 绘制控制点
  const handleSize = 10
  const handles = [
    { x: cropBox.value.x, y: cropBox.value.y }, // 左上
    { x: cropBox.value.x + cropBox.value.width, y: cropBox.value.y }, // 右上
    { x: cropBox.value.x, y: cropBox.value.y + cropBox.value.height }, // 左下
    { x: cropBox.value.x + cropBox.value.width, y: cropBox.value.y + cropBox.value.height } // 右下
  ]

  ctx.value.fillStyle = '#ffffff'
  handles.forEach(handle => {
    ctx.value!.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
  })

  ctx.value.restore()
}

const applyCrop = () => {
  if (!canvas.value || !ctx.value) return

  // 创建临时画布
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  // 设置新尺寸
  tempCanvas.width = cropBox.value.width
  tempCanvas.height = cropBox.value.height

  // 复制裁剪区域
  tempCtx.drawImage(
    canvas.value,
    cropBox.value.x,
    cropBox.value.y,
    cropBox.value.width,
    cropBox.value.height,
    0,
    0,
    cropBox.value.width,
    cropBox.value.height
  )

  // 更新主画布
  canvas.value.width = tempCanvas.width
  canvas.value.height = tempCanvas.height
  ctx.value.drawImage(tempCanvas, 0, 0)

  saveHistory()
  showMessage('裁剪完成', { color: 'success' })
}
```

### 5. 快捷键支持 🔄

```typescript
import { onMounted, onUnmounted } from 'vue'

const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + Z: 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }

  // Ctrl/Cmd + Shift + Z: 重做
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    redo()
  }

  // Ctrl/Cmd + S: 保存
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }

  // Ctrl/Cmd + R: 重置
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault()
    reset()
  }

  // ESC: 关闭
  if (e.key === 'Escape') {
    close()
  }
}

watch(isOpen, open => {
  if (open) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
```

### 6. 预设模板功能 🔄

```typescript
interface EditPreset {
  name: string
  brightness: number
  contrast: number
  saturation: number
  filter: string
}

const presets: EditPreset[] = [
  {
    name: '鲜艳',
    brightness: 110,
    contrast: 120,
    saturation: 130,
    filter: 'vivid'
  },
  {
    name: '柔和',
    brightness: 105,
    contrast: 95,
    saturation: 90,
    filter: 'soft'
  },
  {
    name: '黑白',
    brightness: 100,
    contrast: 110,
    saturation: 0,
    filter: 'grayscale'
  }
]

const applyPreset = (preset: EditPreset) => {
  brightness.value = preset.brightness
  contrast.value = preset.contrast
  saturation.value = preset.saturation
  applyAdjustments()
  if (preset.filter !== 'none') {
    applyFilter(preset.filter)
  }
  showMessage(`已应用${preset.name}预设`, { color: 'success' })
}

const saveAsPreset = () => {
  const preset: EditPreset = {
    name: '自定义',
    brightness: brightness.value,
    contrast: contrast.value,
    saturation: saturation.value,
    filter: currentFilter.value
  }
  // 保存到 localStorage
  const savedPresets = JSON.parse(localStorage.getItem('editPresets') || '[]')
  savedPresets.push(preset)
  localStorage.setItem('editPresets', JSON.stringify(savedPresets))
  showMessage('预设已保存', { color: 'success' })
}
```

### 7. 性能优化 ✅

**已实现**：

- ✅ 历史记录限制（20 步）
- ✅ Canvas 离屏渲染
- ✅ 防抖处理

**待优化**：

- 🔄 Web Worker 处理大图片
- 🔄 虚拟化长列表（滤镜列表）
- 🔄 图片压缩预处理

### 8. 批量编辑功能 📅

**计划实现**：

1. 支持选择多张图片
2. 应用相同的编辑操作
3. 批量导出
4. 进度显示

## 📊 实施优先级

### 高优先级（立即实施）

1. ✅ 更多滤镜效果
2. 🔄 文字水印功能
3. 🔄 快捷键支持

### 中优先级（近期实施）

4. 🔄 交互式裁剪
5. 🔄 图形绘制工具
6. 🔄 预设模板

### 低优先级（长期规划）

7. 📅 批量编辑
8. 📅 Web Worker 优化

## 🎯 总结

图片编辑器功能正在持续完善中，当前已实现基础编辑功能，正在添加更多高级功能以提供专业级的编辑体验。

---

**更新时间**: 2024-11-08  
**当前版本**: v1.1  
**下一版本**: v1.2（计划添加文字和绘制功能）
