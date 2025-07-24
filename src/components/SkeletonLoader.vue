<template>
  <div class="skeleton-loader">
    <!-- 图片网格骨架屏 -->
    <template v-if="type === 'image-grid'">
      <v-container>
        <v-row>
          <v-col v-for="n in count" :key="n" :cols="cols" :sm="sm" :md="md" :lg="lg">
            <v-card :elevation="elevation" :rounded="rounded">
              <v-skeleton-loader type="image, article" :height="imageHeight" class="skeleton-card" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- 列表骨架屏 -->
    <template v-else-if="type === 'list'">
      <v-container>
        <div v-for="n in count" :key="n" class="skeleton-list-item mb-4">
          <v-skeleton-loader type="avatar, sentences" class="skeleton-list" />
        </div>
      </v-container>
    </template>

    <!-- 文章骨架屏 -->
    <template v-else-if="type === 'article'">
      <v-container>
        <v-skeleton-loader type="heading, paragraph, image, paragraph" class="skeleton-article" />
      </v-container>
    </template>

    <!-- 统计卡片骨架屏 -->
    <template v-else-if="type === 'stats'">
      <v-container>
        <v-row>
          <v-col v-for="n in count" :key="n" :cols="cols" :sm="sm" :md="md" :lg="lg">
            <v-card :elevation="elevation" :rounded="rounded">
              <v-card-text>
                <v-skeleton-loader type="heading, text" class="skeleton-stats" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- 表格骨架屏 -->
    <template v-else-if="type === 'table'">
      <v-container>
        <v-skeleton-loader type="table-heading, table-tbody" class="skeleton-table" />
      </v-container>
    </template>

    <!-- 自定义骨架屏 -->
    <template v-else-if="type === 'custom'">
      <v-container>
        <v-skeleton-loader :type="customType" :height="height" :width="width" class="skeleton-custom" />
      </v-container>
    </template>

    <!-- 默认骨架屏 -->
    <template v-else>
      <v-container>
        <v-skeleton-loader type="card" :height="height" class="skeleton-default" />
      </v-container>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // 骨架屏类型
  type?: 'image-grid' | 'list' | 'article' | 'stats' | 'table' | 'custom' | 'default'

  // 数量相关
  count?: number

  // 网格布局
  cols?: number | string
  sm?: number | string
  md?: number | string
  lg?: number | string

  // 样式相关
  elevation?: number | string
  rounded?: boolean | string
  height?: number | string
  width?: number | string
  imageHeight?: number | string

  // 自定义类型
  customType?: string
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  count: 6,
  cols: 12,
  sm: 6,
  md: 4,
  lg: 3,
  elevation: 2,
  rounded: 'lg',
  height: 200,
  width: '100%',
  imageHeight: 200,
  customType: 'card'
})
</script>

<style scoped lang="scss">
.skeleton-loader {
  .skeleton-card {
    :deep(.v-skeleton-loader__image) {
      height: v-bind(imageHeight + 'px') !important;
    }
  }

  .skeleton-list-item {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-bottom: 16px;

    &:last-child {
      border-bottom: none;
      margin-bottom: 0 !important;
    }
  }

  .skeleton-article {
    max-width: 800px;
    margin: 0 auto;
  }

  .skeleton-stats {
    text-align: center;
  }

  .skeleton-table {
    :deep(.v-skeleton-loader__table-heading) {
      height: 48px;
    }

    :deep(.v-skeleton-loader__table-tbody) {
      height: 300px;
    }
  }

  // 自定义动画效果
  :deep(.v-skeleton-loader__bone) {
    &::after {
      animation: skeleton-wave 1.6s linear 0.5s infinite;
    }
  }
}

@keyframes skeleton-wave {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 响应式调整
@media (max-width: 600px) {
  .skeleton-loader {
    .skeleton-article {
      padding: 0 16px;
    }
  }
}
</style>
