<template>
  <v-row>
    <!-- GitHub 用户名 -->
    <v-col cols="12" md="6">
      <div class="mb-2">
        <v-icon icon="mdi-account" size="small" class="me-1" />
        <span class="text-subtitle-2">GitHub 用户名</span>
      </div>
      <v-text-field
        v-model="name"
        placeholder="输入您的 GitHub 用户名"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details="auto"
        :loading="nameInputLoading"
        :error="nameError"
        :error-messages="nameErrorMessage"
      >
        <template #prepend-inner>
          <v-avatar v-if="avatar" :image="avatar" size="32" class="me-2" />
          <v-icon v-else icon="mdi-github" class="me-2" />
        </template>
        <template #append-inner>
          <v-btn
            icon="mdi-check"
            variant="text"
            size="small"
            color="primary"
            @click="checkUserName"
            :disabled="!name || nameInputLoading"
          />
        </template>
      </v-text-field>
    </v-col>

    <!-- Personal Access Token -->
    <v-col cols="12" md="6">
      <div class="mb-2 d-flex align-center justify-space-between">
        <div>
          <v-icon icon="mdi-key" size="small" class="me-1" />
          <span class="text-subtitle-2">Personal Access Token</span>
        </div>
        <v-btn variant="text" size="x-small" prepend-icon="mdi-open-in-new" @click="openGithubTokenPage" color="primary">
          获取 Token
        </v-btn>
      </div>
      <v-text-field
        v-model="token"
        placeholder="输入您的 GitHub Token"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details="auto"
        :loading="tokenInputLoading"
        :disabled="!name"
        :type="showToken ? 'text' : 'password'"
        :error="tokenError"
        :error-messages="tokenErrorMessage"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-check"
            variant="text"
            size="small"
            color="primary"
            @click="checkUserToken"
            :disabled="!token || tokenInputLoading"
            class="me-1"
          />
          <v-btn :icon="showToken ? 'mdi-eye-off' : 'mdi-eye'" variant="text" size="small" @click="showToken = !showToken" />
        </template>
      </v-text-field>
    </v-col>

    <!-- 仓库选择 -->
    <v-col cols="12" md="6">
      <div class="mb-2">
        <v-icon icon="mdi-source-repository" size="small" class="me-1" />
        <span class="text-subtitle-2">选择仓库</span>
      </div>
      <v-select
        v-model="repository"
        :items="repositoriesName"
        placeholder="选择您的仓库"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :loading="reposInputLoading"
        :disabled="!token"
      >
        <template #append>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            color="primary"
            @click="reposData"
            :disabled="!token || reposInputLoading"
          />
        </template>
      </v-select>
    </v-col>

    <!-- 路径选择 -->
    <v-col cols="12" md="6">
      <div class="mb-2">
        <v-icon icon="mdi-folder" size="small" class="me-1" />
        <span class="text-subtitle-2">存储路径</span>
      </div>
      <v-combobox
        v-model="directory"
        :items="directories"
        placeholder="选择或输入路径"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :loading="dirsInputLoading"
        :disabled="!repository"
        @blur="formatDir"
      >
        <template #append>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            color="primary"
            @click="dirsData"
            :disabled="!repository || dirsInputLoading"
          />
        </template>
      </v-combobox>
    </v-col>

    <!-- 配置状态提示 -->
    <v-col cols="12">
      <v-alert v-if="isConfigured" type="success" variant="tonal" density="compact" class="mt-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-check-circle" class="me-2" />
          <div>
            <div class="font-weight-bold">配置完成</div>
            <div class="text-caption">用户：{{ name }} | 仓库：{{ repository }} | 路径：{{ directory }}</div>
          </div>
        </div>
      </v-alert>
      <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-information" class="me-2" />
          <div class="text-caption">请依次填写 GitHub 用户名、Token、选择仓库和路径以完成配置</div>
        </div>
      </v-alert>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { repoContent } from '@/plugins/axios/repo'
import type { UserRepos } from '@/plugins/axios/user'
import { userInfo, userRepos, userToken } from '@/plugins/axios/user'
import { useSnackBarStore } from '@/plugins/stores/snackbar'
import { useUserStore } from '@/plugins/stores/user'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const { name, avatar, token, repository, directory } = storeToRefs(useUserStore())
const { showMessage } = useSnackBarStore()

// 配置状态
const isConfigured = computed(() => {
  return !!(name.value && token.value && repository.value && directory.value)
})

// 用户名输入
const nameInputLoading = ref(false)
const nameError = ref(false)
const nameErrorMessage = ref('')

const checkUserName = async () => {
  if (!name.value) {
    return
  }
  nameInputLoading.value = true
  nameError.value = false
  nameErrorMessage.value = ''

  try {
    const { avatar_url } = await userInfo(name.value)
    avatar.value = avatar_url
    showMessage('用户名验证成功', { color: 'success' })
  } catch (error) {
    console.error(error)
    nameError.value = true
    nameErrorMessage.value = '用户名不存在或网络错误'
    name.value = ''
    avatar.value = ''
    showMessage('用户名验证失败', { color: 'error' })
  }
  nameInputLoading.value = false
}

// Token 输入
const showToken = ref(false)
const tokenInputLoading = ref(false)
const tokenError = ref(false)
const tokenErrorMessage = ref('')

const checkUserToken = async () => {
  if (!token.value) {
    return
  }
  tokenInputLoading.value = true
  tokenError.value = false
  tokenErrorMessage.value = ''

  try {
    await userToken(token.value)
    await reposData()
    showMessage('Token 验证成功', { color: 'success' })
  } catch (error) {
    console.error(error)
    tokenError.value = true
    tokenErrorMessage.value = 'Token 无效或权限不足'
    token.value = ''
    showMessage('Token 验证失败', { color: 'error' })
  }
  tokenInputLoading.value = false
}

// Github Token 创建页面
const openGithubTokenPage = () => {
  window.open('https://github.com/settings/tokens/new', '_blank')
}

// 仓库名输入
const reposInputLoading = ref(false)
const repositories = ref<UserRepos[]>([])
const repositoriesName = computed(() => repositories.value.map(val => val.name))

const reposData = async () => {
  reposInputLoading.value = true
  try {
    repositories.value = await userRepos(name.value)
    if (repositories.value.length === 0) {
      window.open('https://github.com/new', '_blank')
      showMessage('未找到仓库，请先创建一个', { color: 'warning' })
    } else {
      if (!repository.value) {
        repository.value = repositories.value[0].name
      }
      showMessage(`已加载 ${repositories.value.length} 个仓库`, { color: 'success' })
    }
  } catch (error) {
    console.error(error)
    showMessage('加载仓库失败', { color: 'error' })
  }
  reposInputLoading.value = false
}

// 路径输入
const dirsInputLoading = ref(false)
const directories = ref<string[]>([])

const dirsData = async () => {
  dirsInputLoading.value = true
  try {
    const data = await repoContent(name.value, repository.value, '/', true)
    directories.value = data.reduce((pre, cur) => (cur.type === 'dir' ? pre.concat(cur.path) : pre), ['/'])
    showMessage(`已加载 ${directories.value.length} 个目录`, { color: 'success' })
  } catch (error) {
    console.error(error)
    showMessage('加载目录失败', { color: 'error' })
  }
  dirsInputLoading.value = false
}

// 格式化路径
const formatDir = () => {
  directory.value =
    directory.value
      .trim()
      .replaceAll(/\\+/g, '/')
      .replaceAll(/\/{2,}/g, '/')
      .replaceAll(/^\/|\/$/g, '') || '/'
}
</script>
