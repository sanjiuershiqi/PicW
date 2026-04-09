<template>
  <v-app @contextmenu.prevent v-scroll="onScroll" class="app-container">
    <header class="util-header" :class="{ 'scrolled': !atTop }">
      <div class="header-content mx-auto w-100 px-6 d-flex align-center">
        <!-- Logo -->
        <div class="logo-area d-flex align-center cursor-pointer" @click="$router.push('/')">
          <v-icon icon="mdi-image-multiple" class="mr-2 text-primary" size="24" />
          <span class="logo-text font-weight-bold">PicW</span>
        </div>

        <v-spacer />

        <!-- Navigation -->
        <nav class="nav-area d-none d-md-flex align-center">
          <router-link to="/images" class="nav-link" active-class="active">
            <v-icon size="small" class="mr-1">mdi-image-search-outline</v-icon>
            Images
          </router-link>
          
          <router-link to="/favorites" class="nav-link" active-class="active">
            <v-icon size="small" class="mr-1">mdi-star-outline</v-icon>
            Favorites
            <v-chip v-if="favoriteCount > 0" size="x-small" color="primary" variant="flat" class="ml-1 px-1">{{ favoriteCount }}</v-chip>
          </router-link>
        </nav>

        <div class="divider-vertical mx-4 d-none d-md-block"></div>

        <!-- Tools -->
        <div class="tools-area d-flex align-center">
          <v-btn icon variant="text" size="small" @click="toggleTheme" class="tool-btn mr-1" color="secondary">
            <v-icon size="20">{{ getThemeIcon }}</v-icon>
          </v-btn>
          
          <v-btn to="/setting" icon variant="text" size="small" class="tool-btn mr-1" color="secondary">
            <v-icon size="20">mdi-cog-outline</v-icon>
          </v-btn>

          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" class="tool-btn" color="secondary">
                <v-icon size="20">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" class="util-menu rounded-lg mt-2" elevation="4">
              <v-list-item to="/test" prepend-icon="mdi-test-tube" class="menu-item">
                <v-list-item-title class="text-body-2">Component Test</v-list-item-title>
              </v-list-item>
              <v-list-item to="/folder-test" prepend-icon="mdi-folder-search-outline" class="menu-item">
                <v-list-item-title class="text-body-2">Folder Test</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </header>

    <v-main class="main-content pt-14">
      <div class="content-wrapper mx-auto">
        <router-view #default="{ Component, route }">
          <transition name="fade" mode="out-in">
            <keep-alive>
              <component v-if="route.meta.keepAlive" :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
          <transition name="fade" mode="out-in">
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
  min-height: 100vh;
}

/* Utilitarian Header */
.util-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgb(var(--v-theme-border-color));
  transition: all 0.2s ease;
  height: 56px;

  &.scrolled {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
}

.header-content {
  height: 100%;
  max-width: 1400px;
}

.logo-area {
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
}

.logo-text {
  font-size: 1.25rem;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-primary));
}

.nav-area {
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  color: rgb(var(--v-theme-secondary));
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  &.active {
    color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.08);
  }
}

.divider-vertical {
  width: 1px;
  height: 24px;
  background-color: rgb(var(--v-theme-border-color));
}

.tool-btn {
  transition: all 0.15s ease;
  
  &:hover {
    color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

.util-menu {
  border: 1px solid rgb(var(--v-theme-border-color));
  background: rgb(var(--v-theme-surface));
  
  .menu-item {
    transition: background-color 0.15s;
    
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.05);
    }
  }
}

.main-content {
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1200px;
  padding: 32px 24px;
}

/* Fade Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .content-wrapper {
    padding: 24px 16px;
  }
}
</style>
