import { createThemePlugin } from '@vuetify/v0'

export default createThemePlugin({
  default: 'light',
  themes: {
    light: {
      dark: false,
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#ffffff',
        surface: '#f5f5f5',
      },
    },
    dark: {
      dark: true,
      colors: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        background: '#1e293b',
        surface: '#334155',
      },
    },
  },
})
