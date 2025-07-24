import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { useTheme } from 'vuetify'

interface ThemeConfig {
  mode: 'auto' | 'light' | 'dark'
  primaryColor: string
  accentColor: string
  customColors: {
    success: string
    warning: string
    error: string
    info: string
  }
  animations: boolean
  compactMode: boolean
}

const storeSetup = () => {
  const type = ref<'dark' | 'light'>('light')
  const config = ref<ThemeConfig>({
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

  // 自动主题检测
  const prefersDark = ref(false)
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', e => {
      prefersDark.value = e.matches
      if (config.value.mode === 'auto') {
        type.value = e.matches ? 'dark' : 'light'
      }
    })
  }

  // 计算实际主题类型
  const actualTheme = computed(() => {
    if (config.value.mode === 'auto') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return config.value.mode === 'dark' ? 'dark' : 'light'
  })

  // 监听值并修改主题
  const theme = useTheme()
  watchEffect(() => {
    const currentTheme = actualTheme.value
    type.value = currentTheme
    theme.global.name.value = currentTheme

    // 更新 meta 标签
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', currentTheme === 'dark' ? '#212121' : '#ffffff')
    }

    // 更新 CSS 变量
    const root = document.documentElement
    root.style.setProperty('--theme-primary', config.value.primaryColor)
    root.style.setProperty('--theme-accent', config.value.accentColor)
    root.style.setProperty('--theme-success', config.value.customColors.success)
    root.style.setProperty('--theme-warning', config.value.customColors.warning)
    root.style.setProperty('--theme-error', config.value.customColors.error)
    root.style.setProperty('--theme-info', config.value.customColors.info)

    // 动画控制
    root.classList.toggle('no-animations', !config.value.animations)
    root.classList.toggle('compact-mode', config.value.compactMode)
  })

  // 切换主题模式
  const toggleTheme = () => {
    if (config.value.mode === 'auto') {
      config.value.mode = 'light'
    } else if (config.value.mode === 'light') {
      config.value.mode = 'dark'
    } else {
      config.value.mode = 'auto'
    }
  }

  // 设置主题模式
  const setThemeMode = (mode: 'auto' | 'light' | 'dark') => {
    config.value.mode = mode
  }

  // 更新主题颜色
  const updateThemeColors = (colors: Partial<ThemeConfig>) => {
    config.value = { ...config.value, ...colors }
  }

  return {
    type,
    config,
    actualTheme,
    prefersDark,
    toggleTheme,
    setThemeMode,
    updateThemeColors
  }
}

export const useThemeStore = defineStore('theme', storeSetup, {
  persist: true
})
