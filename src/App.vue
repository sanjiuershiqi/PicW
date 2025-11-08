<template>
  <v-app @contextmenu.prevent v-scroll="onScroll">
    <v-app-bar :elevation="atTop ? 0 : 3" class="header">
      <!-- 主题切换 -->
      <v-btn :icon="getThemeIcon" @click="toggleTheme" variant="text" />

      <!-- 标题 -->
      <v-app-bar-title class="font-weight-bold">
        <span @click="$router.push('/')" class="home">PicW</span>
      </v-app-bar-title>

      <v-spacer />

      <!-- 导航按钮 -->
      <v-btn to="/images" variant="text" prepend-icon="mdi-image-search-outline">
        <span class="d-none d-sm-inline">图片管理</span>
      </v-btn>

      <v-btn to="/favorites" variant="text" prepend-icon="mdi-star">
        <span class="d-none d-sm-inline">我的收藏</span>
        <v-badge v-if="favoriteCount > 0" :content="favoriteCount" color="warning" inline />
      </v-btn>

      <v-btn to="/setting" icon="mdi-cog-outline" variant="text" />

      <!-- 测试菜单 -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon="mdi-test-tube" variant="text" />
        </template>
        <v-list density="compact">
          <v-list-item to="/test" prepend-icon="mdi-test-tube">
            <v-list-item-title>组件测试</v-list-item-title>
          </v-list-item>
          <v-list-item to="/folder-test" prepend-icon="mdi-folder-search">
            <v-list-item-title>文件夹测试</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
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
.header {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.home {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
  }
}

.gradient-text {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-btn {
  text-transform: none;
  letter-spacing: normal;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
  }
}

.nav-btn-icon {
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
    transform: scale(1.1);
  }

  transition: all 0.2s;
}

.gap-2 {
  gap: 8px;
}

// 响应式调整
@media (max-width: 600px) {
  .header {
    .v-avatar {
      display: none;
    }

    .v-divider {
      display: none;
    }
  }
}
</style>
