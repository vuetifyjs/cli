import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'

const packages = ['@vuetify/v0', '@vuetify/paper']

export const update = defineCommand({
  meta: {
    name: 'update',
    description: i18n.t('commands.update.description'),
  },
  args: {
    packages: {
      type: 'string',
      description: i18n.t('commands.update.packages.description'),
      default: packages.join(','),
    },
  },
  run: ({ args }: { args: { packages: string } }) => {
    console.log(i18n.t('commands.update.stub'))
    const list = (args.packages)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (list.length > 0) {
      console.log(i18n.t('commands.update.packages_to_update', { pkgs: list.join(', ') }))
    } else {
      console.log(i18n.t('commands.update.no_packages_specified'))
    }
  },
})

export default update
