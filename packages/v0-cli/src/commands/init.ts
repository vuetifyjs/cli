import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template, i18n, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'

const cwd = process.cwd()

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs('v0'),
  },
  run: ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(i18n.t('commands.init.creating_project', { dir: relativeDir }))

    downloadVuetifyV0Template({
      cwd,
      force: args.force,
      dir: args.dir,
    })
  },
})
