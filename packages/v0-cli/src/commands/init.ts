import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template } from '@vuetify/cli-shared'
import { definePlugin } from 'clerc'

const cwd = process.cwd()

export function initPlugin () {
  return definePlugin({
    setup: cli =>
      cli
        .command('init', 'Initialize a Vuetify V0 project', {
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
        .on('init', context => {
          const dir = context.flags.dir ?? 'v0'
          const relativeDir = relative(cwd, resolve(cwd, dir))
          console.log(`Creating project in ${relativeDir}`)

          downloadVuetifyV0Template({
            cwd,
            force: context.flags.force,
            dir: context.flags.dir,
          })
        }),
  })
}
