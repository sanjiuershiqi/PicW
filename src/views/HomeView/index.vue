<template>
  <v-container class="home-container fill-height d-flex flex-column justify-center pa-0">
    <div class="text-center mb-10 hero-section">
      <h1 class="hero-title text-h4 font-weight-bold mb-3 text-primary">Upload Images</h1>
      <p class="hero-subtitle text-body-1 text-secondary max-w-2xl mx-auto">
        Drag and drop your images below, or click to browse.
      </p>
    </div>

    <!-- 上传区域 -->
    <v-card class="upload-card" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }" elevation="0">
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
            <div class="upload-icon-container mb-6">
              <v-icon icon="mdi-cloud-upload-outline" size="48" color="secondary" />
            </div>
            <h2 class="prompt-title text-h6 font-weight-medium mb-2">Drop files here</h2>
            <p class="prompt-subtitle text-body-2 text-secondary mb-6">Support for JPG, PNG, WEBP, GIF</p>
            <v-btn variant="tonal" color="primary" class="browse-btn">
              Browse Files
            </v-btn>
          </div>

          <!-- 文件列表 -->
          <div v-else class="files-container w-100">
            <div class="files-header d-flex align-center justify-space-between pa-4 border-b bg-surface-variant">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-file-multiple-outline</v-icon>
                <span class="text-subtitle-1 font-weight-medium">{{ files.length }} files selected</span>
              </div>
              <v-btn color="primary" variant="text" size="small" prepend-icon="mdi-plus" @click.stop="handleAddMore">
                Add More
              </v-btn>
            </div>
            
            <div class="files-grid pa-6">
              <transition-group name="list" tag="div" class="grid-container">
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
  max-width: 900px;
  margin: 0 auto;
}

.hero-section {
  animation: fadeDown 0.4s ease-out;
}

.upload-card {
  position: relative;
  min-height: 400px;
  background: rgb(var(--v-theme-surface));
  border: 2px dashed rgb(var(--v-theme-border-color));
  transition: all 0.2s ease;

  &.drag-over {
    transform: scale(1.02);
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.02) !important;
    
    .upload-icon-container {
      background: rgb(var(--v-theme-primary));
      .v-icon { color: rgb(var(--v-theme-on-primary)) !important; }
    }
  }

  &.has-files {
    min-height: auto;
    border-style: solid;
  }

  :deep(.file-input) {
    .v-input__control {
      min-height: 400px;
    }

    .v-field {
      overflow: visible;
      box-shadow: none !important;
      background: transparent !important;
    }

    .v-field__input {
      padding: 0;
      min-height: 400px;
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

  .upload-icon-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(var(--v-theme-secondary), 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
}

.upload-card:hover .upload-icon-container {
  transform: translateY(-4px);
  background: rgba(var(--v-theme-primary), 0.05);
  
  .v-icon {
    color: rgb(var(--v-theme-primary)) !important;
  }
}

.browse-btn {
  pointer-events: auto;
}

.files-container {
  width: 100%;
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-theme-border-color));
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@keyframes fadeDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.list-move {
  transition: transform 0.2s;
}

// 响应式
@media (max-width: 600px) {
  .upload-card {
    min-height: 300px;

    :deep(.file-input) {
      .v-input__control, .v-field__input {
        min-height: 300px;
      }
    }
  }
  
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
