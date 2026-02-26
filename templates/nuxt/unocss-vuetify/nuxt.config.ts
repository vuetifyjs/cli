import { presetVuetify } from 'unocss-preset-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-21',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
    'vuetify-nuxt-module',
  ],

  css: [
    'assets/styles/layers.css',
    'vuetify/styles',
  ],

  vuetify: {
    moduleOptions: {
      disableVuetifyStyles: true,
      styles: { configFile: 'assets/styles/settings.scss' },
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
      },
    },
  },

  unocss: {
    presets: [
      presetVuetify({
        font: {
          heading: 'Roboto, sans-serif',
          body: 'Roboto, sans-serif',
        },
        typography: 'md2',
        elevation: 'md2',
      }),
    ],
    safelist: [
      ...Array.from({ length: 25 }, (_, i) => `elevation-${i}`),
      ...['', '-0', '-sm', '-lg', '-xl', '-pill', '-circle', '-shaped'].map(suffix => `rounded${suffix}`),
    ],
    outputToCssLayers: {
      cssLayerName: (layer) => layer === 'properties' ? null : `uno.${layer}`,
    },
  },
})
