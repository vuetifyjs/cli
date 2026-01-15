import { version } from '../constants/version'

export function getTemplateSource (templateName: string) {
  let tag = `v${version}`
  if (version.includes('beta-next')) {
    tag = `v${version.replace('beta-next', 'beta')}`
  } else if (version.endsWith('-next.1')) {
    tag = `v${version.slice(0, -7)}`
  }
  return `gh:vuetifyjs/cli/templates/${templateName}#${tag}`
}
