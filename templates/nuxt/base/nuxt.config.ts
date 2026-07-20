// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-21',
  devtools: { enabled: true },
  // ssr: false,
  modules: [
    '@nuxt/fonts',
    'vuetify-nuxt-module',
  ],

  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: '/layers.css' },
      ],
    },
  },

  vuetify: {
    moduleOptions: {
      prefixComposables: ['useLayout'],
      styles: { configFile: 'assets/styles/settings.scss' },
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark', // default 'system' requires `ssr: false` to avoid hydration warnings
      },
    },
  },
})
