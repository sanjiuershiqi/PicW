<template>
  <v-container class="home-container fill-height d-flex flex-column justify-center pa-0">
    <div class="text-center mb-16 hero-section">
      <div class="brutalist-badge font-mono mb-4">SYSTEM_UPLOAD_V1</div>
      <h1 class="hero-title text-uppercase">UPLOAD</h1>
      <h1 class="hero-title text-uppercase outline-text">IMAGES</h1>
      <p class="hero-subtitle font-mono mt-6 max-w-2xl mx-auto">
        [ SELECT OR DRAG FILES TO INITIALIZE TRANSFER ]
      </p>
    </div>

    <!-- 上传区域 -->
    <v-card class="upload-card" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }" elevation="0">
      <div class="card-borders">
        <div class="border-top"></div>
        <div class="border-right"></div>
        <div class="border-bottom"></div>
        <div class="border-left"></div>
      </div>
      <div class="corner-markers">
        <div class="marker tl"></div>
        <div class="marker tr"></div>
        <div class="marker bl"></div>
        <div class="marker br"></div>
      </div>

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
            <div class="upload-icon-container mb-8">
              <v-icon icon="mdi-arrow-down-bold" size="80" class="upload-arrow" />
            </div>
            <h2 class="prompt-title text-uppercase mb-2">DROP_ZONE</h2>
            <p class="prompt-subtitle font-mono mb-8">CLICK OR DRAG FILES HERE</p>
            <div class="formats-supported font-mono">
              <span>JPG</span> / <span>PNG</span> / <span>WEBP</span> / <span>GIF</span>
            </div>
          </div>

          <!-- 文件列表 -->
          <div v-else class="files-container w-100">
            <div class="files-header d-flex align-center justify-space-between pa-6 border-b">
              <div class="d-flex align-center">
                <span class="count-badge font-mono mr-4">{{ files.length }}</span>
                <h3 class="text-h5 font-weight-black text-uppercase mb-0">FILES_QUEUED</h3>
              </div>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="add-more-btn font-mono" @click.stop="handleAddMore">
                ADD_MORE
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
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  animation: fadeDown 0.4s ease-out;
}

.brutalist-badge {
  display: inline-block;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 4px 12px;
  font-size: 0.8rem;
  letter-spacing: 2px;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  line-height: 0.9;
  letter-spacing: -2px;
  margin: 0;
  color: rgb(var(--v-theme-primary));
  
  &.outline-text {
    color: transparent;
    -webkit-text-stroke: 2px rgb(var(--v-theme-primary));
  }
}

.hero-subtitle {
  font-size: 1rem;
  letter-spacing: 1px;
  color: rgb(var(--v-theme-secondary));
}

.upload-card {
  position: relative;
  min-height: 400px;
  background: rgb(var(--v-theme-surface)) !important;
  transition: all 0.2s ease;
  border-radius: 0 !important;

  .card-borders {
    position: absolute;
    inset: 0;
    pointer-events: none;
    
    div {
      position: absolute;
      background: rgb(var(--v-theme-primary));
      transition: all 0.2s;
    }
    
    .border-top { top: 0; left: 0; right: 0; height: 2px; }
    .border-bottom { bottom: 0; left: 0; right: 0; height: 2px; }
    .border-left { top: 0; bottom: 0; left: 0; width: 2px; }
    .border-right { top: 0; bottom: 0; right: 0; width: 2px; }
  }

  .corner-markers {
    position: absolute;
    inset: -6px;
    pointer-events: none;
    
    .marker {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid rgb(var(--v-theme-primary));
      background: rgb(var(--v-theme-surface));
      transition: all 0.2s;
      
      &.tl { top: 0; left: 0; }
      &.tr { top: 0; right: 0; }
      &.bl { bottom: 0; left: 0; }
      &.br { bottom: 0; right: 0; }
    }
  }

  &.drag-over {
    transform: scale(1.02);
    background: rgb(var(--v-theme-accent)) !important;
    
    .card-borders div {
      background: rgb(var(--v-theme-primary));
      height: 4px;
    }
    .border-left, .border-right { width: 4px !important; }
    
    .corner-markers .marker {
      background: rgb(var(--v-theme-accent));
      transform: scale(1.5);
    }
    
    .prompt-title, .prompt-subtitle, .formats-supported span {
      color: rgb(var(--v-theme-primary)) !important;
    }
  }

  &.has-files {
    min-height: auto;
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
    width: 120px;
    height: 120px;
    border: 2px solid rgb(var(--v-theme-primary));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    background: rgb(var(--v-theme-background));
    
    .upload-arrow {
      color: rgb(var(--v-theme-primary));
      transition: transform 0.3s ease;
    }
  }

  .prompt-title {
    font-size: 2rem;
    letter-spacing: 2px;
    color: rgb(var(--v-theme-primary));
  }

  .prompt-subtitle {
    letter-spacing: 1px;
    color: rgb(var(--v-theme-secondary));
  }

  .formats-supported {
    font-size: 0.8rem;
    color: rgb(var(--v-theme-secondary));
    
    span {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid currentColor;
      margin: 0 4px;
    }
  }
}

.upload-card:hover .upload-icon-container {
  transform: translateY(-10px);
  box-shadow: 8px 8px 0 rgb(var(--v-theme-accent));
  
  .upload-arrow {
    transform: translateY(5px);
  }
}

.files-container {
  width: 100%;
}

.border-b {
  border-bottom: 2px solid rgb(var(--v-theme-border-color));
}

.count-badge {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 4px 12px;
  font-size: 1.2rem;
}

.add-more-btn {
  border: 2px solid rgb(var(--v-theme-primary));
  box-shadow: 4px 4px 0 rgb(var(--v-theme-accent));
  transition: all 0.1s;
  
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 rgb(var(--v-theme-accent));
  }
  
  &:active {
    transform: translate(4px, 4px);
    box-shadow: none;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
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

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
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

  .upload-prompt {
    .upload-icon-container {
      width: 80px;
      height: 80px;
      margin-bottom: 16px !important;
      
      .v-icon {
        font-size: 40px !important;
      }
    }

    .prompt-title {
      font-size: 1.5rem;
    }
  }
  
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .files-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
  }
}
</style>
