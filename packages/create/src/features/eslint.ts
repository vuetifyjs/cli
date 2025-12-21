import type { Feature } from './types'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const eslint: Feature = {
  name: 'eslint',
  apply: async ({ cwd, pkg, isTypescript }) => {
    // Check if Nuxt
    const isNuxt = existsSync(join(cwd, 'nuxt.config.ts'))

    if (isNuxt) {
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies['eslint'] = rootPkg.dependencies.eslint
      pkg.devDependencies['@nuxt/eslint'] = rootPkg.dependencies['@nuxt/eslint']
      pkg.devDependencies['eslint-config-vuetify'] = rootPkg.dependencies['eslint-config-vuetify']
      pkg.scripts = pkg.scripts || {}
      pkg.scripts['lint'] = 'eslint'
      pkg.scripts['lint:fix'] = 'eslint --fix'

      const configPath = join(cwd, 'nuxt.config.ts')
      const mod = await loadFile(configPath)

      const options = getDefaultExportOptions(mod)
      if (options) {
        options.modules ||= []
        options.modules.push('@nuxt/eslint')

        options.eslint = {
          config: {
            import: {
              package: 'eslint-plugin-import-lite',
            },
          },
        }
      }

      await writeFile(configPath, mod.generate().code)
      await writeFile(join(cwd, 'eslint.config.js'), getNuxtEslintContent(isTypescript))
    } else {
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies['eslint'] = rootPkg.dependencies.eslint
      pkg.devDependencies['eslint-config-vuetify'] = rootPkg.dependencies['eslint-config-vuetify']
      pkg.scripts = pkg.scripts || {}
      pkg.scripts['lint'] = 'eslint'
      pkg.scripts['lint:fix'] = 'eslint --fix'

      await writeFile(join(cwd, 'eslint.config.js'), getVueEslintContent(isTypescript))
    }
  },
}

function getVueEslintContent (isTypescript: boolean) {
  return `import vuetify from 'eslint-config-vuetify'

export default vuetify({
  ts: ${isTypescript},
})
`
}

function getNuxtEslintContent (isTypescript: boolean) {
  return `import vuetify from 'eslint-config-vuetify'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  vuetify({
    ts: ${isTypescript},
  }),
)
`
}
