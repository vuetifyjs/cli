// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-21',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
  ],
  css: [
    '@fontsource/roboto',
  ],
  build: {
    transpile: ['@vuetify/v0'],
  },
})
