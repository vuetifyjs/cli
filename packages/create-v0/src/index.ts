import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template } from '@vuetify/cli-shared'
import { Clerc, helpPlugin, notFoundPlugin, Root } from 'clerc'

import { version } from '../package.json'

const cwd = process.cwd()

export const cli = Clerc.create()
  .name('Create Vuetify0')
  .description('Create a Vuetify0 project')
  .use(helpPlugin())
  .use(notFoundPlugin())
  .scriptName('create-vuetify-v0')
  .version(version)
  .command(Root, 'Create a Vuetify0', {
    flags: {
      dir: {
        type: String,
        description: 'The directory to create the project in',
      },
      force: {
        type: Boolean,
        description: 'Force overwrite existing files',
        default: false,
      },
    },
  })
  .on(Root, context => {
    const dir = context.flags.dir ?? 'v0'
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(`Creating project in ${relativeDir}`)

    downloadVuetifyV0Template({
      cwd,
      force: context.flags.force,
      dir: context.flags.dir,
    })
  })
  .parse()
