import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ignore: ['vuetify-create-old'],
  pnpm: {
    enforceCatalog: false,
  },
  ts: {
    tsconfigRootDir: import.meta.dirname,
  },
})
