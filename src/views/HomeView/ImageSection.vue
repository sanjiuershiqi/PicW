<template>
  <v-container @click.stop class="pa-0 mb-4">
    <v-card class="image-section-card overflow-hidden" elevation="0" rounded="xl">
      <v-row no-gutters>
        <v-col cols="12" sm="4" class="image-col">
          <v-hover #default="{ isHovering, props }">
            <v-img v-bind="props" :src="blob2Url" height="100%" min-height="200" cover class="preview-img">
              <div class="overlay-gradient"></div>
              <v-overlay :model-value="isHovering" contained class="align-center justify-center overlay-blur">
                <v-btn color="error" variant="flat" icon="mdi-delete-outline" @click="delEvent" size="large" class="delete-btn"></v-btn>
              </v-overlay>
              <div class="filesize-badge">{{ filesize(props.filesize) }}</div>
            </v-img>
          </v-hover>
        </v-col>
        <v-col cols="12" sm="8" class="content-col d-flex flex-column">
          <div class="pa-5 flex-grow-1">
            <div class="d-flex align-center mb-4">
              <v-icon icon="mdi-file-image-outline" color="accent" class="mr-2"></v-icon>
              <h3 class="text-h6 font-weight-bold mb-0 editable-filename" contenteditable @keyup="keyUp" spellcheck="false">
                {{ filename }}
              </h3>
              <v-icon icon="mdi-pencil-outline" size="small" color="medium-emphasis" class="ml-2"></v-icon>
            </div>
            
            <div class="links-container">
              <TextChip v-for="item in items(useName)" :key="item.text" :label="item.label" :text="item.text" :disabled="!uploaded" />
            </div>
          </div>
          
          <div class="pa-4 bg-surface-variant d-flex justify-end align-center" v-show="!uploaded">
            <v-btn 
              variant="flat" 
              color="accent" 
              rounded="pill" 
              class="px-6 upload-btn" 
              @click="uploadImage" 
              :loading="uploading"
              elevation="2"
            >
              <v-icon start icon="mdi-cloud-upload-outline"></v-icon>
              Upload to GitHub
              <template #loader>
                <div class="d-flex align-center">
                  <v-progress-circular :model-value="progress" size="20" width="2" color="white" class="mr-2"></v-progress-circular>
                  <span>{{ progress }}%</span>
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
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  
  &:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
    border-color: rgba(var(--v-theme-accent), 0.3);
  }
}

.image-col {
  position: relative;
}

.preview-img {
  position: relative;
  
  .overlay-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
    z-index: 1;
  }
}

.overlay-blur {
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.2) !important;
}

.delete-btn {
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
}

.filesize-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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
  border-radius: 6px;
  transition: all 0.2s;
  border: 1px solid transparent;
  
  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
  }
  
  &:focus {
    background: rgba(var(--v-theme-surface), 1);
    border-color: rgb(var(--v-theme-accent));
    box-shadow: 0 0 0 3px rgba(var(--v-theme-accent), 0.1);
  }
}

.links-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  font-weight: 600;
  letter-spacing: 0;
}

// 响应式
@media (max-width: 600px) {
  .preview-img {
    min-height: 160px;
  }
}
</style>
