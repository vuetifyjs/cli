export interface Preset {
  meta: {
    displayName: string
  }
  type: string
  platform: string
  features: string[]
  router?: string
  css?: string
  typescript?: boolean
}

export const standardPresets: Record<string, Preset> = {
  base: {
    meta: {
      displayName: 'Base',
    },
    type: 'vuetify',
    platform: 'vue',
    features: [],
    router: 'none',
    typescript: true,
  },
  full: {
    meta: {
      displayName: 'Full',
    },
    type: 'vuetify',
    platform: 'vue',
    features: ['eslint', 'pinia', 'i18n', 'mcp'],
    router: 'router',
    typescript: true,
  },
  v0: {
    meta: {
      displayName: 'Vuetify0',
    },
    type: 'vuetify0',
    platform: 'vue',
    features: ['eslint'],
    router: 'router',
    typescript: true,
  },
}
