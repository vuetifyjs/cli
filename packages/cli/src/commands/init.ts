import { projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'
import { relative, resolve } from 'pathe'

const cwd = process.cwd()

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs('vuetify'),
    v0: {
      type: 'boolean',
      description: i18n.t('commands.init.v0.description'),
    },
  },
  run: ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(i18n.t('commands.init.creating_project', { dir: relativeDir }))

    // TODO: Implement Vuetify project template download
    console.log('Vuetify project initialization will be implemented here')
  },
})

export default init
