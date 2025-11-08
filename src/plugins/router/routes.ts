import type { RouteRecordRaw } from 'vue-router'

export default <readonly RouteRecordRaw[]>[
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
  {
    path: '/',
    component: () => import('@/views/HomeView/index.vue'),
    meta: {
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/images',
    component: () => import('@/views/ImagesView.vue'),
    meta: {
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: {
      keepAlive: true
    }
  },
  {
    path: '/setting',
    component: () => import('@/views/SettingView/index.vue'),
    meta: {
      keepAlive: true
    }
  },
  {
    path: '/test',
    component: () => import('@/views/TestView.vue'),
    meta: {
      keepAlive: false
    }
  },
  {
    path: '/folder-test',
    component: () => import('@/views/FolderTestView.vue'),
    meta: {
      keepAlive: false
    }
  }
]
