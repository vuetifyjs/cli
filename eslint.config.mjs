import vuetify from 'eslint-config-vuetify'

export default vuetify({
  files: ['**/package.json', '**/pnpm-workspace.yaml'],
  rules: {
    'pnpm/json-enforce-catalog': 'error',
    'pnpm/json-valid-catalog': 'error',
  },
}, {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['node:path'],
    }],
  },
})
