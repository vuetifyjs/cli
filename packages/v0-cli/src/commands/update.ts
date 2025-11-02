import { i18n } from '@vuetify/cli-shared'
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
      description: 'Comma-separated list of packages to update',
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
      console.log(`Packages to update: ${list.join(', ')}`)
    } else {
      console.log('No specific packages provided; would update defaults')
    }
  },
})

export default update
