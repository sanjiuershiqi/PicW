<template>
  <v-container>
    <!-- 上传区域 -->
    <v-card class="upload-area" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }" elevation="2">
      <v-file-input
        v-model="files"
        accept="image/*"
        hide-details
        variant="solo"
        prepend-icon=""
        :clearable="false"
        multiple
        class="file-input"
        :key="forceUpdate"
        ref="inputRef"
        @dragenter="dragEnterHandle"
        @dragleave="dragLeaveHandle"
        @drop="dragLeaveHandle"
      >
        <template #selection="{ fileNames }">
          <!-- 空状态提示 -->
          <div v-if="files.length === 0" class="upload-prompt">
            <v-icon icon="mdi-cloud-upload" size="80" color="primary" class="mb-4" />
            <h2 class="text-h5 font-weight-bold mb-2">拖拽图片到这里</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">或点击选择文件</p>
            <v-chip variant="tonal" color="primary" prepend-icon="mdi-information"> 支持多张图片同时上传 </v-chip>
          </div>

          <!-- 文件列表 -->
          <div v-else class="files-container">
            <div class="files-header">
              <h3 class="text-h6 font-weight-bold">
                <v-icon icon="mdi-image-multiple" class="me-2" />
                已选择 {{ files.length }} 张图片
              </h3>
              <v-btn variant="text" prepend-icon="mdi-plus" size="small" @click="handleAddMore"> 添加更多 </v-btn>
            </div>
            <v-divider class="my-4" />
            <transition-group name="list" tag="div" class="files-list">
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
.upload-area {
  min-height: 400px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px dashed rgba(var(--v-border-color), var(--v-border-opacity));

  &.drag-over {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
    transform: scale(1.02);
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
    }

    .v-field__input {
      padding: 40px;
      min-height: 400px;
      cursor: pointer;
    }

    &.has-files .v-field__input {
      min-height: auto;
      padding: 24px;
    }
  }
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  text-align: center;
  pointer-events: none;
}

.files-container {
  width: 100%;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  transition: all 0.3s;
}

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

// 响应式
@media (max-width: 600px) {
  .upload-area {
    min-height: 300px;

    :deep(.file-input) {
      .v-input__control {
        min-height: 300px;
      }

      .v-field__input {
        padding: 20px;
        min-height: 300px;
      }
    }
  }

  .upload-prompt {
    min-height: 240px;

    .v-icon {
      font-size: 60px !important;
    }

    h2 {
      font-size: 1.25rem !important;
    }
  }
}
</style>
