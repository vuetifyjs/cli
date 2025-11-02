import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'

const packages = ['vuetify', '@vuetify/v0', '@vuetify/paper', 'vuetify-nuxt-module']

export const update = defineCommand({
  meta: {
    name: 'update',
    description: i18n.t('commands.update.description'),
  },
  args: {
    nightly: {
      type: 'boolean',
      description: 'Use nightly builds when updating',
      default: false,
    },
    packages: {
      type: 'string',
      description: 'Comma-separated list of packages to update',
      default: packages.join(','),
    },
  },
  run: ({ args }: { args: { nightly: boolean, packages: string } }) => {
    console.log(i18n.t('commands.update.stub'))
    const nightly = Boolean(args.nightly)
    const list = (args.packages)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    console.log(`Nightly builds: ${nightly ? 'enabled' : 'disabled'}`)
    if (list.length > 0) {
      console.log(`Packages to update: ${list.join(', ')}`)
    } else {
      console.log('No specific packages provided; would update defaults')
    }
    // TODO: Implement actual package update logic with optional nightly builds
  },
})

export default update
