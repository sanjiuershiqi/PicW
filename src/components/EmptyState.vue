<template>
  <div class="empty-state">
    <v-container class="text-center py-12">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <!-- 图标区域 -->
          <div class="empty-icon-wrapper mb-6">
            <v-avatar :size="iconSize" :color="iconColor" class="empty-icon">
              <v-icon :icon="icon" :size="iconSize * 0.6" :color="iconTextColor" />
            </v-avatar>
          </div>

          <!-- 标题 -->
          <h3 class="empty-title text-h5 font-weight-medium mb-3">
            {{ title }}
          </h3>

          <!-- 描述 -->
          <p class="empty-description text-body-1 text-medium-emphasis mb-6">
            {{ description }}
          </p>

          <!-- 操作按钮 -->
          <div v-if="showAction" class="empty-actions">
            <v-btn
              :color="actionColor"
              :variant="actionVariant"
              :size="actionSize"
              :prepend-icon="actionIcon"
              @click="handleAction"
              class="empty-action-btn"
            >
              {{ actionText }}
            </v-btn>
          </div>

          <!-- 额外内容插槽 -->
          <div v-if="$slots.extra" class="empty-extra mt-6">
            <slot name="extra"></slot>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

interface Props {
  // 图标相关
  icon?: string
  iconSize?: number
  iconColor?: string

  // 文本内容
  title?: string
  description?: string

  // 操作按钮
  showAction?: boolean
  actionText?: string
  actionIcon?: string
  actionColor?: string
  actionVariant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  actionSize?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-inbox-outline',
  iconSize: 120,
  iconColor: 'grey-lighten-2',
  title: '暂无数据',
  description: '这里还没有任何内容',
  showAction: false,
  actionText: '刷新',
  actionIcon: 'mdi-refresh',
  actionColor: 'primary',
  actionVariant: 'tonal',
  actionSize: 'default'
})

const emit = defineEmits<{
  action: []
}>()

const theme = useTheme()

// 根据主题动态调整图标文字颜色
const iconTextColor = computed(() => {
  return theme.current.value.dark ? 'grey-lighten-1' : 'grey-darken-1'
})

const handleAction = () => {
  emit('action')
}
</script>

<style scoped lang="scss">
.empty-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon-wrapper {
  position: relative;
  display: inline-block;

  .empty-icon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.05);
    }
  }
}

.empty-title {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

.empty-description {
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

.empty-action-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.empty-extra {
  opacity: 0.8;
}

// 响应式调整
@media (max-width: 600px) {
  .empty-state {
    min-height: 250px;
  }

  .empty-icon-wrapper .empty-icon {
    width: 80px !important;
    height: 80px !important;
  }

  .empty-title {
    font-size: 1.25rem !important;
  }

  .empty-description {
    font-size: 0.875rem !important;
  }
}

// 动画效果
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  animation: fadeInUp 0.6s ease-out;
}
</style>
