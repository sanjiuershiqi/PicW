<template>
  <v-app @contextmenu.prevent v-scroll="onScroll" class="app-container">
    <header class="brutalist-header" :class="{ 'scrolled': !atTop }">
      <div class="header-grid">
        <!-- Logo -->
        <div class="header-cell logo-cell" @click="$router.push('/')">
          <span class="logo-text">PICW</span>
          <span class="logo-badge">SYS</span>
        </div>

        <!-- Navigation -->
        <nav class="header-cell nav-cell d-none d-md-flex">
          <router-link to="/images" class="nav-link" active-class="active">
            <span class="link-num">01</span>
            <span class="link-text">IMAGES</span>
          </router-link>
          
          <router-link to="/favorites" class="nav-link" active-class="active">
            <span class="link-num">02</span>
            <span class="link-text">FAVORITES</span>
            <span v-if="favoriteCount > 0" class="fav-count">[{{ favoriteCount }}]</span>
          </router-link>
        </nav>

        <!-- Tools -->
        <div class="header-cell tools-cell">
          <v-btn icon variant="text" @click="toggleTheme" class="tool-btn">
            <v-icon>{{ getThemeIcon }}</v-icon>
          </v-btn>
          
          <v-btn to="/setting" icon variant="text" class="tool-btn">
            <v-icon>mdi-cog</v-icon>
          </v-btn>

          <v-menu transition="none">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" class="tool-btn">
                <v-icon>mdi-test-tube</v-icon>
              </v-btn>
            </template>
            <div class="brutalist-menu">
              <router-link to="/test" class="menu-item">COMPONENTS</router-link>
              <router-link to="/folder-test" class="menu-item">FOLDERS</router-link>
            </div>
          </v-menu>
        </div>
      </div>
    </header>

    <v-main class="main-content pt-16">
      <div class="content-wrapper">
        <router-view #default="{ Component, route }">
          <transition name="hard-cut" mode="out-in">
            <keep-alive>
              <component v-if="route.meta.keepAlive" :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
          <transition name="hard-cut" mode="out-in">
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

/* Brutalist Header */
.brutalist-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: rgb(var(--v-theme-background));
  border-bottom: 2px solid rgb(var(--v-theme-border-color));
  transition: transform 0.2s ease;

  &.scrolled {
    transform: translateY(-100%); /* Hide on scroll down for brutalism */
    
    &:hover {
      transform: translateY(0); /* Show on hover */
    }
  }
}

.header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 64px;
}

.header-cell {
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-right: 2px solid rgb(var(--v-theme-border-color));

  &:last-child {
    border-right: none;
  }
}

/* Logo */
.logo-cell {
  cursor: pointer;
  background-color: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-on-surface));
  gap: 8px;
  transition: filter 0.1s;

  &:hover {
    filter: invert(100%);
  }
}

.logo-text {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -1px;
}

.logo-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  border: 1px solid currentColor;
  padding: 2px 4px;
  line-height: 1;
}

/* Navigation */
.nav-cell {
  gap: 0;
  padding: 0;
}

.nav-link {
  display: flex;
  align-items: baseline;
  height: 100%;
  padding: 0 32px;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  border-right: 2px solid rgb(var(--v-theme-border-color));
  transition: all 0.1s;
  position: relative;
  overflow: hidden;

  .link-num {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    margin-right: 8px;
    opacity: 0.5;
  }

  .link-text {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 1px;
    align-self: center;
  }

  .fav-count {
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    margin-left: 8px;
    color: rgb(var(--v-theme-accent));
    font-weight: 700;
    align-self: center;
  }

  &:hover {
    background-color: rgb(var(--v-theme-on-surface));
    color: rgb(var(--v-theme-background));

    .link-num { opacity: 1; }
  }

  &.active {
    background-color: rgb(var(--v-theme-accent));
    color: rgb(var(--v-theme-on-surface));
    
    .link-num { color: rgb(var(--v-theme-on-surface)); opacity: 1; }
    .fav-count { color: rgb(var(--v-theme-on-surface)); }
  }
}

/* Tools */
.tools-cell {
  gap: 8px;
}

.tool-btn {
  border-radius: 0 !important;
  border: 2px solid transparent;
  
  &:hover {
    background-color: transparent !important;
    border-color: rgb(var(--v-theme-on-surface));
    transform: translate(2px, -2px);
    box-shadow: -2px 2px 0 rgb(var(--v-theme-accent));
  }
}

.brutalist-menu {
  background: rgb(var(--v-theme-background));
  border: 2px solid rgb(var(--v-theme-border-color));
  box-shadow: 8px 8px 0 rgba(var(--v-theme-accent), 1);
  display: flex;
  flex-direction: column;
  min-width: 200px;
  margin-top: 8px;
}

.menu-item {
  padding: 16px 24px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  border-bottom: 2px solid rgb(var(--v-theme-border-color));
  transition: all 0.1s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgb(var(--v-theme-accent));
    padding-left: 32px;
  }
}

/* Content Layout */
.main-content {
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 48px 24px;
}

/* Hard Cut Transitions */
.hard-cut-enter-active,
.hard-cut-leave-active {
  transition: opacity 0.1s;
}
.hard-cut-enter-from,
.hard-cut-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .header-grid {
    grid-template-columns: auto 1fr;
  }
  .nav-cell {
    display: none !important;
  }
  .content-wrapper {
    padding: 24px 16px;
  }
}
</style>
