import e18e from '@e18e/eslint-plugin'
import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ignore: {
    extendIgnore: [
      'vuetify-create',
      'vuetify-create/**',
    ],
  },
  pnpm: {
    enforceCatalog: false,
  },
  ts: {
    tsconfigRootDir: import.meta.dirname,
  },
}, {
  ...e18e.configs.recommended,
})
