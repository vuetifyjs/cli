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
      description: i18n.t('commands.update.nightly.description'),
    },
    packages: {
      type: 'string',
      description: i18n.t('commands.update.packages.description'),
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

    console.log(i18n.t('commands.update.nightly_status', { status: i18n.t(nightly ? 'common.enabled' : 'common.disabled') }))
    if (list.length > 0) {
      console.log(i18n.t('commands.update.packages_to_update', { pkgs: list.join(', ') }))
    } else {
      console.log(i18n.t('commands.update.no_packages_specified'))
    }
    // TODO: Implement actual package update logic with optional nightly builds
  },
})

export default update
