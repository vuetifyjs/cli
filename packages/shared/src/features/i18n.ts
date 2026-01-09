import type { Feature } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { addStatementToFunctionBody, isFunction } from '../utils/magicast'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const i18n: Feature = {
  name: 'i18n',
  apply: async ({ cwd, pkg, isTypescript }) => {
    const ext = isTypescript ? 'ts' : 'js'
    const isNuxt = existsSync(join(cwd, 'nuxt.config.ts'))

    if (isNuxt) {
      pkg.dependencies ??= {}
      pkg.dependencies['@nuxtjs/i18n'] = rootPkg.dependencies['@nuxtjs/i18n']

      const configPath = join(cwd, 'nuxt.config.ts')
      const mod = await loadFile(configPath)
      const options = getDefaultExportOptions(mod)

      if (options) {
        options.modules ||= []
        options.modules.push('@nuxtjs/i18n')

        // Add basic configuration
        options.i18n = {
          defaultLocale: 'en',
          vueI18n: './i18n.config.ts',
        }
      }

      await writeFile(configPath, mod.generate().code)

      // Create i18n.config.ts
      await writeFile(join(cwd, `i18n.config.${ext}`), getNuxtI18nConfig(isTypescript))
    } else {
      pkg.dependencies ??= {}
      pkg.dependencies['vue-i18n'] = rootPkg.dependencies['vue-i18n']

      // Create i18n plugin file
      if (!existsSync(join(cwd, 'src/plugins'))) {
        mkdirSync(join(cwd, 'src/plugins'), { recursive: true })
      }
      await writeFile(join(cwd, `src/plugins/i18n.${ext}`), getVueI18nContent(isTypescript))

      // Register in plugins/index.ts
      const pluginsPath = join(cwd, `src/plugins/index.${ext}`)
      if (existsSync(pluginsPath)) {
        const mod = await loadFile(pluginsPath)

        mod.imports.$prepend({
          from: './i18n',
          imported: 'default',
          local: 'i18n',
        })

        const registerPlugins = mod.exports.registerPlugins
        if (isFunction(registerPlugins)) {
          addStatementToFunctionBody(registerPlugins, 'app.use(i18n)')
        }

        await writeFile(pluginsPath, mod.generate().code)
      }
    }
  },
}

function getVueI18nContent (_ts: boolean) {
  return `import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    message: {
      hello: 'hello world',
    },
  },
  ja: {
    message: {
      hello: 'こんにちは、世界',
    },
  },
}

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
`
}

function getNuxtI18nConfig (_ts: boolean) {
  return `export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      welcome: 'Welcome',
    },
    fr: {
      welcome: 'Bienvenue',
    },
  },
}))
`
}
