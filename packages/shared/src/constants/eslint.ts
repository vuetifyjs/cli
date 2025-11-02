import { link } from 'kolorist'
export const ESLINT = 'eslint'
export const ESLINT_CONFIG = 'eslint-config-vuetify'
export const VUETIFY = 'vuetify'

export const LINKS = {
  [ESLINT]: link(ESLINT, 'https://npmjs.org/package/eslint'),
  [ESLINT_CONFIG]: link(ESLINT_CONFIG, 'https://npmjs.org/package/eslint-config-vuetify'),
}

export const configData = `import vuetify from 'eslint-config-vuetify'

export default vuetify()
`
