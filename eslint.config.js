import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ignore: ['vuetify-create-old'],
  pnpm: {
    enforceCatalog: true,
  },
  ts: {
    projectService: 'tsconfig.json',
  },
}, {
  files: ['templates/**', 'packages/create/src/features/**'],
  rules: {
    'pnpm/json-enforce-catalog': 'off',
  },
})
