<template>
  <v-container fluid class="pa-4">
    <!-- 页面标题 -->
    <v-card class="mb-6" elevation="2">
      <v-card-text class="d-flex align-center pa-6">
        <v-avatar color="primary" size="48" class="me-4">
          <v-icon icon="mdi-cog" size="28" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">设置中心</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">配置您的 GitHub 账户、主题、标签和其他选项</p>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- 左侧：设置导航 -->
      <v-col cols="12" md="3">
        <v-card elevation="2" class="sticky-nav">
          <v-card-title
            class="text-subtitle-1 font-weight-bold d-flex align-center"
            style="cursor: pointer"
            @click="navExpanded = !navExpanded"
          >
            <v-icon icon="mdi-view-list" class="me-2" />
            设置分类
            <v-spacer />
            <v-btn :icon="navExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" size="small" />
          </v-card-title>
          <v-expand-transition>
            <div v-show="navExpanded">
              <v-divider />
              <v-list density="compact" nav>
                <v-list-item
                  v-for="section in sections"
                  :key="section.id"
                  :value="section.id"
                  :active="activeSection === section.id"
                  @click="scrollToSection(section.id)"
                  :prepend-icon="section.icon"
                >
                  <v-list-item-title>{{ section.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>

      <!-- 右侧：设置内容 -->
      <v-col cols="12" md="9">
        <!-- GitHub 账户设置 -->
        <v-card :id="sections[0].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="sections[0].icon" class="me-2" />
            {{ sections[0].name }}
            <v-spacer />
            <v-chip size="small" color="success" variant="flat">必需</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">配置您的 GitHub 账户信息以使用图床功能</p>
            <UserSection />
          </v-card-text>
        </v-card>

        <!-- 主题设置 -->
        <v-card :id="sections[1].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="sections[1].icon" class="me-2" />
            {{ sections[1].name }}
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">自定义应用的外观和主题颜色</p>
            <ThemeSettings />
          </v-card-text>
        </v-card>

        <!-- 标签管理 -->
        <v-card :id="sections[2].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="sections[2].icon" class="me-2" />
            {{ sections[2].name }}
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">创建和管理图片标签，方便分类和搜索</p>
            <TagManager />
          </v-card-text>
        </v-card>

        <!-- 图片压缩设置 -->
        <v-card :id="sections[3].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="sections[3].icon" class="me-2" />
            {{ sections[3].name }}
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-4">配置图片自动压缩选项，节省存储空间</p>
            <ImageCompressSettings />
          </v-card-text>
        </v-card>

        <!-- 高级设置 - 函数配置 -->
        <v-card :id="sections[4].id" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center bg-surface-variant">
            <v-icon :icon="sections[4].icon" class="me-2" />
            {{ sections[4].name }}
            <v-spacer />
            <v-chip size="small" color="warning" variant="flat">高级</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-alert type="warning" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <v-icon icon="mdi-alert" class="me-2" />
                <div>
                  <div class="font-weight-bold">注意事项</div>
                  <div class="text-caption mt-1">需严格按照提供的 TypeScript 类型编写 JavaScript 代码，代码有问题将使用默认方法</div>
                </div>
              </div>
            </v-alert>

            <!-- 文件名重命名函数 -->
            <div class="mb-6">
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-file-edit-outline" class="me-2" color="primary" />
                <h3 class="text-h6">文件名重命名函数</h3>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-3">
                自定义上传图片的文件名，可以包含 <code class="text-red font-weight-bold px-1">/</code> 用于指定路径
              </p>
              <v-alert border="start" border-color="error" density="compact" class="mb-3" variant="tonal">
                <div class="text-caption font-weight-bold">
                  <v-icon icon="mdi-code-tags" size="small" class="me-1" />
                  类型签名：<code class="ml-2">(filename: string, md5: string) => string</code>
                </div>
              </v-alert>
              <CodeSection v-model="fileName" />
            </div>

            <v-divider class="my-6" />

            <!-- CDN 链接函数 -->
            <div>
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-link-variant" class="me-2" color="primary" />
                <h3 class="text-h6">CDN 链接生成函数</h3>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-3">自定义导出的 CDN 链接格式，支持多种链接类型</p>
              <v-alert border="start" border-color="error" density="compact" class="mb-3" variant="tonal">
                <div class="text-caption font-weight-bold">
                  <v-icon icon="mdi-code-tags" size="small" class="me-1" />
                  类型签名：
                  <code class="ml-2 d-block mt-1">
                    (username: string, repository: string, directory: string, filename: string) => Array&lt;{ label: string, text: string }>
                  </code>
                </div>
              </v-alert>
              <CodeSection v-model="cdnUrl" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ImageCompressSettings from '@/components/ImageCompressSettings.vue'
import TagManager from '@/components/TagManager.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'
import { useCodeStore } from '@/plugins/stores/code'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import CodeSection from './CodeSection.vue'
import UserSection from './UserSection.vue'

const { fileName, cdnUrl } = storeToRefs(useCodeStore())

// 设置分类
const sections = [
  { id: 'github', name: 'GitHub 账户', icon: 'mdi-github' },
  { id: 'theme', name: '主题设置', icon: 'mdi-palette' },
  { id: 'tags', name: '标签管理', icon: 'mdi-tag-multiple' },
  { id: 'compress', name: '图片压缩', icon: 'mdi-image-size-select-actual' },
  { id: 'advanced', name: '高级设置', icon: 'mdi-code-braces' }
]

const activeSection = ref('github')
const navExpanded = ref(true)

// 滚动到指定设置区域
const scrollToSection = (id: string) => {
  activeSection.value = id
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped lang="scss">
.sticky-nav {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

code {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

:deep() {
  .v-alert__content {
    white-space: normal;
  }
}

// 平滑滚动
html {
  scroll-behavior: smooth;
}
</style>
