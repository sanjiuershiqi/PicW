<template>
  <v-card variant="flat" title="主题设置" prepend-icon="mdi-palette">
    <v-card-text>
      <v-row>
        <!-- 主题模式选择 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="config.mode"
            :items="themeOptions"
            label="主题模式"
            prepend-inner-icon="mdi-theme-light-dark"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <!-- 动画开关 -->
        <v-col cols="12" md="6">
          <v-switch v-model="config.animations" label="启用动画效果" color="primary" hide-details />
        </v-col>

        <!-- 紧凑模式 -->
        <v-col cols="12" md="6">
          <v-switch v-model="config.compactMode" label="紧凑模式" color="primary" hide-details />
        </v-col>

        <!-- 主色调选择 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="config.primaryColor"
            label="主色调"
            prepend-inner-icon="mdi-palette"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>

        <!-- 强调色选择 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="config.accentColor"
            label="强调色"
            prepend-inner-icon="mdi-palette"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 预设主题色彩 -->
      <v-divider class="my-6" />

      <v-row>
        <v-col cols="12">
          <h4 class="text-subtitle-1 mb-4">预设主题</h4>
          <div class="theme-presets">
            <v-chip-group v-model="selectedPreset" selected-class="text-primary" @update:model-value="applyPreset">
              <v-chip v-for="preset in themePresets" :key="preset.name" :value="preset.name" variant="outlined" class="theme-preset-chip">
                <div class="preset-colors">
                  <div class="color-dot" :style="{ backgroundColor: preset.primaryColor }" />
                  <div class="color-dot" :style="{ backgroundColor: preset.accentColor }" />
                </div>
                {{ preset.name }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-col>
      </v-row>

      <!-- 自定义状态颜色 -->
      <v-divider class="my-6" />

      <v-row>
        <v-col cols="12">
          <h4 class="text-subtitle-1 mb-4">状态颜色</h4>
        </v-col>

        <v-col cols="6" md="3">
          <v-text-field
            v-model="config.customColors.success"
            label="成功"
            prepend-inner-icon="mdi-check-circle"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>

        <v-col cols="6" md="3">
          <v-text-field
            v-model="config.customColors.warning"
            label="警告"
            prepend-inner-icon="mdi-alert"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>

        <v-col cols="6" md="3">
          <v-text-field
            v-model="config.customColors.error"
            label="错误"
            prepend-inner-icon="mdi-close-circle"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>

        <v-col cols="6" md="3">
          <v-text-field
            v-model="config.customColors.info"
            label="信息"
            prepend-inner-icon="mdi-information"
            variant="outlined"
            density="comfortable"
            type="color"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 重置按钮 -->
      <v-row class="mt-4">
        <v-col cols="12" class="text-center">
          <v-btn variant="outlined" color="warning" prepend-icon="mdi-restore" @click="resetToDefault"> 重置为默认 </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/plugins/stores/theme'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const themeStore = useThemeStore()
const { config } = storeToRefs(themeStore)

const selectedPreset = ref<string>()

const themeOptions = [
  { title: '自动', value: 'auto' },
  { title: '浅色', value: 'light' },
  { title: '深色', value: 'dark' }
]

const themePresets = [
  {
    name: '默认蓝',
    primaryColor: '#1976D2',
    accentColor: '#82B1FF'
  },
  {
    name: '优雅紫',
    primaryColor: '#7C4DFF',
    accentColor: '#B388FF'
  },
  {
    name: '活力橙',
    primaryColor: '#FF6D00',
    accentColor: '#FFB74D'
  },
  {
    name: '自然绿',
    primaryColor: '#388E3C',
    accentColor: '#81C784'
  },
  {
    name: '温暖红',
    primaryColor: '#D32F2F',
    accentColor: '#EF5350'
  },
  {
    name: '深海蓝',
    primaryColor: '#0277BD',
    accentColor: '#29B6F6'
  }
]

const applyPreset = (presetName: string | undefined) => {
  if (!presetName) {
    return
  }

  const preset = themePresets.find(p => p.name === presetName)
  if (preset) {
    themeStore.updateThemeColors({
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor
    })
  }
}

const resetToDefault = () => {
  themeStore.updateThemeColors({
    mode: 'auto',
    primaryColor: '#1976D2',
    accentColor: '#82B1FF',
    customColors: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    },
    animations: true,
    compactMode: false
  })
  selectedPreset.value = undefined
}
</script>

<style scoped lang="scss">
.theme-presets {
  .theme-preset-chip {
    margin: 4px;

    .preset-colors {
      display: flex;
      align-items: center;
      margin-right: 8px;

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 4px;
        border: 1px solid rgba(0, 0, 0, 0.1);

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
}
</style>
