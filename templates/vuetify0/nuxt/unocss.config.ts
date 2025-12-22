import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
  ],
  theme: {
    fontFamily: {
      sans: 'Roboto, sans-serif',
    },
    colors: {
      primary: 'var(--v0-primary)',
      secondary: 'var(--v0-secondary)',
      background: 'var(--v0-background)',
      surface: 'var(--v0-surface)',
      'surface-tint': 'var(--v0-surface-tint)',
      'on-surface': 'var(--v0-on-surface)',
      divider: 'var(--v0-divider)',
    },
  },
})
