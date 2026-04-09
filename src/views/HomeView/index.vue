<template>
  <v-container class="home-container fill-height d-flex flex-column justify-center">
    <div class="text-center mb-10 hero-section">
      <h1 class="text-h3 font-weight-black mb-3 title-gradient">Image Upload</h1>
      <p class="text-body-1 text-medium-emphasis max-w-2xl mx-auto">
        Seamlessly upload and manage your images. Drag & drop files here to instantly store them in your repository.
      </p>
    </div>

    <!-- 上传区域 -->
    <v-card class="upload-card" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }" elevation="0">
      <div class="upload-glow" v-if="isDragOver"></div>
      <v-file-input
        v-model="files"
        accept="image/*"
        hide-details
        variant="plain"
        prepend-icon=""
        :clearable="false"
        multiple
        class="file-input"
        :key="forceUpdate"
        ref="inputRef"
        @dragenter.prevent="dragEnterHandle"
        @dragleave.prevent="dragLeaveHandle"
        @drop.prevent="dragLeaveHandle"
      >
        <template #selection="{ fileNames }">
          <!-- 空状态提示 -->
          <div v-if="files.length === 0" class="upload-prompt py-16">
            <div class="icon-wrapper mb-6">
              <v-icon icon="mdi-cloud-upload-outline" size="64" color="accent" />
            </div>
            <h2 class="text-h5 font-weight-bold mb-2">Drag & Drop images here</h2>
            <p class="text-body-1 text-medium-emphasis mb-6">or click to browse files</p>
            <v-chip variant="flat" color="surface-variant" class="px-4 py-2 text-medium-emphasis font-weight-medium">
              <v-icon start icon="mdi-information-outline" size="small"></v-icon>
              Supports multiple files, WebP, PNG, JPG, GIF
            </v-chip>
          </div>

          <!-- 文件列表 -->
          <div v-else class="files-container w-100 pa-6">
            <div class="files-header mb-6 d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h5 font-weight-bold mb-1">
                  Ready to upload
                </h3>
                <p class="text-body-2 text-medium-emphasis">{{ files.length }} files selected</p>
              </div>
              <v-btn color="accent" variant="tonal" prepend-icon="mdi-plus" rounded="pill" @click.stop="handleAddMore">
                Add More
              </v-btn>
            </div>
            
            <transition-group name="list" tag="div" class="files-grid">
              <ImageSection
                v-for="(fileName, index) in fileNames"
                :key="fileName"
                :filename="getFileName(fileName, md5(fileName, String(files[index].size)))"
                :filesize="files[index].size"
                :fileblob="files[index]"
                @delate="removeItem(index)"
                class="file-item"
              />
            </transition-group>
          </div>
        </template>
      </v-file-input>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useCodeStore } from '@/plugins/stores/code'
import md5 from 'blueimp-md5'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import ImageSection from './ImageSection.vue'

const forceUpdate = ref(Date.now())
const files = ref<File[]>([])
const isDragOver = ref(false)

const removeItem = (index: number) => {
  files.value.splice(index, 1)
  if (files.value.length === 0) {
    forceUpdate.value = Date.now()
  }
}

const { getFileName } = storeToRefs(useCodeStore())

// 拖入文件提示
interface TemplateRefType {
  $el: HTMLElement
}
const inputRef = ref<TemplateRefType | null>(null)

const dragEnterHandle = () => {
  isDragOver.value = true
}

const dragLeaveHandle = () => {
  isDragOver.value = false
}

const handleAddMore = () => {
  const input = inputRef.value?.$el.querySelector('input')
  if (input) {
    input.click()
  }
}
</script>

<style scoped lang="scss">
.home-container {
  max-width: 1000px;
  margin: 0 auto;
}

.hero-section {
  animation: fadeDown 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.title-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-accent)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
}

.upload-card {
  position: relative;
  min-height: 480px;
  border-radius: 32px;
  background: rgba(var(--v-theme-surface), 0.5) !important;
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.1);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  &.drag-over {
    border-color: rgb(var(--v-theme-accent));
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(var(--v-theme-accent), 0.15);
    background: rgba(var(--v-theme-accent), 0.03) !important;
  }

  &.has-files {
    min-height: auto;
    border-style: solid;
    border-color: rgba(var(--v-theme-on-surface), 0.05);
    background: rgba(var(--v-theme-surface), 0.8) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }

  .upload-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: rgb(var(--v-theme-accent));
    filter: blur(100px);
    opacity: 0.15;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: pulse 2s infinite;
  }

  :deep(.file-input) {
    .v-input__control {
      min-height: 480px;
    }

    .v-field {
      overflow: visible;
      box-shadow: none !important;
      background: transparent !important;
    }

    .v-field__input {
      padding: 0;
      min-height: 480px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.has-files .v-field__input {
      min-height: auto;
      cursor: default;
    }
  }
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;

  .icon-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(var(--v-theme-accent), 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  }
}

.upload-card:hover .icon-wrapper {
  transform: scale(1.05) translateY(-5px);
  background: rgba(var(--v-theme-accent), 0.1);
}

.files-container {
  width: 100%;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.file-item {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 20px;
  padding: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
    border-color: rgba(var(--v-theme-accent), 0.2);
  }
}

@keyframes fadeDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.25; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
}

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.list-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

// 响应式
@media (max-width: 600px) {
  .upload-card {
    min-height: 360px;
    border-radius: 24px;

    :deep(.file-input) {
      .v-input__control, .v-field__input {
        min-height: 360px;
      }
    }
  }

  .upload-prompt {
    .icon-wrapper {
      width: 80px;
      height: 80px;
      margin-bottom: 16px !important;
      
      .v-icon {
        font-size: 40px !important;
      }
    }

    h2 {
      font-size: 1.25rem !important;
    }
  }
  
  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
