<template>
  <v-app @contextmenu.prevent v-scroll="onScroll">
    <v-app-bar :elevation="atTop ? 0 : 5" class="header">
      <v-btn :icon="getThemeIcon" @click="toggleTheme" :title="getThemeTooltip" />
      <v-app-bar-title class="font-weight-bold">
        <span @click="$router.push('/')" class="home"> PicW </span>
      </v-app-bar-title>
      <v-btn class="ml-sm-3" icon="mdi-image-search-outline" to="/images"></v-btn>
      <v-btn class="ml-sm-3" icon="mdi-cog-outline" to="/setting"></v-btn>
      <v-btn class="ml-sm-3" icon="mdi-test-tube" to="/test" title="测试页面"></v-btn>
    </v-app-bar>
    <v-main>
      <router-view #default="{ Component, route }">
        <transition name="router-transition">
          <keep-alive>
            <component v-if="route.meta.keepAlive" :is="Component" :key="route.fullPath" />
          </keep-alive>
        </transition>
        <transition name="router-transition">
          <component v-if="!route.meta.keepAlive" :is="Component" />
        </transition>
      </router-view>
    </v-main>
    <SnackBar />
  </v-app>
</template>

<script setup lang="ts">
import SnackBar from '@/components/SnackBar.vue'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useThemeStore } from '@/plugins/stores/theme'
import { storeToRefs } from 'pinia'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const $router = useRouter()

const themeStore = useThemeStore()
const { config } = storeToRefs(themeStore)
const { showMessage } = useSnackBarStore()
const { show } = storeToRefs(useSnackBarStore())

// 主题相关计算属性和方法
const getThemeIcon = computed(() => {
  switch (config.value.mode) {
    case 'auto':
      return 'mdi-brightness-auto'
    case 'dark':
      return 'mdi-weather-night'
    case 'light':
      return 'mdi-weather-sunny'
    default:
      return 'mdi-brightness-auto'
  }
})

const getThemeTooltip = computed(() => {
  switch (config.value.mode) {
    case 'auto':
      return '自动主题'
    case 'dark':
      return '深色主题'
    case 'light':
      return '浅色主题'
    default:
      return '自动主题'
  }
})

const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 更新提示
const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegistered: r => r && setInterval(async () => await r.update(), 60 * 60 * 1000)
})
watch(needRefresh, () => {
  showMessage(
    '新内容可用，点击刷新！',
    {
      location: 'bottom right',
      transition: 'slide-x-reverse-transition',
      timeout: 10 * 1000,
      vertical: true
    },
    {
      text: '刷新',
      event: () => {
        updateServiceWorker().finally(() => {
          show.value = false
        })
      }
    }
  )
})

const atTop = ref(true)
const onScroll = (event: Event) => {
  const document = event.target as Document
  atTop.value = (document.documentElement.scrollTop || document.body.scrollTop) < 100
}
</script>

<style scoped lang="scss">
.header {
  transition: box-shadow 200ms ease;
}
.home {
  cursor: pointer;
  user-select: none;
}
</style>
