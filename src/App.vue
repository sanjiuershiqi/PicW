<template>
  <v-app @contextmenu.prevent v-scroll="onScroll" class="app-container">
    <v-app-bar
      :elevation="0"
      class="header"
      :class="{ 'header-scrolled': !atTop }"
    >
      <div class="header-content mx-auto w-100 px-4 d-flex align-center" style="max-width: 1400px;">
        <!-- 主题切换 -->
        <v-btn :icon="getThemeIcon" @click="toggleTheme" variant="text" class="theme-btn" />

        <!-- 标题 -->
        <v-app-bar-title class="font-weight-bold mx-4">
          <span @click="$router.push('/')" class="home logo-text">Pic<span class="text-accent">W</span></span>
        </v-app-bar-title>

        <v-spacer />

        <!-- 导航按钮 -->
        <div class="nav-links d-none d-md-flex align-center">
          <v-btn to="/images" variant="text" class="nav-btn" rounded="pill">
            <v-icon start icon="mdi-image-search-outline"></v-icon>
            图片管理
          </v-btn>

          <v-btn to="/favorites" variant="text" class="nav-btn" rounded="pill">
            <v-icon start icon="mdi-star"></v-icon>
            我的收藏
            <v-badge v-if="favoriteCount > 0" :content="favoriteCount" color="accent" inline class="ms-1" />
          </v-btn>
        </div>

        <v-btn to="/setting" icon="mdi-cog-outline" variant="text" class="ms-2 icon-btn" />

        <!-- 测试菜单 -->
        <v-menu transition="slide-y-transition">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-test-tube" variant="text" class="icon-btn" />
          </template>
          <v-list density="compact" class="rounded-xl mt-2 elevation-4" bg-color="surface">
            <v-list-item to="/test" prepend-icon="mdi-test-tube" class="rounded-lg mx-2 mb-1">
              <v-list-item-title>组件测试</v-list-item-title>
            </v-list-item>
            <v-list-item to="/folder-test" prepend-icon="mdi-folder-search" class="rounded-lg mx-2">
              <v-list-item-title>文件夹测试</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
    <v-main class="main-content">
      <div class="content-wrapper mx-auto" style="max-width: 1400px; padding: 24px;">
        <router-view #default="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <keep-alive>
              <component v-if="route.meta.keepAlive" :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
          <transition name="page-fade" mode="out-in">
            <component v-if="!route.meta.keepAlive" :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>
    <SnackBar />
  </v-app>
</template>

<script setup lang="ts">
import SnackBar from '@/components/SnackBar.vue'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useThemeStore } from '@/plugins/stores/theme'
import { useFavoritesStore } from '@/plugins/stores/favorites'
import { storeToRefs } from 'pinia'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const $router = useRouter()

const themeStore = useThemeStore()
const { config } = storeToRefs(themeStore)
const { showMessage } = useSnackBarStore()
const { show } = storeToRefs(useSnackBarStore())
const favoritesStore = useFavoritesStore()
const favoriteCount = computed(() => favoritesStore.favoriteCount)

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
.app-container {
  background-color: rgb(var(--v-theme-background));
}

.header {
  background-color: rgba(var(--v-theme-surface), 0.7) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &.header-scrolled {
    background-color: rgba(var(--v-theme-surface), 0.85) !important;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
  }
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
}

.text-accent {
  color: rgb(var(--v-theme-accent));
}

.nav-btn {
  font-weight: 600;
  letter-spacing: -0.2px;
  margin: 0 4px;
  padding: 0 16px;
  opacity: 0.8;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }

  &.v-btn--active {
    opacity: 1;
    background-color: rgba(var(--v-theme-on-surface), 0.08);
  }
}

.icon-btn, .theme-btn {
  opacity: 0.7;
  transition: all 0.2s;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }
}

/* Page Transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 响应式调整
@media (max-width: 600px) {
  .content-wrapper {
    padding: 16px !important;
  }
}
</style>
