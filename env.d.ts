/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    requiresAuth?: boolean
  }
}

interface textChip {
  label: string
  text: string
}
type CdnUrlItemsType = (username: string, repository: string, directory: string, filename: string) => textChip[]
type FileNameType = (filename: string, md5: string) => string

type RemoveReadonly<T> = { -readonly [P in keyof T]: T[P] }
