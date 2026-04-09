<template>
  <v-app @contextmenu.prevent v-scroll="onScroll" class="app-container">
    <header class="glass-header" :class="{ scrolled: !atTop }">
      <div class="header-content mx-auto w-100 px-6 d-flex align-center">
        <!-- Logo -->
        <div class="logo-area d-flex align-center cursor-pointer" @click="$router.push('/')">
          <div class="logo-orb mr-3"></div>
          <span class="logo-text font-weight-bold">PicW</span>
        </div>

        <v-spacer />

        <!-- Navigation -->
        <nav class="nav-area d-none d-md-flex align-center">
          <router-link to="/images" class="nav-link" active-class="active"> Images </router-link>

          <router-link to="/favorites" class="nav-link" active-class="active">
            Favorites
            <v-chip v-if="favoriteCount > 0" size="x-small" color="accent" class="ml-2 px-2 fw-bold">{{ favoriteCount }}</v-chip>
          </router-link>
        </nav>

        <!-- Tools -->
        <div class="tools-area d-flex align-center ml-4">
          <v-btn icon variant="text" size="small" @click="toggleTheme" class="tool-btn mr-2" color="primary">
            <v-icon size="20">{{ getThemeIcon }}</v-icon>
          </v-btn>

          <v-btn to="/setting" icon variant="text" size="small" class="tool-btn mr-2" color="primary">
            <v-icon size="20">mdi-tune-variant</v-icon>
          </v-btn>

          <v-menu location="bottom end" transition="slide-y-transition">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" class="tool-btn" color="primary">
                <v-icon size="20">mdi-dots-grid</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" class="glass-menu mt-2" elevation="0">
              <v-list-item to="/test" prepend-icon="mdi-test-tube" class="menu-item rounded-pill mx-2 mb-1">
                <v-list-item-title>Components</v-list-item-title>
              </v-list-item>
              <v-list-item to="/folder-test" prepend-icon="mdi-folder-search-outline" class="menu-item rounded-pill mx-2">
                <v-list-item-title>Folders</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </header>

    <v-main class="main-content pt-16">
      <div class="content-wrapper mx-auto">
        <router-view #default="{ Component, route }">
          <transition name="liquid-fade" mode="out-in">
            <keep-alive>
              <component v-if="route.meta.keepAlive" :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
          <transition name="liquid-fade" mode="out-in">
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
  background-color: transparent !important;
  min-height: 100vh;
}

/* Glassmorphism Header */
.glass-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  height: 64px;

  .v-theme--dark & {
    background-color: rgba(15, 23, 42, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  &.scrolled {
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);

    .v-theme--dark & {
      background-color: rgba(15, 23, 42, 0.4);
    }
  }
}

.header-content {
  height: 100%;
  max-width: 1400px;
}

.logo-area {
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
    .logo-orb {
      transform: scale(1.1);
      box-shadow: 0 0 15px rgb(var(--v-theme-accent));
    }
  }
}

.logo-orb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--v-theme-accent)), #ff9a9e);
  box-shadow: 0 0 10px rgba(var(--v-theme-accent), 0.5);
  transition: all 0.3s ease;
}

.logo-text {
  font-size: 1.4rem;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-primary));
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);

  .v-theme--dark & {
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }
}

.nav-area {
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.1);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  color: rgb(var(--v-theme-primary));
  opacity: 0.7;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 100px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 1;
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  &.active {
    opacity: 1;
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-background));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.fw-bold {
  font-weight: 700;
}

.tool-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.05);
  }

  &:hover {
    transform: translateY(-2px);
    background: rgba(var(--v-theme-primary), 0.1) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

.glass-menu {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border-radius: 20px !important;
  padding: 8px 0;

  .v-theme--dark & {
    background: rgba(15, 23, 42, 0.6) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .menu-item {
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.08);
      transform: translateX(4px);
    }
  }
}

.main-content {
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1400px;
  padding: 40px 24px;
}

/* Liquid Fade Transitions */
.liquid-fade-enter-active,
.liquid-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.liquid-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.liquid-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

@media (max-width: 960px) {
  .content-wrapper {
    padding: 24px 16px;
  }
}
</style>
