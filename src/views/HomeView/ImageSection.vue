<template>
  <v-container @click.stop class="pa-0">
    <v-card class="image-section-card" elevation="0">
      <v-row no-gutters>
        <v-col cols="12" sm="4" class="image-col border-r">
          <v-hover #default="{ isHovering, props }">
            <v-img v-bind="props" :src="blob2Url" height="100%" min-height="200" cover class="preview-img">
              <v-overlay :model-value="isHovering" contained class="align-center justify-center util-overlay">
                <v-btn color="white" variant="flat" icon="mdi-delete" @click="delEvent" size="small" class="delete-btn"></v-btn>
              </v-overlay>
              <div class="filesize-badge">{{ filesize(props.filesize) }}</div>
            </v-img>
          </v-hover>
        </v-col>
        <v-col cols="12" sm="8" class="content-col d-flex flex-column">
          <div class="pa-5 flex-grow-1 border-b">
            <div class="d-flex align-start mb-4">
              <h3 class="text-subtitle-1 font-weight-medium mb-0 editable-filename" contenteditable @keyup="keyUp" spellcheck="false">
                {{ filename }}
              </h3>
              <v-spacer></v-spacer>
              <v-icon icon="mdi-pencil" size="small" color="secondary"></v-icon>
            </div>

            <div class="links-container">
              <TextChip v-for="item in items(useName)" :key="item.text" :label="item.label" :text="item.text" :disabled="!uploaded" />
            </div>
          </div>

          <div class="pa-4 bg-surface-variant d-flex justify-space-between align-center" v-show="!uploaded">
            <span class="text-caption text-secondary">Ready to upload</span>
            <v-btn variant="flat" color="primary" class="px-6" @click="uploadImage" :loading="uploading">
              Upload
              <template #loader>
                <div class="d-flex align-center">
                  <span class="mr-2">{{ progress }}%</span>
                </div>
              </template>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import TextChip from '@/components/TextChip.vue'
import blob2Base64 from '@/libs/blob2Base64'
import { handleFileError } from '@/libs/errorHandler'
import filesize from '@/libs/filesize'
import { compressImage, compressSettings, shouldCompress } from '@/libs/imageCompressor'
import { uploadFile } from '@/plugins/axios/file'
import { repoPathContent } from '@/plugins/axios/repo'
import { useCodeStore } from '@/plugins/stores/code'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useThemeStore } from '@/plugins/stores/theme'
import { useUserStore } from '@/plugins/stores/user'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const { type } = storeToRefs(useThemeStore())
const isDark = computed(() => type.value == 'dark')

const props = defineProps<{
  filename: string
  filesize: number
  fileblob: File
}>()
const emit = defineEmits<{
  (event: 'delate'): void
}>()

// 文件名
const useName = ref(props.filename)
const keyUp = (e: KeyboardEvent) => {
  useName.value = (e.target as HTMLSpanElement).textContent || props.filename
}

// 图片链接
const blob2Url = URL.createObjectURL(props.fileblob)
const delEvent = () => {
  URL.revokeObjectURL(blob2Url)
  emit('delate')
}

// 获取 CDN 链接模板
const { getCdnUrlItems } = storeToRefs(useCodeStore())
const { name, repository, directory } = storeToRefs(useUserStore())
const items = (filename: string) => {
  return getCdnUrlItems.value(name.value, repository.value, directory.value, filename)
}

// 上传图片
const uploaded = ref(false)
const uploading = ref(false)
const progress = ref(0)
const uploadImage = async () => {
  uploading.value = true
  try {
    // 检查存储库中是否含有相同文件
    await repoPathContent(name.value, repository.value, `${directory.value}/${useName.value}`)
    uploaded.value = true
    useSnackBarStore().showMessage('已经存在相同文件！', { timeout: 2000 })
  } catch (error) {
    try {
      let fileToUpload = props.fileblob

      // 检查是否需要压缩
      const settings = compressSettings.load()
      if (settings?.enabled !== false && shouldCompress(props.fileblob, settings?.threshold)) {
        try {
          useSnackBarStore().showMessage('正在压缩图片...', { color: 'info', timeout: 2000 })
          const result = await compressImage(props.fileblob, {
            quality: settings?.quality,
            maxWidth: settings?.maxWidth,
            maxHeight: settings?.maxHeight
          })

          fileToUpload = result.file
          useSnackBarStore().showMessage(`图片已压缩 ${result.ratio}`, { color: 'success', timeout: 3000 })
        } catch (compressError) {
          console.error('压缩失败，使用原图:', compressError)
          useSnackBarStore().showMessage('压缩失败，使用原图上传', { color: 'warning', timeout: 2000 })
        }
      }

      await uploadFile(name.value, repository.value, directory.value, useName.value, await blob2Base64(fileToUpload), progress)
      uploaded.value = true
    } catch (error) {
      progress.value = 0
      handleFileError(error, 'upload')
    }
  }
  uploading.value = false
}
</script>

<style scoped lang="scss">
.image-section-card {
  transition: all 0.2s;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border-color));

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

.border-r {
  border-right: 1px solid rgb(var(--v-theme-border-color));
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-theme-border-color));
}

.preview-img {
  position: relative;
  background: rgb(var(--v-theme-surface-variant));
}

.util-overlay {
  background: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(2px);
}

.delete-btn {
  transition: all 0.15s;

  &:hover {
    transform: scale(1.05);
    background: rgb(var(--v-theme-error)) !important;
  }
}

.filesize-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.content-col {
  position: relative;
}

.editable-filename {
  outline: none;
  cursor: text;
  padding: 4px 8px;
  margin: -4px -8px;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s;
  font-size: 0.95rem !important;
  line-height: 1.4;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.04);
  }

  &:focus {
    background: rgb(var(--v-theme-surface));
    border-color: rgba(var(--v-theme-primary), 0.2);
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
  }
}

.links-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// 响应式
@media (max-width: 600px) {
  .preview-img {
    min-height: 160px;
  }
  .border-r {
    border-right: none;
    border-bottom: 1px solid rgb(var(--v-theme-border-color));
  }
}
</style>
