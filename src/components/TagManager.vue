<template>
  <div class="tag-manager">
    <!-- 标签创建 -->
    <v-card variant="flat" class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-tag-plus" class="me-2" />
        标签管理
        <v-spacer />
        <v-chip :color="getTagStats.totalTags > 0 ? 'primary' : 'grey'" size="small" variant="tonal">
          {{ getTagStats.totalTags }} 个标签
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="newTagName"
              label="标签名称"
              prepend-inner-icon="mdi-tag"
              variant="outlined"
              density="comfortable"
              :error-messages="tagError"
              @keyup.enter="createNewTag"
              @input="tagError = ''"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="newTagDescription"
              label="描述（可选）"
              prepend-inner-icon="mdi-text"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" variant="flat" block :disabled="!newTagName.trim()" @click="createNewTag"> 创建 </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 标签搜索 -->
    <v-card variant="flat" class="mb-4">
      <v-card-text>
        <v-text-field
          v-model="searchQuery"
          label="搜索标签"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        />
      </v-card-text>
    </v-card>

    <!-- 标签列表 -->
    <v-card variant="flat">
      <v-card-title>
        标签列表
        <v-spacer />
        <v-btn-toggle v-model="viewMode" variant="outlined" density="compact" mandatory>
          <v-btn value="grid" icon="mdi-view-grid" />
          <v-btn value="list" icon="mdi-view-list" />
        </v-btn-toggle>
      </v-card-title>

      <v-card-text>
        <!-- 网格视图 -->
        <template v-if="viewMode === 'grid'">
          <div v-if="filteredTags.length === 0" class="text-center py-8">
            <EmptyState icon="mdi-tag-outline" title="暂无标签" description="创建第一个标签来开始组织您的图片" :show-action="false" />
          </div>
          <v-row v-else>
            <v-col v-for="tag in filteredTags" :key="tag.id" cols="12" sm="6" md="4" lg="3">
              <v-card :color="tag.color" variant="tonal" class="tag-card" @click="selectTag(tag.id)">
                <v-card-text class="text-center">
                  <v-avatar :color="tag.color" size="48" class="mb-2">
                    <v-icon icon="mdi-tag" color="white" />
                  </v-avatar>
                  <h4 class="text-subtitle-1 font-weight-medium">
                    {{ tag.name }}
                  </h4>
                  <p v-if="tag.description" class="text-caption text-medium-emphasis">
                    {{ tag.description }}
                  </p>
                  <v-chip size="small" variant="outlined" class="mt-2"> {{ tag.count }} 张图片 </v-chip>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" size="small" icon="mdi-pencil" @click.stop="editTag(tag)" />
                  <v-spacer />
                  <v-btn variant="text" size="small" icon="mdi-delete" color="error" @click.stop="confirmDeleteTag(tag)" />
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <!-- 列表视图 -->
        <template v-else>
          <v-list v-if="filteredTags.length > 0">
            <v-list-item v-for="tag in filteredTags" :key="tag.id" @click="selectTag(tag.id)">
              <template #prepend>
                <v-avatar :color="tag.color" size="40">
                  <v-icon icon="mdi-tag" color="white" />
                </v-avatar>
              </template>

              <v-list-item-title>{{ tag.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="tag.description">
                {{ tag.description }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center">
                  <v-chip size="small" variant="outlined" class="me-2">
                    {{ tag.count }}
                  </v-chip>
                  <v-btn variant="text" size="small" icon="mdi-pencil" @click.stop="editTag(tag)" />
                  <v-btn variant="text" size="small" icon="mdi-delete" color="error" @click.stop="confirmDeleteTag(tag)" />
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8">
            <EmptyState icon="mdi-tag-outline" title="暂无标签" description="创建第一个标签来开始组织您的图片" :show-action="false" />
          </div>
        </template>
      </v-card-text>
    </v-card>

    <!-- 编辑标签对话框 -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card v-if="editingTag">
        <v-card-title>编辑标签</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingTag.name"
            label="标签名称"
            variant="outlined"
            :error-messages="editTagError"
            @input="editTagError = ''"
          />
          <v-text-field v-model="editingTag.description" label="描述" variant="outlined" class="mt-4" />
          <v-color-picker v-model="editingTag.color" mode="hex" class="mt-4" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveTagEdit">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card v-if="deletingTag">
        <v-card-title>删除标签</v-card-title>
        <v-card-text>
          确定要删除标签 "{{ deletingTag.name }}" 吗？
          <br />
          <span class="text-warning"> 这将从 {{ deletingTag.count }} 张图片中移除此标签。 </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteTagConfirmed">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import { useTagsStore, type ImageTag } from '@/plugins/stores/tags'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const tagsStore = useTagsStore()
const { getTagStats } = storeToRefs(tagsStore)
const { showMessage } = useSnackBarStore()

const emit = defineEmits<{
  'tag-selected': [tagId: string]
}>()

// 新标签创建
const newTagName = ref('')
const newTagDescription = ref('')
const tagError = ref('')

// 搜索和视图
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')

// 编辑标签
const editDialog = ref(false)
const editingTag = ref<ImageTag | null>(null)
const editTagError = ref('')

// 删除标签
const deleteDialog = ref(false)
const deletingTag = ref<ImageTag | null>(null)

// 筛选后的标签
const filteredTags = computed(() => {
  return tagsStore.searchTags(searchQuery.value)
})

// 创建新标签
const createNewTag = async () => {
  try {
    tagError.value = ''
    await tagsStore.createTag(newTagName.value, newTagDescription.value)
    newTagName.value = ''
    newTagDescription.value = ''
    showMessage('标签创建成功', { color: 'success' })
  } catch (error) {
    tagError.value = (error as Error).message
  }
}

// 选择标签
const selectTag = (tagId: string) => {
  emit('tag-selected', tagId)
}

// 编辑标签
const editTag = (tag: ImageTag) => {
  editingTag.value = { ...tag }
  editDialog.value = true
}

// 保存标签编辑
const saveTagEdit = async () => {
  if (!editingTag.value) {
    return
  }

  try {
    editTagError.value = ''
    await tagsStore.updateTag(editingTag.value.id, {
      name: editingTag.value.name,
      description: editingTag.value.description,
      color: editingTag.value.color
    })
    editDialog.value = false
    showMessage('标签更新成功', { color: 'success' })
  } catch (error) {
    editTagError.value = (error as Error).message
  }
}

// 确认删除标签
const confirmDeleteTag = (tag: ImageTag) => {
  deletingTag.value = tag
  deleteDialog.value = true
}

// 删除标签
const deleteTagConfirmed = async () => {
  if (!deletingTag.value) {
    return
  }

  try {
    await tagsStore.deleteTag(deletingTag.value.id)
    deleteDialog.value = false
    showMessage('标签删除成功', { color: 'success' })
  } catch (error) {
    showMessage((error as Error).message, { color: 'error' })
  }
}
</script>

<style scoped lang="scss">
.tag-card {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}
</style>
