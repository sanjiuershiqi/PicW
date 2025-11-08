import { ref } from 'vue'

/**
 * 选择逻辑 Composable
 */
export const useSelection = () => {
  const selectedItems = ref<string[]>([])

  // 切换选择状态
  const toggleSelection = (sha: string, selected: boolean) => {
    if (selected) {
      if (!selectedItems.value.includes(sha)) {
        selectedItems.value.push(sha)
      }
    } else {
      const index = selectedItems.value.indexOf(sha)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      }
    }
  }

  // 全选
  const selectAll = (items: Array<{ sha: string }>) => {
    selectedItems.value = items.map(item => item.sha)
  }

  // 取消全选
  const deselectAll = () => {
    selectedItems.value = []
  }

  // 反选
  const invertSelection = (items: Array<{ sha: string }>) => {
    const allShas = items.map(item => item.sha)
    const newSelection = allShas.filter(sha => !selectedItems.value.includes(sha))
    selectedItems.value = newSelection
  }

  // 检查是否选中
  const isSelected = (sha: string) => {
    return selectedItems.value.includes(sha)
  }

  // 检查是否全选
  const isAllSelected = (items: Array<{ sha: string }>) => {
    if (items.length === 0) {
      return false
    }
    return items.every(item => selectedItems.value.includes(item.sha))
  }

  // 检查是否部分选中
  const isSomeSelected = (items: Array<{ sha: string }>) => {
    if (items.length === 0) {
      return false
    }
    return items.some(item => selectedItems.value.includes(item.sha)) && !isAllSelected(items)
  }

  return {
    selectedItems,
    toggleSelection,
    selectAll,
    deselectAll,
    invertSelection,
    isSelected,
    isAllSelected,
    isSomeSelected
  }
}
