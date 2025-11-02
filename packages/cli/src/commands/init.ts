import { relative, resolve } from 'node:path'
import { i18n, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'

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
