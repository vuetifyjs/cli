import { Clerc, helpPlugin, notFoundPlugin } from 'clerc'

import { version } from '../package.json'
import { initPlugin } from './commands/init'

export const cli = Clerc.create()
  .name('Vuetify0')
  .description('Unified CLI for Vuetify0')
  .use(helpPlugin())
  .use(notFoundPlugin())
  .scriptName('@vuetify/v0')
  .version(version)
  .use(initPlugin())
  .parse()
