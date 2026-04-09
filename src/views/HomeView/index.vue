<template>
  <v-container class="home-container fill-height d-flex flex-column justify-center pa-0">
    <div class="text-center mb-10 hero-section">
      <div class="glass-pill mb-6 mx-auto d-inline-flex align-center">
        <span class="pulse-dot mr-2"></span>
        <span class="text-caption font-weight-medium">System Ready</span>
      </div>
      <h1 class="hero-title text-h3 font-weight-bold mb-4 text-primary">Upload Images</h1>
      <p class="hero-subtitle text-body-1 text-secondary max-w-2xl mx-auto">
        Drag and drop your images below, or click to browse.
      </p>
    </div>

    <!-- 上传区域 -->
    <v-card class="upload-card glass-panel" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }" elevation="0">
      <div class="liquid-glow" v-if="isDragOver"></div>
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
              <div class="liquid-ring"></div>
              <v-icon icon="mdi-cloud-upload-outline" size="48" color="primary" class="upload-icon" />
            </div>
            <h2 class="prompt-title text-h5 font-weight-medium mb-2">Drop files here</h2>
            <p class="prompt-subtitle text-body-2 text-secondary mb-6">Support for JPG, PNG, WEBP, GIF</p>
            <v-btn variant="flat" color="primary" class="browse-btn px-6 rounded-pill">
              Browse Files
            </v-btn>
          </div>

          <!-- 文件列表 -->
          <div v-else class="files-container w-100">
            <div class="files-header d-flex align-center justify-space-between pa-6 border-b glass-header">
              <div class="d-flex align-center">
                <div class="icon-orb mr-3">
                  <v-icon color="primary" size="small">mdi-file-multiple-outline</v-icon>
                </div>
                <span class="text-subtitle-1 font-weight-medium">{{ files.length }} files selected</span>
              </div>
              <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" @click.stop="handleAddMore" class="rounded-pill px-4">
                Add More
              </v-btn>
            </div>
            
            <div class="files-grid pa-6">
              <transition-group name="liquid-list" tag="div" class="grid-container">
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
  max-width: 1000px;
  margin: 0 auto;
}

.hero-section {
  animation: liquidFadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-pill {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 100px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 10px rgb(var(--v-theme-success));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(var(--v-theme-success), 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
}

.glass-panel {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 32px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.5) !important;
  
  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  }
}

.upload-card {
  position: relative;
  min-height: 480px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  .liquid-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(var(--v-theme-accent), 0.4) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: liquidPulse 3s ease-in-out infinite alternate;
    z-index: 0;
  }

  &.drag-over {
    transform: scale(1.02);
    border-color: rgba(var(--v-theme-accent), 0.5);
    box-shadow: 0 16px 48px rgba(var(--v-theme-accent), 0.15) !important;
    
    .upload-icon-container {
      transform: scale(1.1);
      .liquid-ring {
        border-color: rgb(var(--v-theme-accent));
        transform: scale(1.2);
        opacity: 0;
        transition: all 0.5s ease-out;
      }
      .upload-icon {
        color: rgb(var(--v-theme-accent)) !important;
        transform: translateY(-5px);
      }
    }
  }

  &.has-files {
    min-height: auto;
  }

  :deep(.file-input) {
    position: relative;
    z-index: 1;
    
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

  .upload-icon-container {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    
    .liquid-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(var(--v-theme-primary), 0.2);
      transition: all 0.3s ease;
    }
    
    .upload-icon {
      transition: all 0.3s ease;
    }
  }
}

.upload-card:hover:not(.has-files) {
  .upload-icon-container {
    transform: translateY(-8px);
    
    .liquid-ring {
      border-color: rgba(var(--v-theme-primary), 0.4);
      transform: scale(1.05);
    }
  }
}

.browse-btn {
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

.files-container {
  width: 100%;
}

.glass-header {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  
  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2);
  }
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.icon-orb {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

@keyframes liquidFadeDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes liquidPulse {
  0% { transform: translate(-50%, -50%) scale(0.8) rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  100% { transform: translate(-50%, -50%) scale(1.2) rotate(45deg); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
}

// 列表动画
.liquid-list-enter-active,
.liquid-list-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.liquid-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  filter: blur(4px);
}

.liquid-list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  filter: blur(4px);
}

.liquid-list-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

// 响应式
@media (max-width: 600px) {
  .upload-card {
    min-height: 360px;
    border-radius: 24px !important;

    :deep(.file-input) {
      .v-input__control, .v-field__input {
        min-height: 360px;
      }
    }
  }
  
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
