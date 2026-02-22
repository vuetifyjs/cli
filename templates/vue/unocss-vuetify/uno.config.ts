import { defineConfig, transformerDirectives } from 'unocss'
import { presetVuetify } from 'unocss-preset-vuetify'

export default defineConfig({
  presets: [
    presetVuetify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
})
